import { useState } from 'react';

export const useForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const sendResetLink = async (email: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    if (email === 'fail@example.com') {
      setError('Connection failed, try again');
      setLoading(false);
      return false;
    }
    
    setSuccess(true);
    setLoading(false);
    return true;
  };

  return { sendResetLink, loading, error, success };
};
