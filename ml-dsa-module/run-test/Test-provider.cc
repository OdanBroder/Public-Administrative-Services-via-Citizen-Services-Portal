
// #include "pqc_crypto_static.h"
#include <iomanip>
#include <iostream>
#include <memory>
#include <openssl/asn1.h>
#include <openssl/bio.h>
#include <openssl/buffer.h>
#include <openssl/err.h>
#include <openssl/evp.h>
#include <openssl/pem.h>
#include <openssl/provider.h>
#include <openssl/types.h>
#include <openssl/x509.h>
#include <sstream>
#include <stdatomic.h>
#include <stdexcept>
#include <string.h>
#include <vector>
#include <emscripten/emscripten.h>
extern "C" {

// Function to generate an ML-DSA-65 key pair and return keys as hex strings.
// Returns 0 on success, -1 on failure.
// public_key_hex: Output buffer for the public key hex string (caller
// allocates). public_key_hex_len: Input: size of the public_key_hex buffer.
// Output: actual length of the hex string written (excluding null terminator).
// private_key_hex: Output buffer for the private key hex string (caller
// allocates). private_key_hex_len: Input: size of the private_key_hex buffer.
// Output: actual length of the hex string written (excluding null terminator).
// Note: Caller must ensure buffers are large enough. Recommended sizes can be
// estimated from OQS documentation or by running once with large buffers.
extern OSSL_provider_init_fn oqs_provider_init; 
EMSCRIPTEN_KEEPALIVE void *mallocMemory(int size) {
    void *ptr = malloc(size);
    if (ptr == NULL) {
        std::cerr << "Memory allocation failed for size: " << size << std::endl;
        ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    }
    return ptr;
}
EMSCRIPTEN_KEEPALIVE void freeMemory(void * ptr){
    if (ptr != NULL) {
        free(ptr);
        ptr = nullptr; 
    } else {
        std::cerr << "Attempted to free a NULL pointer." << std::endl;
    }
}

EMSCRIPTEN_KEEPALIVE int generate_mldsa65_keypair_hex(char *public_key_hex,
                                 size_t *public_key_hex_len,
                                 char *private_key_hex,
                                 size_t *private_key_hex_len);

// Function to generate an X.509 certificate from an ML-DSA-65 key pair provided
// as hex strings. Returns 0 on success, -1 on failure. public_key_hex: Input
// hex string representing the raw public key. private_key_hex: Input hex string
// representing the raw private key (needed for signing). cert_path: The path
// where the generated certificate will be saved (PEM format).
EMSCRIPTEN_KEEPALIVE int generate_x509_certificate_from_hex_keys(const char *public_key_hex,
                                            const char *private_key_hex,
                                            const char *cert_path);

// Function to convert a raw private key (hex string) to PEM format.
// Returns 0 on success, -1 on failure.
// private_key_hex: Input hex string representing the raw private key.
// pem_path: The path where the generated private key PEM file will be saved.
EMSCRIPTEN_KEEPALIVE int raw_to_pem_private(const char *private_key_hex, const char *pem_path);

// Function to convert a raw public key (hex string) to PEM format.
// Returns 0 on success, -1 on failure.
// public_key_hex: Input hex string representing the raw public key.
// pem_path: The path where the generated public key PEM file will be saved.
EMSCRIPTEN_KEEPALIVE int raw_to_pem_public(const char *public_key_hex, const char *pem_path);

// Function to load an ML-DSA-65 public key from a PEM file and return it as a
// hex string. Returns 0 on success, -1 on failure. pem_path: Path to the input
// public key PEM file. public_key_hex: Output buffer for the public key hex
// string (caller allocates). public_key_hex_len: Input: size of the
// public_key_hex buffer. Output: actual length of the hex string written
// (excluding null terminator).
EMSCRIPTEN_KEEPALIVE int load_mldsa65_public_pem(const char *pem_path, char *public_key_hex,
                            size_t *public_key_hex_len);

// Function to load an ML-DSA-65 private key from a PEM file and return it as a
// hex string. Returns 0 on success, -1 on failure. private_key_hex: Output
// buffer for the private key hex string (caller allocates).
// private_key_hex_len: Input: size of the private_key_hex buffer. Output:
// actual length of the hex string written (excluding null terminator).
// pem_path: Path to the input private key PEM file.
EMSCRIPTEN_KEEPALIVE int load_mldsa65_private_pem(const char *pem_path, char *private_key_hex,
                             size_t *private_key_hex_len);

}

// --- Helper RAII classes ---
struct PKEYDeleter {
  void operator()(EVP_PKEY *pkey) const { EVP_PKEY_free(pkey); }
};
using unique_pkey_ptr = std::unique_ptr<EVP_PKEY, PKEYDeleter>;

struct BIODeleter {
  void operator()(BIO *bio) const { BIO_free_all(bio); }
};
using unique_bio_ptr = std::unique_ptr<BIO, BIODeleter>;

struct X509Deleter {
  void operator()(X509 *x509) const { X509_free(x509); }
};
using unique_x509_ptr = std::unique_ptr<X509, X509Deleter>;

struct X509NameDeleter {
  void operator()(X509_NAME *name) const { X509_NAME_free(name); }
};
using unique_x509_name_ptr = std::unique_ptr<X509_NAME, X509NameDeleter>;

// --- Helper Functions (Corrected) ---

// Convert byte array to hex string
std::string bytes_to_hex(const unsigned char *bytes, size_t len) {
  std::stringstream ss;
  ss << std::hex << std::setfill('0'); // Correct: use single quotes for char
  for (size_t i = 0; i < len; ++i) {
    ss << std::setw(2) << static_cast<unsigned>(bytes[i]);
  }
  return ss.str();
}

// Convert hex string to byte vector
std::vector<unsigned char> hex_to_bytes(const std::string &hex) {
  std::vector<unsigned char> bytes;
  if (hex.length() % 2 != 0) {
    throw std::invalid_argument(
        "Hex string must have an even number of digits");
  }
  for (unsigned int i = 0; i < hex.length(); i += 2) {
    std::string byteString = hex.substr(i, 2);
    unsigned char byte =
        static_cast<unsigned char>(strtol(byteString.c_str(), NULL, 16));
    bytes.push_back(byte);
  }
  return bytes;
}

// --- Implemented Functions (Refactored) ---

int generate_mldsa65_keypair_hex(char *public_key_hex,
                                 size_t *public_key_hex_len,
                                 char *private_key_hex,
                                 size_t *private_key_hex_len) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY_CTX *pctx = NULL;
  EVP_PKEY *pkey_raw = NULL;
  OSSL_PROVIDER *default_provider = NULL;
  OSSL_LIB_CTX *libctx = NULL;

  libctx = OSSL_LIB_CTX_new();
  unique_pkey_ptr pkey(nullptr);
  int ret = -1;
  size_t raw_pub_len = 0;
  size_t raw_priv_len = 0;
  std::vector<unsigned char> raw_pub_key;
  std::vector<unsigned char> raw_priv_key;
  std::string pub_hex_str;
  std::string priv_hex_str;
  if(!OSSL_PROVIDER_add_builtin(libctx, "oqsprovider", oqs_provider_init)){
    std::cerr << "Failed to add OQS provider to libctx." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
  }


  default_provider = OSSL_PROVIDER_load(NULL, "default");

  oqsprov = OSSL_PROVIDER_load(libctx, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue, maybe loaded elsewhere
  }

  pctx = EVP_PKEY_CTX_new_from_name(NULL, "mldsa65", "provider=oqsprovider");
  if (pctx == NULL) {
    std::cerr << "Failed to create EVP_PKEY_CTX for mldsa65." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }

  if (EVP_PKEY_keygen_init(pctx) <= 0) {
    std::cerr << "Failed to initialize keygen context." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }

  if (EVP_PKEY_generate(pctx, &pkey_raw) <= 0) {
    std::cerr << "Failed to generate mldsa65 key pair." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  std::cout << "Successfully generated ML-DSA-65 EVP_PKEY object." << std::endl;

  if (EVP_PKEY_get_raw_public_key(pkey.get(), NULL, &raw_pub_len) <= 0) {
    std::cerr << "Failed to get raw public key length." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }
  raw_pub_key.resize(raw_pub_len);
  if (EVP_PKEY_get_raw_public_key(pkey.get(), raw_pub_key.data(),
                                  &raw_pub_len) <= 0) {
    std::cerr << "Failed to get raw public key." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }

  if (EVP_PKEY_get_raw_private_key(pkey.get(), NULL, &raw_priv_len) <= 0) {
    std::cerr << "Failed to get raw private key length." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }
  raw_priv_key.resize(raw_priv_len);
  if (EVP_PKEY_get_raw_private_key(pkey.get(), raw_priv_key.data(),
                                   &raw_priv_len) <= 0) {
    std::cerr << "Failed to get raw private key." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_keygen;
  }

  pub_hex_str = bytes_to_hex(raw_pub_key.data(), raw_pub_len);
  priv_hex_str = bytes_to_hex(raw_priv_key.data(), raw_priv_len);

  if (public_key_hex == NULL || *public_key_hex_len <= pub_hex_str.length()) {
    std::cerr << "Public key hex buffer too small or NULL. Required: "
              << pub_hex_str.length() + 1 << std::endl;
    *public_key_hex_len = pub_hex_str.length();
    goto cleanup_keygen;
  }
  strncpy(public_key_hex, pub_hex_str.c_str(), *public_key_hex_len);
  public_key_hex[pub_hex_str.length()] = 0;
  *public_key_hex_len = pub_hex_str.length();

  if (private_key_hex == NULL ||
      *private_key_hex_len <= priv_hex_str.length()) {
    std::cerr << "Private key hex buffer too small or NULL. Required: "
              << priv_hex_str.length() + 1 << std::endl;
    *private_key_hex_len = priv_hex_str.length();
    goto cleanup_keygen;
  }
  strncpy(private_key_hex, priv_hex_str.c_str(), *private_key_hex_len);
  private_key_hex[priv_hex_str.length()] = 0;
  *private_key_hex_len = priv_hex_str.length();

  std::cout << "Successfully extracted raw keys and converted to hex."
            << std::endl;
  ret = 0;

cleanup_keygen:
  if (pctx != NULL) {
    EVP_PKEY_CTX_free(pctx);
  }
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}

int generate_x509_certificate_from_hex_keys(const char *public_key_hex,
                                            const char *private_key_hex,
                                            const char *cert_path) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY *pkey_raw = NULL;
  unique_pkey_ptr pkey(nullptr);
  unique_x509_ptr cert(X509_new());
  unique_bio_ptr bio_out(nullptr);
  X509_NAME *name = NULL;
  int ret = -1;
  std::vector<unsigned char> raw_pub_key;
  std::vector<unsigned char> raw_priv_key;

  oqsprov = OSSL_PROVIDER_load(NULL, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider for signing." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue
  }

  try {
    raw_pub_key = hex_to_bytes(public_key_hex);
    raw_priv_key = hex_to_bytes(private_key_hex);
  } catch (const std::exception &e) {
    std::cerr << "Error converting hex keys to bytes: " << e.what()
              << std::endl;
    goto cleanup_cert;
  }

  pkey_raw = EVP_PKEY_new_raw_private_key_ex(
      NULL, "mldsa65", NULL, raw_priv_key.data(), raw_priv_key.size());
  if (pkey_raw == NULL) {
    std::cerr << "Failed to create EVP_PKEY from raw private key." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  // Assign public key part to the EVP_PKEY object
  if (EVP_PKEY_set1_encoded_public_key(pkey.get(), raw_pub_key.data(),
                                       raw_pub_key.size()) <= 0) {
    std::cerr << "Failed to assign raw public key to EVP_PKEY." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!cert) {
    std::cerr << "Failed to create X509 object." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!X509_set_version(cert.get(), 2)) { /* version 3 */
    std::cerr << "Failed to set certificate version." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!ASN1_INTEGER_set(X509_get_serialNumber(cert.get()), 1)) {
    std::cerr << "Failed to set serial number." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!X509_gmtime_adj(X509_getm_notBefore(cert.get()), 0) ||
      !X509_gmtime_adj(X509_getm_notAfter(cert.get()),
                       (long)60 * 60 * 24 * 365)) {
    std::cerr << "Failed to set validity period." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!X509_set_pubkey(cert.get(), pkey.get())) {
    std::cerr << "Failed to set public key in certificate." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  name = X509_get_subject_name(cert.get());
  if (!name ||
      !X509_NAME_add_entry_by_txt(name, "C", MBSTRING_ASC,
                                  (unsigned char *)"CA", -1, -1, 0) ||
      !X509_NAME_add_entry_by_txt(name, "O", MBSTRING_ASC,
                                  (unsigned char *)"My Test Org Static", -1, -1,
                                  0) ||
      !X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC,
                                  (unsigned char *)"ML-DSA-65 Test Cert Static",
                                  -1, -1, 0)) {
    std::cerr << "Failed to set subject name entries." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!X509_set_issuer_name(cert.get(), name)) {
    std::cerr << "Failed to set issuer name." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!X509_sign(cert.get(), pkey.get(), NULL)) { // Use default digest
    std::cerr << "Failed to sign the certificate." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  bio_out.reset(BIO_new_file(cert_path, "w"));
  if (!bio_out) {
    std::cerr << "Failed to open file for writing: " << cert_path << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  if (!PEM_write_bio_X509(bio_out.get(), cert.get())) {
    std::cerr << "Failed to write certificate to file." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_cert;
  }

  std::cout << "Successfully generated X.509 certificate: " << cert_path
            << std::endl;
  ret = 0;

cleanup_cert:
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}

int raw_to_pem_private(const char *private_key_hex, const char *pem_path) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY *pkey_raw = NULL;
  unique_pkey_ptr pkey(nullptr);
  unique_bio_ptr bio_out(nullptr);
  int ret = -1;
  std::vector<unsigned char> raw_priv_key;

  oqsprov = OSSL_PROVIDER_load(NULL, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider for PEM conversion." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue
  }

  try {
    raw_priv_key = hex_to_bytes(private_key_hex);
  } catch (const std::exception &e) {
    std::cerr << "Error converting private key hex to bytes: " << e.what()
              << std::endl;
    goto cleanup_pem_priv;
  }

  pkey_raw = EVP_PKEY_new_raw_private_key_ex(
      NULL, "mldsa65", NULL, raw_priv_key.data(), raw_priv_key.size());
  if (pkey_raw == NULL) {
    std::cerr
        << "Failed to create EVP_PKEY from raw private key for PEM conversion."
        << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_priv;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  bio_out.reset(BIO_new_file(pem_path, "w"));
  if (!bio_out) {
    std::cerr << "Failed to open file for writing PEM: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_priv;
  }

  if (!PEM_write_bio_PrivateKey(bio_out.get(), pkey.get(), NULL, NULL, 0, NULL,
                                NULL)) {
    std::cerr << "Failed to write private key to PEM file." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_priv;
  }

  std::cout << "Successfully wrote private key to PEM file: " << pem_path
            << std::endl;
  ret = 0;

cleanup_pem_priv:
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}

int raw_to_pem_public(const char *public_key_hex, const char *pem_path) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY *pkey_raw = NULL;
  unique_pkey_ptr pkey(nullptr);
  unique_bio_ptr bio_out(nullptr);
  int ret = -1;
  std::vector<unsigned char> raw_pub_key;

  oqsprov = OSSL_PROVIDER_load(NULL, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider for PEM conversion." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue
  }

  try {
    raw_pub_key = hex_to_bytes(public_key_hex);
  } catch (const std::exception &e) {
    std::cerr << "Error converting public key hex to bytes: " << e.what()
              << std::endl;
    goto cleanup_pem_pub;
  }

  pkey_raw = EVP_PKEY_new_raw_public_key_ex(
      NULL, "mldsa65", NULL, raw_pub_key.data(), raw_pub_key.size());
  if (pkey_raw == NULL) {
    std::cerr
        << "Failed to create EVP_PKEY from raw public key for PEM conversion."
        << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_pub;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  bio_out.reset(BIO_new_file(pem_path, "w"));
  if (!bio_out) {
    std::cerr << "Failed to open file for writing PEM: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_pub;
  }

  if (!PEM_write_bio_PUBKEY(bio_out.get(), pkey.get())) {
    std::cerr << "Failed to write public key to PEM file." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_pem_pub;
  }

  std::cout << "Successfully wrote public key to PEM file: " << pem_path
            << std::endl;
  ret = 0;

cleanup_pem_pub:
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}

int load_mldsa65_public_pem(const char *pem_path, char *public_key_hex,
                            size_t *public_key_hex_len) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY *pkey_raw = NULL;
  unique_pkey_ptr pkey(nullptr);
  unique_bio_ptr bio_in(nullptr);
  int ret = -1;
  size_t raw_pub_len = 0;
  std::vector<unsigned char> raw_pub_key;
  std::string pub_hex_str;

  oqsprov = OSSL_PROVIDER_load(NULL, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider for PEM loading." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue
  }

  bio_in.reset(BIO_new_file(pem_path, "r"));
  if (!bio_in) {
    std::cerr << "Failed to open PEM file for reading: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_pub;
  }

  pkey_raw = PEM_read_bio_PUBKEY(bio_in.get(), NULL, NULL, NULL);
  if (pkey_raw == NULL) {
    std::cerr << "Failed to read public key from PEM file: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_pub;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  if (EVP_PKEY_get_raw_public_key(pkey.get(), NULL, &raw_pub_len) <= 0) {
    std::cerr << "Failed to get raw public key length from loaded PEM."
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_pub;
  }
  raw_pub_key.resize(raw_pub_len);
  if (EVP_PKEY_get_raw_public_key(pkey.get(), raw_pub_key.data(),
                                  &raw_pub_len) <= 0) {
    std::cerr << "Failed to get raw public key from loaded PEM." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_pub;
  }

  pub_hex_str = bytes_to_hex(raw_pub_key.data(), raw_pub_len);

  if (public_key_hex == NULL || *public_key_hex_len <= pub_hex_str.length()) {
    std::cerr << "Public key hex output buffer too small or NULL. Required: "
              << pub_hex_str.length() + 1 << std::endl;
    *public_key_hex_len = pub_hex_str.length();
    goto cleanup_load_pub;
  }
  strncpy(public_key_hex, pub_hex_str.c_str(), *public_key_hex_len);
  public_key_hex[pub_hex_str.length()] = 0;
  *public_key_hex_len = pub_hex_str.length();

  std::cout << "Successfully loaded public key from PEM and converted to hex: "
            << pem_path << std::endl;
  ret = 0;

cleanup_load_pub:
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}

int load_mldsa65_private_pem(const char *pem_path, char *private_key_hex,
                             size_t *private_key_hex_len) {
  OSSL_PROVIDER *oqsprov = NULL;
  EVP_PKEY *pkey_raw = NULL;
  unique_pkey_ptr pkey(nullptr);
  unique_bio_ptr bio_in(nullptr);
  int ret = -1;
  size_t raw_priv_len = 0;
  std::vector<unsigned char> raw_priv_key;
  std::string priv_hex_str;

  oqsprov = OSSL_PROVIDER_load(NULL, "oqsprovider");
  if (oqsprov == NULL) {
    std::cerr << "Failed to load OQS provider for PEM loading." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    // Continue
  }

  bio_in.reset(BIO_new_file(pem_path, "r"));
  if (!bio_in) {
    std::cerr << "Failed to open PEM file for reading: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_priv;
  }

  pkey_raw = PEM_read_bio_PrivateKey(bio_in.get(), NULL, NULL, NULL);
  if (pkey_raw == NULL) {
    std::cerr << "Failed to read private key from PEM file: " << pem_path
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_priv;
  }
  pkey.reset(pkey_raw);
  pkey_raw = NULL;

  if (EVP_PKEY_get_raw_private_key(pkey.get(), NULL, &raw_priv_len) <= 0) {
    std::cerr << "Failed to get raw private key length from loaded PEM."
              << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_priv;
  }
  raw_priv_key.resize(raw_priv_len);
  if (EVP_PKEY_get_raw_private_key(pkey.get(), raw_priv_key.data(),
                                   &raw_priv_len) <= 0) {
    std::cerr << "Failed to get raw private key from loaded PEM." << std::endl;
    ERR_print_errors(BIO_new_fd(2, BIO_NOCLOSE));
    goto cleanup_load_priv;
  }

  priv_hex_str = bytes_to_hex(raw_priv_key.data(), raw_priv_len);

  if (private_key_hex == NULL ||
      *private_key_hex_len <= priv_hex_str.length()) {
    std::cerr << "Private key hex output buffer too small or NULL. Required: "
              << priv_hex_str.length() + 1 << std::endl;
    *private_key_hex_len = priv_hex_str.length();
    goto cleanup_load_priv;
  }
  strncpy(private_key_hex, priv_hex_str.c_str(), *private_key_hex_len);
  private_key_hex[priv_hex_str.length()] = 0;
  *private_key_hex_len = priv_hex_str.length();

  std::cout << "Successfully loaded private key from PEM and converted to hex: "
            << pem_path << std::endl;
  ret = 0;

cleanup_load_priv:
  if (oqsprov != NULL) {
    OSSL_PROVIDER_unload(oqsprov);
  }
  return ret;
}
