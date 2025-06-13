// crypto_lib.h
#ifndef CRYPTO_LIB_H
#define CRYPTO_LIB_H

#include <cstddef>
#include <string>
#include <vector>
#include <memory>
#include <openssl/bio.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/x509.h>
#include <openssl/err.h>
#include <openssl/provider.h>


template<typename T, void (*Func)(T*)>
using ossl_unique_ptr = std::unique_ptr<T, decltype(Func)>;

using BIO_ptr = ossl_unique_ptr<BIO, BIO_free_all>;
using EVP_PKEY_ptr = ossl_unique_ptr<EVP_PKEY, EVP_PKEY_free>;
using X509_ptr = ossl_unique_ptr<X509, X509_free>;
const int ml_dsa_65_public_key_size = 1952;
const int ml_dsa_65_private_key_size = 4032;
// --- Error Handling ---

#ifdef __EMSCRIPTEN__
  #include <emscripten/emscripten.h>
  #define EXPOSE_WASM EMSCRIPTEN_KEEPALIVE
#else 
  #define EXPOSE_WASM
#endif 

void handle_openssl_error(const char* context);
X509_ptr load_certificate(const std::string& cert_path);
// --- Helper Functions ---

/**
 * @brief Reads the entire content of a file into a byte vector.
 * @param file_path Path to the file.
 * @param data Output vector containing file bytes.
 * @return data length on success, -1 on failure.
 */
bool read_file_bytes(const std::string& file_path, std::vector<unsigned char>& data);
int read_file_char (const char *file_path, char* data);

/**
 * @brief Writes a byte vector to a file.
 * @param file_path Path to the file.
 * @param data Vector containing bytes to write.
 * @return true on success, false on failure.
 */
bool write_file_bytes(const std::string& file_path, const std::vector<unsigned char>& data);
bool write_file_char (const char *file_path, const char* data, int data_len);

/**
 * @brief Encodes a byte vector into a Base64 string.
 * @param input Byte vector to encode.
 * @return Base64 encoded string, or empty string on failure.
 */
std::string base64_encode(const std::vector<unsigned char>& input);
void base64_encode(char* input, size_t input_len, char *output);

/**
  * @brief Save a private key in PEM format to a file.
  * @param private_key_path Path to save the private key (PEM format).
  * @param private_key The private key in PEM format as a string.
  * @return void
 */
void save_private_key_to_pem(const char* private_key_path, char* private_key);
void save_public_key_to_pem(const char* public_key_path, char* public_key);

/**
  * @brief Loads a public key from a PEM file.
  * @param public_key_path_chr Path to the public key PEM file.
  * @param public_key_chr Output buffer for the public key in PEM format.
  * @return key length on success, -1 on failure.
 */
int load_public_key_from_pem(char* public_key_path_chr, char* public_key_chr);
int load_private_key_from_pem(char* private_key_path_chr, char* private_key_chr);
// --- Key Generation ---

// bool generate_mldsa65_keypair(const std::string& private_key_path, const std::string& public_key_path);
extern "C"{
EXPOSE_WASM void freeMemory(void* ptr);
/**
  * @brief Generates a MLDSA 65 keypair and saves them to files.
  * @param private_key The return private key buffer.
  * @param public_key The return public key buffer.
  * @return true on success, false on failure.
  */
EXPOSE_WASM bool sha256_digest(const char *message_chr, size_t message_len, char *digest_out);
EXPOSE_WASM bool generate_mldsa65_keypair(char *private_key, char *public_key);
EXPOSE_WASM int sign_certificate(
    const char* csr_buf,
    size_t csr_buf_len,
    const char* ca_cert_buf,
    size_t ca_cert_buf_len,
    const char* ca_privkey_buf,
    size_t ca_privkey_len,
    char* out_cert_buf,
    size_t out_cert_buf_size,
    int days_valid
);
/**
 * @brief Generates a Certificate Signing Request (CSR) using a private key.
 * @param private_key_char The private key buffer
 * @param csr_path Path to save the CSR (DER).
 * @param subject_info Vector of subject components (e.g., {"C=US", "ST=CA", "O=MyOrg", "CN=localhost"}).
 * @return true on success, false on failure.
 */
EXPOSE_WASM int generate_csr(
    char* private_key_chr,
    char* public_key_chr,
    char** subject_info_vec,
    int subject_info_count,
    char* out_csr_buf,
    size_t out_csr_buf_size
);

/**
 * @brief Generates a self-signed X.509 certificate from a CSR and private key.
 * @param csr_path Path to the CSR file (PEM format).
 * @param private_key_path Path to the private key used for the CSR (PEM format).
 * @param certificate_path Path to save the certificate (PEM format).
 * @param days Validity period in days.
 * @return true on success, false on failure.
 */


EXPOSE_WASM int generate_self_signed_certificate(
    const char* csr_buf,
    size_t csr_buf_len,
    char* private_key,
    char* out_cert_buf,
    size_t out_cert_buf_size,
    int days
);
// --- Signing ---
EXPOSE_WASM bool verify_certificate_issued_by_ca(
    const char* cert_buf, size_t cert_buf_len,
    const char* ca_cert_buf, size_t ca_cert_buf_len
);
/**
 * @brief Sign a message using MLDSA 
  * @param private_key  The private key buffer.
  * @param message The message to sign.
  * @param message_len Length of the message.
  * @param signature_path Path to save the binary signature file.
  * @return true on success, false on failure.
*/
EXPOSE_WASM int sign_mldsa65(
    const char *private_key,
    const char *message,
    size_t message_len,
    unsigned char *signature_buf,
    size_t signature_buf_size
);
// --- Verification ---

/**
 * @brief Verifies an ECDSA signature (SHA256 digest).
 * @param public_key_char Path to the ECDSA public key (PEM format).
 * @param signature_path Path to the binary signature file.
 * @param message_char Path to the original message file.
 * @param message_len Length of the original message.
 * @return true if signature is valid, false otherwise (or on error).
 */
EXPOSE_WASM bool verify_mldsa65(const char *public_key_chr, const char *signature_path, const char *message_chr, int message_len);
// --- X.509 Operations ---

/**
 * @brief Extracts the public key from an X.509 certificate file.
 * @param certificate_path Path to the certificate file (PEM format).
 * @param public_key_path Path to save the extracted public key (PEM format).
 * @return true on success, false on failure.
 */
EXPOSE_WASM bool extract_pubkey_from_cert(const std::string& certificate_path, const std::string& public_key_path);

/**
 * @brief Verifies a signature using the public key from an X.509 certificate.
 * @param certificate_path_chr Path to the certificate file (PEM format).
 * @param signature_path Path to the binary signature file.
 * @param message_chr The original message to verify.
  * @param message_len Length of the original message.
 * @return true if signature is valid, false otherwise (or on error).
 */
EXPOSE_WASM bool verify_signature_with_cert(const char *certificate_buf, size_t certificate_len, const unsigned char *signature_buf, size_t signature_len, const char *message_chr, int message_len);
} // Extern "C"
#endif //CRYPTO_LIB_H
//