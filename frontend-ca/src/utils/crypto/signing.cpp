#include "mldsa_lib.h"
#include "openssl/bio.h"

// src/signing.cpp
#include <cstddef>
#include <openssl/evp.h>
#include <openssl/err.h>
#include <openssl/rsa.h>
#include <vector>
#include <memory>
#include <iostream> // Added missing include

// --- Helper: Unique pointers for OpenSSL types ---
template<typename T, void (*Func)(T*)>
using ossl_unique_ptr = std::unique_ptr<T, decltype(Func)>;

using EVP_PKEY_ptr = ossl_unique_ptr<EVP_PKEY, EVP_PKEY_free>;
using EVP_MD_CTX_ptr = ossl_unique_ptr<EVP_MD_CTX, EVP_MD_CTX_free>;
using EVP_PKEY_CTX_ptr = ossl_unique_ptr<EVP_PKEY_CTX, EVP_PKEY_CTX_free>;

// Forward declaration for helper from helpers.cpp (or include helpers.h if created)
EVP_PKEY_ptr load_private_key(const std::string& key_path);
// Need definition of handle_openssl_error, read_file_bytes, write_file_bytes
void handle_openssl_error(const char* context);
bool read_file_bytes(const std::string& file_path, std::vector<unsigned char>& data);
bool write_file_bytes(const std::string& file_path, const std::vector<unsigned char>& data);

extern const int ml_dsa_65_private_key_size; // Defined in mldsa_lib.h
extern const int ml_dsa_65_public_key_size; // Defined in mldsa_lib.h
// --- Signing Implementations ---

// Returns signature length on success, 0 on failure
int sign_mldsa65(
    const char *private_key,
    const char *message,
    size_t message_len,
    unsigned char *signature_buf,
    size_t signature_buf_size
) {
    EVP_PKEY_ptr pkey(EVP_PKEY_new_raw_private_key_ex(NULL, "ML-DSA-65", NULL, (unsigned char*) private_key, ml_dsa_65_private_key_size), EVP_PKEY_free);
    if (!pkey.get()) {
        return 0;
    }

    EVP_MD_CTX_ptr md_ctx(EVP_MD_CTX_new(), EVP_MD_CTX_free);
    if (!md_ctx) {
        handle_openssl_error("EVP_MD_CTX_new");
        return 0;
    }

    if (EVP_DigestSignInit(md_ctx.get(), nullptr, nullptr, nullptr, pkey.get()) <= 0) {
        handle_openssl_error("EVP_DigestSignInit");
        return 0;
    }

    size_t sig_len = 0;
    if (EVP_DigestSign(md_ctx.get(), NULL, &sig_len, (const unsigned char*)message, message_len) <= 0) {
        handle_openssl_error("EVP_DigestSign (get size)");
        return 0;
    }

    if (sig_len > signature_buf_size) {
        // Buffer too small
        return 0;
    }

    if (EVP_DigestSign(md_ctx.get(), signature_buf, &sig_len, (const unsigned char*)message, message_len) <= 0) {
        handle_openssl_error("EVP_DigestSignFinal (sign)");
        return 0;
    }

    return sig_len;
}