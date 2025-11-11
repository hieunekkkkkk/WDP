import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaPaperPlane } from "react-icons/fa";
import "../css/ChatBox.css";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { io } from "socket.io-client";

const formatTime = (dateStr) => {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * ChatBox Component - Popup chat mini cho Business
 *
 * Hoạt động GIỐNG HỆT BusinessMessagesPage:
 * - Business chat với Student hoặc Business khác
 * - Luôn dùng Manager mode (không có bot)
 * - Tin nhắn luôn được lưu vào Redis (qua socket)
 *
 * Props:
 * - businessName: Tên người chat (Student/Business)
 * - studentId: ID của người nhận (có thể là Student hoặc Business khác)
 */
const ChatBox = ({ onClose, businessName, studentId: propStudentId }) => {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [currentChatId, setCurrentChatId] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const currentChatIdRef = useRef(null);
  const roomJoinedRef = useRef(false);
  const businessId = user?.id;

  // Effect 1: Load chat history
  useEffect(() => {
    if (!businessId || !propStudentId) {
      console.warn("⚠️ Business ChatBox: Missing businessId or studentId");
      return;
    }

    const loadHistory = async () => {
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_BE_URL}/api/conversation/check`,
          {
            sender_id: propStudentId,
            receiver_id: businessId,
          }
        );

        const { chatId, history } = res.data;
        setCurrentChatId(chatId);
        currentChatIdRef.current = chatId;

        const formattedHistory = history.map((msg) => ({
          id: msg.ts,
          type: msg.sender_id === businessId ? "sent" : "received",
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
  }, [businessId, propStudentId]);

  // Effect 2: Socket connection
  useEffect(() => {
    if (!businessId) return;

    socketRef.current = io(`${import.meta.env.VITE_BE_URL}`, {
      transports: ["websocket"],
    });

    socketRef.current.on("connect", () => {
      if (currentChatIdRef.current) {
        socketRef.current.emit("join_chat", currentChatIdRef.current);
        roomJoinedRef.current = true;
      }
    });

    socketRef.current.on("receive_message", (msg) => {
      if (msg.sender_id === businessId) {
        return;
      }

      const belongsToCurrentChat = msg.chatId === currentChatIdRef.current;
      if (!belongsToCurrentChat) {
        return;
      }

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.ts);
        if (exists) {
          return prev;
        }

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

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [businessId]);

  // Effect 3: Join room when chatId ready
  useEffect(() => {
    if (!currentChatId || !socketRef.current?.connected) return;

    socketRef.current.emit("join_chat", currentChatId);
    roomJoinedRef.current = true;
  }, [currentChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !businessId || !propStudentId || !currentChatId)
      return;

    // Đảm bảo đã join room
    if (!roomJoinedRef.current && socketRef.current?.connected) {
      socketRef.current.emit("join_chat", currentChatId);
      roomJoinedRef.current = true;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const messageContent = input.trim();
    const tempId = Date.now();

    // Optimistic UI update
    const optimisticMessage = {
      id: tempId,
      type: "sent",
      content: messageContent,
      time: formatTime(new Date()),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setInput("");

    socketRef.current.emit("send_message", {
      chatId: currentChatId,
      sender_id: businessId,
      receiver_id: propStudentId,
      message: messageContent,
      message_who: "receiver",
    });
  };

  if (!propStudentId) {
    return (
      <div className="business-view-container">
        <div className="business-view-header">
          <span>💬 Chat với {businessName || "doanh nghiệp"}</span>
          <button onClick={onClose} className="business-view-close">
            <FaTimes />
          </button>
        </div>
        <div className="business-view-messages">
          <div className="business-view-empty">
            ⚠️ Không thể chat: Thiếu thông tin sinh viên
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-view-container">
      <div className="business-view-header">
        <span>💬 Chat với {businessName || "sinh viên"}</span>
        <button onClick={onClose} className="business-view-close">
          <FaTimes />
        </button>
      </div>

      <div className="business-view-messages">
        {messages.length === 0 ? (
          <div className="business-view-empty">Chưa có tin nhắn</div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`business-view-message ${
                msg.type === "sent" ? "user" : "bot"
              }`}
            >
              {msg.content}
            </div>
          ))
        )}
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
