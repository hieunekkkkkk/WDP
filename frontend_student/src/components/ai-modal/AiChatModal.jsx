import React, { useState, useCallback, useRef, useEffect } from "react";
import { askGemini } from "../../utils/geminiClient.js";

// --- CONSTANTS VÀ UTILS ---
const getStorageKey = (docTitle) => `aiChatHistory_${docTitle}`;

const initialWelcomeMessage = (docTitle) => ({
  id: Date.now(),
  sender: "ai",
  text: `Xin chào! Tôi có thể giúp gì cho bạn về tài liệu "${docTitle}"?`,
});

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

const TrashIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

// Message Component
const Message = React.memo(({ msg }) => (
  <div className={`ai-chat-message ${msg.sender}`}>
    <div className="ai-chat-bubble">{msg.text}</div>
  </div>
));
Message.displayName = "Message";

// Main AI Chat Modal
export default function AiChatModal({ isOpen, onClose, docTitle }) {
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // --- THAY ĐỔI 1: TẢI LỊCH SỬ TỪ LOCALSTORAGE (thay vì reset) ---
  const [messages, setMessages] = useState(() => {
    if (!docTitle) return []; // Không có docTitle thì không load

    const key = getStorageKey(docTitle);
    const savedHistory = localStorage.getItem(key);

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (
          parsedHistory &&
          Array.isArray(parsedHistory) &&
          parsedHistory.length > 0
        ) {
          return parsedHistory;
        }
      } catch (e) {
        console.error("Lỗi khi tải lịch sử chat:", e);
      }
    }
    // Trả về tin nhắn chào mừng mặc định nếu không có lịch sử
    return [initialWelcomeMessage(docTitle)];
  });

  // --- THAY ĐỔI 2: LƯU LỊCH SỬ MỖI KHI CÓ TIN NHẮN MỚI ---
  useEffect(() => {
    if (messages.length > 1) {
      const key = getStorageKey(docTitle);
      localStorage.setItem(key, JSON.stringify(messages));
    }
  }, [messages, docTitle]);

  // --- THAY ĐỔI 3: LOẠI BỎ useEffect TỰ ĐỘNG RESET KHI MỞ MODAL (đã xóa) ---
  // (Đoạn useEffect cũ đã bị xóa)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Xử lý khi docTitle thay đổi (khi người dùng mở chat cho tài liệu khác)
  useEffect(() => {
    const key = getStorageKey(docTitle);
    const savedHistory = localStorage.getItem(key);

    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        if (
          parsedHistory &&
          Array.isArray(parsedHistory) &&
          parsedHistory.length > 0
        ) {
          setMessages(parsedHistory);
          return;
        }
      } catch (e) {
        console.error("Lỗi khi tải lịch sử chat:", e);
      }
    }
    // Nếu không có lịch sử cho docTitle mới, set tin nhắn chào mừng
    setMessages([initialWelcomeMessage(docTitle)]);
  }, [docTitle]);

  // --- THAY ĐỔI 4: CHỨC NĂNG XÓA CHAT THỦ CÔNG ---
  const handleClearChat = useCallback(() => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện này không?"
    );
    if (isConfirmed) {
      const key = getStorageKey(docTitle);
      localStorage.removeItem(key); // Xóa khỏi localStorage
      setMessages([
        // Reset state về tin nhắn chào mừng
        {
          id: Date.now(),
          sender: "ai",
          text: `Lịch sử chat đã được xóa. Tôi có thể giúp gì cho bạn về tài liệu "${docTitle}"?`,
        },
      ]);
      setInput("");
    }
  }, [docTitle]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    // Tạo prompt dựa trên toàn bộ lịch sử để AI có ngữ cảnh
    const contextHistory = messages
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const userMsg = { id: Date.now(), sender: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const aiPrompt = `Bạn là trợ lý học tập thông minh. Người dùng đang hỏi về tài liệu "${docTitle}". 
    Đây là lịch sử cuộc trò chuyện (USER là người dùng, AI là bạn):
    
    --- Bắt đầu Lịch sử ---
    ${contextHistory}
    USER: ${input}
    --- Kết thúc Lịch sử ---

    Hãy trả lời tin nhắn cuối cùng (USER) bằng tiếng Việt, súc tích, dễ hiểu và hữu ích. Giả định rằng bạn có thông tin về tài liệu "${docTitle}".`;

    const reply = await askGemini(aiPrompt);

    setMessages((prev) => [
      ...prev,
      { id: Date.now() + 1, sender: "ai", text: reply },
    ]);
    setLoading(false);
  }, [input, loading, docTitle, messages]); // messages được thêm vào dependencies để lấy lịch sử

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
          <div style={{ display: "flex", gap: "10px" }}>
            {/* --- THAY ĐỔI 5: NÚT XÓA CHAT THỦ CÔNG --- */}
            {messages.length > 1 && (
              <button
                className="ai-chat-close"
                onClick={handleClearChat}
                title="Xóa lịch sử trò chuyện"
              >
                <TrashIcon />
              </button>
            )}
            <button className="ai-chat-close" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="ai-chat-message ai">
              <div className="ai-chat-bubble">Đang trả lời...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-chat-input-area">
          <input
            type="text"
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
