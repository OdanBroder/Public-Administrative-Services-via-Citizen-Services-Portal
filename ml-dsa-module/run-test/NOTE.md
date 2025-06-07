# How to build openssl with wasm
1. clone openssl
2. cd openssl 
3. Run 
```sh
emconfigure ./Configure no-asm \
    no-async \
    no-egd \
    no-ktls \
    no-module \
    no-posix-io \
    no-secure-memory \
    no-shared \
    no-sock \
    no-stdio \
    no-thread-pool \
    no-threads \
    no-ui-console \
    no-weak-ssl-ciphers \
    no-afalgeng \
    --prefix="${Your dir}/openssl-build-wasm/" \
    --openssldir="${Your dir}/openssl-build-wasm/" \
linux-generic32
```
4. emmake make -j {number of thread}

# Build liboqs with wasm
1. Clone liboqs
2. mkdir build && cd build
3. emcmake cmake .. -DOQS_USE_OPENSSL=OFF -DBUILD_SHARED_LIBS=OFF
4. emmake make -j
4. emmake make install -j

# Build oqsprovider with wasm
1. clone oqsprovider
2. 
```bash
emcmake cmake -S . -B _build \\
  -DOPENSSL_ROOT_DIR=/home/aneii11/oqs-provider/openssl-build-wasm \\
  -DOPENSSL_INCLUDE_DIR=/home/aneii11/oqs-provider/openssl-build-wasm/include \\
  -DOPENSSL_CRYPTO_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libcrypto.a \\
  -DOPENSSL_SSL_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libssl.a \\
  -DOPENSSL_USE_STATIC_LIBS=TRUE \\
  -Dliboqs_DIR=/home/aneii11/oqs-provider/liboqs-build-wasm
```
3.
```sh
emcmake cmake --build _build \\
  -DOPENSSL_ROOT_DIR=/home/aneii11/oqs-provider/openssl-build-wasm \\
  -DOPENSSL_INCLUDE_DIR=/home/aneii11/oqs-provider/openssl-build-wasm/include \\
  -DOPENSSL_CRYPTO_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libcrypto.a \\
  -DOPENSSL_SSL_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libssl.a \\
  -DOPENSSL_USE_STATIC_LIBS=TRUE \\
  -Dliboqs_DIR=/home/aneii11/oqs-provider/liboqs-build-wasm \\
-DOPENSSL_ENABLE_LEGACY=ON \\
-DBUILD_TESTING=OFF
```
4.
```sh
emcmake cmake --install _build \\
  -DOPENSSL_ROOT_DIR=/home/aneii11/oqs-provider/openssl-build-wasm \\
  -DOPENSSL_INCLUDE_DIR=/home/aneii11/oqs-provider/openssl-build-wasm/include \\
  -DOPENSSL_CRYPTO_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libcrypto.a \\
  -DOPENSSL_SSL_LIBRARY=/home/aneii11/oqs-provider/openssl-build-wasm/lib/libssl.a \\
  -DOPENSSL_USE_STATIC_LIBS=TRUE \\
  -Dliboqs_DIR=/home/aneii11/oqs-provider/liboqs-build-wasm \\
-DOPENSSL_ENABLE_LEGACY=ON \\
-DBUILD_TESTING=OFF
```