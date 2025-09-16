import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserRole } from '../contexts/UserRoleContext';
import LoadingScreen from './LoadingScreen';

const OwnerRoute = ({ children }) => {
    const navigate = useNavigate();
    const { role } = useUserRole();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (role === null) {
            navigate('/');
            return;
        }

        if (role !== 'owner') {
            navigate('/');
        } else {
            setChecking(false);
        }
    }, [role, navigate]);

    if (checking) {
        return <LoadingScreen />;
    }

    return children;
};

export default OwnerRoute;
