import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import "./../../css/DarkModeToggle.css";

const DarkModeToggle = ({ darkMode, setDarkMode }) => {
  const handleToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="dark-mode-toggle">
      <div className="toggle-container">
        <FaMoon className={`toggle-icon moon ${!darkMode ? 'active' : ''}`} />
        
        <button 
          className="toggle-switch"
          onClick={handleToggle}
          aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
        >
          <input
            type="checkbox"
            checked={darkMode}
            onChange={handleToggle}
            className="toggle-input"
          />
          <span className="toggle-slider">
            <span className="toggle-thumb"></span>
          </span>
        </button>
        
        <FaSun className={`toggle-icon sun ${darkMode ? 'active' : ''}`} />
      </div>
      
      <span className="toggle-label">
        {darkMode ? 'Dark Mode' : 'Light Mode'}
      </span>
    </div>
  );
};

export default DarkModeToggle;