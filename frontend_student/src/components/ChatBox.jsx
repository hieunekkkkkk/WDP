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

/**
 * ChatBox Component - Popup chat mini cho Student
 * 
 * Hoạt động GIỐNG HỆT StudentMessagesPage:
 * - Student chat với Business
 * - Tin nhắn luôn được lưu vào Redis (qua socket)
 * - Nếu type = 'bot': Bot tự động response (kể cả khi Business offline)
 * - Nếu type = 'human': Chờ Business online mới response
 * 
 * Props:
 * - businessName: Tên doanh nghiệp
 * - businessOwnerId: ID của business owner
 */
const ChatBox = ({ onClose, businessName, businessOwnerId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const studentId = user?.id;

  const navigate = useNavigate();

  // Effect 1: Load chat history và init chatId
  useEffect(() => {
    if (!studentId || !businessOwnerId) return;

    const loadHistory = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
          {
            sender_id: studentId,
            receiver_id: businessOwnerId,
          }
        );

        const { chatId, history } = res.data;
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;

        const formattedHistory = history.map((msg) => ({
          id: msg.ts,
          type: msg.sender_id === studentId ? "sent" : "received",
          content: msg.message,
          time: formatTime(msg.ts),
        }));

        setMessages(formattedHistory);
      } catch (err) {
        console.error("Error fetching chat history:", err);
        setMessages([]);
      }
    };

    loadHistory();
  }, [studentId, businessOwnerId]);

  // Effect 2: Manage Socket.IO connection
  useEffect(() => {
    if (!studentId) return;

    // Connect to socket
    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      console.log("✅ ChatBox socket connected:", socketRef.current.id);

      // Re-join room if reconnect
      if (currentChatIdRef.current) {
        console.log("🔄 ChatBox re-joining room:", currentChatIdRef.current);
        socketRef.current.emit("join_chat", currentChatIdRef.current);
        roomJoinedRef.current = true;
      }
    });

    // Listen for incoming messages
    socketRef.current.on("receive_message", (msg) => {
      console.log("📩 ChatBox received message:", msg);

      // Skip own messages (optimistic update)
      if (msg.sender_id === studentId) {
        console.log("⏭️ ChatBox skipping own message");
        return;
      }

      // Only add if belongs to current chat
      const belongsToCurrentChat = msg.chatId === currentChatIdRef.current;
      if (!belongsToCurrentChat) {
        console.log("⏭️ ChatBox: message doesn't belong to current chat");
        return;
      }

      // Check duplicate
      setMessages((prev) => {
        const exists = prev.some(m => m.id === msg.ts);
        if (exists) {
          console.log("⏭️ ChatBox: duplicate message");
          return prev;
        }

        console.log("✅ ChatBox adding received message");
        return [
          ...prev,
          {
            id: msg.ts,
            type: "received",
            content: msg.message,
            time: formatTime(msg.ts),
          },
        ];
      });
    });

    // Disconnect on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [studentId]);

  // Effect 3: Join room when chatId is ready
  useEffect(() => {
    if (!currentChatId || !socketRef.current?.connected) return;

    console.log("🔗 ChatBox joining room:", currentChatId);
    socketRef.current.emit("join_chat", currentChatId);
    roomJoinedRef.current = true;
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !studentId || !businessOwnerId || !currentChatId) return;

    // Đảm bảo đã join room
    if (!roomJoinedRef.current && socketRef.current?.connected) {
      console.log("⚠️ ChatBox not in room yet, joining now...");
      socketRef.current.emit("join_chat", currentChatId);
      roomJoinedRef.current = true;
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const messageContent = input.trim();
    const tempId = Date.now();

    // 1. Optimistic UI update
    const optimisticMessage = {
      id: tempId,
      type: "sent",
      content: messageContent,
      time: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    // 2. Lấy type mới nhất từ server (Business có thể đã đổi type)
    let latestType = 'human';
    try {
      const typeRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/conversation/${currentChatId}/type`
      );
      latestType = typeRes.data.type;
      console.log("📋 ChatBox latest chat type:", latestType);
    } catch {
      console.warn("⚠️ ChatBox failed to get latest type, using default: human");
    }

    // 3. Gửi tin nhắn (GIỐNG HỆT StudentMessagesPage)
    if (latestType === 'bot') {
      // Bot mode: EMIT student message TRƯỚC, sau đó gọi bot API
      console.log("� ChatBox bot mode: Step 1 - Emitting student message...");
      socketRef.current.emit("send_message", {
        chatId: currentChatId,
        sender_id: studentId,
        receiver_id: businessOwnerId,
        message: messageContent,
        message_who: 'sender'
      });

      // Gọi bot API
      try {
        console.log("🤖 ChatBox bot mode: Step 2 - Calling bot API...");
        await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/conversation/${currentChatId}/bot`,
          {
            sender_id: studentId,
            receiver_id: businessOwnerId,
            message: messageContent,
          }
        );
        console.log("✅ ChatBox bot API called successfully");
      } catch (err) {
        console.error("❌ ChatBox bot API error:", err);
      }
    } else {
      // Human mode: Chỉ gửi qua socket
      console.log("💬 ChatBox human mode: Sending message via socket...");
      socketRef.current.emit("send_message", {
        chatId: currentChatId,
        sender_id: studentId,
        receiver_id: businessOwnerId,
        message: messageContent,
        message_who: 'sender'
      });
      console.log("✅ ChatBox message emitted to socket");
    }
  };

  const handleOpenMessagesPage = () => {
    navigate("/dashboard/messages?ownerId=" + businessOwnerId);
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
              className={`business-view-message ${msg.type === "sent" ? "user" : "bot"
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
