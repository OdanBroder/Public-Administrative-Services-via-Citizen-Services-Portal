// C++ (test_key_generation.cpp)
#include <gtest/gtest.h>
#include <fstream>
#include <cstdio>
#include <cstring>
#include "key_generation.cpp"

class KeyGenerationTest : public ::testing::Test {
protected:
  char private_key[ml_dsa_65_private_key_size];
  char public_key[ml_dsa_65_public_key_size];
  std::string csr_path = "test_csr.pem";
  std::string cert_path = "test_cert.pem";

  void SetUp() override {
    memset(private_key, 0, sizeof(private_key));
    memset(public_key, 0, sizeof(public_key));
    remove(csr_path.c_str());
    remove(cert_path.c_str());
  }

  void TearDown() override {
    remove(csr_path.c_str());
    remove(cert_path.c_str());
  }
};

TEST_F(KeyGenerationTest, GenerateSelfSignedCertificate_Success) {
  ASSERT_TRUE(generate_mldsa65_keypair(private_key, public_key));

  // Prepare subject info
  const char* subject[] = {"CN=Test User", "O=Test Org", "C=US"};
  ASSERT_TRUE(generate_csr(private_key, (char*)csr_path.c_str(),
               const_cast<char**>(subject), 3));

  ASSERT_TRUE(generate_self_signed_certificate((char*)csr_path.c_str(),
                         private_key,
                         (char*)cert_path.c_str(),
                         30));

  std::ifstream cert_file(cert_path);
  ASSERT_TRUE(cert_file.good());
  cert_file.seekg(0, std::ios::end);
  ASSERT_GT(cert_file.tellg(), 0);
}

TEST_F(KeyGenerationTest, GenerateSelfSignedCertificate_InvalidCSRPath) {
  ASSERT_TRUE(generate_mldsa65_keypair(private_key, public_key));
  ASSERT_FALSE(generate_self_signed_certificate((char*)"nonexistent_csr.pem",
                          private_key,
                          (char*)cert_path.c_str(),
                          30));
}

TEST_F(KeyGenerationTest, GenerateSelfSignedCertificate_InvalidPrivateKey) {
  // Generate a valid CSR first
  ASSERT_TRUE(generate_mldsa65_keypair(private_key, public_key));
  const char* subject[] = {"CN=Test User", "O=Test Org", "C=US"};
  ASSERT_TRUE(generate_csr(private_key, (char*)csr_path.c_str(),
               const_cast<char**>(subject), 3));

  // Corrupt the private key
  char bad_private_key[ml_dsa_65_private_key_size] = {0};
  ASSERT_FALSE(generate_self_signed_certificate((char*)csr_path.c_str(),
                          bad_private_key,
                          (char*)cert_path.c_str(),
                          30));
}

TEST_F(KeyGenerationTest, GenerateSelfSignedCertificate_InvalidCertPath) {
  ASSERT_TRUE(generate_mldsa65_keypair(private_key, public_key));
  const char* subject[] = {"CN=Test User", "O=Test Org", "C=US"};
  ASSERT_TRUE(generate_csr(private_key, (char*)csr_path.c_str(),
               const_cast<char**>(subject), 3));

  // Try to write to an invalid path
  ASSERT_FALSE(generate_self_signed_certificate((char*)csr_path.c_str(),
                          private_key,
                          (char*)"/invalid_path/test_cert.pem",
                          30));
}