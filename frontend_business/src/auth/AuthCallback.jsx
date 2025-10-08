import React, { useEffect } from 'react';
import { useUser, useAuth, useClerk } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '../components/LoadingScreen';
import { useUserRole } from '../contexts/UserRoleContext';
import { toast } from 'react-toastify';

const AuthCallback = () => {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const { setRole } = useUserRole();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      if (isSignedIn && user) {
        try {
          const clerkToken = await getToken({ template: 'node-backend' });
          if (!clerkToken) throw new Error("Không lấy được token từ Clerk");

          const requestOptions = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${clerkToken}`,
              'Content-Type': 'application/json',
            },
          };

          const hasRoleField = Object.prototype.hasOwnProperty.call(user.publicMetadata, 'role');
          console.log(hasRoleField);
          
          if (!hasRoleField) {
            requestOptions.body = JSON.stringify({ role: 'owner' });
          }

          console.log(requestOptions);

          const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/auth`, requestOptions);

          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Lỗi xác thực từ server');

          const role = data.claims?.role || user.publicMetadata?.role;
          setRole(role);

          if (role !== 'owner') {
            toast.error('Chỉ doanh nghiệp mới được phép đăng nhập.');
            await signOut();
            navigate('/');
            return;
          }

          localStorage.setItem('accessToken', data.accessToken);
          navigate('/my-business');

        } catch (err) {
          console.error('Lỗi xác thực:', err);
          toast.error('Không thể xác thực. Vui lòng thử lại sau.');
          await signOut();
          navigate('/');
        }
      }
    };

    handleAuth();
  }, [isSignedIn, user, getToken, navigate, setRole, signOut]);

  return <LoadingScreen />;
};

export default AuthCallback;
