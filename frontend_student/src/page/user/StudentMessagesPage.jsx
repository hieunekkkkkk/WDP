import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { IoSend, IoAdd, IoClose } from "react-icons/io5";
import { useUser } from "@clerk/clerk-react";
import "../../css/MessagesPage.css";

const NewChatModal = ({ isOpen, onClose, businessList, onSelectBusiness }) => {
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
  const [businessList, setBusinessList] = useState([]); // Danh sách cho Modal
  const [conversations, setConversations] = useState([]); // Danh sách cho Sidebar
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false); // State cho modal

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  const studentId = user?.id;

  useEffect(() => {
    if (!studentId) return;

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });
    socketRef.current.emit("join", studentId);

    socketRef.current.on("receive_message", (msg) => {
      if (msg.sender_id === selectedBusiness?.owner_id) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "received",
            content: msg.message,
            time: new Date(msg.ts).toLocaleString([], {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      }

      setConversations((prevConvos) => {
        const convoIndex = prevConvos.findIndex(
          (c) => c.business?.owner_id === msg.sender_id
        );
        if (convoIndex === -1) return prevConvos;

        const updatedConvo = {
          ...prevConvos[convoIndex],
          lastMessage: msg.message,
          lastMessageSenderId: msg.sender_id,
        };

        const newConvos = [
          updatedConvo,
          ...prevConvos.slice(0, convoIndex),
          ...prevConvos.slice(convoIndex + 1),
        ];
        return newConvos;
      });
    });
    return () => socketRef.current.disconnect();
  }, [studentId, selectedBusiness]); // Thêm selectedBusiness

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

  useEffect(() => {
    if (!studentId) return;

    const loadHistoriesAndDetails = async () => {
      let histories = [];
      try {
        const historyRes = await axios.get(
          `${
            import.meta.env.VITE_BE_URL
          }/api/conversation/user/${studentId}/histories`
        );
        histories = historyRes.data || [];
      } catch (err) {
        console.error("Error fetching conversation histories:", err);
        setConversations([]);
        return;
      }

      if (histories.length === 0) {
        setConversations([]);
        return;
      }

      const conversationPromises = histories.map(async (history) => {
        if (!history.conversation || history.conversation.length === 0) {
          return null;
        }

        const ids = history.chatId.split("_");
        if (ids.length < 4) return null;

        const userId1 = ids[1];
        const userId2 = ids[3];
        const businessOwnerId =
          "user_" + userId1 === studentId ? userId2 : userId1;

        try {
          const bizRes = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/owner/${
              "user_" + businessOwnerId
            }`
          );

          const businessInfo = bizRes.data;

          if (!businessInfo) return null;

          const lastMessageObject =
            history.conversation[history.conversation.length - 1];
          return {
            business: businessInfo,
            lastMessage: lastMessageObject.message,
            lastMessageSenderId: lastMessageObject.sender_id,
          };
        } catch (err) {
          console.error(`Error fetching biz info for ${businessOwnerId}:`, err);
          return null;
        }
      });

      const processedConversations = (
        await Promise.all(conversationPromises)
      ).filter(Boolean);

      setConversations(processedConversations);
    };

    loadHistoriesAndDetails();
  }, [studentId]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedBusiness || !studentId) return;

    const messageContent = message.trim();
    const currentReceiverId = selectedBusiness.owner_id;
    const currentChatId = `${studentId}_${currentReceiverId}`;
    const currentSelectedBusiness = selectedBusiness;

    const newMsg = {
      id: Date.now(),
      type: "sent",
      content: messageContent,
      time: new Date().toLocaleString([], {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessage("");

    setConversations((prevConvos) => {
      const convoIndex = prevConvos.findIndex(
        (c) => c.business?.[0].owner_id === currentReceiverId
      );

      if (convoIndex === -1) {
        const newBizInfo = businessList.find(
          (b) => b.owner_id === currentReceiverId
        );
        return [
          {
            business: [newBizInfo || currentSelectedBusiness],
            lastMessage: messageContent,
            lastMessageSenderId: studentId,
          },
          ...prevConvos,
        ];
      }

      const updatedConvo = {
        ...prevConvos[convoIndex],
        lastMessage: messageContent,
        lastMessageSenderId: studentId,
      };
      const newConvos = [
        updatedConvo,
        ...prevConvos.slice(0, convoIndex),
        ...prevConvos.slice(convoIndex + 1),
      ];
      return newConvos;
    });

    let eventName = "send_message_socket"; 

    try {
      const botRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${currentReceiverId}`
      );

      const botData = botRes.data;

      if (botData && botData.knowledge && botData.knowledge.length > 0) {
        eventName = "send_message_bot";
      } else {
      }
    } catch (botErr) {
      console.error("Lỗi khi kiểm tra AIBot (có thể là 404):", botErr.message);
    }

    socketRef.current.emit(eventName, {
      chatId: currentChatId,
      sender_id: studentId,
      receiver_id: currentReceiverId,
      message: messageContent,
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ... (handleSelectBusiness) ...
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
        time: new Date(msg.ts).toLocaleString([], {
          day: "2-digit",
          month: "2-digit",
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

          {/* ====================================================== */}
          {/* PHẦN JSX ĐƯỢC CẬP NHẬT ĐỂ DÙNG `conversations`   */}
          {/* ====================================================== */}
          <div className="business-mess-chat-list">
            {conversations.map((convo) => (
              <div
                key={convo.business._id}
                className={`business-mess-chat-item ${
                  selectedBusiness?._id === convo.business._id ? "active" : ""
                }`}
                onClick={() => handleSelectBusiness(convo.business?.[0])}
              >
                <div className="business-mess-avatar-wrapper">
                  <img
                    src={convo.business?.[0].business_image?.[0]}
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">
                    {convo.business?.[0].business_name}
                  </p>
                  <p className="business-mess-chat-status">
                    {convo.lastMessageSenderId === studentId ? "Bạn: " : ""}
                    {convo.lastMessage}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* ====================================================== */}
          {/* HẾT PHẦN JSX CẬP NHẬT                             */}
          {/* ====================================================== */}
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
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
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
