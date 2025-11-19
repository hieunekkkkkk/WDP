import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";
import { IoAdd, IoSend, IoClose } from "react-icons/io5";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [businessList, setBusinessList] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatType, setCurrentChatType] = useState("human");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const roomJoinedRef = useRef(false); // Track room join status
  const studentId = user?.id;

  // Khởi tạo socket - CHỈ PHỤ THUỘC studentId
  useEffect(() => {
    if (!studentId) return;

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      // Re-join room if we were in a chat
      if (currentChatIdRef.current) {
        socketRef.current.emit("join_chat", currentChatIdRef.current);
      }
    });

    socketRef.current.on("receive_message", (msg) => {
      // BỎ QUA tin nhắn của chính mình (đã có optimistic update)
      if (msg.sender_id === studentId) {
        return;
      }

      // Cập nhật messages nếu thuộc chat hiện tại
      setMessages((prev) => {
        // Kiểm tra message thuộc chat nào
        const belongsToCurrentChat = msg.chatId === currentChatIdRef.current;

        if (!belongsToCurrentChat) {
          return prev;
        }

        // Tránh duplicate
        const exists = prev.some((m) => m.id === msg.ts);
        if (exists) {
          return prev;
        }

        // Tin nhắn từ người khác = received
        const messageType = "received";

        return [
          ...prev,
          {
            id: msg.ts,
            content: msg.message,
            type: messageType,
            time: new Date(msg.ts).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      });

      // Cập nhật conversation list
      if (msg.sender_id === studentId || msg.receiver_id === studentId) {
        setConversations((prevConvos) => {
          const businessOwnerId =
            msg.sender_id === studentId ? msg.receiver_id : msg.sender_id;
          const convoIndex = prevConvos.findIndex(
            (c) =>
              c.receiverId === businessOwnerId || c.senderId === businessOwnerId
          );

          if (convoIndex === -1) return prevConvos;

          const updatedConvo = {
            ...prevConvos[convoIndex],
            lastMessage: msg.message,
            lastMessageSenderId: msg.sender_id,
          };

          return [
            updatedConvo,
            ...prevConvos.slice(0, convoIndex),
            ...prevConvos.slice(convoIndex + 1),
          ];
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [studentId]); // Load danh sách businesses
  useEffect(() => {
    const fetchBusinesses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/business?limit=100`
        );
        const activeBusinesses = (res.data.businesses || []).filter(
          (b) => b.business_active === "active"
        );
        setBusinessList(activeBusinesses);
      } catch (err) {
        console.error("Error fetching businesses:", err);
      }
    };
    fetchBusinesses();
  }, []);

  // Load conversations history
  useEffect(() => {
    if (!studentId) return;

    const loadHistories = async () => {
      try {
        const res = await axios.get(
          `${
            import.meta.env.VITE_BE_URL
          }/api/conversation/user/${studentId}/histories`
        );

        const convos = await Promise.all(
          res.data.map(async (conv) => {
            const businessId =
              conv.senderId === studentId ? conv.receiverId : conv.senderId;

            try {
              const bizRes = await axios.get(
                `${
                  import.meta.env.VITE_BE_URL
                }/api/business/owner/${businessId}`
              );
              const business = bizRes.data;
              const lastMsg = conv.conversation[conv.conversation.length - 1];

              return {
                chatId: conv.chatId,
                senderId: conv.senderId,
                receiverId: conv.receiverId,
                type: conv.type,
                business,
                lastMessage: lastMsg?.message || "",
                lastMessageSenderId: lastMsg?.sender_id || "",
              };
            } catch {
              return null;
            }
          })
        );

        setConversations(convos.filter(Boolean));
      } catch (err) {
        console.error("Error loading histories:", err);
      }
    };

    loadHistories();
  }, [studentId]);

  // Chọn business và load conversation
  const handleSelectBusiness = useCallback(
    async (biz) => {
      if (!studentId) return;

      setSelectedBusiness(biz);
      setMessages([]);
      roomJoinedRef.current = false; // Reset room join status

      const businessId = biz.owner_id;

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
          {
            sender_id: studentId,
            receiver_id: businessId,
          }
        );

        const { chatId, type, history } = res.data;
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId; // Sync ref
        setCurrentChatType(type);

        // Join room sau khi socket connected
        if (socketRef.current) {
          if (socketRef.current.connected) {
            socketRef.current.emit("join_chat", chatId);
            roomJoinedRef.current = true;
          } else {
            socketRef.current.once("connect", () => {
              socketRef.current.emit("join_chat", chatId);
              roomJoinedRef.current = true;
            });
          }
        } else {
          console.error("❌ Student socketRef.current is null!");
        }

        // Parse history - XÁC ĐỊNH sent/received DỰA VÀO sender_id
        const parsedMessages = history.map((msg) => ({
          id: msg.ts,
          content: msg.message,
          type: msg.sender_id === studentId ? "sent" : "received",
          time: new Date(msg.ts).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));

        setMessages(parsedMessages);
      } catch (err) {
        console.error("Error loading conversation:", err);
      }
    },
    [studentId]
  );

  // Gửi tin nhắn
  const handleSendMessage = async () => {
    if (!message.trim() || !currentChatId || !selectedBusiness) return;

    // Đảm bảo đã join room
    if (!roomJoinedRef.current && socketRef.current?.connected) {
      ("⚠️ Not in room yet, joining now...");
      socketRef.current.emit("join_chat", currentChatId);
      roomJoinedRef.current = true;
      // Đợi một chút để join hoàn tất
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const businessId = selectedBusiness.owner_id;
    const messageContent = message.trim();
    const tempId = Date.now();

    // 1. CẬP NHẬT UI NGAY LẬP TỨC (Optimistic Update)
    const optimisticMessage = {
      id: tempId,
      content: messageContent,
      type: "sent",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    // 2. LẤY TYPE MỚI NHẤT TỪ SERVER (Business có thể đã đổi type)
    let latestType = currentChatType;
    try {
      const typeRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/conversation/${currentChatId}/type`
      );
      latestType = typeRes.data.type;
      "📋 Latest chat type:", latestType;

      // Cập nhật state nếu khác
      if (latestType !== currentChatType) {
        setCurrentChatType(latestType);
      }
    } catch {
      console.warn(
        "⚠️ Failed to get latest type, using cached:",
        currentChatType
      );
    }

    // 3. GỬI TIN NHẮN LÊN SERVER
    if (latestType === "bot") {
      // Bot mode:
      // BƯỚC 1: EMIT STUDENT MESSAGE TRƯỚC để Business nhận ngay
      socketRef.current.emit("send_message", {
        chatId: currentChatId,
        sender_id: studentId,
        receiver_id: businessId,
        message: messageContent,
        message_who: "sender",
      });

      // BƯỚC 2: Gọi bot API sau khi đã emit
      try {
        const res = await axios.post(
          `${
            import.meta.env.VITE_BE_URL
          }/api/conversation/${currentChatId}/bot`,
          {
            sender_id: studentId,
            receiver_id: businessId,
            message: messageContent,
          }
        );

        "✅ Bot response received:", res.data;

        // KHÔNG CẦN emit bot response nữa
        // Backend đã tự động emit qua socket rồi
        // Student và Business sẽ nhận qua receive_message listener
      } catch (err) {
        console.error("❌ Error calling bot API:", err);
        // Không xóa optimistic message vì đã emit rồi
      }
    } else {
      // Human mode: Gửi qua socket

      socketRef.current.emit("send_message", {
        chatId: currentChatId,
        sender_id: studentId,
        receiver_id: businessId,
        message: messageContent,
        message_who: "sender",
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const ownerIdFromUrl = searchParams.get("ownerId");
    if (ownerIdFromUrl && businessList.length > 0 && studentId) {
      const biz = businessList.find((b) => b.owner_id === ownerIdFromUrl);
      if (biz) {
        handleSelectBusiness(biz);
        setSearchParams({});
      }
    }
  }, [
    businessList,
    searchParams,
    setSearchParams,
    handleSelectBusiness,
    studentId,
  ]);

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
            {conversations.map((convo) => (
              <div
                key={convo.chatId}
                className={`business-mess-chat-item ${
                  currentChatId === convo.chatId ? "active" : ""
                }`}
                onClick={() => handleSelectBusiness(convo.business?.[0])}
              >
                <div className="business-mess-avatar-wrapper">
                  <img
                    src={
                      convo.business?.[0]?.business_image?.[0] ||
                      "/default-avatar.png"
                    }
                    alt="avatar"
                    className="business-mess-avatar"
                  />
                </div>
                <div className="business-mess-chat-info">
                  <p className="business-mess-chat-name">
                    {convo.business?.[0]?.business_name}
                  </p>
                  <p className="business-mess-chat-status">
                    {convo.lastMessageSenderId === studentId ? "Bạn: " : ""}
                    {convo.lastMessage}
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
                  maxLength={250}
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
