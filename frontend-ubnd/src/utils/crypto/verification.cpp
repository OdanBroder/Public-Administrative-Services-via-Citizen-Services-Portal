// src/verification.cpp
#include "openssl/crypto.h"
#include <cstdlib>
#include <openssl/pem.h>
#include <openssl/evp.h>
#include <openssl/err.h>
#include <openssl/rsa.h>
#include <vector>
#include <memory>
#include <iostream>
#include "helper.cpp"

// --- Helper: Unique pointers for OpenSSL types ---
extern const int ml_dsa_65_public_key_size; // Defined in mldsa_lib.h
extern const int ml_dsa_65_private_key_size; // Defined in mldsa_lib.h

template<typename T, void (*Func)(T*)>
using ossl_unique_ptr = std::unique_ptr<T, decltype(Func)>;

using BIO_ptr = ossl_unique_ptr<BIO, BIO_free_all>;
using EVP_PKEY_ptr = ossl_unique_ptr<EVP_PKEY, EVP_PKEY_free>;
using EVP_MD_CTX_ptr = ossl_unique_ptr<EVP_MD_CTX, EVP_MD_CTX_free>;
using EVP_PKEY_CTX_ptr = ossl_unique_ptr<EVP_PKEY_CTX, EVP_PKEY_CTX_free>;
using X509_ptr = ossl_unique_ptr<X509, X509_free>;
using char_ptr = std::unique_ptr<char []>;
// Forward declarations for helpers (or include helpers.h)
// Need definition of handle_openssl_error, read_file_bytes
void handle_openssl_error(const char* context);
bool read_file_bytes(const std::string& file_path, std::vector<unsigned char>& data);

X509_ptr load_certificate(const std::string& cert_path) {
    // Open certificate file using std::ifstream
    std::ifstream file(cert_path, std::ios::binary);
    if (!file) {
        std::cerr << "Failed to open certificate file: " << cert_path << std::endl;
        return X509_ptr(nullptr, X509_free);
    }

    // Read the entire file into a std::string
    std::string pem_data((std::istreambuf_iterator<char>(file)), std::istreambuf_iterator<char>());

    // Create a memory BIO from the PEM data
    BIO_ptr cert_bio(BIO_new_mem_buf(pem_data.data(), static_cast<int>(pem_data.size())), BIO_free_all);
    if (!cert_bio) {
        handle_openssl_error("BIO_new_mem_buf for loading certificate");
        return X509_ptr(nullptr, X509_free);
    }

    // Parse X509 certificate from the memory BIO
    X509* cert_raw = PEM_read_bio_X509(cert_bio.get(), nullptr, nullptr, nullptr);
    if (!cert_raw) {
        handle_openssl_error("PEM_read_bio_X509");
        return X509_ptr(nullptr, X509_free);
    }

    return X509_ptr(cert_raw, X509_free);
}



// Helper to load public key (implementation)
EVP_PKEY_ptr load_public_key(const std::string& key_path) {
    BIO_ptr key_bio(BIO_new_file(key_path.c_str(), "rb"), BIO_free_all); // Corrected init
    if (!key_bio) {
        handle_openssl_error("BIO_new_file for loading public key");
        return EVP_PKEY_ptr(nullptr, EVP_PKEY_free); // Corrected return
    }
    EVP_PKEY* pkey_raw = PEM_read_bio_PUBKEY(key_bio.get(), nullptr, nullptr, nullptr);
    if (!pkey_raw) {
        handle_openssl_error("PEM_read_bio_PUBKEY");
        return EVP_PKEY_ptr(nullptr, EVP_PKEY_free); // Corrected return
    }
    return EVP_PKEY_ptr(pkey_raw, EVP_PKEY_free); // Corrected init
}

// --- Verification Implementations ---

bool verify_mldsa65(const char *public_key_chr, const char *signature_path, const char *message_chr, int message_len){
    EVP_PKEY_ptr pkey(EVP_PKEY_new_raw_public_key(EVP_PKEY_ML_DSA_65, nullptr, (const unsigned char*)public_key_chr, ml_dsa_65_public_key_size), EVP_PKEY_free);
    if (!pkey) {
        return false;
    }

    // Check if the key is ECDSA
    // if (EVP_PKEY_base_id(pkey.get()) != EVP_PKEY_ML_DSA_65) {
    //     std::cerr << "Error: Provided key is not a key for ML-DSA-65 verification." << std::endl;
    //     return false;
    // }

    std::vector<unsigned char> message_data;
    for(int i=0;i<message_len; i++) {
        message_data.push_back(static_cast<unsigned char>(message_chr[i]));
    }

    std::vector<unsigned char> signature_data;
    if (!read_file_bytes(signature_path, signature_data)) {
        return false;
    }

    EVP_MD_CTX_ptr md_ctx(EVP_MD_CTX_new(), EVP_MD_CTX_free); // Corrected init
    if (!md_ctx) {
        handle_openssl_error("EVP_MD_CTX_new for verification");
        return false;
    }

    if (EVP_DigestVerifyInit(md_ctx.get(), nullptr, NULL, nullptr, pkey.get()) <= 0) {
        handle_openssl_error("EVP_DigestVerifyInit");
        return false;
    }



        // EVP_DigestVerifyFinal returns 1 for success (valid signature), 0 for failure (invalid signature),
    // and a negative value for other errors.
    int verify_result = EVP_DigestVerify(md_ctx.get(), signature_data.data(), signature_data.size(), (unsigned char*) message_chr, message_len);
    if (verify_result == 1) {
        return true; // Signature is valid
    } else if (verify_result == 0) {
        std::cerr << "Verification failed: Signature is invalid." << std::endl;
        return false; // Signature is invalidB
    } else {
        handle_openssl_error("EVP_DigestVerifyFinal");
        return false; // An error occurred during verification
    }
}

bool verify_signature_with_cert(const char *certificate_buf, size_t certificate_len, const unsigned char *signature_buf, size_t signature_len, const char *message_chr, int message_len) {
    // Load certificate from buffer
    BIO_ptr cert_bio(BIO_new_mem_buf(certificate_buf, static_cast<int>(certificate_len)), BIO_free_all);
    if (!cert_bio) {
        handle_openssl_error("BIO_new_mem_buf for certificate");
        return false;
    }
    X509* cert_raw = PEM_read_bio_X509(cert_bio.get(), nullptr, nullptr, nullptr);
    if (!cert_raw) {
        handle_openssl_error("PEM_read_bio_X509");
        return false;
    }
    X509_ptr cert(cert_raw, X509_free);

    // Extract the public key from the certificate
    EVP_PKEY* pkey_raw = X509_get_pubkey(cert.get());
    if (!pkey_raw) {
        handle_openssl_error("X509_get_pubkey for verification");
        return false;
    }
    EVP_PKEY_ptr pkey(pkey_raw, EVP_PKEY_free);

    char_ptr temp_pubkey = std::make_unique<char[]>(ml_dsa_65_public_key_size);
    size_t public_key_size = ml_dsa_65_public_key_size;
    if (!EVP_PKEY_get_raw_public_key(pkey.get(), (unsigned char*) temp_pubkey.get(), &public_key_size)) {
        handle_openssl_error("EVP_PKEY_get_raw_public_key for verification");
        return false;
    }

    // Prepare message data
    std::vector<unsigned char> message_data(message_chr, message_chr + message_len);

    EVP_PKEY_ptr verify_pkey(EVP_PKEY_new_raw_public_key(EVP_PKEY_ML_DSA_65, nullptr, (const unsigned char*)temp_pubkey.get(), ml_dsa_65_public_key_size), EVP_PKEY_free);
    if (!verify_pkey) {
        handle_openssl_error("EVP_PKEY_new_raw_public_key for verification");
        return false;
    }

    EVP_MD_CTX_ptr md_ctx(EVP_MD_CTX_new(), EVP_MD_CTX_free);
    if (!md_ctx) {
        handle_openssl_error("EVP_MD_CTX_new for verification");
        return false;
    }

    if (EVP_DigestVerifyInit(md_ctx.get(), nullptr, NULL, nullptr, verify_pkey.get()) <= 0) {
        handle_openssl_error("EVP_DigestVerifyInit");
        return false;
    }

    int verify_result = EVP_DigestVerify(md_ctx.get(), signature_buf, signature_len, (unsigned char*)message_chr, message_len);
    if (verify_result == 1) {
        return true; 
    } else if (verify_result == 0) {
        std::cerr << "Verification failed: Signature is invalid." << std::endl;
        return false;
    } else {
        handle_openssl_error("EVP_DigestVerifyFinal");
        return false;
    }
}

bool verify_certificate_issued_by_ca(
    const char* cert_buf, size_t cert_buf_len,
    const char* ca_cert_buf, size_t ca_cert_buf_len
) {
    // Create BIOs from memory buffers
    BIO_ptr cert_bio(BIO_new_mem_buf(cert_buf, static_cast<int>(cert_buf_len)), BIO_free_all);
    BIO_ptr ca_bio(BIO_new_mem_buf(ca_cert_buf, static_cast<int>(ca_cert_buf_len)), BIO_free_all);
    if (!cert_bio || !ca_bio) {
        handle_openssl_error("BIO_new_mem_buf for certificate or CA");
        return false;
    }

    // Load X509 structures
    X509* cert = PEM_read_bio_X509(cert_bio.get(), nullptr, nullptr, nullptr);
    X509* ca_cert = PEM_read_bio_X509(ca_bio.get(), nullptr, nullptr, nullptr);
    if (!cert || !ca_cert) {
        handle_openssl_error("PEM_read_bio_X509 for certificate or CA");
        if (cert) X509_free(cert);
        if (ca_cert) X509_free(ca_cert);
        return false;
    }

    // Create X509_STORE and add CA cert
    X509_STORE* store = X509_STORE_new();
    if (!store) {
        handle_openssl_error("X509_STORE_new");
        X509_free(cert);
        X509_free(ca_cert);
        return false;
    }
    if (X509_STORE_add_cert(store, ca_cert) != 1) {
        handle_openssl_error("X509_STORE_add_cert");
        X509_STORE_free(store);
        X509_free(cert);
        X509_free(ca_cert);
        return false;
    }

    // Create X509_STORE_CTX for verification
    X509_STORE_CTX* ctx = X509_STORE_CTX_new();
    if (!ctx) {
        handle_openssl_error("X509_STORE_CTX_new");
        X509_STORE_free(store);
        X509_free(cert);
        X509_free(ca_cert);
        return false;
    }

    bool result = false;
    if (X509_STORE_CTX_init(ctx, store, cert, nullptr) == 1) {
        int verify_result = X509_verify_cert(ctx);
        result = (verify_result == 1);
        if (!result) {
            handle_openssl_error("X509_verify_cert by CA");
            int err = X509_STORE_CTX_get_error(ctx);
            std::cerr << "Certificate verification failed: " << X509_verify_cert_error_string(err) << std::endl;
        }
    } else {
        handle_openssl_error("X509_STORE_CTX_init");
    }

    // Cleanup
    X509_STORE_CTX_free(ctx);
    X509_STORE_free(store);
    X509_free(cert);
    X509_free(ca_cert);

    return result;
}