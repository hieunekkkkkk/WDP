import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { IoSend, IoAdd, IoClose } from "react-icons/io5"; // Thêm icon
import { useUser } from "@clerk/clerk-react";
import "../../css/MessagesPage.css";

const NewChatModal = ({
  isOpen,
  onClose,
  businessList,
  onSelectBusiness,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredList = businessList.filter((biz) =>
    biz.business_name.toLowerCase().includes(searchTerm.toLowerCase())
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
                onSelectBusiness(biz); // Gọi hàm select
                onClose(); // Đóng modal
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

const StudentMessagesPage = () => {
  const { user } = useUser();
  const [businessList, setBusinessList] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State cho modal

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const studentId = user?.id;

  // ... (useEffect cho Socket.io vẫn giữ nguyên) ...
  useEffect(() => {
    if (!studentId) return;

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
  }, [studentId]);

  // Load danh sách doanh nghiệp (cho modal)
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

  // ... (handleSendMessage vẫn giữ nguyên) ...
  const handleSendMessage = () => {
    if (!message.trim() || !selectedBusiness || !studentId) return;
    const chatId = `${studentId}_${selectedBusiness.owner_id}`;
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
      receiver_id: selectedBusiness.owner_id,
      message,
    });
  };

  // ... (useEffect cho scroll vẫn giữ nguyên) ...
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... (handleSelectBusiness vẫn giữ nguyên) ...
  const handleSelectBusiness = async (biz) => {
    setSelectedBusiness(biz);
    setMessages([]);
    if (!studentId) return;
    try {
      const res = await axios.request({
        method: "post",
        url: `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
        data: {
          sender_id: studentId,
          receiver_id: biz.owner_id,
        },
      });
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

  return (
    <>
      <NewChatModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        businessList={businessList}
        onSelectBusiness={handleSelectBusiness}
      />

      <div className="business-card business-mess-container">
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
            {/* {businessList.map((biz) => (
              <div
                key={biz._id}
                className={`business-mess-chat-item ${
                  selectedBusiness?._id === biz._id ? "active" : ""
                }`}
                onClick={() => handleSelectBusiness(biz)}
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
                </div>
              </div>
            ))} */}
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
                {/* ... (code input giữ nguyên) ... */}
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
    </>
  );
};

export default StudentMessagesPage;