import React, { useState } from "react";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import "../css/ChatBox.css";

const ChatBox = ({ onClose, businessName }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (input.trim() === "") return;
    setMessages([...messages, { text: input, sender: "user" }]);
    setInput("");
    // Later: integrate API or WebSocket to send messages
  };

  return (
    <div className="business-view-container">
      <div className="business-view-header">
        <span>💬 Chat với {businessName || "doanh nghiệp"}</span>
        <button onClick={onClose} className="business-view-close">
          <FaTimes />
        </button>
      </div>

      <div className="business-view-messages">
        {messages.length === 0 ? (
          <div className="business-view-empty">Chưa có tin nhắn</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`business-view-message ${
                msg.sender === "user" ? "user" : "bot"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>

      <div className="business-view-input">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button onClick={handleSend}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
