import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane, FaExpand } from "react-icons/fa";
import "../css/ChatBox.css";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChatBox = ({ onClose, businessName, businessOwnerId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const studentId = user?.id;

  const navigate = useNavigate();

  useEffect(() => {
    if (!studentId || !businessOwnerId) return;

    const loadHistory = async () => {
      try {
        const res = await axios.request({
          method: "post",
          url: `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
          data: {
            sender_id: studentId,
            receiver_id: businessOwnerId,
          },
        });

        const chatHistory = res.data.history || [];

        const formattedHistory = chatHistory.map((msg) => ({
          id: msg.ts, // Use timestamp as key
          type: msg.sender_id === studentId ? "sent" : "received",
          content: msg.message,
          time: formatTime(msg.ts),
        }));

        setMessages(formattedHistory);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setMessages([]); // Start with empty on error
      }
    };

    loadHistory();
  }, [studentId, businessOwnerId]); // Reload if user or business changes

  // Effect 2: Manage Socket.IO connection
  useEffect(() => {
    if (!studentId || !businessOwnerId) return;

    // Connect to socket
    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    // Join room
    socketRef.current.emit("join", studentId);

    // Listen for incoming messages
    socketRef.current.on("receive_message", (msg) => {
      // Only add message if it's from the business we are currently chatting with
      if (msg.sender_id === businessOwnerId) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "received",
            content: msg.message,
            time: formatTime(msg.ts),
          },
        ]);
      }
    });

    // Disconnect on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [studentId, businessOwnerId]); // Re-establish socket if props change

  // Effect 3: Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]); // Run every time a new message is added

  // Updated send handler
  const handleSend = () => {
    if (!input.trim() || !studentId || !businessOwnerId) return;

    const chatId = `${studentId}_${businessOwnerId}`;
    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: input,
      time: formatTime(new Date()),
    };

    // 1. Update UI locally
    setMessages((prev) => [...prev, newMsg]);

    // 2. Send message via socket
    if (socketRef.current) {
      socketRef.current.emit("send_message_socket", {
        chatId,
        sender_id: studentId,
        receiver_id: businessOwnerId,
        message: input,
      });
    }

    // 3. Clear input
    setInput("");
  };

  const handleOpenMessagesPage = () => {
    navigate("/dashboard/messages");
  };

  return (
    // Using your original CSS classes
    <div className="business-view-container">
      <div className="business-view-header">
        <span>💬 Chat với {businessName || "doanh nghiệp"}</span>
        <button
          onClick={handleOpenMessagesPage}
          className="business-view-expand"
          title="Mở trang tin nhắn"
        >
          <FaExpand color="white" />
        </button>
        <button onClick={onClose} className="business-view-close">
          <FaTimes color="white" />
        </button>
      </div>

      <div className="business-view-messages">
        {messages.length === 0 ? (
          <div className="business-view-empty">Chưa có tin nhắn</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              // Updated to use msg.type (sent/received)
              className={`business-view-message ${
                msg.type === "sent" ? "user" : "bot"
              }`}
            >
              {/* Updated to use msg.content */}
              {msg.content}
            </div>
          ))
        )}
        {/* Empty div for auto-scrolling */}
        <div ref={messagesEndRef} />
      </div>

      <div className="business-view-input">
        <input
          type="text"
          placeholder="Nhập tin nhắn..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} disabled={!input.trim()}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatBox;
