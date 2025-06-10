import { useState, useEffect } from 'react';
import {useAuth} from '../context/AuthContext';
export const useUnverifiedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { api } = useAuth();
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/police/unverified-users');
      setUsers(response.data.data || []);

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
  // console.log(error)
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
  const { api } = useAuth();

  const verifyUser = async (userId) => {
    try {
      setVerifying(true);
      setError(null);
      
      const response = await api.post(`/police/sign-certificate/${userId}`);
      return response.data;


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

