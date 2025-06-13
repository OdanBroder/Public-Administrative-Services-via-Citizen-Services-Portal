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

// return true out_csr_buf_size
int  generate_csr(
    char* private_key_chr,
    char* public_key_chr,
    char** subject_info_vec,
    int subject_info_count,
    char* out_csr_buf,
    size_t out_csr_buf_size
) {
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

    if (X509_REQ_set_version(req.get(), 0L) != 1) {
        handle_openssl_error("X509_REQ_set_version");
        return false;
    }

    // Set subject name
    X509_NAME* name = X509_REQ_get_subject_name(req.get());
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

    OSSL_PROVIDER *defprov = OSSL_PROVIDER_load(NULL, "default");
    if (defprov == NULL) {
        handle_openssl_error("OSSL_PROVIDER_load");
        return false;
    }

    const EVP_MD* digest = EVP_MD_fetch(NULL, "SHA-256", NULL);
    if(digest == NULL) {
        handle_openssl_error("EVP_sha256");
        return false;
    }
    if (X509_REQ_sign(req.get(), pkey.get(), NULL) <= 0) {
        handle_openssl_error("X509_REQ_sign");
        return false;
    }

    // Write CSR to memory buffer 
    BIO_ptr mem(BIO_new(BIO_s_mem()), BIO_free_all);
    if (!mem) return false;

    if (!PEM_write_bio_X509_REQ(mem.get(), req.get())) {
        BIO_free(mem.get());
        return false;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem.get(), &data);

    if (!data || len <= 0) return false;

    // Copy to output buffer
    if ((size_t)len >= out_csr_buf_size) {
        return false;
    }
    memcpy(out_csr_buf, data, len);
    out_csr_buf[len] = '\0'; 

    return len;
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


// returns true out_cert_buf_size to use 
int generate_self_signed_certificate(
    const char* csr_buf,
    size_t csr_buf_len,
    char* private_key,
    char* out_cert_buf,
    size_t out_cert_buf_size,
    int days
) {
    // Load CSR from buffer
    BIO_ptr csr_bio(BIO_new_mem_buf(csr_buf, static_cast<int>(csr_buf_len)), BIO_free_all);
    if (!csr_bio) {
        handle_openssl_error("BIO_new_mem_buf for CSR");
        return false;
    }
    X509_REQ* req_raw = PEM_read_bio_X509_REQ(csr_bio.get(), nullptr, nullptr, nullptr);
    if (!req_raw) {
        handle_openssl_error("PEM_read_bio_X509_REQ");
        return false;
    }
    X509_REQ_ptr req(req_raw, X509_REQ_free);

    EVP_PKEY_ptr ca_pkey(EVP_PKEY_new_raw_private_key(EVP_PKEY_ML_DSA_65, NULL, (unsigned char*)private_key, ml_dsa_65_private_key_size), EVP_PKEY_free);
    if (!ca_pkey) {
        handle_openssl_error("EVP_PKEY_new_raw_private_key");
        return false;
    }

    // Verify CSR signature
    EVP_PKEY* req_pubkey_raw = X509_REQ_get_pubkey(req.get());
    if (!req_pubkey_raw) {
        handle_openssl_error("X509_REQ_get_pubkey");
        return false;
    }
    EVP_PKEY_ptr req_pubkey(req_pubkey_raw, EVP_PKEY_free);

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
    if (X509_set_version(cert.get(), 2L) != 1) {
        handle_openssl_error("X509_set_version");
        return false;
    }

    // Set serial number
    ASN1_INTEGER_ptr serial(ASN1_INTEGER_new(), ASN1_INTEGER_free);
    if (!serial || !ASN1_INTEGER_set(serial.get(), 1L)) {
        handle_openssl_error("ASN1_INTEGER_set or new");
        return false;
    }
    if (X509_set_serialNumber(cert.get(), serial.get()) != 1) {
        handle_openssl_error("X509_set_serialNumber");
        return false;
    }

    // Set issuer and subject name (self-signed)
    X509_NAME* subject_name = X509_REQ_get_subject_name(req.get());
    if (X509_set_issuer_name(cert.get(), subject_name) != 1) {
        handle_openssl_error("X509_set_issuer_name");
        return false;
    }
    if (X509_set_subject_name(cert.get(), subject_name) != 1) {
        handle_openssl_error("X509_set_subject_name");
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

    // Set public key (from CSR)
    if (X509_set_pubkey(cert.get(), req_pubkey.get()) != 1) {
        handle_openssl_error("X509_set_pubkey");
        return false;
    }

    // Sign the certificate with the CA private key (self-signed)
    if (X509_sign(cert.get(), ca_pkey.get(), NULL) <= 0) {
        handle_openssl_error("X509_sign");
        return false;
    }

    // Write certificate to memory buffer (PEM)
    BIO_ptr mem(BIO_new(BIO_s_mem()), BIO_free_all);
    if (!mem) return false;

    if (!PEM_write_bio_X509(mem.get(), cert.get())) {
        return false;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem.get(), &data);

    if (!data || len <= 0) return false;

    // Copy to output buffer
    if ((size_t)len >= out_cert_buf_size) {
        out_cert_buf = (char *) realloc(out_cert_buf, len + 1);
    }
    memcpy(out_cert_buf, data, len);
    out_cert_buf[len] = '\0'; 

    return true;
}


int sign_certificate(
    const char* csr_buf,
    size_t csr_buf_len,
    const char* ca_cert_buf,
    size_t ca_cert_buf_len,
    const char* ca_privkey_buf,
    size_t ca_privkey_len,
    char* out_cert_buf,
    size_t out_cert_buf_size,
    int days_valid
) {
    // Load CSR from buffer
    BIO_ptr csr_bio(BIO_new_mem_buf(csr_buf, static_cast<int>(csr_buf_len)), BIO_free_all);
    if (!csr_bio) {
        handle_openssl_error("BIO_new_mem_buf for CSR");
        return 0;
    }
    X509_REQ* csr_raw = PEM_read_bio_X509_REQ(csr_bio.get(), nullptr, nullptr, nullptr);
    if (!csr_raw) {
        handle_openssl_error("PEM_read_bio_X509_REQ");
        return 0;
    }
    X509_REQ_ptr csr(csr_raw, X509_REQ_free);

    // Load CA certificate from buffer
    BIO_ptr ca_cert_bio(BIO_new_mem_buf(ca_cert_buf, static_cast<int>(ca_cert_buf_len)), BIO_free_all);
    if (!ca_cert_bio) {
        handle_openssl_error("BIO_new_mem_buf for CA cert");
        return 0;
    }
    X509* ca_cert_raw = PEM_read_bio_X509(ca_cert_bio.get(), nullptr, nullptr, nullptr);
    if (!ca_cert_raw) {
        handle_openssl_error("PEM_read_bio_X509");
        return 0;
    }
    X509_ptr ca_cert(ca_cert_raw, X509_free);

    // Load CA private key from buffer
    EVP_PKEY_ptr ca_pkey(
        EVP_PKEY_new_raw_private_key(EVP_PKEY_ML_DSA_65, nullptr, (unsigned char*) ca_privkey_buf, ca_privkey_len),
        EVP_PKEY_free);
    if (!ca_pkey) {
        handle_openssl_error("EVP_PKEY_new_raw_private_key");
        return 0;
    }

    // Create new certificate
    X509_ptr cert(X509_new(), X509_free);
    if (!cert) return 0;

    X509_set_version(cert.get(), 2);  // X.509v3
    ASN1_INTEGER_set(X509_get_serialNumber(cert.get()), 1);
    X509_gmtime_adj(X509_get_notBefore(cert.get()), 0);
    X509_gmtime_adj(X509_get_notAfter(cert.get()), 60 * 60 * 24 * days_valid);

    // Set subject and public key from CSR
    X509_set_subject_name(cert.get(), X509_REQ_get_subject_name(csr.get()));
    EVP_PKEY_ptr req_pubkey(X509_REQ_get_pubkey(csr.get()), EVP_PKEY_free);
    if (!req_pubkey) {
        handle_openssl_error("Extracting public key from CSR");
        return 0;
    }
    X509_set_pubkey(cert.get(), req_pubkey.get());

    // Set issuer from CA certificate
    X509_set_issuer_name(cert.get(), X509_get_subject_name(ca_cert.get()));

    // Sign with CA private key (digest may be ignored for ML-DSA)
    if (!X509_sign(cert.get(), ca_pkey.get(), nullptr)) {
        handle_openssl_error("X509_sign");
        return 0;
    }

    // Write signed certificate to output buffer
    BIO_ptr mem(BIO_new(BIO_s_mem()), BIO_free_all);
    if (!mem) return 0;

    if (!PEM_write_bio_X509(mem.get(), cert.get())) {
        return 0;
    }

    char* data = nullptr;
    long len = BIO_get_mem_data(mem.get(), &data);

    if (!data || len <= 0) return 0;

    // Copy to output buffer
    if ((size_t)len >= out_cert_buf_size) {
        return 0;
    }
    memcpy(out_cert_buf, data, len);
    out_cert_buf[len] = '\0';

    return static_cast<size_t>(len);
}
