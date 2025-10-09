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

          const response = await fetch(`${import.meta.env.VITE_BE_URL}/api/auth`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${clerkToken}`,
            },
          });

          const data = await response.json();

          if (!response.ok) throw new Error(data.message || 'Lỗi xác thực từ server');

          localStorage.setItem('accessToken', data.accessToken);
          
          const role = data.claims?.role || user.publicMetadata?.role;
          setRole(role);

          switch (role) {
            case 'admin': navigate('/admin/users'); break;
            case 'owner': navigate('/my-business'); break;
            case 'client': navigate('/'); break;
            default: navigate('/');
          }

        } catch (err) {
          console.error('Lỗi xác thực, start backend :', err);
          // await signOut(); //auto logout nếu không start be hoặc k thể gọi tới /auth
        }
      }
    };

    handleAuth();
  }, [isSignedIn, user, getToken, navigate, setRole, signOut]);

  return <LoadingScreen />;
};

export default AuthCallback;
