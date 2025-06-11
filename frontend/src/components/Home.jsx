import { Building2, Shield, FileText, User, Phone, Mail, MapPin } from 'lucide-react';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M30 30c0-11.046-8.954-20-20-20s-20 8.954-20 20 8.954 20 20 20 20-8.954 20-20zm0 0c0 11.046 8.954 20 20 20s20-8.954 20-20-8.954-20-20-20-20 8.954-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        <div className="relative container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            Cổng Dịch vụ công Quốc gia
          </h1>
          <div className="max-w-2xl mx-auto">
            <h2 className="text-xl md:text-2xl font-light mb-4 text-blue-100">
              Chào mừng bạn đến với Cổng Dịch vụ công Quốc gia
            </h2>
            <p className="text-lg text-blue-100 leading-relaxed">
              Nơi cung cấp các dịch vụ công trực tuyến, giúp bạn thực hiện các thủ tục hành chính một cách nhanh chóng và tiện lợi.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Public Services Card */}
          <a
            href="/public-services"
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 overflow-hidden cursor-pointer"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-blue-600 transition-colors">
                Dịch vụ công
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Truy cập các dịch vụ công trực tuyến một cách dễ dàng và nhanh chóng.
              </p>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-blue-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </a>

          {/* Health Insurance Card */}
          <a
            href="/medical-coverage"
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 overflow-hidden cursor-pointer"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-green-600 transition-colors">
                Bảo hiểm y tế
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Quản lý và tra cứu thông tin bảo hiểm y tế của bạn một cách tiện lợi.
              </p>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500 to-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </a>

          {/* Birth Registration Card */}
          <a
            href="/ubnd/dang-ky-khai-sinh"
            className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-200 overflow-hidden cursor-pointer"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3 group-hover:text-purple-600 transition-colors">
                Đăng ký khai sinh
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Thực hiện thủ tục đăng ký khai sinh trực tuyến một cách nhanh chóng.
              </p>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-purple-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
          </a>
        </div>

        {/* Additional Services Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">Dịch vụ nổi bật khác</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <User className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Thông tin cá nhân</h4>
              <p className="text-sm text-gray-600">Quản lý hồ sơ cá nhân</p>
            </div>
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <FileText className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Giấy tờ</h4>
              <p className="text-sm text-gray-600">Tra cứu giấy tờ</p>
            </div>
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Phone className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Hỗ trợ</h4>
              <p className="text-sm text-gray-600">Liên hệ hỗ trợ</p>
            </div>
            <div className="text-center p-4 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <MapPin className="w-8 h-8 text-red-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-800 mb-2">Địa điểm</h4>
              <p className="text-sm text-gray-600">Tìm cơ quan</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">1,000+</div>
            <div className="text-blue-100">Dịch vụ trực tuyến</div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">500,000+</div>
            <div className="text-green-100">Người dùng đã đăng ký</div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl text-center">
            <div className="text-3xl font-bold mb-2">24/7</div>
            <div className="text-purple-100">Hỗ trợ trực tuyến</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Hotline: 1900 1234</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email: support@dichvucong.gov.vn</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Hà Nội, Việt Nam</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Dịch vụ</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/services" className="hover:text-white transition-colors cursor-pointer">Dịch vụ công</a></li>
                <li><a href="/medical" className="hover:text-white transition-colors cursor-pointer">Bảo hiểm y tế</a></li>
                <li><a href="/registration" className="hover:text-white transition-colors cursor-pointer">Đăng ký khai sinh</a></li>
                <li><a href="/documents" className="hover:text-white transition-colors cursor-pointer">Giấy tờ tùy thân</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Thông tin</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="/about" className="hover:text-white transition-colors cursor-pointer">Giới thiệu</a></li>
                <li><a href="/guide" className="hover:text-white transition-colors cursor-pointer">Hướng dẫn sử dụng</a></li>
                <li><a href="/faq" className="hover:text-white transition-colors cursor-pointer">Câu hỏi thường gặp</a></li>
                <li><a href="/privacy" className="hover:text-white transition-colors cursor-pointer">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>© 2025 Cổng Dịch vụ công Quốc gia. Mọi quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;