import React from 'react';
import { Navigate } from 'react-router-dom';
import { isJwtExpired } from '../utils/tokenUtils';
import { useUser } from '@clerk/clerk-react';


const ProtectedRoute = ({ children }) => {
  const {isSignedIn } = useUser();
  const token = localStorage.getItem('accessToken');

  if (isSignedIn && (!token || isJwtExpired(token))) {
    return <Navigate to="/auth-callback" />;
  }

  return children;
};

export default ProtectedRoute;