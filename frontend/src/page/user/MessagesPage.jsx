import React, { useEffect, useRef, useState } from "react";
import "../../css/MessagesPage.css";
import { IoSend } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import Header from "../../components/Header";
import { FaPhoneAlt } from "react-icons/fa";
import { HiVideoCamera } from "react-icons/hi2";
import { FaInfoCircle } from "react-icons/fa";

const MessagesPage = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [responseType, setResponseType] = useState("Bot");
  const dropdownRef = useRef(null);

  const handleSelect = (type) => {
    setResponseType(type);
    setShowMenu(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="page-container">
      <Header />
      <div className="business-mess-container">
        {/* Sidebar */}
        <div className="business-mess-sidebar">
          <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
          <div className="business-mess-sidebar-subtitle">
            <button className="business-mess-add-btn">
              <FaPlus />
            </button>
          </div>

          {/* Chat list */}
          <div className="business-mess-chat-list">
            {Array(6)
              .fill(0)
              .map((_, index) => (
                <div
                  key={index}
                  className={`business-mess-chat-item ${
                    index === 0 ? "active" : ""
                  }`}
                >
                  <div className="business-mess-avatar-wrapper">
                    <img
                      src="https://scontent.fhan18-1.fna.fbcdn.net/v/t39.30808-6/466854849_1733817834124988_5196228810719253685_n.jpg?_nc_cat=104&ccb=1-7&_nc_sid=6ee11a&_nc_eui2=AeHB6NxJ3V9KXUcKN3Wdm_zac00U3AvFs0VzTRTcC8WzRbXTerX4ZtJoXdMsdU76V90-J11usNiwD9e16zvDUJps&_nc_ohc=BIqcUM9JOOIQ7kNvwFQYzHJ&_nc_oc=AdlEiZecP6a_3T6cokU-VvpfHCYogolOQ5FZ2CKitoSJyMueumUPMrgK4TsSvpr_8xE&_nc_zt=23&_nc_ht=scontent.fhan18-1.fna&_nc_gid=8RKGO-quruyECv-iYutaCQ&oh=00_AfZIYYRcw_h5zNllwjOaKOZBE2C13DXkqAndubMRj5WQrw&oe=68D21539"
                      alt="avatar"
                      className="business-mess-avatar"
                    />
                    <span className="business-mess-status-dot"></span>
                  </div>
                  <div className="business-mess-chat-info">
                    <p className="business-mess-chat-name">Suporte ADMIN</p>
                    <p className="business-mess-chat-status">
                      {index % 2 === 0 ? "Espera" : "Atendimento"}
                    </p>
                  </div>
                  <div className="business-mess-chat-meta">
                    <span>00:31:00</span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Chat window */}
        <div className="business-mess-window">
          <div className="business-mess-header">
            <div className="business-mess-header-left">
              <img
                src="https://via.placeholder.com/40"
                alt="avatar"
                className="business-mess-avatar"
              />
              <div>
                <h4>Suporte ADMIN</h4>
                <span>#CU678SH</span>
              </div>
            </div>
            <div className="business-mess-header-actions">
              <button>
                <FaPhoneAlt color="#283593" />
              </button>
              <button>
                <HiVideoCamera color="#283593" />
              </button>
              <button>
                <FaInfoCircle color="#283593" />
              </button>
            </div>
          </div>

          <div className="business-mess-body">
            <div className="business-mess-row left">
              <div className="business-mess-message">
                Lorem Ipsum has been the industry's standard dummy text ever
                since the 1500s.
              </div>
              <span className="business-mess-time">8:00 PM</span>
            </div>

            <div className="business-mess-row right">
              <div className="business-mess-message">
                Lorem Ipsum has been the industry's standard dummy text ever
                since the 1500s.
              </div>
              <span className="business-mess-time">8:00 PM</span>
            </div>

            <div className="business-mess-row left">
              <div className="business-mess-message">
                Lorem Ipsum has been the industry's standard dummy text ever
                since the 1500s.
              </div>
              <span className="business-mess-time">8:00 PM</span>
            </div>

            <div className="business-mess-row right">
              <div className="business-mess-message">
                Lorem Ipsum has been the industry's standard dummy text ever
                since the 1500s.
              </div>
              <span className="business-mess-time">8:00 PM</span>
            </div>
          </div>

          {/* Input area */}
          <div className="business-mess-input">
            <div className="business-mess-dropdown" ref={dropdownRef}>
              <button
                className="business-mess-more-btn"
                onClick={() => setShowMenu((prev) => !prev)}
              >
                {responseType}
              </button>
              {showMenu && (
                <div className="business-mess-dropdown-menu">
                  <div
                    className={responseType === "Manager" ? "active" : ""}
                    onClick={() => handleSelect("Manager")}
                  >
                    Manager
                  </div>
                  <div
                    className={responseType === "Bot" ? "active" : ""}
                    onClick={() => handleSelect("Bot")}
                  >
                    Bot
                  </div>
                </div>
              )}
            </div>

            <input type="text" placeholder={`Send as ${responseType}...`} />
            <button className="business-mess-send-btn">
              <IoSend />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
