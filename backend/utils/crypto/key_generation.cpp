#include "mldsa_lib.h"
#include <cstddef>
#include <openssl/pem.h>
#include <openssl/ec.h>
#include <openssl/rsa.h>
#include <openssl/evp.h>
#include <openssl/types.h>
#include <openssl/x509.h>
#include <openssl/err.h>
#include <iostream>
#include <fstream>
#include <memory>
#include <openssl/x509v3.h>
using BIO_ptr = ossl_unique_ptr<BIO, BIO_free_all>;
using EVP_PKEY_ptr = ossl_unique_ptr<EVP_PKEY, EVP_PKEY_free>;
using EVP_PKEY_CTX_ptr = ossl_unique_ptr<EVP_PKEY_CTX, EVP_PKEY_CTX_free>;
using X509_REQ_ptr = ossl_unique_ptr<X509_REQ, X509_REQ_free>;
using X509_ptr = ossl_unique_ptr<X509, X509_free>;
using X509_NAME_ptr = ossl_unique_ptr<X509_NAME, X509_NAME_free>;
using ASN1_INTEGER_ptr = ossl_unique_ptr<ASN1_INTEGER, ASN1_INTEGER_free>;



void handle_openssl_error(const char* context) {
    std::cerr << "OpenSSL Error in " << context << ":\n";
    int err_code = ERR_get_error();
    std::cerr << "Error Code: " << err_code << "\n";    
    std::cerr << "Error String: " << ERR_reason_error_string(err_code) << "\n";
}

// =============================== KEY GENERATION FUNCTIONS ===============================
bool generate_mldsa65_keypair(char *private_key, char *public_key) {
  EVP_PKEY_CTX_ptr pctx(EVP_PKEY_CTX_new_id(EVP_PKEY_ML_DSA_65, NULL), EVP_PKEY_CTX_free);
  if(!pctx){
    handle_openssl_error("new EVP_PKEY_CTX failed");
    return false;
  }
  if(!EVP_PKEY_keygen_init(pctx.get())) {
    handle_openssl_error("EVP_PKEY_keygen_init failed");
    return false;
  }
  EVP_PKEY* pkey_raw = NULL;
  if(EVP_PKEY_keygen(pctx.get(), &pkey_raw) <= 0) {
    handle_openssl_error("EVP_PKEY_keygen failed");
    return false;
  }
  EVP_PKEY_ptr pkey(pkey_raw, EVP_PKEY_free);

  // Extracting the public and private keys to buffers
  size_t pub_keylen = ml_dsa_65_public_key_size;
  size_t priv_keylen = ml_dsa_65_private_key_size;
  if(!EVP_PKEY_get_raw_public_key(pkey.get(), (unsigned char*) public_key, &pub_keylen) ||
     !EVP_PKEY_get_raw_private_key(pkey.get(), (unsigned char*) private_key, &priv_keylen)) {
    handle_openssl_error("EVP_PKEY_get_raw_public_key failed");
    return false;
  }
  return true;
}

bool generate_csr(char* private_key_chr, char *public_key_chr ,char* csr_path, char** subject_info_vec, int subject_info_count) {
    std::vector<std::string> subject_info;
    for (int i = 0; i < subject_info_count; ++i) {
        subject_info.push_back(subject_info_vec[i]);
    }
    EVP_PKEY_ptr pkey(EVP_PKEY_new_raw_private_key(EVP_PKEY_ML_DSA_65, NULL, (unsigned char*)private_key_chr, ml_dsa_65_private_key_size), EVP_PKEY_free);
    EVP_PKEY_ptr pubkey(EVP_PKEY_new_raw_public_key(EVP_PKEY_ML_DSA_65, NULL, (unsigned char*)public_key_chr, ml_dsa_65_public_key_size), EVP_PKEY_free);
    if (!pkey) {
        return false;
    }

    X509_REQ_ptr req(X509_REQ_new(), X509_REQ_free);
    if (!req) {
        handle_openssl_error("X509_REQ_new");
        return false;
    }

    // Set version (typically 0 for CSRs)
    if (X509_REQ_set_version(req.get(), 0L) != 1) {
        handle_openssl_error("X509_REQ_set_version");
        return false;
    }

    // Set subject name
    X509_NAME* name = X509_REQ_get_subject_name(req.get()); // Internal pointer
    if (!name) {
        handle_openssl_error("X509_REQ_get_subject_name");
        return false;
    }
    for (const auto& entry : subject_info) {
        size_t eq_pos = entry.find("=");
        if (eq_pos == std::string::npos || eq_pos == 0 || eq_pos == entry.length() - 1) {
            std::cerr << "Error: Invalid subject entry format: " << entry << std::endl;
            return false;
        }
        std::string key = entry.substr(0, eq_pos);
        std::string value = entry.substr(eq_pos + 1);
        if (X509_NAME_add_entry_by_txt(name, key.c_str(), MBSTRING_ASC, (const unsigned char*)value.c_str(), -1, -1, 0) != 1) {
            handle_openssl_error("X509_NAME_add_entry_by_txt");
            return false;
        }
    }

    // Set public key
    if (X509_REQ_set_pubkey(req.get(), pubkey.get()) <= 0) {
        handle_openssl_error("X509_REQ_set_pubkey");
        return false;
    } 

    // EVP_PKEY *pubkey = X509_REQ_get_pubkey(req.get());
    // if (pubkey == NULL) {
    //     fprintf(stderr, "Failed to get public key from CSR\n");
    //     // handle error
    // } else {
    //     // pubkey now contains the public key inside EVP_PKEY
    //     // You can use pubkey to verify signatures or print it

    //     // Example: print public key PEM to stdout
    //     PEM_write_PUBKEY(stdout, pubkey);

    //     EVP_PKEY_free(pubkey);
    // }
    OSSL_PROVIDER *defprov = OSSL_PROVIDER_load(NULL, "default");
    if (defprov == NULL) {
        handle_openssl_error("OSSL_PROVIDER_load");
        return false;
    }

    const EVP_MD* digest = EVP_MD_fetch(NULL, "SHA-256", NULL); // Use SHA256 for signing
    if(digest == NULL) {
        handle_openssl_error("EVP_sha256");
        return false;
    }
    if (X509_REQ_sign(req.get(), pkey.get(), NULL) <= 0) {
        handle_openssl_error("X509_REQ_sign");
        return false; 
    }
    // Write CSR to file
    BIO_ptr mem(BIO_new(BIO_s_mem()), BIO_free_all);
    if (!mem) return false;

    if (!PEM_write_bio_X509_REQ(mem.get(), req.get())) {
        BIO_free(mem.get());
        return false;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem.get(), &data);  // `data` is valid as long as BIO is not freed

    std::ofstream out(csr_path, std::ios::binary);
    out.write(data, len);
    out.close();
    return true;
}

X509_REQ_ptr load_csr(const std::string& csr_path) {
    // Read the file into a std::string
    std::ifstream file(csr_path, std::ios::binary);
    if (!file) {
        std::cerr << "Failed to open CSR file: " << csr_path << std::endl;
        return X509_REQ_ptr(nullptr, X509_REQ_free);
    }

    std::string pem((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    // Create a memory BIO with the contents
    BIO_ptr csr_bio(BIO_new_mem_buf(pem.data(), static_cast<int>(pem.size())), BIO_free_all);
    if (!csr_bio) {
        handle_openssl_error("BIO_new_mem_buf for loading CSR");
        return X509_REQ_ptr(nullptr, X509_REQ_free);
    }

    // Parse the CSR from the BIO
    X509_REQ* req_raw = PEM_read_bio_X509_REQ(csr_bio.get(), nullptr, nullptr, nullptr);
    if (!req_raw) {
        handle_openssl_error("PEM_read_bio_X509_REQ");
        return X509_REQ_ptr(nullptr, X509_REQ_free);
    }

    return X509_REQ_ptr(req_raw, X509_REQ_free);
}


bool generate_self_signed_certificate(char* csr_path, char *private_key, char *certificate_path, int days) {
    X509_REQ_ptr req = load_csr(csr_path);
    if (!req) {
        return false;
    }

    EVP_PKEY_ptr ca_pkey(EVP_PKEY_new_raw_private_key(EVP_PKEY_ML_DSA_65, NULL, (unsigned char*)private_key, ml_dsa_65_private_key_size), EVP_PKEY_free);
    if (!ca_pkey) {
        return false;
    }

    // Verify CSR signature (optional but good practice)
    // X509_REQ_get_pubkey returns an internal pointer managed by the X509_REQ object,
    // but it's safer to manage it with its own unique_ptr if used outside the immediate scope.
    // However, since we use it immediately for verification and setting in the cert, we can use the raw pointer carefully.
    // For robustness, using a unique_ptr is better practice.
    EVP_PKEY* req_pubkey_raw = X509_REQ_get_pubkey(req.get());
    if (!req_pubkey_raw) {
         handle_openssl_error("X509_REQ_get_pubkey");
         return false;
    }
    EVP_PKEY_ptr req_pubkey(req_pubkey_raw, EVP_PKEY_free); // Manage with unique_ptr

    if (X509_REQ_verify(req.get(), req_pubkey.get()) != 1) {
        handle_openssl_error("X509_REQ_verify failed (CSR signature invalid or key mismatch)");
        return false;
    }

    X509_ptr cert(X509_new(), X509_free);
    if (!cert) {
        handle_openssl_error("X509_new");
        return false;
    }

    // Set version (X.509 v3)
    if (X509_set_version(cert.get(), 2L) != 1) { // Version is 0-based, so 2 means v3
        handle_openssl_error("X509_set_version");
        return false;
    }

    // Set serial number (use something simple for self-signed, e.g., 1)
    ASN1_INTEGER_ptr serial(ASN1_INTEGER_new(), ASN1_INTEGER_free);
    if (!serial || !ASN1_INTEGER_set(serial.get(), 1L)) {
        handle_openssl_error("ASN1_INTEGER_set or new");
        return false;
    }
    if (X509_set_serialNumber(cert.get(), serial.get()) != 1) {
        handle_openssl_error("X509_set_serialNumber");
        return false;
    }
    // serial ownership is transferred to cert, no need to free here.

    // Set issuer name (same as subject for self-signed)
    X509_NAME* subject_name = X509_REQ_get_subject_name(req.get()); // Internal pointer
    if (X509_set_issuer_name(cert.get(), subject_name) != 1) {
        handle_openssl_error("X509_set_issuer_name");
        return false;
    }

    // Set validity period
    if (!X509_gmtime_adj(X509_getm_notBefore(cert.get()), 0)) {
        handle_openssl_error("X509_gmtime_adj (notBefore)");
        return false;
    }
    if (!X509_gmtime_adj(X509_getm_notAfter(cert.get()), (long)60 * 60 * 24 * days)) {
        handle_openssl_error("X509_gmtime_adj (notAfter)");
        return false;
    }

    // Set subject name (from CSR)
    if (X509_set_subject_name(cert.get(), subject_name) != 1) {
        handle_openssl_error("X509_set_subject_name");
        return false;
    }

    // Set public key (from CSR)
    if (X509_set_pubkey(cert.get(), req_pubkey.get()) != 1) {
        handle_openssl_error("X509_set_pubkey");
        return false;
    }
    X509_EXTENSION* ext = X509V3_EXT_conf_nid(NULL, NULL, NID_basic_constraints, "CA:TRUE");
    if (!ext || !X509_add_ext(cert.get(), ext, -1)) {
        handle_openssl_error("X509_add_ext basicConstraints");
        if (ext) X509_EXTENSION_free(ext);
        return false;
    }
    X509_EXTENSION_free(ext);

    // Optionally add keyUsage for CA
    X509_EXTENSION* ext2 = X509V3_EXT_conf_nid(NULL, NULL, NID_key_usage, "keyCertSign,cRLSign");
    if (!ext2 || !X509_add_ext(cert.get(), ext2, -1)) {
        handle_openssl_error("X509_add_ext keyUsage");
        if (ext2) X509_EXTENSION_free(ext2);
        return false;
    }
    X509_EXTENSION_free(ext2);
    // Sign the certificate with the CA private key (which is our key for self-signed)
    const EVP_MD* digest = EVP_sha256();
    if (X509_sign(cert.get(), ca_pkey.get(), NULL) <= 0) {
        handle_openssl_error("X509_sign");
        return false;
    }

    // Write certificate to file
    BIO* mem = BIO_new(BIO_s_mem());
    if (!mem) return false;

    if (!PEM_write_bio_X509(mem, cert.get())) {
        BIO_free(mem);
        return false;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem, &data);  // `data` is valid as long as BIO is not freed

    std::ofstream out(certificate_path, std::ios::binary);
    out.write(data, len);
    out.close();
    BIO_free(mem);
    return true;
}

bool sign_certificate(const char* csr_path,
                      const char* ca_cert_path,
                      const char* ca_privkey_buf,  
                      size_t ca_privkey_len,
                      const char* result_cert_path,
                      int days_valid)
{
    // Load CSR
    X509_REQ_ptr csr = load_csr(csr_path);
    if (!csr) return false;

    // Load CA certificate
    X509_ptr ca_cert = load_certificate(ca_cert_path);
    if (!ca_cert) return false;

    // Load CA private key from memory buffer
    EVP_PKEY_ptr ca_pkey(
        EVP_PKEY_new_raw_private_key(EVP_PKEY_ML_DSA_65, nullptr, (unsigned char*) ca_privkey_buf, ca_privkey_len),
        EVP_PKEY_free);
    if (!ca_pkey) {
        handle_openssl_error("EVP_PKEY_new_raw_private_key");
        return false;
    }

    // Create new certificate
    X509_ptr cert(X509_new(), X509_free);
    if (!cert) return false;

    X509_set_version(cert.get(), 2);  // X.509v3
    ASN1_INTEGER_set(X509_get_serialNumber(cert.get()), 1);
    X509_gmtime_adj(X509_get_notBefore(cert.get()), 0);
    X509_gmtime_adj(X509_get_notAfter(cert.get()), 60 * 60 * 24 * days_valid);

    // Set subject and public key from CSR
    X509_set_subject_name(cert.get(), X509_REQ_get_subject_name(csr.get()));
    EVP_PKEY_ptr req_pubkey(X509_REQ_get_pubkey(csr.get()), EVP_PKEY_free);
    if (!req_pubkey) {
        handle_openssl_error("Extracting public key from CSR");
        return false;
    }
    X509_set_pubkey(cert.get(), req_pubkey.get());

    // Set issuer from CA certificate
    X509_set_issuer_name(cert.get(), X509_get_subject_name(ca_cert.get()));

    // Sign with CA private key (digest may be ignored for ML-DSA)
    if (!X509_sign(cert.get(), ca_pkey.get(), nullptr)) {
        handle_openssl_error("X509_sign");
        return false;
    }

    // Write signed certificate to output file
    BIO* mem = BIO_new(BIO_s_mem());
    if (!mem) return false;

    if (!PEM_write_bio_X509(mem, cert.get())) {
        BIO_free(mem);
        return false;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem, &data);  // `data` is valid as long as BIO is not freed

    std::ofstream out(result_cert_path, std::ios::binary);
    out.write(data, len);
    out.close();
    BIO_free(mem);
    return true;
}
