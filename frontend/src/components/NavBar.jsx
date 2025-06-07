import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

 
// Replace with your actual user state and auth logic
// For demo: const { user, login, logout } = useAuth();
const Navbar = ({ user }) => { // Pass user and handlers as props
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  }

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
              OurSite {/* Or an <img src="/logo.svg" alt="Logo" className="h-8 w-auto" /> */}
            </Link>
          </div>

          {/* Center */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user && (
              <>
              <Link to="/public-services"
              className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors">
              Thủ tục trực tuyến 
              </Link>
              <Link
                to="/medical-coverage"
                className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
              >
                Medical Coverage  
              </Link>
              <Link to="/application-query"
                className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
              >
                Tra cứu tình trạng thủ tục 
              </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            {!user ? (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 bg-theme-red text-theme-text-nav-hover hover:bg-theme-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-white transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 border border-theme-red hover:bg-theme-red hover:text-theme-text-nav-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <Link
                  to="/profile"
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 hover:bg-theme-red hover:text-theme-text-nav-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-theme-red-dark transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 rounded-md text-md font-medium text-yellow-100 bg-theme-red text-theme-text-nav-hover hover:bg-theme-red-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-yellow focus:ring-white transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button (Optional - for small screens) */}
          <div className="md:hidden flex items-center">
            <button
              // onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-yellow-100 hover:text-theme-red hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-theme-red"
              aria-controls="mobile-menu"
              aria-expanded="false" /* Dynamically set this with state */
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed. Heroicon name: menu */}
              <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
              {/* Icon when menu is open. Heroicon name: x */}
              <svg className="hidden h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state (Optional) */}
      {/* <div className="md:hidden" id="mobile-menu"> ... mobile links here ... </div> */}
    </nav>
  );
};

export default Navbar;