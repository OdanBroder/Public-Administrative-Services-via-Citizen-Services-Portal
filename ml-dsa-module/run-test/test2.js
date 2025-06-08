// test_with_ca.js
// Test script for the ML-DSA WASM module (mldsa_lib.wasm)
// Including CA certificate signing workflow

// --- Configuration ---

// Adjust the path if your compiled JS file has a different name or location
const wasmModulePath = './mldsa_lib.js';

// Test parameters
// For entity certificate
const csrFsPath = '/working/req.csr';
const certFsPath = '/working/cert.pem';
const signatureFsPath = '/working/message.sig';
// For CA certificate
const caCsrFsPath = '/working/ca_req.csr';
const caCertFsPath = '/working/ca_cert.pem';
// For CA-signed certificate
const signedCertFsPath = '/working/signed_cert.pem';

const message = "This is a test message for ML-DSA-65 signing and verification.";
const entitySubjectInfo = ["C=US", "ST=CA", "L=San Francisco", "O=Test Org Inc.", "CN=test.example.com"];
const caSubjectInfo = ["C=US", "ST=CA", "L=San Francisco", "O=Test CA Inc.", "CN=testca.example.com"];
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
    let sign_certificate; // New function for CA signing

    // Pointers to allocated WASM memory
    // For entity certificate
    let privateKeyPtr = 0;
    let publicKeyPtr = 0;
    let subjectInfoPtrs = [];
    let subjectInfoArrayPtr = 0;
    let messagePtr = 0;
    // For CA certificate
    let caPrivateKeyPtr = 0;
    let caPublicKeyPtr = 0;
    let caSubjectInfoPtrs = [];
    let caSubjectInfoArrayPtr = 0;

    try {
        console.log(`Loading WASM module from ${wasmModulePath}...`);
        // Dynamically import the module
        const { default: createOQSModule } = await import(wasmModulePath);
        Module = await createOQSModule();
        console.log("WASM module initialized successfully.");

        // Get necessary functions and utilities from the Module
        ({ _malloc: malloc, _free: free, cwrap, stringToUTF8, UTF8ToString, FS, NODEFS } = Module);
        FS.mkdir('/working');
        FS.mount(NODEFS, { root: './nodefs' }, '/working');
        // Check if _free is available
        if (typeof free !== 'function') {
            console.warn("\n⚠️ Warning: The '_free' function was not found in the exported WASM functions.");
            console.warn("Memory allocated within the WASM heap (using '_malloc') will not be freed.");
            console.warn("This is acceptable for a short test run, but consider exporting '_free' for applications to prevent memory leaks.\n");
            free = () => {}; // Use a no-op function if free is not available
        }

        // Create a working directory in Emscripten's virtual file system
        if (!FS.analyzePath('/working').exists) {
            FS.mkdir('/working');
            console.log("Created directory '/working' in virtual FS.");
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
        // bool sign_certificate(const char* csr_path, const char* ca_cert_path, const char* ca_privkey_buf, size_t ca_privkey_len, const char* result_cert_path, int days_valid = 365);
        sign_certificate = cwrap('sign_certificate', 'number', ['string', 'string', 'number', 'number', 'string', 'number']);
        console.log("C functions wrapped.");

        // --- Test Step 1: Generate Entity Key Pair --- 
        console.log("\n--- 🔑 Test Step 1: Generate Entity ML-DSA-65 Key Pair (Raw Bytes) ---");
        privateKeyPtr = malloc(PRIV_KEY_BUFFER_SIZE);
        publicKeyPtr = malloc(PUB_KEY_BUFFER_SIZE);
        if (!privateKeyPtr || !publicKeyPtr) {
            throw new Error("Test Step 1 Failed: Could not allocate memory for entity keys.");
        }
        console.log(`Allocated WASM memory: privateKeyPtr=${privateKeyPtr} (${PRIV_KEY_BUFFER_SIZE} bytes), publicKeyPtr=${publicKeyPtr} (${PUB_KEY_BUFFER_SIZE} bytes)`);

        const keygenResult = generate_mldsa65_keypair(privateKeyPtr, publicKeyPtr);
        console.log(`Called generate_mldsa65_keypair -> Result: ${keygenResult}`);
        if (!keygenResult) {
            throw new Error("Test Step 1 Failed: C function generate_mldsa65_keypair returned false.");
        }
        console.log("✅ Entity key pair generated successfully (raw bytes in WASM memory).");

        // --- Test Step 2: Generate CA Key Pair --- 
        console.log("\n--- 🔑 Test Step 2: Generate CA ML-DSA-65 Key Pair (Raw Bytes) ---");
        caPrivateKeyPtr = malloc(PRIV_KEY_BUFFER_SIZE);
        caPublicKeyPtr = malloc(PUB_KEY_BUFFER_SIZE);
        if (!caPrivateKeyPtr || !caPublicKeyPtr) {
            throw new Error("Test Step 2 Failed: Could not allocate memory for CA keys.");
        }
        console.log(`Allocated WASM memory: caPrivateKeyPtr=${caPrivateKeyPtr} (${PRIV_KEY_BUFFER_SIZE} bytes), caPublicKeyPtr=${caPublicKeyPtr} (${PUB_KEY_BUFFER_SIZE} bytes)`);

        const caKeygenResult = generate_mldsa65_keypair(caPrivateKeyPtr, caPublicKeyPtr);
        console.log(`Called generate_mldsa65_keypair for CA -> Result: ${caKeygenResult}`);
        if (!caKeygenResult) {
            throw new Error("Test Step 2 Failed: C function generate_mldsa65_keypair returned false for CA keys.");
        }
        console.log("✅ CA key pair generated successfully (raw bytes in WASM memory).");

        // --- Test Step 3: Generate Entity CSR --- 
        console.log("\n--- 📄 Test Step 3: Generate Entity Certificate Signing Request (CSR) ---");
        // Allocate memory for subject info strings in WASM heap
        subjectInfoPtrs = entitySubjectInfo.map(s => {
            const ptr = malloc(s.length + 1);
            if (!ptr) throw new Error("Test Step 3 Failed: Could not allocate memory for a subject info string.");
            stringToUTF8(s, ptr, s.length + 1);
            return ptr;
        });
        // Allocate memory for the array of pointers (char**) in WASM heap
        subjectInfoArrayPtr = malloc(subjectInfoPtrs.length * 4); // 4 bytes per pointer in WASM32
        if (!subjectInfoArrayPtr) throw new Error("Test Step 3 Failed: Could not allocate memory for subject info pointer array.");
        // Write the pointers into the WASM memory array
        for (let i = 0; i < subjectInfoPtrs.length; i++) {
            Module.setValue(subjectInfoArrayPtr + i * 4, subjectInfoPtrs[i], 'i32'); // 'i32' for pointer type
        }
        console.log(`Allocated WASM memory for entity subject info: Array @ ${subjectInfoArrayPtr}, Strings @ ${subjectInfoPtrs.join(', ')}`);

        console.log(`Generating entity CSR with subject: ${entitySubjectInfo.join(', ')}`);
        console.log(`Using raw private key (pointer: ${privateKeyPtr}) and saving CSR to virtual FS path: ${csrFsPath}`);
        // Pass the pointer privateKeyPtr directly
        const csrResult = generate_csr(privateKeyPtr, csrFsPath, subjectInfoArrayPtr, entitySubjectInfo.length);
        console.log(`Called generate_csr -> Result: ${csrResult}`);
        if (!csrResult) {
            throw new Error("Test Step 3 Failed: C function generate_csr returned false.");
        }

        // Verify CSR file exists and is not empty
        const csrStat = FS.analyzePath(csrFsPath);
         if (!csrStat.exists || FS.readFile(csrFsPath).length === 0) {
             throw new Error(`Test Step 3 Failed: CSR file ${csrFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ Entity CSR generated successfully at ${csrFsPath} (${FS.readFile(csrFsPath).length} bytes).`);

        // --- Test Step 4: Generate CA CSR --- 
        console.log("\n--- 📄 Test Step 4: Generate CA Certificate Signing Request (CSR) ---");
        // Allocate memory for CA subject info strings in WASM heap
        caSubjectInfoPtrs = caSubjectInfo.map(s => {
            const ptr = malloc(s.length + 1);
            if (!ptr) throw new Error("Test Step 4 Failed: Could not allocate memory for a CA subject info string.");
            stringToUTF8(s, ptr, s.length + 1);
            return ptr;
        });
        // Allocate memory for the array of pointers (char**) in WASM heap
        caSubjectInfoArrayPtr = malloc(caSubjectInfoPtrs.length * 4); // 4 bytes per pointer in WASM32
        if (!caSubjectInfoArrayPtr) throw new Error("Test Step 4 Failed: Could not allocate memory for CA subject info pointer array.");
        // Write the pointers into the WASM memory array
        for (let i = 0; i < caSubjectInfoPtrs.length; i++) {
            Module.setValue(caSubjectInfoArrayPtr + i * 4, caSubjectInfoPtrs[i], 'i32'); // 'i32' for pointer type
        }
        console.log(`Allocated WASM memory for CA subject info: Array @ ${caSubjectInfoArrayPtr}, Strings @ ${caSubjectInfoPtrs.join(', ')}`);

        console.log(`Generating CA CSR with subject: ${caSubjectInfo.join(', ')}`);
        console.log(`Using raw CA private key (pointer: ${caPrivateKeyPtr}) and saving CSR to virtual FS path: ${caCsrFsPath}`);
        // Pass the pointer caPrivateKeyPtr directly
        const caCsrResult = generate_csr(caPrivateKeyPtr, caCsrFsPath, caSubjectInfoArrayPtr, caSubjectInfo.length);
        console.log(`Called generate_csr for CA -> Result: ${caCsrResult}`);
        if (!caCsrResult) {
            throw new Error("Test Step 4 Failed: C function generate_csr returned false for CA CSR.");
        }

        // Verify CA CSR file exists and is not empty
        const caCsrStat = FS.analyzePath(caCsrFsPath);
         if (!caCsrStat.exists || FS.readFile(caCsrFsPath).length === 0) {
             throw new Error(`Test Step 4 Failed: CA CSR file ${caCsrFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ CA CSR generated successfully at ${caCsrFsPath} (${FS.readFile(caCsrFsPath).length} bytes).`);

        // --- Test Step 5: Generate Self-Signed CA Certificate --- 
        console.log("\n--- 📜 Test Step 5: Generate Self-Signed CA Certificate ---");
        console.log(`Generating CA certificate from CSR (${caCsrFsPath}) and raw CA private key (pointer: ${caPrivateKeyPtr}).`);
        console.log(`Validity: ${validityDays} days. Saving CA certificate to virtual FS path: ${caCertFsPath}`);
        // Pass the pointer caPrivateKeyPtr directly
        const caCertResult = generate_self_signed_certificate(caCsrFsPath, caPrivateKeyPtr, caCertFsPath, validityDays);
        console.log(`Called generate_self_signed_certificate for CA -> Result: ${caCertResult}`);
        if (!caCertResult) {
            throw new Error("Test Step 5 Failed: C function generate_self_signed_certificate returned false for CA cert.");
        }

        // Verify CA certificate file exists and is not empty
        const caCertStat = FS.analyzePath(caCertFsPath);
        if (!caCertStat.exists || FS.readFile(caCertFsPath).length === 0) {
             throw new Error(`Test Step 5 Failed: CA Certificate file ${caCertFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ Self-signed CA certificate generated successfully at ${caCertFsPath} (${FS.readFile(caCertFsPath).length} bytes).`);

        // --- Test Step 6: Sign Entity Certificate with CA --- 
        console.log("\n--- 📜 Test Step 6: Sign Entity Certificate with CA ---");
        console.log(`Signing entity CSR (${csrFsPath}) with CA certificate (${caCertFsPath}) and CA private key.`);
        console.log(`Validity: ${validityDays} days. Saving signed certificate to virtual FS path: ${signedCertFsPath}`);
        
        // Get the size of the CA private key (should be ml_dsa_65_private_key_size = 4032)
        const caPrivKeyLen = 4032; // Using the constant from header file
        
        // Call sign_certificate with the CA private key pointer
        const signCertResult = sign_certificate(csrFsPath, caCertFsPath, caPrivateKeyPtr, caPrivKeyLen, signedCertFsPath, validityDays);
        console.log(`Called sign_certificate -> Result: ${signCertResult}`);
        if (!signCertResult) {
            throw new Error("Test Step 6 Failed: C function sign_certificate returned false.");
        }

        // Verify signed certificate file exists and is not empty
        const signedCertStat = FS.analyzePath(signedCertFsPath);
        if (!signedCertStat.exists || FS.readFile(signedCertFsPath).length === 0) {
             throw new Error(`Test Step 6 Failed: Signed certificate file ${signedCertFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ CA-signed entity certificate generated successfully at ${signedCertFsPath} (${FS.readFile(signedCertFsPath).length} bytes).`);

        // --- Test Step 7: Sign a Message with Entity Key --- 
        console.log("\n--- ✍️ Test Step 7: Sign Message with Entity Key ---");
        // Allocate memory for the message in WASM heap
        messagePtr = malloc(message.length + 1);
        if (!messagePtr) throw new Error("Test Step 7 Failed: Could not allocate memory for message.");
        stringToUTF8(message, messagePtr, message.length + 1); // +1 for null terminator
        console.log(`Allocated WASM memory for message: messagePtr=${messagePtr}`);

        console.log(`Signing message: "${message}"`);
        console.log(`Using entity private key (pointer: ${privateKeyPtr}) and saving signature to virtual FS path: ${signatureFsPath}`);
        // Pass the pointer privateKeyPtr directly
        const signResult = sign_mldsa65(privateKeyPtr, messagePtr, message.length, signatureFsPath);
        console.log(`Called sign_mldsa65 -> Result: ${signResult}`);
        if (!signResult) {
            throw new Error("Test Step 7 Failed: C function sign_mldsa65 returned false.");
        }

        // Verify signature file exists in virtual FS and is not empty
        const signatureStat = FS.analyzePath(signatureFsPath);
        if (!signatureStat.exists || FS.readFile(signatureFsPath).length === 0) {
             throw new Error(`Test Step 7 Failed: Signature file ${signatureFsPath} was not created or is empty in virtual FS.`);
        }
        console.log(`✅ Signature created successfully at ${signatureFsPath} (${FS.readFile(signatureFsPath).length} bytes).`);

        // --- Test Step 8: Verify Signature with CA-Signed Certificate --- 
        console.log("\n--- ✅ Test Step 8: Verify Signature with CA-Signed Certificate ---");
        console.log(`Verifying signature at ${signatureFsPath} against original message.`);
        console.log(`Using CA-signed entity certificate (${signedCertFsPath}).`);
        const verifyCertResult = verify_signature_with_cert(signedCertFsPath, signatureFsPath, messagePtr, message.length);
        console.log(`Called verify_signature_with_cert -> Result: ${verifyCertResult}`);
        if (!verifyCertResult) {
            throw new Error("Test Step 8 Failed: C function verify_signature_with_cert returned false (verification failed).");
        }
        console.log("✅ Signature verified successfully using the CA-signed certificate.");

        console.log("\n\n🎉 All ML-DSA WASM tests including CA certificate signing passed successfully! 🎉");

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
            if (caPrivateKeyPtr) { free(caPrivateKeyPtr); console.log(`Freed caPrivateKeyPtr (${caPrivateKeyPtr})`); }
            if (caPublicKeyPtr) { free(caPublicKeyPtr); console.log(`Freed caPublicKeyPtr (${caPublicKeyPtr})`); }
            if (messagePtr) { free(messagePtr); console.log(`Freed messagePtr (${messagePtr})`); }
            if (subjectInfoArrayPtr) { free(subjectInfoArrayPtr); console.log(`Freed subjectInfoArrayPtr (${subjectInfoArrayPtr})`); }
            if (caSubjectInfoArrayPtr) { free(caSubjectInfoArrayPtr); console.log(`Freed caSubjectInfoArrayPtr (${caSubjectInfoArrayPtr})`); }
            
            // Free subject info pointers
            subjectInfoPtrs.forEach((ptr, i) => {
                 if (ptr) { free(ptr); console.log(`Freed subjectInfoPtrs[${i}] (${ptr})`); }
            });
            caSubjectInfoPtrs.forEach((ptr, i) => {
                 if (ptr) { free(ptr); console.log(`Freed caSubjectInfoPtrs[${i}] (${ptr})`); }
            });
        } else {
             console.log("Skipping memory free operations as '_free' was not available.");
        }

        // Clean up virtual file system (optional, but good practice for testing)
        try {
            if (FS) {
                console.log("Removing files from virtual FS...");
                const filesToRemove = [csrFsPath, certFsPath, signatureFsPath, caCsrFsPath, caCertFsPath, signedCertFsPath];
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
