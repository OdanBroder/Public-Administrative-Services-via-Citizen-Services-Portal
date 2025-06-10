import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Profile from './components/Profile';
import CitizenForm from './components/BasicInfo';
import MedicalCoverage from './components/MedicalCoverage';
import Navbar from './components/NavBar';
import Banner from './components/Banner';
import BirthRegistrationForm from './components/BirthRegistrationForm';
import ServiceList from './components/ServiceList';
import AdminConsole from './components/UserManagement';
import { Unauthorized } from './components/UnauthorizedPage';
import BirthRegistrationDetail from './components/BCABirthRegistrationDetail';
import BirthRegistrationList from './components/BirthRegistrationList';
import MyRegistration from './components/BirthRegistrationProf';
import BCAPendingApplications from './components/BCABirthRegistrations';
import UnverifiedUsersTable from './components/UnverifiedUsersTable';
// 4 Defined roles: Admin, Citizen, Staff, Head
const AuthorizedRoute = ({ children, required_role }) => {
  const { user, loading, role } = useAuth();
  console.log("AuthorizedRoute", required_role, role);
  debugger;
  if (loading) {
    return <div>Loading...</div>;
  }
  console.log("FDSFDSFDSFDFDSFDSF");
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Banner />
      <Navbar user={user} role={role} />
      <div className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/basicinfo"
            element={
              <ProtectedRoute>
                <CitizenForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/medical-coverage"
            element={
              <ProtectedRoute>
                <MedicalCoverage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/profile" />} />
          <Route path="/admin/console" element={
            <AuthorizedRoute required_role="Admin">
              <AdminConsole />
            </AuthorizedRoute>
          }></Route>
          <Route path="/ubnd/dang-ky-khai-sinh" element={
            <ProtectedRoute>
              <BirthRegistrationForm />
            </ProtectedRoute>
          }></Route>
          <Route path="/public-services" element={
            <ProtectedRoute>
              <ServiceList />
            </ProtectedRoute>

          } />
          <Route path="/view-applications" element={
            <AuthorizedRoute required_role={["Head", "Staff", "BCA"]}>
              <BirthRegistrationList></BirthRegistrationList>
            </AuthorizedRoute>
          } ></Route>
          <Route path="/bca/birth-registrations" element={
            <AuthorizedRoute required_role="BCA">
              <BCAPendingApplications />
            </AuthorizedRoute>
          } />
          <Route path="/bca/birth-registration/:id" element={
            <ProtectedRoute>
              <BirthRegistrationDetail />
            </ProtectedRoute>
          } />
          <Route path="/my-application" element={
            <ProtectedRoute>
              <MyRegistration></MyRegistration>
            </ProtectedRoute>
          } />
          <Route path="/police/unverifyUsers" element={
            <AuthorizedRoute required_role="Police">
              <UnverifiedUsersTable />
            </AuthorizedRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />
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
