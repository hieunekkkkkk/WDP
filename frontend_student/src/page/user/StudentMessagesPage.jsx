import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaPhoneAlt, FaInfoCircle } from "react-icons/fa";
import { HiVideoCamera } from "react-icons/hi";
import { IoSend } from "react-icons/io5";
import "../../css/MessagesPage.css";

const StudentMessagesPage = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [responseType, setResponseType] = useState("Bot");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "received",
      content:
        "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
      time: "8:00 PM",
    },
    {
      id: 2,
      type: "sent",
      content:
        "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.",
      time: "8:05 PM",
    },
  ]);

  const dropdownRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleSelect = (type) => {
    setResponseType(type);
    setShowMenu(false);
  };

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        type: "sent",
        content: message,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, newMessage]);
      setMessage("");

      if (responseType === "Bot") {
        setTimeout(() => {
          const botResponse = {
            id: messages.length + 2,
            type: "received",
            content:
              "Cảm ơn bạn đã gửi tin nhắn! Tôi đã nhận được và sẽ phản hồi sớm nhất có thể.",
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
          setMessages((prev) => [...prev, botResponse]);
        }, 1000);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="business-card business-mess-container">
      {/* Sidebar */}
      <div className="business-mess-sidebar">
        <h2 className="business-mess-sidebar-title">Tin nhắn</h2>
        <div className="business-mess-sidebar-subtitle">
          <button className="business-mess-add-btn">
            <FaPlus />
          </button>
        </div>

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
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSclv9wC3RpMsd1MEU3pSgPky1Ns0YpuS1mEA&s"
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                  <span className="business-mess-status-dot"></span>
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">Suporte ADMIN</p>
                  <p className="business-mess-chat-status">
                    {index % 2 === 0 ? "Đang chờ" : "Đang chat"}
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
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRM-7hjMfAnA9oW2MSTts0_DeYxMlWS1Uv5ZA&s"
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
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`business-mess-row ${
                msg.type === "sent" ? "right" : "left"
              }`}
            >
              <div className="business-mess-message">{msg.content}</div>
              <span className="business-mess-time">{msg.time}</span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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

          <input
            type="text"
            placeholder={`Send as ${responseType}...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          <button
            className="business-mess-send-btn"
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentMessagesPage;
