import { useState } from 'react';
import { Key, Download, Shield, Lock, Copy, CheckCircle, FileKey, AlertCircle } from 'lucide-react';
import Mldsa_wrapper from '../utils/crypto/MLDSAWrapper.js';

const formatKeyToPEM = (keyData, keyType) => {
  const base64Key = btoa(String.fromCharCode(...keyData));
  const formattedKey = `-----BEGIN ${keyType}-----\n${base64Key.match(/.{1,64}/g).join('\n')}\n-----END ${keyType}-----`;
  return formattedKey;
};

const KeyGenerator = () => {
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedPrivate, setCopiedPrivate] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  const generateKeys = async () => {
    setError('');
    setIsLoading(true);
    setPrivateKey('');
    setPublicKey('');

    try {
      const { privateKey, publicKey } = await Mldsa_wrapper.generateKeyPair();
      const formattedPrivateKey = formatKeyToPEM(privateKey, 'PRIVATE KEY');
      const formattedPublicKey = formatKeyToPEM(publicKey, 'PUBLIC KEY');

      setPrivateKey(formattedPrivateKey);
      setPublicKey(formattedPublicKey);
    } catch (err) {
      setError('Đã xảy ra lỗi khi tạo khóa. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadKey = (key, filename) => {
    const blob = new Blob([key], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'private') {
        setCopiedPrivate(true);
        setTimeout(() => setCopiedPrivate(false), 2000);
      } else {
        setCopiedPublic(true);
        setTimeout(() => setCopiedPublic(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header matching government portal style */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 text-white py-4 px-6 shadow-lg">
        <div className="max-w-[96rem] mx-auto flex items-center">
          <Shield className="w-8 h-8 mr-3" />
          <div>
            <h1 className="text-2xl font-bold">Hệ thống tạo khóa mã hóa</h1>
            <p className="text-red-100 text-sm">Cổng dịch vụ công trực tuyến</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[90rem] mx-auto p-6">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-600 mb-6">
          <span>Trang chủ</span> / <span>Dịch vụ công</span> / <span className="text-red-600 font-medium">Tạo khóa mã hóa</span>
        </nav>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-full mr-4">
                <FileKey className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Tạo Khóa Mã Hóa</h2>
                <p className="text-blue-100 mt-1">Tạo cặp khóa công khai và riêng tư bảo mật cao</p>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div className="text-blue-800 text-sm">
                  <p className="font-medium mb-1">Thông tin quan trọng:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Private Key (khóa riêng): Dùng để giải mã và ký số, cần được bảo mật tuyệt đối</li>
                    <li>Public Key (khóa công khai): Dùng để mã hóa và xác thực chữ ký, có thể chia sẻ công khai</li>
                    <li>Lưu trữ Private Key ở nơi an toàn và không chia sẻ với bất kỳ ai</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center mb-8">
              <button
                onClick={generateKeys}
                disabled={isLoading}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg hover:shadow-xl"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Đang tạo khóa...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Key className="w-5 h-5 mr-2" />
                    Tạo Cặp Khóa Mới
                  </div>
                )}
              </button>
            </div>

            {/* Keys Display */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Private Key */}
              {privateKey && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 transition-all duration-500 ease-out">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Lock className="w-5 h-5 text-red-600 mr-2" />
                      <h3 className="text-lg font-semibold text-red-800">Private Key</h3>
                    </div>
                    <span className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      BÍ MẬT
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={privateKey}
                    className="w-full bg-white border border-red-300 rounded-md p-3 text-gray-800 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={8}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => copyToClipboard(privateKey, 'private')}
                      className="flex-1 bg-white border border-red-300 hover:bg-red-50 text-red-700 py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                    >
                      {copiedPrivate ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Sao chép
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => downloadKey(privateKey, 'private.key')}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Tải xuống
                    </button>
                  </div>
                </div>
              )}

              {/* Public Key */}
              {publicKey && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-500 ease-out">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Key className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="text-lg font-semibold text-green-800">Public Key</h3>
                    </div>
                    <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      CÔNG KHAI
                    </span>
                  </div>
                  <textarea
                    readOnly
                    value={publicKey}
                    className="w-full bg-white border border-green-300 rounded-md p-3 text-gray-800 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={8}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => copyToClipboard(publicKey, 'public')}
                      className="flex-1 bg-white border border-green-300 hover:bg-green-50 text-green-700 py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                    >
                      {copiedPublic ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                          Đã sao chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Sao chép
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => downloadKey(publicKey, 'public.key')}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Tải xuống
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Security Warning */}
            {(privateKey || publicKey) && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-yellow-800">
                    <p className="font-medium mb-1">Lưu ý bảo mật:</p>
                    <ul className="text-sm list-disc list-inside space-y-1">
                      <li>Private Key phải được lưu trữ ở nơi an toàn và không được chia sẻ</li>
                      <li>Sao lưu Private Key ở nhiều nơi khác nhau để tránh mất mát</li>
                      <li>Public Key có thể chia sẻ công khai để người khác mã hóa dữ liệu gửi cho bạn</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-gray-600 text-sm">
          <p>© 2024 Cổng dịch vụ công trực tuyến | Hệ thống tạo khóa mã hóa bảo mật</p>
        </div>
      </div>
    </div>
  );
};

export default KeyGenerator;