import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaCog,
  FaRegComments,
  FaRobot,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { NavLink } from "react-router-dom";
import DarkModeToggle from "./DarkModeToggle";
import "./../../css/Sidebar.css";

const Sidebar = ({ darkMode, setDarkMode }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Menu items (tất cả đều là NavLink riêng biệt)
  const menus = [
    { icon: <FaHome />, label: "Dashboard", path: "/" },
    { icon: <FaCog />, label: "Quản lý", path: "/quan-ly" },
    { icon: <FaRegComments />, label: "Messages", path: "/business-dashboard/message" },
    { icon: <FaRobot />, label: "AI", path: "/business-dashboard/ai" },
  ];

  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`sidebar ${open ? "open" : "collapsed"} ${
          isMobile ? "mobile" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo vertical">
            <img src="/logo-home.png" className="logo-img" alt="Logo" />
            {open && <div className="logo-text">FPT EDUCATION</div>}
          </div>
          {isMobile && (
            <button className="menu-toggle" onClick={() => setOpen(!open)}>
              {open ? <FaTimes /> : <FaBars />}
            </button>
          )}
        </div>

        <nav className="sidebar-nav">
          <ul className="menu-list">
            {menus.map((item, i) => (
              <li key={i} className="menu-item">
                <NavLink
                  to={item.path}
                  end
                  className={({ isActive }) =>
                    `menu-link ${isActive ? "active" : ""}`
                  }
                >
                  <span className="menu-icon">{item.icon}</span>
                  {open && <span className="menu-label">{item.label}</span>}
                </NavLink>

                {/* Tooltip khi collapsed */}
                {!open && !isMobile && (
                  <div className="tooltip">{item.label}</div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          {open ? (
            <DarkModeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          ) : (
            <div className="dark-mode-compact">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="dark-mode-btn"
                title={
                  darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"
                }
              >
                {darkMode ? "🌞" : "🌙"}
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
