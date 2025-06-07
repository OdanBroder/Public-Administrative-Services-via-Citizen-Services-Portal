#include "mldsa_lib.h"
// ...existing code...
#include <iostream>
#include <fstream>
#include <cstdio>
#include <cstring>
#include "key_generation.cpp"
#include "signing.cpp"
#include "verification.cpp"
#include <iomanip>

std::string bytesToHexString(const uint8_t* data, size_t len) {
    std::stringstream ss;
    ss << std::hex << std::setfill('0');
    for (size_t i = 0; i < len; i++) {
        ss << std::setw(2) << static_cast<int>(data[i]);
    }
    return ss.str();
}



int main() {
    char private_key[ml_dsa_65_private_key_size];
    char public_key[ml_dsa_65_public_key_size];
    std::string csr_path = "test_csr.pem";
    std::string cert_path = "test_cert.pem";

    // Clean up before
    remove(csr_path.c_str());
    remove(cert_path.c_str());

    // 1. Success case
    memset(private_key, 0, sizeof(private_key));
    memset(public_key, 0, sizeof(public_key));
    bool ok = generate_mldsa65_keypair(private_key, public_key);
    std::string public_key_hex = bytesToHexString((uint8_t*)public_key, ml_dsa_65_public_key_size);
    std::string private_key_hex = bytesToHexString((uint8_t*)private_key, ml_dsa_65_private_key_size);
    std::cout << "[Test] Public Key: " << public_key_hex << '\n' << std::endl;
    std::cout << "[Test] Private Key: " << private_key_hex << std::endl;
    std::cout << "[Test] Keypair generation: " << (ok ? "PASS" : "FAIL") << std::endl;

    const char* subject[] = {"CN=Test User", "O=Test Org", "C=US"};
    ok = generate_csr(private_key, (char*)csr_path.c_str(), const_cast<char**>(subject), 3);
    std::cout << "[Test] CSR generation: " << (ok ? "PASS" : "FAIL") << std::endl;

    ok = generate_self_signed_certificate((char*)csr_path.c_str(), private_key, (char*)cert_path.c_str(), 30);
    std::cout << "[Test] Self-signed certificate generation: " << (ok ? "PASS" : "FAIL") << std::endl;

    std::ifstream cert_file(cert_path);
    bool cert_exists = cert_file.good();
    cert_file.seekg(0, std::ios::end);
    bool cert_nonempty = cert_file.tellg() > 0;
    std::cout << "[Test] Certificate file exists: " << (cert_exists ? "PASS" : "FAIL") << std::endl;
    std::cout << "[Test] Certificate file non-empty: " << (cert_nonempty ? "PASS" : "FAIL") << std::endl;
    cert_file.close();

    // 2. Invalid CSR path
    ok = generate_self_signed_certificate((char*)"nonexistent_csr.pem", private_key, (char*)cert_path.c_str(), 30);
    std::cout << "[Test] Invalid CSR path: " << (!ok ? "PASS" : "FAIL") << std::endl;

    // 3. Invalid private key
    char bad_private_key[ml_dsa_65_private_key_size] = {0};
    // Generate a valid CSR first
    generate_csr(private_key, (char*)csr_path.c_str(), const_cast<char**>(subject), 3);
    ok = generate_self_signed_certificate((char*)csr_path.c_str(), bad_private_key, (char*)cert_path.c_str(), 30);
    std::cout << "[Test] Invalid private key: " << (!ok ? "PASS" : "FAIL") << std::endl;

    // 4. Invalid certificate path
    ok = generate_self_signed_certificate((char*)csr_path.c_str(), private_key, (char*)"/invalid_path/test_cert.pem", 30);
    std::cout << "[Test] Invalid certificate path: " << (!ok ? "PASS" : "FAIL") << std::endl;
    // 5. Signing with a valid key
    std::string message = "This is a test message.";
    ok = sign_mldsa65(private_key, message.c_str(), message.size(), (char*)"test_signature.bin");
    std::cout << "[Test] Signing with valid key: " << (ok ? "PASS" : "FAIL") << std::endl;
    // 6. Verifying with a valid public key
    ok = verify_mldsa65(public_key, "test_signature.bin", message.c_str(), message.size());
    
    // Clean up after
    // remove(csr_path.c_str());
    // remove(cert_path.c_str());

    return 0;
}
// ...existing code...