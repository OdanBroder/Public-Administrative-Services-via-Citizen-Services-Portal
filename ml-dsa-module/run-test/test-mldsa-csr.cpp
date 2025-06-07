#include <openssl/evp.h>
#include <openssl/x509.h>
#include <openssl/x509v3.h>
#include <openssl/pem.h>
#include <openssl/provider.h>
#include <openssl/err.h>
#include <stdio.h>

void handle_openssl_error(const char *msg) {
    fprintf(stderr, "%s failed:\n", msg);
    ERR_print_errors_fp(stderr);
}

int main(void) {
    // Load OpenSSL error strings and algorithms
    ERR_load_crypto_strings();
    OpenSSL_add_all_algorithms();

    // Load default provider (important!)
    OSSL_PROVIDER *defp = OSSL_PROVIDER_load(NULL, "default");
    if (!defp) {
        handle_openssl_error("OSSL_PROVIDER_load");
        return 1;
    }

    // Create MLDSA65 key
    EVP_PKEY_CTX *pctx = EVP_PKEY_CTX_new_from_name(NULL, "MLDSA65", NULL);
    if (!pctx || EVP_PKEY_keygen_init(pctx) <= 0) {
        handle_openssl_error("EVP_PKEY_CTX_new_from_name or keygen_init");
        return 1;
    }

    EVP_PKEY *pkey = NULL;
    if (EVP_PKEY_generate(pctx, &pkey) <= 0) {
        handle_openssl_error("EVP_PKEY_generate");
        return 1;
    }

    // Create CSR
    X509_REQ *req = X509_REQ_new();
    X509_NAME *name = X509_NAME_new();
    X509_NAME_add_entry_by_txt(name, "CN", MBSTRING_ASC, (const unsigned char *)"MLDSA Test", -1, -1, 0);
    X509_REQ_set_subject_name(req, name);
    X509_REQ_set_pubkey(req, pkey);

    // Use EVP_MD_fetch to fetch SHA256 from default provider
    EVP_MD *md = EVP_MD_fetch(NULL, "SHA256", NULL);
    if (!md) {
        handle_openssl_error("EVP_MD_fetch");
        return 1;
    }

    if (X509_REQ_sign(req, pkey, md) <= 0) {
        handle_openssl_error("X509_REQ_sign");
        return 1;
    }

    // Write CSR to stdout
    PEM_write_X509_REQ(stdout, req);

    // Clean up
    EVP_MD_free(md);
    EVP_PKEY_free(pkey);
    EVP_PKEY_CTX_free(pctx);
    X509_REQ_free(req);
    X509_NAME_free(name);
    OSSL_PROVIDER_unload(defp);
    EVP_cleanup();
    ERR_free_strings();

    return 0;
}
