import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaCog,
  FaRegComments,
  FaRobot,
  FaBars,
  FaTimes,
  FaArrowLeft,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./../../css/Sidebar.css";

const Sidebar = ({ darkMode, setDarkMode }) => {
  const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) setOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const menus = [
    { icon: <FaHome />, label: "Dashboard", path: "/business-dashboard" },
    { icon: <FaCog />, label: "Quản lý", path: "/business-dashboard/manage" },
    {
      icon: <FaRegComments />,
      label: "Messages",
      path: "/business-dashboard/messages",
    },
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
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/logo-home.png" alt="Logo" className="logo-img" />
            {open && <span className="logo-text">FPT EDUCATION</span>}
          </div>
         <button className="menu-toggle" onClick={() => setOpen(!open)}>
  {open ? <FaTimes /> : <FaBars />}
</button>

        </div>

        {/* Menu */}
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
                {!open && !isMobile && (
                  <div className="tooltip">{item.label}</div>
                )}
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {/* Back button */}
          <button
            className="sidebar-back-btn"
            onClick={() => navigate("/")}
            title="Quay về trang chính"
          >
            <FaArrowLeft className="back-icon" />
            {open && <span className="back-label">Quay lại</span>}
          </button>

          {/* Dark Mode toggle */}
          <div className="dark-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span className="slider round"></span>
            </label>
            {open && <span>{darkMode ? "Dark Mode" : "Light Mode"}</span>}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
