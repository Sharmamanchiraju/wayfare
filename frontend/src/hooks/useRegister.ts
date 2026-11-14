import { useState } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';

export const useRegister = () => {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerUser = async (username: string, email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.post('/auth/register', { username, email, password });
      await authLogin(email, password);
      return true;
    } catch (err: any) {
      let msg = 'Registration failed';
      if (err.code === 'ERR_NETWORK') {
        msg = 'Connection failed, try again';
      } else if (err.response?.status === 409 || err.response?.status === 400 && String(err.response?.data?.detail).includes("registered")) {
        msg = 'Email already registered';
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Registration failed';
      }
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { registerUser, loading, error };
};
