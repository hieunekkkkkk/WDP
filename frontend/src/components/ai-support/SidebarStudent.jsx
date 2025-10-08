import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaBook,
  FaHandsHelping,
  FaUserFriends,
  FaBars,
  FaArrowLeft,
  FaRobot,
  FaCommentAlt,
  FaCalendarAlt,
  FaCog,
  FaEnvelope,
  FaMagic,
} from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./../../css/Sidebar.css";

const SidebarStudent = ({ darkMode, setDarkMode }) => {
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

  // Menu student
  const menus = [
    {
      icon: <FaEnvelope />,
      label: "Messages",
      path: "/dashboard/messages",
    },
    {
      icon: <FaRobot />,
      label: "My AI",
      path: "/dashboard/my-ai",
    },
    {
      icon: <FaCog />,
      label: "AI Module",
      path: "/dashboard/ai-module",
    },
    {
      icon: (
        <span
          style={{
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            width: "18px",
            height: "22px",
            backgroundColor: "#1c090cbe", // Màu nền tối giống icon khác
            borderRadius: "4px", // Góc bo nhẹ để giống hình
            color: "white", // Chữ màu trắng
            fontSize: "0.9em",
            fontWeight: "bold",
            fontFamily: "Arial, sans-serif",
          }}
        >
          AI
        </span>
      ),
      label: "AI có sẵn",
      path: "/dashboard/ai-available",
    },
    {
      icon: <FaCalendarAlt />,
      label: "Calendar",
      path: "/dashboard/calendar",
    },
  ];

  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`sidebar ${open ? "open" : "collapsed"} ${isMobile ? "mobile" : ""
          }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img
              src="/localLink.png"
              alt="Local Link Assistant"
              className="logo-img"
            />
          </div>

          {/* Toggle đóng/mở kiểu ChatGPT */}
          <button className="menu-toggle" onClick={() => setOpen(!open)}>
            <span className="toggle-icon">{open ? "«" : "»"}</span>
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

          {/* Dark Mode */}
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

export default SidebarStudent;
