import React from 'react';
import { Home, Search, FileText, ArrowLeft, AlertCircle } from 'lucide-react';

const NotFound = () => {
  const handleGoBack = () => {
    window.history.back();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const query = encodeURIComponent(e.target.value.trim());
      window.location.href = `/search?q=${query}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main 404 Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-4">
        <div className="text-center max-w-2xl mx-auto">
          {/* Animated 404 */}
          <div className="relative mb-8">
            <div className="text-8xl md:text-9xl font-bold text-gray-200 select-none">
              404
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-red-500 animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Trang không tìm thấy
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Trang bạn tìm kiếm không tồn tại hoặc đã được di chuyển.
            </p>
            <p className="text-gray-500">
              Vui lòng kiểm tra lại đường dẫn hoặc quay về trang chủ.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={handleGoHome}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Home className="w-5 h-5" />
              <span className="font-semibold">Về Trang Chủ</span>
            </button>
            <button
              onClick={handleGoBack}
              className="flex items-center justify-center space-x-2 px-8 py-4 bg-white text-gray-700 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-4 focus:ring-gray-200 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Quay Lại</span>
            </button>
          </div>

          {/* Helpful Links */}
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Dịch vụ phổ biến
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <a
                href="/public-services"
                className="flex items-center space-x-3 p-4 rounded-lg hover:bg-blue-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Dịch vụ công</div>
                  <div className="text-sm text-gray-500">Truy cập các dịch vụ trực tuyến</div>
                </div>
              </a>
              <a
                href="/medical-coverage"
                className="flex items-center space-x-3 p-4 rounded-lg hover:bg-green-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <div className="w-5 h-5 bg-green-600 rounded"></div>
                </div>
                <div>
                  <div className="font-medium text-gray-800">Bảo hiểm y tế</div>
                  <div className="text-sm text-gray-500">Quản lý thông tin bảo hiểm</div>
                </div>
              </a>
              <a
                href="/ubnd/dang-ky-khai-sinh"
                className="flex items-center space-x-3 p-4 rounded-lg hover:bg-purple-50 transition-colors group cursor-pointer"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-800">Đăng ký khai sinh</div>
                  <div className="text-sm text-gray-500">Thủ tục khai sinh trực tuyến</div>
                </div>
              </a>
            </div>
          </div>

          {/* Search Section */}
          <div className="mt-8">
            <div className="max-w-md mx-auto">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoặc tìm kiếm dịch vụ bạn cần:
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Nhập từ khóa tìm kiếm..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  onKeyDown={handleSearch} // Updated event handler
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Cổng Dịch vụ công Quốc gia. Mọi quyền được bảo lưu.
            </p>
            <div className="mt-2 space-x-4 text-sm">
              <a href="/contact" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Liên hệ hỗ trợ</a>
              <span className="text-gray-500">•</span>
              <a href="/sitemap" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Sơ đồ trang</a>
              <span className="text-gray-500">•</span>
              <a href="/help" className="text-gray-300 hover:text-white transition-colors cursor-pointer">Trợ giúp</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NotFound;