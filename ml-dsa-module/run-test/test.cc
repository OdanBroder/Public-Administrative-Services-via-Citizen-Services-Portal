#include <openssl/evp.h>
#include <iostream>
#include <cstring>
#include <iomanip>
using namespace std;
int main(){
  const char *input = "Hello, World!";
  size_t input_len = strlen(input);
  unsigned char output[EVP_MAX_MD_SIZE];
  unsigned int output_len;
  const EVP_MD *md = EVP_sha256();
  EVP_MD_CTX *ctx = EVP_MD_CTX_new();
  if (ctx == NULL) {
    cerr << "Error creating context" << endl;
    return 0;
  }

  if (EVP_DigestInit_ex(ctx, md, NULL) != 1) {
    cerr << "Error initializing digest" << endl;
    EVP_MD_CTX_free(ctx);
    return 0;
  }

  if (EVP_DigestUpdate(ctx, input, input_len) != 1) {
    cerr << "Error updating digest" << endl;
    EVP_MD_CTX_free(ctx);
    return 0;
  }

  if (md == EVP_shake128() || md == EVP_shake256()) {
    if (EVP_DigestFinalXOF(ctx, output, output_len) != 1) {
      cerr << "Error finalizing digest" << endl;
      EVP_MD_CTX_free(ctx);
      return 0;
    }
    return 0;
  }
  if (EVP_DigestFinal_ex(ctx, output, &output_len) != 1) {
    cerr << "Error finalizing digest" << endl;
    EVP_MD_CTX_free(ctx);
    return 0 ;
  }
  EVP_MD_CTX_free(ctx);
  std::cout << "Digest computed successfully, length: " << output_len << std::endl;
  std::cout << "Digest: ";
  for (unsigned int i = 0; i < output_len; i++) {
    std::cout << std::hex << std::setw(2) << std::setfill('0') << (int)output[i];
  }
}

