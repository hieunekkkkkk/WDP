import React, { useState, useEffect } from 'react';
import HeaderAi from '../components/ai-assistant/HeaderAi';
import Sidebar from '../components/ai-assistant/Sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import '../css/AiChatLayout.css';
import { useUser } from '@clerk/clerk-react';
import axios from "axios";

const AiChatLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const savedState = localStorage.getItem('sidebarOpen');

    return savedState !== null ? JSON.parse(savedState) : true;
  });

  const { user, isLoaded } = useUser();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (user) {
      const checkBusinessStatus = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/business/owner/${user.id}`);

          const businessData = response.data?.[0];

          if (businessData && businessData.business_active !== "active") {
            navigate("/my-business");
          }
        } catch (error) {
          console.error("Error checking business status:", error);
        }
      };

      checkBusinessStatus();
    }
  }, [user, isLoaded, navigate]);

  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  return (
    <div className={`layout ${darkMode ? 'dark' : ''}`}>
      <div className="layout-container">
        {/* Sidebar bên trái */}
        <Sidebar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Main bên phải */}
        <div className="layout-main">
          <HeaderAi
            onToggleSidebar={handleToggleSidebar}
            sidebarOpen={sidebarOpen}
            darkMode={darkMode}
            setDarkMode={setDarkMode}
          />

          <main className="main-content">
            <div className="content-wrapper">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      {/* <Footer /> */}
    </div>
  );
};

export default AiChatLayout;
