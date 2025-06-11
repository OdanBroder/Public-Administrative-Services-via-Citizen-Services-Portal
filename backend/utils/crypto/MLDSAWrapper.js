import path from 'path';
/**
 * @file mldsa_wrapper.js
 * @description A JavaScript wrapper for the ML-DSA WASM module that provides a clean,
 * Promise-based API with proper memory management and type conversions.
 */

/**
 * ML-DSA Wrapper Class
 * Provides a JavaScript-friendly interface to the ML-DSA WASM module.
 */
class MLDSAWrapper {
  /**
   * Creates a new instance of the ML-DSA wrapper.
   * @param {string} wasmPath - Path to the compiled WASM module JS loader (default: './mldsa_lib.js')
   */
  constructor(wasmPath = '/app/utils/crypto/mldsa_lib.js') {
    this.wasmPath = wasmPath;
    this.module = null;
    this.initialized = false;
    
    // Constants from the C++ header
    this.ML_DSA_65_PRIVATE_KEY_SIZE = 4032;
    this.ML_DSA_65_PUBLIC_KEY_SIZE = 1952;
  }


  /**
   * Initializes the WASM module. Must be called before any other methods.
   * @returns {Promise<void>} A promise that resolves when the module is initialized
   * @throws {Error} If the module fails to initialize
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Dynamic import of the WASM module
      const { default: createOQSModule } = await import(this.wasmPath);
      console.log("Type of createOQSModule:", typeof createOQSModule);
      this.module = await createOQSModule();
      
      // Extract necessary functions and utilities
      this.malloc = this.module._malloc;
      this.free = typeof this.module._free === 'function' ? this.module._free : () => {};
      this.cwrap = this.module.cwrap;
      this.stringToUTF8 = this.module.stringToUTF8;
      this.UTF8ToString = this.module.UTF8ToString;
      this.FS = this.module.FS;
      this.NODEFS = this.module.NODEFS;
      // Wrap C functions
      this._initWrappers();
      
      // Create working directory in virtual FS if it doesn't exist

      if (!this.FS.analyzePath('/app/working').exists) {
        this.FS.mkdir('/app/');
        this.FS.mkdir('/app/working');
      }
      this.FS.mount(this.module.NODEFS, { root: './working' }, '/app/working');

      this.initialized = true;
      console.log("ML-DSA WASM module initialized successfully.");
    } catch (error) {
      console.error("Failed to initialize ML-DSA WASM module:", error);
      throw new Error(`ML-DSA initialization failed: ${error.message}`);
    }
  }

  /**
   * Initializes the wrapped C function references.
   * @private
   */
  _initWrappers() {
    // Wrap all exported C functions
    this._generate_mldsa65_keypair = this.cwrap('generate_mldsa65_keypair', 'number', ['number', 'number']);
    this._generate_csr = this.cwrap('generate_csr', 'number', ['number', 'number' ,'string', 'number', 'number']);
    this._generate_self_signed_certificate = this.cwrap('generate_self_signed_certificate', 'number', ['string', 'number', 'string', 'number']);
    this._sign_mldsa65 = this.cwrap('sign_mldsa65', 'number', ['number', 'number', 'number', 'string']);
    this._verify_mldsa65 = this.cwrap('verify_mldsa65', 'number', ['number', 'string', 'number', 'number']);
    this._verify_signature_with_cert = this.cwrap('verify_signature_with_cert', 'number', ['string', 'string', 'number', 'number']);
    this._sign_certificate = this.cwrap('sign_certificate', 'number', ['string', 'string', 'number', 'number', 'string', 'number']);
  }

  /**
   * Ensures the module is initialized before performing operations.
   * @private
   * @throws {Error} If the module is not initialized
   */
  _ensureInitialized() {
    if (!this.initialized) {
      throw new Error("ML-DSA WASM module not initialized. Call initialize() first.");
    }
  }

/**
 * Ensures that the directory for a given file path exists in the virtual FS.
 * @param {string} filePath - The file path to check.
 */
  ensureDirForFilePath(filePath) {
    const dirPath = path.dirname(filePath);
    if (!this.FS.analyzePath(dirPath).exists) {
      this.FS.mkdir(dirPath, { recursive: true });
    }
  }
  /**
   * Allocates memory in the WASM heap and copies a string into it.
   * @private
   * @param {string} str - The string to copy
   * @returns {number} Pointer to the allocated memory
   */
  _allocateString(str) {
    const ptr = this.malloc(str.length + 1); // +1 for null terminator
    if (!ptr) throw new Error("Failed to allocate memory for string");
    this.stringToUTF8(str, ptr, str.length + 1);
    return ptr;
  }

  /**
   * Allocates memory in the WASM heap for an array of strings and returns pointers.
   * @private
   * @param {string[]} strArray - Array of strings
   * @returns {Object} Object containing array pointer and individual string pointers
   */
  _allocateStringArray(strArray) {
    // Allocate memory for each string
    const stringPtrs = strArray.map(str => this._allocateString(str));
    
    // Allocate memory for the array of pointers
    const arrayPtr = this.malloc(strArray.length * 4); // 4 bytes per pointer in WASM32
    if (!arrayPtr) {
      // Free the already allocated strings to prevent memory leaks
      stringPtrs.forEach(ptr => this.free(ptr));
      throw new Error("Failed to allocate memory for string array");
    }
    
    // Write the pointers into the WASM memory array
    for (let i = 0; i < stringPtrs.length; i++) {
      this.module.setValue(arrayPtr + i * 4, stringPtrs[i], 'i32');
    }
    
    return { arrayPtr, stringPtrs };
  }

  /**
   * Frees memory allocated for a string array.
   * @private
   * @param {Object} allocation - Object containing array pointer and string pointers
   */
  _freeStringArray(allocation) {
    if (allocation) {
      // Free each string pointer
      if (allocation.stringPtrs) {
        allocation.stringPtrs.forEach(ptr => {
          if (ptr) this.free(ptr);
        });
      }
      // Free the array pointer
      if (allocation.arrayPtr) this.free(allocation.arrayPtr);
    }
  }

  /**
   * Converts a Uint8Array to a hexadecimal string.
   * @private
   * @param {Uint8Array} bytes - The byte array to convert
   * @returns {string} Hexadecimal representation of the bytes
   */
  _bytesToHex(bytes) {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Converts a hexadecimal string to a Uint8Array.
   * @private
   * @param {string} hex - The hexadecimal string to convert
   * @returns {Uint8Array} Byte array representation of the hex string
   */
  _hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Copies data from a WASM memory pointer to a Uint8Array.
   * @private
   * @param {number} ptr - Pointer to the WASM memory
   * @param {number} size - Number of bytes to copy
   * @returns {Uint8Array} The copied data
   */
  _copyFromWasmMemory(ptr, size) {
    const result = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      result[i] = this.module.getValue(ptr + i, 'i8');
    }
    return result;
  }

  /**
   * Copies data from a Uint8Array to WASM memory.
   * @private
   * @param {number} ptr - Pointer to the WASM memory
   * @param {Uint8Array} data - Data to copy
   */
  _copyToWasmMemory(ptr, data) {
    for (let i = 0; i < data.length; i++) {
      this.module.setValue(ptr + i, data[i], 'i8');
    }
  }

  /**
   * Generates an ML-DSA-65 key pair.
   * @returns {Promise<Object>} Object containing privateKey and publicKey as Uint8Array
   * @throws {Error} If key generation fails
   */
  async generateKeyPair() {
    this._ensureInitialized();
    
    // Allocate memory for the keys
    const privateKeyPtr = this.malloc(this.ML_DSA_65_PRIVATE_KEY_SIZE);
    const publicKeyPtr = this.malloc(this.ML_DSA_65_PUBLIC_KEY_SIZE);
    
    if (!privateKeyPtr || !publicKeyPtr) {
      if (privateKeyPtr) this.free(privateKeyPtr);
      if (publicKeyPtr) this.free(publicKeyPtr);
      throw new Error("Failed to allocate memory for keys");
    }
    
    try {
      // Generate the key pair
      const result = this._generate_mldsa65_keypair(privateKeyPtr, publicKeyPtr);
      if (!result) {
        throw new Error("Key generation failed");
      }
      
      // Copy the keys from WASM memory
      const privateKey = this._copyFromWasmMemory(privateKeyPtr, this.ML_DSA_65_PRIVATE_KEY_SIZE);
      const publicKey = this._copyFromWasmMemory(publicKeyPtr, this.ML_DSA_65_PUBLIC_KEY_SIZE);
      
      return { privateKey, publicKey };
    } finally {
      // Free allocated memory
      if (privateKeyPtr) this.free(privateKeyPtr);
      if (publicKeyPtr) this.free(publicKeyPtr);
    }
  }

  /**
   * Generates a Certificate Signing Request (CSR) using a private key.
   * @param {Uint8Array} privateKey - The private key as a byte array
   * @param {string[]} subjectInfo - Array of subject components (e.g., ["C=US", "CN=example.com"])
   * @param {string} [csrPath='/working/req.csr'] - Virtual FS path to save the CSR
   * @returns {Promise<Uint8Array>} The generated CSR as a byte array
   * @throws {Error} If CSR generation fails
   */
  async generateCSR(privateKey, publicKey, subjectInfo, csrPath = '/working/req.csr') {
    this._ensureInitialized();
    this.ensureDirForFilePath(csrPath);
    // Allocate memory for the private key
    const privateKeyPtr = this.malloc(privateKey.length);
    const publicKeyPtr = this.malloc(publicKey.length);
    if (!privateKeyPtr) {
      throw new Error("Failed to allocate memory for private key");
    }
    
    // Allocate memory for subject info
    let subjectAllocation = null;
    
    try {
      // Copy private key to WASM memory
      this._copyToWasmMemory(privateKeyPtr, privateKey);
      this._copyToWasmMemory(publicKeyPtr, publicKey);
      // Allocate and prepare subject info
      subjectAllocation = this._allocateStringArray(subjectInfo);
      
      // Generate the CSR
      const result = this._generate_csr(
        privateKeyPtr,
        publicKeyPtr,
        csrPath,
        subjectAllocation.arrayPtr,
        subjectInfo.length
      );
      
      if (!result) {
        throw new Error("CSR generation failed");
      }
      
      // Read the CSR file from virtual FS
      const csrData = this.FS.readFile(csrPath);
      return new Uint8Array(csrData);
    } finally {
      // Free allocated memory
      if (privateKeyPtr) this.free(privateKeyPtr);
      if (subjectAllocation) this._freeStringArray(subjectAllocation);
    }
  }

  /**
   * Generates a self-signed certificate from a CSR and private key.
   * @param {Uint8Array} privateKey - The private key as a byte array
   * @param {number} [days=365] - Validity period in days
   * @param {string} [csrPath='/working/req.csr'] - Virtual FS path to save the CSR
   * @param {string} [certPath='/working/cert.pem'] - Virtual FS path to save the certificate
   * @returns {Promise<Uint8Array>} The generated certificate as a byte array
   * @throws {Error} If certificate generation fails
   */
  async generateSelfSignedCertificate(privateKey, days = 365, csrPath = '/working/req.csr', certPath = '/working/cert.pem') {
    this._ensureInitialized();
    this.ensureDirForFilePath(certPath);
    // Allocate memory for the private key
    const privateKeyPtr = this.malloc(privateKey.length);
    if (!privateKeyPtr) {
      throw new Error("Failed to allocate memory for private key");
    }
    
    try {
      // Copy private key to WASM memory
      this._copyToWasmMemory(privateKeyPtr, privateKey);
      
      // Write CSR to virtual FS      
      // Generate the certificate
      const result = this._generate_self_signed_certificate(
        csrPath,
        privateKeyPtr,
        certPath,
        days
      );
      
      if (!result) {
        throw new Error("Self-signed certificate generation failed");
      }
      
      // Read the certificate file from virtual FS
      const certData = this.FS.readFile(certPath);
      return new Uint8Array(certData);
    } finally {
      // Free allocated memory
      if (privateKeyPtr) this.free(privateKeyPtr);
    }
  }

  /**
   * Signs a message using ML-DSA-65.
   * @param {Uint8Array} privateKey - The private key as a byte array
   * @param {string|Uint8Array} message - The message to sign
   * @param {string} [signaturePath='/working/signature.bin'] - Virtual FS path to save the signature
   * @returns {Promise<Uint8Array>} The signature as a byte array
   * @throws {Error} If signing fails
   */
  async sign(privateKey, message, signaturePath = '/working/signature.bin') {
    this._ensureInitialized();
    this.ensureDirForFilePath(signaturePath);
    // Allocate memory for the private key
    const privateKeyPtr = this.malloc(privateKey.length);
    if (!privateKeyPtr) {
      throw new Error("Failed to allocate memory for private key");
    }
    
    // Convert message to Uint8Array if it's a string
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    // Allocate memory for the message
    const messagePtr = this.malloc(messageBytes.length);
    if (!messagePtr) {
      this.free(privateKeyPtr);
      throw new Error("Failed to allocate memory for message");
    }
    
    try {
      // Copy data to WASM memory
      this._copyToWasmMemory(privateKeyPtr, privateKey);
      this._copyToWasmMemory(messagePtr, messageBytes);
      
      // Sign the message
      const result = this._sign_mldsa65(
        privateKeyPtr,
        messagePtr,
        messageBytes.length,
        signaturePath
      );
      
      if (!result) {
        throw new Error("Signing failed");
      }
      
      // Read the signature file from virtual FS
      const signatureData = this.FS.readFile(signaturePath);
      return new Uint8Array(signatureData);
    } finally {
      // Free allocated memory
      if (privateKeyPtr) this.free(privateKeyPtr);
      if (messagePtr) this.free(messagePtr);
    }
  }

  /**
   * Verifies an ML-DSA-65 signature.
   * @param {Uint8Array} publicKey - The public key as a byte array
   * @param {Uint8Array} signature - The signature to verify
   * @param {string|Uint8Array} message - The original message
   * @param {string} [signaturePath='/working/signature.bin'] - Virtual FS path to save the signature
   * @returns {Promise<boolean>} True if the signature is valid, false otherwise
   * @throws {Error} If verification process fails
   */
  async verify(publicKey, signature, message, signaturePath = '/working/signature.bin') {
    this._ensureInitialized();
    
    // Allocate memory for the public key
    const publicKeyPtr = this.malloc(publicKey.length);
    if (!publicKeyPtr) {
      throw new Error("Failed to allocate memory for public key");
    }
    
    // Convert message to Uint8Array if it's a string
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    // Allocate memory for the message
    const messagePtr = this.malloc(messageBytes.length);
    if (!messagePtr) {
      this.free(publicKeyPtr);
      throw new Error("Failed to allocate memory for message");
    }
    
    try {
      // Copy data to WASM memory
      this._copyToWasmMemory(publicKeyPtr, publicKey);
      this._copyToWasmMemory(messagePtr, messageBytes);
      
      // Write signature to virtual FS
      this.FS.writeFile(signaturePath, signature);
      
      // Verify the signature
      const result = this._verify_mldsa65(
        publicKeyPtr,
        signaturePath,
        messagePtr,
        messageBytes.length
      );
      
      return !!result; // Convert to boolean
    } finally {
      // Free allocated memory
      if (publicKeyPtr) this.free(publicKeyPtr);
      if (messagePtr) this.free(messagePtr);
    }
  }

  /**
   * Verifies a signature using a certificate.
   * @param {string|Uint8Array} message - The original message
   * @param {string} [certPath='/working/cert.pem'] - Virtual FS path to save the certificate
   * @param {string} [signaturePath='/working/signature.bin'] - Virtual FS path to save the signature
   * @returns {Promise<boolean>} True if the signature is valid, false otherwise
   * @throws {Error} If verification process fails
   */
  async verifyWithCertificate(message, certPath = '/working/cert.pem', signaturePath = '/working/signature.bin') {
    this._ensureInitialized();
    
    // Convert message to Uint8Array if it's a string
    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message) 
      : message;
    
    // Allocate memory for the message
    const messagePtr = this.malloc(messageBytes.length);
    if (!messagePtr) {
      throw new Error("Failed to allocate memory for message");
    }
    
    try {
      // Copy message to WASM memory
      this._copyToWasmMemory(messagePtr, messageBytes);
      
      
      // Verify the signature
      const result = this._verify_signature_with_cert(
        certPath,
        signaturePath,
        messagePtr,
        messageBytes.length
      );
      
      return !!result; // Convert to boolean
    } finally {
      // Free allocated memory
      if (messagePtr) this.free(messagePtr);
    }
  }

  /**
   * Signs a certificate with a CA certificate and private key.
   * @param {Uint8Array} caPrivateKey - The CA private key as a byte array
   * @param {number} [days=365] - Validity period in days
   * @param {string} [csrPath='/working/req.csr'] - Virtual FS path to save the CSR
   * @param {string} [caCertPath='/working/ca_cert.pem'] - Virtual FS path to save the CA certificate
   * @param {string} [signedCertPath='/working/signed_cert.pem'] - Virtual FS path to save the signed certificate
   * @returns {Promise<Uint8Array>} The signed certificate as a byte array
   * @throws {Error} If certificate signing fails
   */
  async signCertificate(caPrivateKey, days = 365, csrPath = '/working/req.csr', caCertPath = '/working/ca_cert.pem', signedCertPath = '/working/signed_cert.pem') {
    this._ensureInitialized();
    this.ensureDirForFilePath(signedCertPath);
    // Allocate memory for the CA private key
    const caPrivateKeyPtr = this.malloc(caPrivateKey.length);
    if (!caPrivateKeyPtr) {
      throw new Error("Failed to allocate memory for CA private key");
    }
    
    try {
      // Copy CA private key to WASM memory
      this._copyToWasmMemory(caPrivateKeyPtr, caPrivateKey);
      
      // Write CSR and CA certificate to virtual FS
      
      // Sign the certificate
      const result = this._sign_certificate(
        csrPath,
        caCertPath,
        caPrivateKeyPtr,
        caPrivateKey.length,
        signedCertPath,
        days
      );
      if (!result) {
        throw new Error("Certificate signing failed");
      }
      
      // Read the signed certificate file from virtual FS
      const signedCertData = this.FS.readFile(signedCertPath);
      return new Uint8Array(signedCertData);
    } finally {
      // Free allocated memory
      if (caPrivateKeyPtr) this.free(caPrivateKeyPtr);
    }
  }

  /**
   * Utility method to export a key or certificate to a hex string.
   * @param {Uint8Array} data - The data to export
   * @returns {string} Hexadecimal representation of the data
   */
  exportToHex(data) {
    return this._bytesToHex(data);
  }

  /**
   * Utility method to import a key or certificate from a hex string.
   * @param {string} hex - The hexadecimal string to import
   * @returns {Uint8Array} Byte array representation of the hex string
   */
  importFromHex(hex) {
    return this._hexToBytes(hex);
  }

  /**
   * Utility method to save data to a file in the virtual filesystem.
   * @param {string} path - Virtual FS path to save the file
   * @param {Uint8Array} data - The data to save
   */
  saveToVirtualFS(path, data) {
    this._ensureInitialized();
    this.FS.writeFile(path, data);
  }

  /**
   * Utility method to read data from a file in the virtual filesystem.
   * @param {string} path - Virtual FS path to read the file from
   * @returns {Uint8Array} The file data
   */
  readFromVirtualFS(path) {
    this._ensureInitialized();
    return new Uint8Array(this.FS.readFile(path));
  }
}

// Export the wrapper class
const Mldsa_wrapper = new MLDSAWrapper();
Mldsa_wrapper.initialize();
export default Mldsa_wrapper;