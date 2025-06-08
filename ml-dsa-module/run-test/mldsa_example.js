/**
 * @file mldsa_wrapper_example.js
 * @description Example usage of the ML-DSA WASM wrapper
 */

// Import the wrapper class
import MLDSAWrapper from './mldsa_wrapper.js';

/**
 * Example demonstrating basic key generation, signing, and verification
 */
async function basicExample() {
  console.log("=== Basic ML-DSA Example ===");
  
  // Create and initialize the wrapper
  const mldsa = new MLDSAWrapper('./mldsa_lib.js');
  await mldsa.initialize();
  
  try {
    // Generate a key pair
    console.log("Generating ML-DSA-65 key pair...");
    const { privateKey, publicKey } = await mldsa.generateKeyPair();
    console.log(`Generated private key (${privateKey.length} bytes) and public key (${publicKey.length} bytes)`);
    
    // Sign a message
    const message = "Hello, ML-DSA!";
    console.log(`Signing message: "${message}"`);
    const signature = await mldsa.sign(privateKey, message);
    console.log(`Generated signature (${signature.length} bytes)`);
    
    // Verify the signature
    console.log("Verifying signature...");
    const isValid = await mldsa.verify(publicKey, signature, message);
    console.log(`Signature verification result: ${isValid ? "Valid ✓" : "Invalid ✗"}`);
    
    // Export keys to hex for storage
    const privateKeyHex = mldsa.exportToHex(privateKey);
    const publicKeyHex = mldsa.exportToHex(publicKey);
    console.log("Keys exported to hex format for storage");
    
    // Later, import keys from hex
    const importedPrivateKey = mldsa.importFromHex(privateKeyHex);
    const importedPublicKey = mldsa.importFromHex(publicKeyHex);
    console.log("Keys imported from hex format");
    
    // Verify with imported keys
    const isStillValid = await mldsa.verify(importedPublicKey, signature, message);
    console.log(`Signature verification with imported keys: ${isStillValid ? "Valid ✓" : "Invalid ✗"}`);
    
  } catch (error) {
    console.error("Error in basic example:", error);
  }
}

/**
 * Example demonstrating certificate operations
 */
async function certificateExample() {
  console.log("\n=== ML-DSA Certificate Example ===");
  
  // Create and initialize the wrapper
  const mldsa = new MLDSAWrapper('./mldsa_lib.js');
  await mldsa.initialize();
  
  try {
    // Generate entity key pair
    console.log("Generating entity key pair...");
    const { privateKey, publicKey } = await mldsa.generateKeyPair();
    
    // Generate CSR
    console.log("Generating Certificate Signing Request (CSR)...");
    const subjectInfo = ["C=US", "ST=California", "L=San Francisco", "O=Example Org", "CN=example.com"];
    const csr = await mldsa.generateCSR(privateKey, subjectInfo);
    console.log(`Generated CSR (${csr.length} bytes)`);
    
    // Generate self-signed certificate
    console.log("Generating self-signed certificate...");
    const selfSignedCert = await mldsa.generateSelfSignedCertificate(privateKey, 365, "/working/req.csr", "/working/self_signed_cert.pem");
    console.log(`Generated self-signed certificate (${selfSignedCert.length} bytes)`);
    
    // Sign a message
    const message = "Message to be verified with certificate";
    console.log(`Signing message: "${message}"`);
    const signature = await mldsa.sign(privateKey, message);
    
    // Verify with certificate
    console.log("Verifying signature with certificate...");
    const isValid = await mldsa.verifyWithCertificate(selfSignedCert, signature, message);
    console.log(`Certificate verification result: ${isValid ? "Valid ✓" : "Invalid ✗"}`);
    
  } catch (error) {
    console.error("Error in certificate example:", error);
  }
}

/**
 * Example demonstrating CA certificate operations
 */
async function caExample() {
  console.log("\n=== ML-DSA CA Certificate Example ===");
  
  // Create and initialize the wrapper
  const mldsa = new MLDSAWrapper('./mldsa_lib.js');
  await mldsa.initialize();
  
  try {
    // Generate CA key pair
    console.log("Generating CA key pair...");
    const { privateKey: caPrivateKey, publicKey: caPublicKey } = await mldsa.generateKeyPair();
    
    // Generate CA CSR
    console.log("Generating CA Certificate Signing Request...");
    const caSubjectInfo = ["C=US", "ST=California", "L=San Francisco", "O=Example CA", "CN=ca.example.com"];
    const caCsr = await mldsa.generateCSR(caPrivateKey, caSubjectInfo);
    
    // Generate self-signed CA certificate
    console.log("Generating self-signed CA certificate...");
    const caCert = await mldsa.generateSelfSignedCertificate(caPrivateKey, 3650, '/working/req.csr', '/working/ca_cert.pem'); // 10 years
    console.log(`Generated CA certificate (${caCert.length} bytes)`);
    
    // Generate entity key pair
    console.log("Generating entity key pair...");
    const { privateKey: entityPrivateKey, publicKey: entityPublicKey } = await mldsa.generateKeyPair();
    
    // Generate entity CSR
    console.log("Generating entity Certificate Signing Request...");
    const entitySubjectInfo = ["C=US", "ST=California", "L=San Francisco", "O=Example Entity", "CN=entity.example.com"];
    const entityCsr = await mldsa.generateCSR(entityPrivateKey, entitySubjectInfo);
    
    // Sign entity certificate with CA
    console.log("Signing entity certificate with CA...");
    const entityCert = await mldsa.signCertificate(caPrivateKey, 365);
    console.log(`Generated CA-signed entity certificate (${entityCert.length} bytes)`);
    
    // Sign a message with entity key
    const message = "Message signed by entity, to be verified with CA-signed cert";
    console.log(`Signing message with entity key: "${message}"`);
    const signature = await mldsa.sign(entityPrivateKey, message);
    
    // Verify with CA-signed entity certificate
    console.log("Verifying signature with CA-signed entity certificate...");
    const isValid = await mldsa.verifyWithCertificate(entityCert, signature, message);
    console.log(`Certificate verification result: ${isValid ? "Valid ✓" : "Invalid ✗"}`);
    
  } catch (error) {
    console.error("Error in CA example:", error);
  }
}

// Run the examples
async function runExamples() {
  try {
    await basicExample();
    await certificateExample();
    await caExample();
    console.log("\nAll examples completed.");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

runExamples();
