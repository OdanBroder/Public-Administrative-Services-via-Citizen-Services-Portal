// scalable-tpm-service.js
import child_process  from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

class ScalableTPMService {
    constructor(options = {}) {
        this.tempDir = options.tempDir || '/tmp/tpm-service';
        this.sealedKeyStorage = options.sealedKeyStorage || '/app/data/sealed-keys';
        this.tctiConfig = options.tctiConfig || this.detectTCTI();
        this.maxRetries = options.maxRetries || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        // TPM Root Key configuration
        this.rootKeyConfig = {
            hierarchy: 'o', // Owner hierarchy
            algorithm: 'ecc', // Changed from 'rsa' to 'ecc'
            curveId: 'nistp256', // Added for ECC, specifies the elliptic curve
            hash: 'sha256',
            handle: '0x81000010', // Persistent handle for root key
            attributes: "fixedtpm|fixedparent|sensitivedataorigin|userwithauth|decrypt|restricted"
        };
        
        // Application AES key configuration
        this.appKeyConfig = {
            algorithm: 'aes-256-gcm',
            keyLength: 32, // 256 bits
            sealedKeyFile: path.join(this.sealedKeyStorage, 'app-aes-key.sealed')
        };
        
        this.encryptingKeyConfig = {
            algorithm: 'aes-256-gcm',
            keyLength: 32, // 256 bits,
            sealedKeyFile: path.join(this.sealedKeyStorage, 'encrypting-key.sealed')
        }
        this.ensureDirectories();
        this.setupEnvironment();
    }

    /**
     * Detect appropriate TCTI configuration
     */
    detectTCTI() {
        if (fs.existsSync('/dev/tpmrm0')) {
            return 'device:/dev/tpmrm0';
        }
        if (fs.existsSync('/dev/tpm0')) {
            return 'device:/dev/tpm0';
        }
        return 'device';
    }

    /**
     * Setup TPM environment variables
     */
    setupEnvironment() {
        process.env.TPM2TOOLS_TCTI = this.tctiConfig;
        process.env.TPM2TOOLS_TCTI_NAME = 'device';
    }

    /**
     * Ensure required directories exist
     */
    ensureDirectories() {
        [this.tempDir, this.sealedKeyStorage].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
            }
        });
    }

    /**
     * Execute TPM command with retry logic
     */
    async executeTPMCommand(command, args, options = {}) {
        const { retries = this.maxRetries, timeout = 30000 } = options;
        console.log(`Executing TPM command: ${command} ${args.join(' ')}`);
        for (let attempt = 1; attempt <= retries; attempt++) {
            try {
                return await this.executeCommand(command, args, timeout);
            } catch (error) {
                console.warn(`TPM command attempt ${attempt}/${retries} failed:`, error.message);
                
                if (attempt === retries) {
                    throw new Error(`TPM command '${command}' failed after ${retries} attempts: ${error.message}`);
                }
                
                await this.sleep(this.retryDelay * attempt);
            }
        }
    }

    /**
     * Execute single command with timeout
     */
    executeCommand(command, args, timeout) {
        return new Promise((resolve, reject) => {
            const child = child_process.spawn(command, args, {
                env: { ...process.env },
                stdio: ['pipe', 'pipe', 'pipe']
            });
            
            let stdout = '';
            let stderr = '';
            let timeoutId;

            if (timeout > 0) {
                timeoutId = setTimeout(() => {
                    child.kill('SIGKILL');
                    reject(new Error(`Command '${command}' timed out after ${timeout}ms`));
                }, timeout);
            }

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                if (timeoutId) clearTimeout(timeoutId);
                
                if (code === 0) {
                    resolve(stdout.trim());
                } else {
                    reject(new Error(`Command failed with code ${code}: ${stderr.trim()}`));
                }
            });

            child.on('error', (err) => {
                if (timeoutId) clearTimeout(timeoutId);
                reject(new Error(`Failed to execute command '${command}': ${err.message}`));
            });
        });
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Generate unique temporary file path
     */
    getTempFilePath(suffix) {
        const randomId = crypto.randomBytes(8).toString('hex');
        const timestamp = Date.now();
        return path.join(this.tempDir, `tpm_${timestamp}_${randomId}_${suffix}`);
    }

    /**
     * Clean up temporary files
     */
    cleanupFiles(filePaths) {
        filePaths.forEach(filePath => {
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (error) {
                console.warn(`Failed to cleanup file ${filePath}:`, error.message);
            }
        });
    }

    /**
     * Initialize TPM with root key
     */
    async initializeTPM() {
        try {
            // Check if root key already exists
            const persistentKeys = await this.listPersistentKeys();
            const rootKeyExists = persistentKeys.some(key => key.handle === this.rootKeyConfig.handle);
            
            if (rootKeyExists) {
                console.log('TPM root key already exists');
                return this.rootKeyConfig.handle;
            }

            console.log('Creating TPM root key...');
            const primaryCtxPath = this.getTempFilePath('root_primary.ctx');
            
            try {
                // Create root key with encryption and signing capabilities
                await this.executeTPMCommand('tpm2_createprimary', [
                    '-C', this.rootKeyConfig.hierarchy,
                    '-g', this.rootKeyConfig.hash,
                    '-G', this.rootKeyConfig.algorithm,
                    '-a', this.rootKeyConfig.attributes,
                    '-c', primaryCtxPath
                ]);

                // Make root key persistent
                await this.executeTPMCommand('tpm2_evictcontrol', [
                    '-C', this.rootKeyConfig.hierarchy,
                    '-c', primaryCtxPath,
                    this.rootKeyConfig.handle
                ]);

                console.log(`TPM root key created and persisted at handle ${this.rootKeyConfig.handle}`);
                return this.rootKeyConfig.handle;

            } finally {
                this.cleanupFiles([primaryCtxPath]);
            }

        } catch (error) {
            throw new Error(`Failed to initialize TPM: ${error.message}`);
        }
    }

    /**
     * Generate and seal application AES key
     */
    async generateAndSealAESKey(options = {}) {
        const { 
            keyLength = this.appKeyConfig.keyLength,
            algorithm = this.appKeyConfig.algorithm,
            pcrValues = null 
        } = options;

        try {
            // Check if sealed key already exists
            if (fs.existsSync(this.appKeyConfig.sealedKeyFile)) {
                console.log('Sealed AES key already exists');
                return { exists: true, keyFile: this.appKeyConfig.sealedKeyFile };
            }

            // Ensure root key exists
            await this.initializeTPM();

            // Generate AES key
            console.log('Generating AES key...');
            const aesKey = crypto.randomBytes(keyLength);
            
            // Create temporary files
            const keyDataPath = this.getTempFilePath('aes_key.bin');
            const sealedPubPath = this.getTempFilePath('sealed.pub');
            const sealedPrivPath = this.getTempFilePath('sealed.priv');

            try {
                // Write AES key to temporary file
                fs.writeFileSync(keyDataPath, aesKey);

                // Create sealing object using root key
                const createArgs = [
                    '-C', this.rootKeyConfig.handle,
                    '-g', this.rootKeyConfig.hash,
                    '-i', keyDataPath,
                    '-u', sealedPubPath,
                    '-r', sealedPrivPath
                ];

                // Add PCR policy if specified
                if (pcrValues && Array.isArray(pcrValues) && pcrValues.length > 0) {
                    const pcrList = pcrValues.join(',');
                    createArgs.push('-L', `pcr:${this.rootKeyConfig.hash}:${pcrList}`);
                }

                await this.executeTPMCommand('tpm2_create', createArgs);

                // Combine sealed public and private parts
                const sealedPub = fs.readFileSync(sealedPubPath);
                const sealedPriv = fs.readFileSync(sealedPrivPath);
                
                const sealedData = {
                    algorithm: algorithm,
                    keyLength: keyLength,
                    publicPart: sealedPub.toString('base64'),
                    privatePart: sealedPriv.toString('base64'),
                    pcrValues: pcrValues,
                    timestamp: new Date().toISOString()
                };

                // Save sealed data
                fs.writeFileSync(this.appKeyConfig.sealedKeyFile, JSON.stringify(sealedData, null, 2));

                console.log('AES key generated and sealed successfully');
                return { 
                    success: true, 
                    keyFile: this.appKeyConfig.sealedKeyFile,
                    algorithm: algorithm,
                    keyLength: keyLength
                };

            } finally {
                this.cleanupFiles([keyDataPath, sealedPubPath, sealedPrivPath]);
            }

        } catch (error) {
            throw new Error(`Failed to generate and seal AES key: ${error.message}`);
        }
    }

    async unsealAESKey() {
        try {
            if (!fs.existsSync(this.appKeyConfig.sealedKeyFile)) {
                throw new Error('Sealed AES key file not found');
            }

            // Read sealed data
            const sealedData = JSON.parse(fs.readFileSync(this.appKeyConfig.sealedKeyFile, 'utf8'));
            
            // Create temporary files
            const sealedPubPath = this.getTempFilePath('sealed.pub');
            const sealedPrivPath = this.getTempFilePath('sealed.priv');
            const loadedCtxPath = this.getTempFilePath('loaded.ctx');
            const unsealedDataPath = this.getTempFilePath('unsealed.bin');

            try {
                // Write sealed parts to temporary files
                fs.writeFileSync(sealedPubPath, Buffer.from(sealedData.publicPart, 'base64'));
                fs.writeFileSync(sealedPrivPath, Buffer.from(sealedData.privatePart, 'base64'));

                // Load sealed object
                await this.executeTPMCommand('tpm2_load', [
                    '-C', this.rootKeyConfig.handle,
                    '-u', sealedPubPath,
                    '-r', sealedPrivPath,
                    '-c', loadedCtxPath
                ]);

                // Unseal the data
                await this.executeTPMCommand('tpm2_unseal', [
                    '-c', loadedCtxPath,
                    '-o', unsealedDataPath
                ]);

                // Read unsealed AES key
                const aesKey = fs.readFileSync(unsealedDataPath);

                console.log('AES key unsealed successfully');
                return {
                    key: aesKey,
                    algorithm: sealedData.algorithm,
                    keyLength: sealedData.keyLength
                };

            } finally {
                this.cleanupFiles([sealedPubPath, sealedPrivPath, loadedCtxPath, unsealedDataPath]);
            }

        } catch (error) {
            throw new Error(`Failed to unseal AES key: ${error.message}`);
        }
    }

    async generateAndSealEncryptingKey(options = {}) {
        const { 
            keyLength = this.encryptingKeyConfig.keyLength,
            algorithm = this.encryptingKeyConfig.algorithm,
            pcrValues = null 
        } = options;

        try {
            // Check if sealed key already exists
            if (fs.existsSync(this.encryptingKeyConfig.sealedKeyFile)) {
                console.log('Sealed AES key already exists');
                return { exists: true, keyFile: this.encryptingKeyConfig.sealedKeyFile };
            }

            // Ensure root key exists
            await this.initializeTPM();

            // Generate AES key
            console.log('Generating AES key...');
            const aesKey = crypto.randomBytes(keyLength);
            
            // Create temporary files
            const keyDataPath = this.getTempFilePath('aes_key.bin');
            const sealedPubPath = this.getTempFilePath('sealed.pub');
            const sealedPrivPath = this.getTempFilePath('sealed.priv');

            try {
                // Write AES key to temporary file
                fs.writeFileSync(keyDataPath, aesKey);

                // Create sealing object using root key
                const createArgs = [
                    '-C', this.rootKeyConfig.handle,
                    '-g', this.rootKeyConfig.hash,
                    '-i', keyDataPath,
                    '-u', sealedPubPath,
                    '-r', sealedPrivPath
                ];

                // Add PCR policy if specified
                if (pcrValues && Array.isArray(pcrValues) && pcrValues.length > 0) {
                    const pcrList = pcrValues.join(',');
                    createArgs.push('-L', `pcr:${this.rootKeyConfig.hash}:${pcrList}`);
                }

                await this.executeTPMCommand('tpm2_create', createArgs);

                // Combine sealed public and private parts
                const sealedPub = fs.readFileSync(sealedPubPath);
                const sealedPriv = fs.readFileSync(sealedPrivPath);
                
                const sealedData = {
                    algorithm: algorithm,
                    keyLength: keyLength,
                    publicPart: sealedPub.toString('base64'),
                    privatePart: sealedPriv.toString('base64'),
                    pcrValues: pcrValues,
                    timestamp: new Date().toISOString()
                };

                // Save sealed data
                fs.writeFileSync(this.encryptingKeyConfig.sealedKeyFile, JSON.stringify(sealedData, null, 2));

                console.log('AES key generated and sealed successfully');
                return { 
                    success: true, 
                    keyFile: this.encryptingKeyConfig.sealedKeyFile,
                    algorithm: algorithm,
                    keyLength: keyLength
                };

            } finally {
                this.cleanupFiles([keyDataPath, sealedPubPath, sealedPrivPath]);
            }

        } catch (error) {
            throw new Error(`Failed to generate and seal AES key: ${error.message}`);
        }
    }

    /**
     * Unseal application AES key
     */
    async unsealEncryptingKey() {
        try {
            if (!fs.existsSync(this.encryptingKeyConfig.sealedKeyFile)) {
                throw new Error('Sealed AES key file not found');
            }

            // Read sealed data
            const sealedData = JSON.parse(fs.readFileSync(this.encryptingKeyConfig.sealedKeyFile, 'utf8'));
            
            // Create temporary files
            const sealedPubPath = this.getTempFilePath('sealed.pub');
            const sealedPrivPath = this.getTempFilePath('sealed.priv');
            const loadedCtxPath = this.getTempFilePath('loaded.ctx');
            const unsealedDataPath = this.getTempFilePath('unsealed.bin');

            try {
                // Write sealed parts to temporary files
                fs.writeFileSync(sealedPubPath, Buffer.from(sealedData.publicPart, 'base64'));
                fs.writeFileSync(sealedPrivPath, Buffer.from(sealedData.privatePart, 'base64'));

                // Load sealed object
                await this.executeTPMCommand('tpm2_load', [
                    '-C', this.rootKeyConfig.handle,
                    '-u', sealedPubPath,
                    '-r', sealedPrivPath,
                    '-c', loadedCtxPath
                ]);

                // Unseal the data
                await this.executeTPMCommand('tpm2_unseal', [
                    '-c', loadedCtxPath,
                    '-o', unsealedDataPath
                ]);

                // Read unsealed AES key
                const aesKey = fs.readFileSync(unsealedDataPath);

                console.log('AES key unsealed successfully');
                return {
                    key: aesKey,
                    algorithm: sealedData.algorithm,
                    keyLength: sealedData.keyLength
                };

            } finally {
                this.cleanupFiles([sealedPubPath, sealedPrivPath, loadedCtxPath, unsealedDataPath]);
            }

        } catch (error) {
            throw new Error(`Failed to unseal AES key: ${error.message}`);
        }
    }

    /**
     * Encrypt data using TPM root key (for protecting user keys)
     */
    async encryptWithRootKey(data) {
        try {
            // Ensure root key exists
            await this.initializeTPM();

            // 1. Get TPM root key public part
            const rootKeyPubPath = this.getTempFilePath("root_key.pub");
            try {
                await this.executeTPMCommand(
                    "tpm2_readpublic",
                    ["-c", this.rootKeyConfig.handle, "-o", rootKeyPubPath, "-f", "pem"]
                );
                const rootKeyPublicKeyPEM = fs.readFileSync(rootKeyPubPath, "utf8");

                const secret = await this.unsealEncryptingKey()
                
                const sharedSecret = secret.key;

                // 4. Derive symmetric key (DEK) from shared secret

                // 5. Symmetrically encrypt the actual data (ML-DSA-65 private key)
                const iv = crypto.randomBytes(16); // AES-256-GCM IV
                const cipher = crypto.createCipheriv("aes-256-gcm", sharedSecret, iv);
                
                let encryptedData = cipher.update(data);
                encryptedData = Buffer.concat([encryptedData, cipher.final()]);
                const authTag = cipher.getAuthTag();

                // Combine ephemeral public key, IV, encrypted data, and auth tag
                const combinedEncryptedData = JSON.stringify({
                    iv: iv.toString("base64"),
                    encryptedData: encryptedData.toString("base64"),
                    authTag: authTag.toString("base64"),
                });

                console.log("Data encrypted with TPM root key via ECIES-like hybrid encryption successfully");
                return Buffer.from(combinedEncryptedData);

            } finally {
                this.cleanupFiles([rootKeyPubPath]);
            }

        } catch (error) {
            throw new Error(`Failed to encrypt data with TPM root key: ${error.message}`);
        }
    }

    /**
     * Decrypt data using TPM root key (for accessing user keys) via ECIES-like hybrid encryption
     */
    async decryptWithRootKey(encryptedCombinedData) {
        try {
            // Ensure root key exists
            await this.initializeTPM();
            const parsedData = JSON.parse(encryptedCombinedData.toString());
            const iv = Buffer.from(parsedData.iv, "base64");
            const encryptedData = Buffer.from(parsedData.encryptedData, "base64");
            const authTag = Buffer.from(parsedData.authTag, "base64");

            try{
                const secret = await this.unsealEncryptingKey();
                const sharedSecret = secret.key;

                    // 2. Derive symmetric key (DEK) from shared secret

                // 3. Symmetrically decrypt the actual data (ML-DSA-65 private key)
                const decipher = crypto.createDecipheriv("aes-256-gcm", sharedSecret, iv);
                decipher.setAuthTag(authTag);

                let decryptedData = decipher.update(encryptedData);
                decryptedData = Buffer.concat([decryptedData, decipher.final()]);

                console.log("Data decrypted with TPM root key via ECIES-like hybrid encryption successfully");
                return decryptedData;
            } finally {
                this.cleanupFiles([]);
            }

        } catch (error) {
            throw new Error(`Failed to decrypt data with TPM root key: ${error.message}`);
        }
    }     

    /**
     * List all persistent keys
     */
    async listPersistentKeys() {
        try {
            const output = await this.executeTPMCommand('tpm2_getcap', ['handles-persistent']);
            
            const handles = [];
            const lines = output.split('\n');
            
            for (const line of lines) {
                const handleMatch = line.match(/(0x[0-9a-fA-F]+)/);
                if (handleMatch) {
                    handles.push({
                        handle: handleMatch[1],
                        type: 'persistent'
                    });
                }
            }
            
            return handles;
        } catch (error) {
            throw new Error(`Failed to list persistent keys: ${error.message}`);
        }
    }

    /**
     * Get comprehensive system status
     */
    async getSystemStatus() {
        try {
            const status = {
                tpm: {
                    available: false,
                    tcti: this.tctiConfig,
                    rootKey: null,
                    error: null
                },
                applicationKey: {
                    sealed: fs.existsSync(this.appKeyConfig.sealedKeyFile),
                    sealedKeyFile: this.appKeyConfig.sealedKeyFile
                }
            };

            // Check TPM availability
            try {
                await this.executeTPMCommand('tpm2_getcap', ['properties-fixed'], { retries: 1 });
                status.tpm.available = true;
            } catch (error) {
                status.tpm.error = error.message;
                return status;
            }

            // Check persistent keys
            const persistentKeys = await this.listPersistentKeys();

            // Check if root key exists
            const rootKeyExists = persistentKeys.some(key => key.handle === this.rootKeyConfig.handle);
            status.tmp.rootKey = rootKeyExists ? this.rootKeyConfig.handle : null;

            return status;

        } catch (error) {
            throw new Error(`Failed to get system status: ${error.message}`);
        }
    }
}
// new ScalableTPMService();
const tpmService = new ScalableTPMService({
    tempDir: '/tmp/tpm-service',
    sealedKeyStorage: '/app/data/sealed-keys'});

const handle = await tpmService.initializeTPM();
const AESContext = await tpmService.generateAndSealAESKey({
    keyLength: 32, // 256 bits
    algorithm: 'aes-256-gcm',
});

const encryptingKey = await tpmService.generateAndSealEncryptingKey({
    keyLength: 32, // 256 bits
    algorithm: 'aes-256-gcm',
});

export default tpmService;
export { tpmService, handle, AESContext, encryptingKey };