import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLocation } from 'react-router-dom';

// For context
import Navbar from './components/NavBar';
import Banner from './components/Banner';
import Home from './components/Home';

// For components
// For auth
import Login from './components/Login';
import Register from './components/Register';
// For personal information
import Account from './components/Account';
import Profile from './components/Profile';
import MyRegistration from './components/BirthRegistrationProf';
import BirthRegistrationDetail from './components/BirthRegistrationDetail';
// For services
import MedicalCoverage from './components/MedicalCoverage';
import BirthRegistrationForm from './components/BirthRegistrationForm';
import ServiceList from './components/ServiceList';

// For verification
import VerifyQr from './components/VerifyQr'; // Uncomment if you need this component
import KeyGenerator from './components/KeyGenerator';
import VerifySubmitterResult from './components/VerifySubmitterResult';
import VerifyIssuerResult from './components/VerifyIssuerResult';
// For not found and unauthorized pages
import NotFound from './components/NotFound';
import { Unauthorized } from './components/UnauthorizedPage';

// 4 Defined roles: Admin, Citizen, Staff, Head, Police, BCA, SYT
const AuthorizedRoute = ({ children, required_role }) => {
  const { user, loading, role } = useAuth();
  console.log("AuthorizedRoute", required_role, role);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (Array.isArray(required_role)) {
    const hasPermission = required_role.some((r) => role === r)
    if (!hasPermission) {
      return <Navigate to="/unauthorized" />; // or any fallback
    }
    return children;
  }
  console.log("AuthorizedRoute", required_role, role);
  // Check if required_role matches user's role
  if (required_role && role !== required_role) {
    return <Navigate to="/unauthorized" />; // or any fallback
  }

  return children;
};


const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

const AppContent = () => {
  const { user, role } = useAuth();
  // const excludedRoutes = ['/verify-qr', '/generate-keys'];
  const excludedRoutes = [];
  const isExcludedRoute = excludedRoutes.includes(location.pathname);
  console.log(location);

  return (
    <div className="min-h-screen bg-gray-50">
      {!isExcludedRoute && (
        <>
          <Banner />
          <Navbar user={user} role={role} />
        </>
      )}
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Personale Information */}
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/birth-registration" element={
            <ProtectedRoute>
              <MyRegistration></MyRegistration>
            </ProtectedRoute>
          } />

          {/* For services */}
          <Route path="/public-services" element={
            <ProtectedRoute>
              <ServiceList />
            </ProtectedRoute>

          } />
          <Route
            path="/medical-coverage"
            element={
              <ProtectedRoute>
                <MedicalCoverage />
              </ProtectedRoute>
            }
          />
          <Route path="/ubnd/dang-ky-khai-sinh" element={
            <ProtectedRoute>
              <BirthRegistrationForm />
            </ProtectedRoute>
          }></Route>


          {/* For verify */}
          <Route path="/verify-qr" element={
            // Public route, no auth required
            <VerifyQr />
          } />
          <Route path="/generate-keys" element={
            <KeyGenerator />
          } />
          <Route path="/birth-registration/:id" element={
            <ProtectedRoute>
              <BirthRegistrationDetail/>
            </ProtectedRoute>
          }></Route>
          <Route path="/signature/requester/:uuid" element={
            <VerifySubmitterResult/>
          }></Route>
          <Route path="/signature/issuer/:uuid" element={
            <VerifyIssuerResult/>
          }></Route>


          {/* For warning Page */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="/not-found" element={<NotFound />} />

          {/* Catch-all route */}
          <Route path="*" element={<NotFound/>} />
        </Routes>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
