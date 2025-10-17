import { useEffect } from 'react';

const AuthTokenReset = () => {
  useEffect(() => {
    localStorage.removeItem('accessToken'); 
  }, []);

  return null;
};

export default AuthTokenReset;