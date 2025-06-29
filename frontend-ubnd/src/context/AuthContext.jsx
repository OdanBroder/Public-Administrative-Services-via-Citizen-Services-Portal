import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// const API_URL = import.meta.env.VITE_API_URL || 'https://localhost/api';
const API_URL = "/api";
// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUserProfile(token);
      fetchRole(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Optionally handle token expiration or invalidation
    } finally {
      setLoading(false);
    }
  };

  const fetchRole = async (token) => {
    try {
      const response = await api.get('/auth/role', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const { role } = response.data;
      console.log('Fetched role:', role);
      setRole(role);
    } catch (error) {
      console.error('Failed to fetch role:', error);
    }
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      const { accessToken, refreshToken, user } = response?.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      setUser(user);

      // Fetch role immediately after login
      const roleResponse = await api.get('/auth/role', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const { role } = roleResponse.data;
      setRole(role);
      
      // debugger;
      console.log(JSON.stringify(user));
      if (user.completedProfile === false) {
        return { success: true, finish_info: false };
      }
      return { success: true, finish_info: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { accessToken, refreshToken, user } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        // Call API to blacklist the token
        await api.post('/auth/logout', {
          token: token
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Remove tokens from localStorage and reset user state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      setRole(null);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await api.patch('/auth/profile', updates);
      setUser(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Update failed'
      };
    }
  };



  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        login,
        register,
        logout,
        updateProfile,
        api
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 