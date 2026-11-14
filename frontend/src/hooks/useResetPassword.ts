import { useState } from 'react';

export const useResetPassword = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetPassword = async (token: string, password: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    if (token === 'expired') {
      setError('Link expired or invalid');
      setLoading(false);
      return false;
    }

    setSuccess(true);
    setLoading(false);
    return true;
  };

  return { resetPassword, loading, error, success };
};
