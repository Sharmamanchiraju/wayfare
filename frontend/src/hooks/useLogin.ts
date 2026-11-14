import { useState } from 'react';
import { useAuth } from './useAuth';
import api from '../utils/api';

export const useLogin = () => {
  const { login: authLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await authLogin(email, password);
      return true;
    } catch (err: any) {
      let msg = 'Invalid credentials';
      if (err.code === 'ERR_NETWORK') {
        msg = 'Connection failed, try again';
      } else if (err.response?.status === 429) {
        msg = 'Too many attempts, try again in a few seconds';
      } else if (err.response?.data?.detail) {
        msg = typeof err.response.data.detail === 'string' ? err.response.data.detail : 'Invalid credentials';
      }
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { loginUser, loading, error };
};
