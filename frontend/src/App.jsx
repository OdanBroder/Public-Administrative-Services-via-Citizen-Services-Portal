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

import AdminConsole from './components/UserManagement';
import { Unauthorized } from './components/UnauthorizedPage';

// 4 Defined roles: Admin, Citizen, Staff, Head
const AuthorizedRoute = ({ children, required_role }) => {
  const { user, loading, role } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

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
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Banner />
      <Navbar user={user} />
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
