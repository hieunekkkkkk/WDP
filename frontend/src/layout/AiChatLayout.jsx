import React, { useState, useEffect } from "react";
import HeaderAi from "../components/ai-assistant/HeaderAi";
import Sidebar from "../components/ai-assistant/Sidebar";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import "../css/AiChatLayout.css";

const AiChatLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle dark mode persistence
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkMode");
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className={`layout ${darkMode ? "dark" : ""}`}>
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
      <Footer />
    </div>
  );
};

export default AiChatLayout;
