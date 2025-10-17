import React, { useState, useEffect } from "react";
import HeaderAi from "../components/ai-assistant/HeaderAi";
import SidebarStudent from "../components/ai-support/SidebarStudent";
import { Outlet } from "react-router-dom";
import "../css/AiChatLayout.css";

const AiChatStudentLayout = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Xử lý responsive
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dark mode persistence (riêng student)
  useEffect(() => {
    const savedDarkMode = localStorage.getItem("darkModeStudent");
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("darkModeStudent", JSON.stringify(darkMode));
  }, [darkMode]);

  const handleToggleSidebar = () => setSidebarOpen(!sidebarOpen);

  return (
    <div className={`layout student ${darkMode ? "dark" : ""}`}>
      <div className="layout-container">
        {/* Sidebar student */}
        <SidebarStudent
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          open={sidebarOpen}
          setOpen={setSidebarOpen}
        />

        {/* Main content */}
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
    </div>
  );
};

export default AiChatStudentLayout;
