import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaCog,
  FaRegComments,
  FaRobot,
  FaBars,
  FaTimes,
  FaArrowLeft,
  FaWarehouse,
} from 'react-icons/fa';
import { NavLink, useNavigate } from 'react-router-dom';
import './../../css/Sidebar.css';

const Sidebar = ({ darkMode, setDarkMode, open, setOpen }) => {
  // const [open, setOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  // Responsive
  useEffect(() => {
    const handleResize = () => {
      const mobileCheck = window.innerWidth <= 768;
      setIsMobile(mobileCheck);

      if (mobileCheck) {
        setOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setOpen]);

  const menus = [
    { icon: <FaHome />, label: 'Thống kê', path: '/business-dashboard' },
    {
      icon: <FaRegComments />,
      label: 'Tin nhắn',
      path: '/business-dashboard/messages',
    },
    {
      icon: <FaWarehouse />,
      label: 'Tồn kho',
      path: '/business-dashboard/stock',
    },
    {
      icon: <FaRobot />,
      label: 'AI',
      path: '/business-dashboard/my-ai',
    },
  ];

  const handleToggle = () => {
    const newState = !open;
    setOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  };

  return (
    <>
      {isMobile && open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)} />
      )}

      <aside
        className={`sidebar ${open ? 'open' : 'collapsed'} ${
          isMobile ? 'mobile' : ''
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
          <button className="menu-toggle" onClick={handleToggle}>
            <span className="toggle-icon">{open ? '«' : '»'}</span>
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
                    `menu-link ${isActive ? 'active' : ''}`
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
            onClick={() => navigate('/')}
            title="Quay về trang chính"
          >
            <FaArrowLeft className="back-icon" />
            {open && <span className="back-label">Quay lại</span>}
          </button>

          {/* Dark Mode toggle */}
          {/* <div className="dark-toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span className="slider round"></span>
            </label>
            {open && <span>{darkMode ? 'Dark Mode' : 'Light Mode'}</span>}
          </div> */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
