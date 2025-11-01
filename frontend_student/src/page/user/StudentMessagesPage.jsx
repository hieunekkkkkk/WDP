import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { IoSend } from "react-icons/io5";
import { useUser } from "@clerk/clerk-react";
import "../../css/MessagesPage.css";

const StudentMessagesPage = () => {
  const { user } = useUser();
  const [businessList, setBusinessList] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const studentId = user?.id;

  // ===============================
  //  Kết nối socket + join room
  // ===============================
  useEffect(() => {
    if (!studentId) return; // đợi Clerk load user xong

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.emit("join", studentId);

    socketRef.current.on("receive_message", (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          type: "received",
          content: msg.message,
          time: new Date(msg.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });

    return () => socketRef.current.disconnect();
  }, [studentId]); // chạy lại khi user đã load

  // ===============================
  //  Load danh sách doanh nghiệp
  // ===============================
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business`
        );
        setBusinessList(res.data.businesses || []);
      } catch (err) {
        console.error("Error fetching business list:", err);
      }
    };
    fetchBusinesses();
  }, []);

  // ===============================
  //  Gửi tin nhắn
  // ===============================
  const handleSendMessage = () => {
    if (!message.trim() || !selectedBusiness || !studentId) return;

    const chatId = `${studentId}_${selectedBusiness._id}`;
    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: message,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    socketRef.current.emit("send_message_socket", {
      chatId,
      sender_id: studentId,
      receiver_id: selectedBusiness._id,
      message,
    });
  };

  // ===============================
  // 4 Scroll xuống khi có tin nhắn
  // ===============================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===============================
  //  Render
  // ===============================
  return (
    <div className="business-card business-mess-container">
      <div className="business-mess-sidebar">
        <h2 className="business-mess-sidebar-title">Danh sách doanh nghiệp</h2>
        <div className="business-mess-chat-list">
          {businessList.map((biz) => (
            <div
              key={biz._id}
              className={`business-mess-chat-item ${
                selectedBusiness?._id === biz._id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedBusiness(biz);
                setMessages([]);
              }}
            >
              <div className="business-mess-avatar-wrapper">
                <img
                  src={biz.business_image?.[0] || "/default-avatar.png"}
                  alt="avatar"
                  className="business-mess-avatar"
                />
              </div>
              <div className="business-mess-chat-info">
                <p className="business-mess-chat-name">{biz.business_name}</p>
                <p className="business-mess-chat-status">
                  {biz.business_active === "active"
                    ? "Đang hoạt động"
                    : "Chưa kích hoạt"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="business-mess-window">
        {selectedBusiness ? (
          <>
            <div className="business-mess-header">
              <div className="business-mess-header-left">
                <img
                  src={
                    selectedBusiness.business_image?.[0] ||
                    "/default-avatar.png"
                  }
                  alt="avatar"
                  className="business-mess-avatar"
                />
                <div>
                  <h4>{selectedBusiness.business_name}</h4>
                  <span>{selectedBusiness.business_address}</span>
                </div>
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

            <div className="business-mess-input">
              <input
                type="text"
                placeholder={`Gửi tin nhắn tới ${selectedBusiness.business_name}...`}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <button
                className="business-mess-send-btn"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <IoSend />
              </button>
            </div>
          </>
        ) : (
          <div className="business-mess-placeholder">
            <p>💬 Chọn một doanh nghiệp để bắt đầu trò chuyện</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMessagesPage;
