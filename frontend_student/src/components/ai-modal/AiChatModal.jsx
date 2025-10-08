import React, { useState, useCallback, useRef, useEffect } from "react";

// Icon Components
const CloseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <path
      d="M18 6L6 18M6 6l12 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const SendIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Message Component
const Message = React.memo(({ msg }) => (
  <div className={`ai-chat-message ${msg.sender}`}>
    <div className="ai-chat-bubble">{msg.text}</div>
  </div>
));

Message.displayName = "Message";

// AI Chat Modal Component
export default function AiChatModal({ isOpen, onClose, docTitle }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "ai",
      text: `Xin chào! Tôi có thể giúp gì cho bạn về tài liệu "${docTitle}"?`,
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset messages when docTitle changes
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 1,
          sender: "ai",
          text: `Xin chào! Tôi có thể giúp gì cho bạn về tài liệu "${docTitle}"?`,
        },
      ]);
      setInput("");
    }
  }, [docTitle, isOpen]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "ai",
          text: "Cảm ơn bạn đã gửi tin nhắn. Đây là phản hồi mẫu từ AI.",
        },
      ]);
    }, 1000);
  }, [input]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-box" onClick={(e) => e.stopPropagation()}>
        <div className="ai-chat-header">
          <div>
            <h3>Chat với AI</h3>
            <p>{docTitle}</p>
          </div>
          <button
            className="ai-chat-close"
            onClick={onClose}
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            aria-label="Chat input"
          />
          <button onClick={handleSend} aria-label="Send message">
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}