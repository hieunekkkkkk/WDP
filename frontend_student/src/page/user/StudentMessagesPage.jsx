import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { IoSend, IoAdd, IoClose } from "react-icons/io5";
import { useUser } from "@clerk/clerk-react";
import "../../css/MessagesPage.css";

// ==========================
// Modal chọn doanh nghiệp
// ==========================
const NewChatModal = ({ isOpen, onClose, businessList, onSelectBusiness }) => {
  const [searchTerm, setSearchTerm] = useState("");
  if (!isOpen) return null;

  const filteredList = businessList.filter((biz) =>
    biz.business_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="business-mess-modal-overlay">
      <div className="business-mess-modal-content">
        <div className="business-mess-modal-header">
          <h2>Bắt đầu cuộc trò chuyện mới</h2>
          <button onClick={onClose} className="business-mess-modal-close-btn">
            <IoClose />
          </button>
        </div>
        <div className="business-mess-search-wrapper">
          <input
            type="text"
            placeholder="Tìm kiếm doanh nghiệp..."
            className="business-mess-search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="business-mess-modal-list">
          {filteredList.map((biz) => (
            <div
              key={biz._id}
              className="business-mess-chat-item"
              onClick={() => {
                onSelectBusiness(biz);
                onClose();
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
    </div>
  );
};

// ==========================
// Trang tin nhắn sinh viên
// ==========================
const StudentMessagesPage = () => {
  const { user } = useUser();
  const studentId = user?.id;

  const [businessList, setBusinessList] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // ==========================
  //  Kết nối Socket.IO 1 lần
  // ==========================
  useEffect(() => {
    if (!studentId) return;

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.emit("join", studentId);

    socketRef.current.on("receive_message", (msg) => {
      // chỉ nhận tin nhắn của doanh nghiệp đang chat
      if (msg.sender_id === selectedBusiness?._id) {
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
      }
    });

    socketRef.current.on("message_sent", (msg) =>
      console.log("Message delivered:", msg)
    );

    socketRef.current.on("error", (err) => console.error("Socket error:", err));

    return () => socketRef.current.disconnect();
  }, [studentId, selectedBusiness]);

  // ==========================
  //  Lấy danh sách doanh nghiệp (cho modal)
  // ==========================
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

  // ==========================
  //  Khi chọn doanh nghiệp → lấy lịch sử hội thoại
  // ==========================
  const handleSelectBusiness = async (biz) => {
    setSelectedBusiness(biz);
    setMessages([]);

    if (!studentId || !biz?._id) return;
    const chatId = `${studentId}_${biz._id}`; // ✅ đúng thứ tự student trước, business sau

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
        {
          sender_id: studentId,
          receiver_id: biz._id,
        }
      );

      const chatHistory = res.data.history || [];
      const formattedHistory = chatHistory.map((msg) => ({
        id: msg.ts,
        type: msg.sender_id === studentId ? "sent" : "received",
        content: msg.message,
        time: new Date(msg.ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
      setMessages(formattedHistory);
    } catch (err) {
      console.error("Error fetching chat history:", err);
      setMessages([]);
    }
  };

  // ==========================
  //  Gửi tin nhắn
  // ==========================
  const handleSendMessage = () => {
    if (!message.trim() || !selectedBusiness || !studentId) return;
    const chatId = `${studentId}_${selectedBusiness._id}`; // ✅ theo chuẩn

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

  // ==========================
  // Tự động scroll xuống cuối khi có tin mới
  // ==========================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ==========================
  //  UI
  // ==========================
  return (
    <>
      {/* Modal chọn doanh nghiệp */}
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessList={businessList}
        onSelectBusiness={handleSelectBusiness}
      />

      <div className="business-card business-mess-container">
        {/* Sidebar */}
        <div className="business-mess-sidebar">
          <div className="business-mess-sidebar-header">
            <h2 className="business-mess-sidebar-title">Đoạn chat</h2>
            <button
              className="business-mess-new-chat-btn"
              onClick={() => setIsModalOpen(true)}
            >
              <IoAdd />
            </button>
          </div>

          <div className="business-mess-chat-list">
            {selectedBusiness && (
              <div
                className="business-mess-chat-item active"
                onClick={() => handleSelectBusiness(selectedBusiness)}
              >
                <div className="business-mess-avatar-wrapper">
                  <img
                    src={
                      selectedBusiness.business_image?.[0] ||
                      "/default-avatar.png"
                    }
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">
                    {selectedBusiness.business_name}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Khung chat */}
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
              <p>💬 Chọn hoặc tạo cuộc trò chuyện mới để bắt đầu</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StudentMessagesPage;
