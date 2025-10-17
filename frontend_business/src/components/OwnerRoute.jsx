import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import LoadingScreen from "./LoadingScreen";
import { getCurrentUserId } from "../utils/useCurrentUserId";

const OwnerRoute = ({ children }) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyBusiness = async () => {
      try {
        const ownerId = await getCurrentUserId();
        if (!ownerId) {
          navigate("/login");
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business/owner/${ownerId}`
        );

        const hasBusiness = response.data && response.data.length > 0;
        if (!hasBusiness) {
          navigate("/business-registration");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error("Error verifying business existence:", error);
        navigate("/business-registration");
      }
    };

    verifyBusiness();
  }, [navigate]);

  if (checking) {
    return <LoadingScreen />;
  }

  return children;
};

export default OwnerRoute;
