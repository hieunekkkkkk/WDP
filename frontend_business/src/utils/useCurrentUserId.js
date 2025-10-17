import { jwtDecode } from 'jwt-decode';

export const getCurrentUserId = () => {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded.sub || decoded.id;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
};
