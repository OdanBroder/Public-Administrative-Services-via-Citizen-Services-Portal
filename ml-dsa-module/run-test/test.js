
// test.js
// Test script for the ML-DSA WASM module (mldsa_lib.wasm)
// Updated to handle raw key bytes from generate_mldsa65_keypair

// --- Configuration ---

// Adjust the path if your compiled JS file has a different name or location
const wasmModulePath = './mldsa_lib.js';

// Test parameters
const csrFsPath = '/tmp/req.csr';
const certFsPath = '/tmp/cert.pem';
const signatureFsPath = '/tmp/message.sig';
const message = "This is a test message for ML-DSA-65 signing and verification.";
const subjectInfo = ["C=US", "ST=CA", "L=San Francisco", "O=Test Org Inc.", "CN=test.example.com"];
const validityDays = 365;

// Buffer sizes based on raw key sizes from mldsa_lib.h
// ml_dsa_65_private_key_size = 4032
// ml_dsa_65_public_key_size = 1952
const PRIV_KEY_BUFFER_SIZE = 4096; // Raw private key size (4032) + padding
const PUB_KEY_BUFFER_SIZE = 2048;  // Raw public key size (1952) + padding

// --- Test Runner ---

async function runMldsaTest() {
    let Module;
    let malloc, free, cwrap, stringToUTF8, UTF8ToString, FS;
    let generate_mldsa65_keypair, generate_csr, generate_self_signed_certificate;
    let sign_mldsa65, verify_mldsa65, verify_signature_with_cert;

    // Pointers to allocated WASM memory
    let privateKeyPtr = 0;
    let publicKeyPtr = 0;
    let subjectInfoPtrs = [];
    let subjectInfoArrayPtr = 0;
    let messagePtr = 0;

    try {
        console.log(`Loading WASM module from ${wasmModulePath}...`);
        // Dynamically import the module
        const { default: createOQSModule } = await import(wasmModulePath);
        Module = await createOQSModule();
        console.log("WASM module initialized successfully.");

        // Get necessary functions and utilities from the Module
        ({ _malloc: malloc, _free: free, cwrap, stringToUTF8, UTF8ToString, FS } = Module);

        // Check if _free is available
        if (typeof free !== 'function') {
            console.warn("\n⚠️ Warning: The '_free' function was not found in the exported WASM functions.");
            console.warn("Memory allocated within the WASM heap (using '_malloc') will not be freed.");
            console.warn("This is acceptable for a short test run, but consider exporting '_free' for applications to prevent memory leaks.\n");
            free = () => {}; // Use a no-op function if free is not available
        }

        // Create a working directory in Emscripten's virtual file system
        if (!FS.analyzePath('/tmp').exists) {
            FS.mkdir('/tmp');
            console.log("Created directory '/tmp' in virtual FS.");
        }

        // Wrap C functions for easier JavaScript usage (Updated argument types for keys)
        console.log("Wrapping exported C functions...");
        // bool generate_mldsa65_keypair(char *private_key, char *public_key);
        generate_mldsa65_keypair = cwrap('generate_mldsa65_keypair', 'number', ['number', 'number']);
        // bool generate_csr(char* private_key_chr, char* csr_path, char** subject_info_vec, int subject_info_count);
        generate_csr = cwrap('generate_csr', 'number', ['number', 'string', 'number', 'number']); // private_key_chr is now 'number' (pointer)
        // bool generate_self_signed_certificate(char* csr_path, char* private_key_chr, char* certificate_path, int days);
        generate_self_signed_certificate = cwrap('generate_self_signed_certificate', 'number', ['string', 'number', 'string', 'number']); // private_key_chr is now 'number' (pointer)
        // bool sign_mldsa65(const char *private_key, const char *message, size_t message_len, char *signature_path);
        sign_mldsa65 = cwrap('sign_mldsa65', 'number', ['number', 'number', 'number', 'string']); // private_key is now 'number' (pointer)
        // bool verify_mldsa65(const char *public_key_chr, const char *signature_path, const char *message_chr, int message_len);
        verify_mldsa65 = cwrap('verify_mldsa65', 'number', ['number', 'string', 'number', 'number']); // public_key_chr is now 'number' (pointer)
        // bool verify_signature_with_cert(const char *certificate_path_chr, const char *signature_path,  const char *message_chr, int message_len);
        verify_signature_with_cert = cwrap('verify_signature_with_cert', 'number', ['string', 'string', 'number', 'number']);
        console.log("C functions wrapped.");

        // --- Test Step 1: Generate Key Pair --- 
        console.log("\n--- 🔑 Test Step 1: Generate ML-DSA-65 Key Pair (Raw Bytes) ---");
        privateKeyPtr = malloc(PRIV_KEY_BUFFER_SIZE);
        publicKeyPtr = malloc(PUB_KEY_BUFFER_SIZE);
        if (!privateKeyPtr || !publicKeyPtr) {
            throw new Error("Test Step 1 Failed: Could not allocate memory for keys.");
        }
        console.log(`Allocated WASM memory: privateKeyPtr=${privateKeyPtr} (${PRIV_KEY_BUFFER_SIZE} bytes), publicKeyPtr=${publicKeyPtr} (${PUB_KEY_BUFFER_SIZE} bytes)`);

        const keygenResult = generate_mldsa65_keypair(privateKeyPtr, publicKeyPtr);
        console.log(`Called generate_mldsa65_keypair -> Result: ${keygenResult}`);
        if (!keygenResult) {
            // NOTE: Add OpenSSL error stack printing here if available/exported
            throw new Error("Test Step 1 Failed: C function generate_mldsa65_keypair returned false.");
        }
        // Keys are now raw bytes in WASM memory pointed to by privateKeyPtr and publicKeyPtr
        console.log("✅ Key pair generated successfully (raw bytes in WASM memory).");

        // --- Test Step 2: Sign a Message --- 
        console.log("\n--- ✍️ Test Step 2: Sign Message ---");
        // Allocate memory for the message in WASM heap
        messagePtr = malloc(message.length + 1);
        if (!messagePtr) throw new Error("Test Step 2 Failed: Could not allocate memory for message.");
        stringToUTF8(message, messagePtr, message.length + 1); // +1 for null terminator
        console.log(`Allocated WASM memory for message: messagePtr=${messagePtr}`);

        console.log(`Signing message: "${message}"`);
        console.log(`Using raw private key (pointer: ${privateKeyPtr}) and saving signature to virtual FS path: ${signatureFsPath}`);
        // Pass the pointer privateKeyPtr directly
        const signResult = sign_mldsa65(privateKeyPtr, messagePtr, message.length, signatureFsPath);
        console.log(`Called sign_mldsa65 -> Result: ${signResult}`);
        if (!signResult) {
            throw new Error("Test Step 2 Failed: C function sign_mldsa65 returned false.");
        }

        // Verify signature file exists in virtual FS and is not empty
        const signatureStat = FS.analyzePath(signatureFsPath);
        if (!signatureStat.exists || FS.readFile(signatureFsPath).length === 0) {
             throw new Error(`Test Step 2 Failed: Signature file ${signatureFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ Signature created successfully at ${signatureFsPath} (${FS.readFile(signatureFsPath).length} bytes).`);

        // --- Test Step 3: Verify Signature (using Public Key) --- 
        console.log("\n--- ✅ Test Step 3: Verify Signature with Public Key ---");
        console.log(`Verifying signature at ${signatureFsPath} against original message.`);
        console.log(`Using raw public key (pointer: ${publicKeyPtr}).`);
        // Pass the pointer publicKeyPtr directly
        const verifyResult = verify_mldsa65(publicKeyPtr, signatureFsPath, messagePtr, message.length);
        console.log(`Called verify_mldsa65 -> Result: ${verifyResult}`);
        if (!verifyResult) {
            throw new Error("Test Step 3 Failed: C function verify_mldsa65 returned false (verification failed).");
        }
        console.log("✅ Signature verified successfully using the public key.");

        // --- Test Step 4: Generate CSR --- 
        console.log("\n--- 📄 Test Step 4: Generate Certificate Signing Request (CSR) ---");
        // Allocate memory for subject info strings in WASM heap
        subjectInfoPtrs = subjectInfo.map(s => {
            const ptr = malloc(s.length + 1);
            if (!ptr) throw new Error("Test Step 4 Failed: Could not allocate memory for a subject info string.");
            stringToUTF8(s, ptr, s.length+1);
            return ptr;
        });
        // Allocate memory for the array of pointers (char**) in WASM heap
        subjectInfoArrayPtr = malloc(subjectInfoPtrs.length * 4); // 4 bytes per pointer in WASM32
        if (!subjectInfoArrayPtr) throw new Error("Test Step 4 Failed: Could not allocate memory for subject info pointer array.");
        // Write the pointers into the WASM memory array
        for (let i = 0; i < subjectInfoPtrs.length; i++) {
            Module.setValue(subjectInfoArrayPtr + i * 4, subjectInfoPtrs[i], 'i32'); // 'i32' for pointer type
        }

        // check subjectIntPtrs are correct
        for(let i=0;i<subjectInfoPtrs.length;i++) {
          let ptr = Module.getValue(subjectInfoArrayPtr + i * 4, 'i32');
          let string = UTF8ToString(ptr);
          console.log(`Subject Info ${i}: Pointer=${ptr}, String="${string}"`); 
        }

        console.log(`Allocated WASM memory for subject info: Array @ ${subjectInfoArrayPtr}, Strings @ ${subjectInfoPtrs.join(', ')}`);

        console.log(`Generating CSR with subject: ${subjectInfo.join(', ')}`);
        console.log(`Using raw private key (pointer: ${privateKeyPtr}) and saving CSR to virtual FS path: ${csrFsPath}`);
        // Pass the pointer privateKeyPtr directly
        const csrResult = generate_csr(privateKeyPtr, csrFsPath, subjectInfoArrayPtr, subjectInfo.length);
        console.log(`Called generate_csr -> Result: ${csrResult}`);
        if (!csrResult) {
            throw new Error("Test Step 4 Failed: C function generate_csr returned false.");
        }

        // Verify CSR file exists and is not empty
        const csrStat = FS.analyzePath(csrFsPath);
         if (!csrStat.exists || FS.readFile(csrFsPath).length === 0) {
             throw new Error(`Test Step 4 Failed: CSR file ${csrFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ CSR generated successfully at ${csrFsPath} (${FS.readFile(csrFsPath).length} bytes).`);

        // --- Test Step 5: Generate Self-Signed Certificate --- 
        console.log("\n--- 📜 Test Step 5: Generate Self-Signed Certificate ---");
        console.log(`Generating certificate from CSR (${csrFsPath}) and raw private key (pointer: ${privateKeyPtr}).`);
        console.log(`Validity: ${validityDays} days. Saving certificate to virtual FS path: ${certFsPath}`);
        // Pass the pointer privateKeyPtr directly
        const certResult = generate_self_signed_certificate(csrFsPath, privateKeyPtr, certFsPath, validityDays);
        console.log(`Called generate_self_signed_certificate -> Result: ${certResult}`);
        if (!certResult) {
            throw new Error("Test Step 5 Failed: C function generate_self_signed_certificate returned false.");
        }

        // Verify certificate file exists and is not empty
        const certStat = FS.analyzePath(certFsPath);
        if (!certStat.exists || FS.readFile(certFsPath).length === 0) {
             throw new Error(`Test Step 5 Failed: Certificate file ${certFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ Self-signed certificate generated successfully at ${certFsPath} (${FS.readFile(certFsPath).length} bytes).`);

        // --- Test Step 6: Verify Signature (using Certificate) --- 
        console.log("\n--- ✅ Test Step 6: Verify Signature with Certificate ---");
        console.log(`Verifying signature at ${signatureFsPath} against original message.`);
        console.log(`Using certificate (${certFsPath}).`);
        const verifyCertResult = verify_signature_with_cert(certFsPath, signatureFsPath, messagePtr, message.length);
        console.log(`Called verify_signature_with_cert -> Result: ${verifyCertResult}`);
        if (!verifyCertResult) {
            throw new Error("Test Step 6 Failed: C function verify_signature_with_cert returned false (verification failed).");
        }
        console.log("✅ Signature verified successfully using the certificate.");

        console.log("\n\n🎉 All ML-DSA WASM tests passed successfully! 🎉");

    } catch (error) {
        console.error("\n\n❌ Test run failed!");
        console.error(error);
        // You might want to add more detailed error reporting here,
        // potentially trying to read OpenSSL error messages from the WASM module
        // if such functionality is exported.
    } finally {
        // --- Cleanup --- 
        console.log("\n--- 🧹 Cleaning up WASM memory and virtual FS ---");
        // Free allocated WASM memory (if _free is available)
        if (typeof free === 'function' && free !== (() => {})) {
            if (privateKeyPtr) { free(privateKeyPtr); console.log(`Freed privateKeyPtr (${privateKeyPtr})`); }
            if (publicKeyPtr) { free(publicKeyPtr); console.log(`Freed publicKeyPtr (${publicKeyPtr})`); }
            if (messagePtr) { free(messagePtr); console.log(`Freed messagePtr (${messagePtr})`); }
            if (subjectInfoArrayPtr) { free(subjectInfoArrayPtr); console.log(`Freed subjectInfoArrayPtr (${subjectInfoArrayPtr})`); }
            subjectInfoPtrs.forEach((ptr, i) => {
                 if (ptr) { free(ptr); console.log(`Freed subjectInfoPtrs[${i}] (${ptr})`); }
            });
        } else {
             console.log("Skipping memory free operations as '_free' was not available.");
        }

        // Clean up virtual file system (optional, but good practice for testing)
        try {
            if (FS) {
                console.log("Removing files from virtual FS...");
                // Removed key files as they are not written anymore
                const filesToRemove = [signatureFsPath, csrFsPath, certFsPath];
                filesToRemove.forEach(f => {
                    try {
                        if (FS.analyzePath(f).exists) {
                             FS.unlink(f);
                             console.log(`Removed ${f}`);
                        }
                    } catch(e){/* ignore errors during cleanup */}
                });
                 if (FS.analyzePath('/working').exists) {
                    FS.rmdir('/working');
                    console.log("Removed directory /working");
                 }
                console.log("Virtual FS cleanup attempted.");
            }
        } catch (fsError) {
            console.error("Error during virtual FS cleanup:", fsError);
        }

        console.log("Cleanup complete.");
    }
}

// --- Run the Test --- 
runMldsaTest();

