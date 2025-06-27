# Public Administrative Services via Citizen Services Portal

This project is a secure, modern web platform for digital public administrative services, enabling citizens and government agencies to interact, submit, and verify official documents online. The system is designed with a strong focus on security, privacy, and post-quantum cryptography.

## Key Features

- **Post-Quantum Digital Signatures:**
  - Utilizes ML-DSA  digital signatures for document signing and verification, ensuring security against quantum attacks.
- **Role-Based Access:**
  - Supports multiple user roles (Citizen, BCA, Police, CA, etc.) with tailored workflows, permissions and graphic interface
- **Digital Document Validation:**
  - All documents and signatures are cryptographically validated, with certificate chains and CA verification.
- **QR Code Verification:**
  - Provides QR code-based signature verification for fast, secure validation of digital documents.
- **Secure File Handling:**
  - Sensitive files (images, certificates, signatures) are encrypted and validated during upload and storage.
- **Microservices Architecture:**
  - Built with Node.js, Express, React, and NGINX, orchestrated via Docker and Kubernetes for scalability and reliability.
- **Kubernetes-Native Deployment:**
  - All services are containerized and deployed via Kubernetes, with NGINX Ingress for secure HTTPS routing and multi-domain support.

## Security Highlights

- **FALCON/ML-DSA Signatures:**
  - Ensures documents are tamper-proof and verifiable, even in a post-quantum world.
- **Certificate Authority (CA) Workflows:**
  - Supports certificate requests, signing, and validation for users and agencies.
- **Strict Security Headers:**
  - Enforces Content Security Policy, HSTS, and other HTTP security headers at the gateway.

## Application Scenarios

- **Birth Registration:**
  - Citizens can securely submit and track birth registration applications, with digital signatures and QR-based verification.
- **User Certificate Management:**
  - Users and authorities can generate, sign, and verify digital certificates using post-quantum algorithms.
- **Administrative Workflows:**
  - Agencies process, approve, and sign documents digitally, with cryptographic validation.

## Technologies Used

- **Backend:** Node.js, Express, Sequelize, MySQL
- **Frontend:** React, Tailwind CSS
- **Cryptography:** ML-DSA, OpenSSL, WASM modules
- **Infrastructure:** Docker, Kubernetes, NGINX Ingress

## Deployment

- **Kubernetes-native:**
  - All services are containerized and deployed via Kubernetes, with Ingress for secure HTTPS routing and multi-domain support.
- **TLS & Security:**
  - Each service domain uses its own TLS certificate, managed via Kubernetes secrets and Ingress.

---

This portal demonstrates a practical, secure, and scalable approach to digital government services, ready for the challenges of the post-quantum era.
