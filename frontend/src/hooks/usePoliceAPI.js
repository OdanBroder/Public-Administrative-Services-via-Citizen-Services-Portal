import { useState, useEffect } from 'react';
import api from '../lib/api';

export const useUnverifiedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/app/police/unverified-users');
      
      if (response.success) {
        setUsers(response.data || []);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
  };
};

export const useVerifyUser = () => {
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(null);

  const verifyUser = async (userId) => {
    try {
      setVerifying(true);
      setError(null);
      
      const response = await api.post(`/app/police/sign-certificate/${userId}`);
      
      if (response.success) {
        return response;
      } else {
        throw new Error(response.message || 'Failed to verify user');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setVerifying(false);
    }
  };

  return {
    verifyUser,
    verifying,
    error,
  };
};

