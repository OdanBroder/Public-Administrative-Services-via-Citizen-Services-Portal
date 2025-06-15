import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ChevronDown, User } from "lucide-react"; // Import icons

const Navbar = ({ user, role }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  return (
    <nav className="bg-red-400 text-yellow-100 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 text-md">
          {/* Left Side */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="text-2xl font-bold hover:text-theme-red transition-colors"
            >
              <img src="/quoc-huy-60x62.png" alt="Logo" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Center */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && role === "BCA" && (
              <Link
                to="/bca/birth-registrations"
                className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
              >
                Quản lý giấy khai sinh
              </Link>
            )}
            {user && (
              <>
                <Link
                  to="/public-services"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Thủ tục trực tuyến
                </Link>
                <Link
                  to="/medical-coverage"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Bảo hiểm Y tế
                </Link>
                <Link
                  to="/birth-registration"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Tra cứu tình trạng thủ tục giấy khai sinh
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="relative">
            {user ? (
              <>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-md font-medium text-yellow-100 bg-theme-red text-theme-text-nav-hover hover:bg-theme-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-white transition-colors"
                >
                  <User className="w-5 h-5" /> {/* User icon */}
                  <ChevronDown className="w-4 h-4" /> {/* Dropdown arrow */}
                </button>
                {dropdownOpen && (
                  <div
                    className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-10"
                    onMouseLeave={closeDropdown}
                  >
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Hồ sơ
                    </Link>
                    <Link
                      to="/account"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Tài khoản
                    </Link>
                    <Link
                      to="/generate-keys"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Tạo khóa
                    </Link>
                    <Link
                      to="/bca/self-signed-certificate"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Tạo chứng chỉ tự ký
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 bg-theme-red text-theme-text-nav-hover hover:bg-theme-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 border border-theme-red hover:bg-theme-red hover:text-theme-text-nav-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
