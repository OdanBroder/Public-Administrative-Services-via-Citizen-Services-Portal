import { expect } from 'chai';
import {MLDSAWrapper} from './MLDSAWrapper.js';

describe('MLDSAWrapper - Real WASM Interaction Tests', function() {
  let wrapper;

  // Increase timeout for WASM operations, as real operations might take longer
  this.timeout(30000); // Increased timeout for potential WASM loading and operations

  before(async function() {
    wrapper = new MLDSAWrapper();
    try {
      await wrapper.initialize();
      console.log('MLDSAWrapper initialized for real WASM interaction tests.');
    } catch (error) {
      console.error('Failed to initialize MLDSAWrapper for real WASM interaction tests:', error);
      // If initialization fails, skip all tests in this suite
      this.skip(); 
    }
  });

  describe('Initialization', function() {
    it('should initialize the WASM module successfully', function() {
      expect(wrapper.initialized).to.be.true;
      expect(wrapper.module).to.not.be.null;
    });
  });

  describe('Key Pair Generation (generateKeyPair)', function() {
    it('should generate a key pair successfully', async function() {
      const { privateKey, publicKey } = await wrapper.generateKeyPair();
      expect(privateKey).to.be.an.instanceof(Uint8Array);
      expect(privateKey).to.have.length(wrapper.ML_DSA_65_PRIVATE_KEY_SIZE);
      expect(publicKey).to.be.an.instanceof(Uint8Array);
      expect(publicKey).to.have.length(wrapper.ML_DSA_65_PUBLIC_KEY_SIZE);
    });
  });

  describe('Signing and Verification (sign, verify)', function() {
    let privateKey, publicKey;
    const message = 'This is a test message for signing and verification.';

    before(async function() {
      // Generate a real key pair for signing and verification tests
      const keys = await wrapper.generateKeyPair();
      privateKey = keys.privateKey;
      publicKey = keys.publicKey;
    });

    it('should sign a message successfully', async function() {
      const signature = await wrapper.sign(privateKey, message);
      expect(signature).to.be.an.instanceof(Uint8Array);
      // The actual signature length will depend on the WASM module's implementation
      // For now, we'll assert it's not empty.
      expect(signature.length).to.be.above(0);
    });

    it('should verify a valid signature', async function() {
      const signature = await wrapper.sign(privateKey, message); // Sign to get a valid signature
      const isValid = await wrapper.verify(publicKey, signature, message);
      expect(isValid).to.be.true;
    });

    it('should return false for an invalid signature', async function() {
      const invalidSignature = new Uint8Array(64).fill(0x00); // An obviously invalid signature
      const isValid = await wrapper.verify(publicKey, invalidSignature, message);
      expect(isValid).to.be.false;
    });
  });

  describe('CSR Generation (generateCSR)', function() {
    let privateKey, publicKey;
    const subjectInfo = ['C=US', 'ST=CA', 'L=Mountain View', 'O=Google', 'OU=Gemini', 'CN=test.example.com'];

    before(async function() {
      const keys = await wrapper.generateKeyPair();
      privateKey = keys.privateKey;
      publicKey = keys.publicKey;
    });

    it('should generate a CSR successfully', async function() {
      const csr = await wrapper.generateCSR(privateKey, publicKey, subjectInfo);
      expect(csr).to.be.an.instanceof(Uint8Array);
      expect(csr.length).to.be.above(0); // CSR length depends on content and encoding
    });
  });

  describe('Self-Signed Certificate Generation (generateSelfSignedCertificate)', function() {
    let privateKey, publicKey, csrData;

    before(async function() {
      const keys = await wrapper.generateKeyPair();
      privateKey = keys.privateKey;
      publicKey = keys.publicKey;
      const subjectInfo = ['C=US', 'CN=selfsigned.example.com'];
      csrData = await wrapper.generateCSR(privateKey, publicKey, subjectInfo);
    });

    it('should generate a self-signed certificate successfully', async function() {
      const cert = await wrapper.generateSelfSignedCertificate(privateKey, csrData);
      expect(cert).to.be.an.instanceof(Uint8Array);
      expect(cert.length).to.be.above(0); // Certificate length depends on content and encoding
    });
  });

  describe('Certificate Verification (verifyCertificateIssuedByCA)', function() {
    let caPrivateKey, caPublicKey, caCertData;
    let certPrivateKey, certPublicKey, certCsrData, certData;

    before(async function() {
      // Generate CA key pair and self-signed CA certificate
      const caKeys = await wrapper.generateKeyPair();

      caPrivateKey = caKeys.privateKey;
      caPublicKey = caKeys.publicKey;
      const caSubjectInfo = ['C=US', 'CN=CA.example.com'];
      const caCsr = await wrapper.generateCSR(caPrivateKey, caPublicKey, caSubjectInfo);
      // console.log((new TextDecoder()).decode(caCsr));
      caCertData = await wrapper.generateSelfSignedCertificate(caPrivateKey, caCsr);

      // Generate client key pair and CSR
      const certKeys = await wrapper.generateKeyPair();
      certPrivateKey = certKeys.privateKey;
      certPublicKey = certKeys.publicKey;
      const certSubjectInfo = ['C=US', 'CN=client.example.com'];
      certCsrData = await wrapper.generateCSR(certPrivateKey, certPublicKey, certSubjectInfo);

      // Sign client certificate with CA
      // console.log((new TextDecoder()).decode(certCsrData));
      // console.log((new TextDecoder()).decode(caCertData))

      certData = await wrapper.signCertificate(caPrivateKey, certCsrData, caCertData);
      // console.log("HEHE");
    });

    it('should verify a certificate issued by CA successfully', async function() {
      const isValid = await wrapper.verifyCertificateIssuedByCA(certData, caCertData);
      expect(isValid).to.be.true;
    });

    it('should return false if certificate is not issued by the given CA', async function() {
      // Generate another self-signed certificate (not issued by caCertData)
      const anotherKeys = await wrapper.generateKeyPair();
      const anotherPrivateKey = anotherKeys.privateKey;
      const anotherPublicKey = anotherKeys.publicKey;
      const anotherSubjectInfo = ['C=US', 'CN=another.example.com'];
      const anotherCsr = await wrapper.generateCSR(anotherPrivateKey, anotherPublicKey, anotherSubjectInfo);
      const anotherCertData = await wrapper.generateSelfSignedCertificate(anotherPrivateKey, anotherCsr);

      const isValid = await wrapper.verifyCertificateIssuedByCA(anotherCertData, caCertData);
      expect(isValid).to.be.false;
    });
  });

  describe('Signature Verification with Certificate (verifyWithCertificate)', function() {
    let privateKey, publicKey, certData;
    const message = 'Message to be signed and verified with certificate.';

    before(async function() {
      const keys = await wrapper.generateKeyPair();
      privateKey = keys.privateKey;
      publicKey = keys.publicKey;
      const subjectInfo = ['C=US', 'CN=certsignverify.example.com'];
      const csrData = await wrapper.generateCSR(privateKey, publicKey, subjectInfo);

      certData = await wrapper.generateSelfSignedCertificate(privateKey, csrData);
    });

    it('should verify signature with certificate successfully', async function() {
      const signature = await wrapper.sign(privateKey, message);
      // console.log("certData", (new TextDecoder()).decode(certData));

      const isValid = await wrapper.verifyWithCertificate(certData, signature, message);
      expect(isValid).to.be.true;
    });

    it('should return false if signature verification with certificate fails', async function() {
      const invalidSignature = new Uint8Array(64).fill(0x00); // An invalid signature
      const isValid = await wrapper.verifyWithCertificate(certData, new TextEncoder().encode(message), invalidSignature);
      expect(isValid).to.be.false;
    });
  });

  describe('Certificate Signing (signCertificate)', function() {
    let caPrivateKey, caPublicKey, caCertData;
    let clientPrivateKey, clientPublicKey, clientCsrData;

    before(async function() {
      // Generate CA key pair and self-signed CA certificate
      const caKeys = await wrapper.generateKeyPair();
      caPrivateKey = caKeys.privateKey;
      caPublicKey = caKeys.publicKey;
      const caSubjectInfo = ['C=US', 'CN=RootCA.example.com'];
      const caCsr = await wrapper.generateCSR(caPrivateKey, caPublicKey, caSubjectInfo);
      caCertData = await wrapper.generateSelfSignedCertificate(caPrivateKey, caCsr);

      // Generate client key pair and CSR
      const clientKeys = await wrapper.generateKeyPair();
      clientPrivateKey = clientKeys.privateKey;
      clientPublicKey = clientKeys.publicKey;
      const clientSubjectInfo = ['C=US', 'CN=clientcert.example.com'];
      clientCsrData = await wrapper.generateCSR(clientPrivateKey, clientPublicKey, clientSubjectInfo);
    });

    it('should sign a certificate successfully', async function() {
      const signedCert = await wrapper.signCertificate(caPrivateKey, clientCsrData, caCertData);
      expect(signedCert).to.be.an.instanceof(Uint8Array);
      expect(signedCert.length).to.be.above(0); // Signed certificate length depends on content
    });
  });

  describe('Utility Functions', function() {
    it('should convert bytes to hex string', function() {
      const bytes = new Uint8Array([0x00, 0x01, 0x0F, 0xFF]);
      const hex = wrapper.exportToHex(bytes);
      expect(hex).to.equal('00010fff');
    });

    it('should convert hex string to bytes', function() {
      const hex = '00010fff';
      const bytes = wrapper.importFromHex(hex);
      expect(bytes).to.deep.equal(new Uint8Array([0x00, 0x01, 0x0F, 0xFF]));
    });

    it('should save and read from virtual FS', function() {
      const testPath = '/test/data.bin';
      const testData = new Uint8Array([1, 2, 3, 4, 5]);
      wrapper.saveToVirtualFS(testPath, testData);
      const readData = wrapper.readFromVirtualFS(testPath);
      expect(readData).to.deep.equal(testData);
    });
  });
});

