import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useLocation } from "react-router-dom";

import "./style/MyAi.css";

// Constants
const SUGGESTIONS = [
  "Xin gợi ý lộ trình ôn thi nhanh",
  "Giải thích định lý Pythagoras dễ hiểu",
  "Tóm tắt chương 1 Vật lý 10",
  "Gợi ý từ khoá để làm đề cương",
];
const DEFAULT_AVATAR =
  "https://res.cloudinary.com/diqpghsfm/image/upload/v1763044072/4712035_dtue3q.png";
const AI_AVATAR =
  "https://res.cloudinary.com/diqpghsfm/image/upload/v1763044032/t%E1%BA%A3i_xu%E1%BB%91ng_ddbyrr.jpg";

// Helper Functions
const currencyVND = (n) =>
  Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

const pickStudentPersonalStack = (stacks = []) => {
  const exact = stacks.find(
    (s) => (s.stack_name || "").trim().toLowerCase() === "bot hỗ trợ cá nhân"
  );

  if (exact) return exact;
  return stacks.find((s) => {
    const name = (s.stack_name || "").toLowerCase();
    return name.includes("cá nhân") || name.includes("sinh viên");
  });
};

// Storage Helpers
const STORAGE_KEY_PREFIX = "aibot_chat_";
const HISTORY_KEY = "aibot_history_list";

// generateUniqueId
const generateUniqueId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

// loadChatHistory
const loadChatHistory = (userId) => {
  try {
    const data = localStorage.getItem(`${HISTORY_KEY}_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// saveChatHistory
const saveChatHistory = (userId, history) => {
  try {
    localStorage.setItem(`${HISTORY_KEY}_${userId}`, JSON.stringify(history));
  } catch (error) {
    console.error("Failed to save chat history to localStorage", error);
  }
};

// loadMessages
const loadMessages = (chatId) => {
  try {
    const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${chatId}`);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// saveMessages
const saveMessages = (chatId, messages) => {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${chatId}`,
      JSON.stringify(messages)
    );
  } catch (error) {
    console.error("Failed to save messages to localStorage", error);
  }
};

// deleteMessages (NEW)
const deleteMessages = (chatId) => {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${chatId}`);
  } catch (error) {
    console.error("Failed to delete messages from localStorage", error);
  }
};

// Loading component
const Loading = () => (
  <div className="myai-container">
    <div className="myai-blur-content">
      <div className="myai-center">
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            fontSize: "1.2rem",
            color: "#666",
          }}
        >
          <div className="loading-spinner" style={{ marginBottom: "1rem" }} />
          Đang tải My AI...
        </div>
      </div>
    </div>
  </div>
);

// SuggestionButton component
const SuggestionButton = React.memo(({ text, onClick }) => (
  <button className="ai-suggestion" onClick={onClick}>
    {text}
  </button>
));

// NoBotView component
const NoBotView = ({ stack, onActivate, isLoading }) => (
  <div className="myai-container">
    <div className="myai-blur-content">
      <div className="myai-center">
        <img src={DEFAULT_AVATAR} alt="AI avatar" className="myai-avatar" />
        <h2 className="myai-title">AI Hỗ Trợ Học Tập</h2>
        <p className="myai-desc">
          Trợ lý AI giúp bạn học hiệu quả hơn. Kích hoạt để bắt đầu sử dụng.
        </p>
      </div>
    </div>

    <div className="stack-overlay">
      {!stack ? (
        <div className="stack-card student-ai">
          <h3>Đang tải gói...</h3>
          <p>Vui lòng chờ giây lát</p>
        </div>
      ) : (
        <div className="stack-card student-ai">
          <div className="stack-card-badge">Dành cho sinh viên</div>
          <h3>{stack.stack_name}</h3>
          <div className="stack-features">
            <div className="stack-feature">✓ Trợ giúp bài tập</div>
            <div className="stack-feature">✓ Giải đáp 24/7</div>
            <div className="stack-feature">✓ Gợi ý ôn tập</div>
            <div className="stack-feature">
              ✓ Phản hồi chuẩn theo kiến thức{" "}
            </div>
          </div>
          <p className="stack-description">
            {stack.stack_detail || "Trợ lý AI cho học tập"}
          </p>
          <div className="stack-price">
            {currencyVND(stack.stack_price)}₫
            <span className="price-period">/tháng</span>
          </div>
          <button
            className="stack-activate-btn"
            onClick={() => onActivate(stack)}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="loading-spinner small" />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>🎓 Kích hoạt ngay</span>
            )}
          </button>
        </div>
      )}
    </div>
  </div>
);

// TypingIndicator component
const TypingIndicator = () => (
  <div className="message assistant">
    <div className="message-content typing-indicator">
      <span />
      <span />
      <span />
    </div>
  </div>
);

// ChatMessage component
const ChatMessage = React.memo(({ role, content }) => (
  <div className={`message ${role}`}>
    <div className="message-content">{content}</div>
  </div>
));

// AISidebar component
const AISidebar = ({
  bot,
  onNavigate,
  chats,
  onSelectChat,
  onNewChat,
  activeChatId,
  onDeleteChat,
}) => {
  const ref = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [w, setW] = useState(360);

  // Logic resize
  useEffect(() => {
    const mm = (e) => {
      if (!isResizing) return;
      const newW = window.innerWidth - e.clientX;
      if (newW >= 280 && newW <= 600) {
        setW(newW);
        if (ref.current) ref.current.style.width = `${newW}px`;
      }
    };
    const mu = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };
    if (isResizing) {
      document.addEventListener("mousemove", mm);
      document.addEventListener("mouseup", mu);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", mm);
      document.removeEventListener("mouseup", mu);
    };
  }, [isResizing]);

  const md = (e) => {
    const rect = ref.current.getBoundingClientRect();
    if (e.clientX - rect.left <= 8) setIsResizing(true);
  };

  // handleDeleteClick
  const handleDeleteClick = (e, chatId) => {
    e.stopPropagation(); // Ngăn sự kiện click lan truyền lên onSelectChat
    if (window.confirm("Bạn có chắc chắn muốn xóa cuộc trò chuyện này?")) {
      onDeleteChat(chatId);
    }
  };

  return (
    <div
      ref={ref}
      className="ai-sidebar"
      style={{ width: `${w}px` }}
      onMouseDown={md}
    >
      <div className="ai-search">
        <input placeholder="Tìm kiếm..." />
        <button className="ai-search-clear">✕</button>
      </div>

      {/* Button NEW CHAT */}
      <div className="ai-newchat" onClick={onNewChat}>
        <span className="newchat-icon">✨</span>
        <span>Cuộc trò chuyện mới</span>
      </div>

      {/* Danh sách hội thoại */}
      <div className="ai-chatlist">
        <div className="ai-chat-section">
          <div className="ai-chat-section-title">LỊCH SỬ HỘI THOẠI</div>
          {chats.length === 0 ? (
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-muted)",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Bắt đầu cuộc trò chuyện đầu tiên!
            </p>
          ) : (
            // Reverse chat list
            chats
              .slice()
              .reverse()
              .map((chat) => (
                <div
                  key={chat.id}
                  className={`ai-chat-item ${
                    chat.id === activeChatId ? "active" : ""
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                  title={chat.title}
                >
                  <span className="ai-chat-title-text">{chat.title}</span>
                  {/* Nút XÓA (NEW) */}
                  <button
                    className="ai-chat-delete-btn"
                    onClick={(e) => handleDeleteClick(e, chat.id)}
                  >
                    ✕
                  </button>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Bot info */}
      <div className="ai-bot-mini">
        <div className="ai-bot-mini__head">
          <img src={bot?.avatar || AI_AVATAR} alt="bot" />
          <div className="ai-bot-mini__meta">
            <div className="ai-bot-mini__name">{bot?.name || "My AI"}</div>
            <div className="ai-bot-mini__desc">
              {(bot?.description || "").slice(0, 64)}
            </div>
          </div>
        </div>
      </div>

      <button
        className="button save-button"
        style={{ marginTop: "12px" }}
        onClick={onNavigate}
      >
        📚 My AI Knowledge
      </button>
    </div>
  );
};

// AIMainContent component
const AIMainContent = ({
  bot,
  user,
  question,
  setQuestion,
  messages, // Danh sách tin nhắn
  onAsk,
  asking,
  onPickSuggestion,
}) => {
  const messagesEndRef = useRef(null);
  const displayName = useMemo(
    () => user?.fullName || user?.username || "User",
    [user]
  );

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onAsk) onAsk();
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="ai-main">
      {/* Messages Container */}
      <div className="messages-container">
        <div className="messages-list">
          {/* Start screen */}
          {!hasMessages && (
            <div
              className="ai-start-screen"
              style={{ marginTop: "auto", textAlign: "center" }}
            >
              <div className="ai-avatar">
                <img src={bot?.avatar || AI_AVATAR} alt="AI avatar" />
              </div>
              <h2 className="ai-title">{bot?.name || "My AI"}</h2>
              <p className="ai-subtitle" style={{ marginBottom: "0" }}>
                {displayName} <span title="Thông tin người dùng">ⓘ</span>
              </p>
              <p className="ai-desc" style={{ marginBottom: "40px" }}>
                {bot?.description ||
                  "Bạn có thể hỏi mọi thứ liên quan học tập."}
              </p>

              {/* Suggestions */}
              <div
                className="ai-suggestions"
                style={{ margin: "0 auto", maxWidth: "600px" }}
              >
                {SUGGESTIONS.map((s) => (
                  <SuggestionButton
                    key={s}
                    text={s}
                    onClick={() => onPickSuggestion(s)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Chat messages */}
          {hasMessages &&
            messages.map((msg, index) => (
              <ChatMessage key={index} role={msg.role} content={msg.content} />
            ))}

          {/* Typing Indicator */}
          {asking && <TypingIndicator />}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input bar */}
      <div className="ai-input-bar">
        <span className="ai-plus">＋</span>
        <input
          placeholder="Hỏi gì cũng được..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={asking}
        />
        <button
          className="ai-mic" // Nút gửi
          onClick={() => onAsk && onAsk()}
          disabled={asking || question.trim() === ""}
        >
          {asking ? "⏳" : "➤"}
        </button>
      </div>
    </div>
  );
};

export default function MyAi() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Lấy userId từ URL params hoặc từ Clerk user
  const userId = searchParams.get('userId') || user?.id;

  const [bot, setBot] = useState(null);
  const [stack, setStack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // State chat
  const [chats, setChats] = useState([]); // Danh sách {id, title}
  const [activeChatId, setActiveChatId] = useState(null); // ID chat hiện tại
  const [messages, setMessages] = useState([]); // Tin nhắn của chat hiện tại

  // State Q&A
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  // startNewChat
  const startNewChat = useCallback(() => {
    if (!userId) {
      console.warn('Cannot start new chat: userId is undefined');
      return;
    }
    const newChatId = generateUniqueId();
    setActiveChatId(newChatId);
    setMessages([]);
    setQuestion("");
    // Add new chat to history (title will be updated later)
    setChats((prevChats) => {
      const newChat = { id: newChatId, title: "Cuộc trò chuyện mới" };
      const updatedChats = [...prevChats, newChat];
      saveChatHistory(userId, updatedChats);
      return updatedChats;
    });
  }, [userId]);

  // handleSelectChat
  const handleSelectChat = useCallback((chatId) => {
    setActiveChatId(chatId);
    const loadedMsgs = loadMessages(chatId);
    setMessages(loadedMsgs);
    setQuestion("");
    setAsking(false);
  }, []);

  // handleDeleteChat (NEW)
  const handleDeleteChat = useCallback(
    (chatId) => {
      if (!userId) {
        console.warn('Cannot delete chat: userId is undefined');
        return;
      }
      // 1. Xóa tin nhắn khỏi localStorage
      deleteMessages(chatId);

      // 2. Xóa chat khỏi state và localStorage history
      setChats((prevChats) => {
        const updatedChats = prevChats.filter((chat) => chat.id !== chatId);
        saveChatHistory(userId, updatedChats);

        // 3. Nếu xóa chat đang hoạt động
        if (chatId === activeChatId) {
          // Chọn chat mới nhất hoặc tạo chat mới
          if (updatedChats.length > 0) {
            const latestChat = updatedChats[updatedChats.length - 1];
            handleSelectChat(latestChat.id);
          } else {
            startNewChat();
          }
        }
        return updatedChats;
      });

      toast.success("Đã xóa cuộc trò chuyện!");
    },
    [userId, activeChatId, startNewChat, handleSelectChat]
  );

  // fetchData
  const fetchData = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Load Bot info
      let loadedBot = null;
      try {
        const botRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${userId}`
        );

        // API trả về một bot object (không phải array), hoặc null nếu không tìm thấy
        if (botRes.data && botRes.data.id) {
          loadedBot = botRes.data;
          setBot(loadedBot);
        }
      } catch (botErr) {
        console.warn("Lỗi khi tìm bot (coi như chưa có bot):", botErr.message);
      }

      // Load Stack if no Bot
      if (!loadedBot) {
        // Kiểm tra xem user đã thanh toán thành công chưa
        try {
          const paymentRes = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/payment/userid/${userId}`
          );
          const payments = paymentRes.data?.data || [];
          
          // Tìm payment completed với amount = 50000 (gói student)
          const hasCompletedPayment = payments.some(
            (p) => p.payment_status === 'completed' && p.payment_amount === 50000
          );

          if (hasCompletedPayment) {
            // Đã thanh toán nhưng chưa có bot -> redirect để tạo bot
            console.log('User đã thanh toán nhưng chưa tạo bot, redirect để tạo bot');
            navigate('/dashboard/knowledge/create-bot?payment=success', { replace: true });
            return;
          }
        } catch (paymentErr) {
          console.warn('Lỗi khi kiểm tra payment:', paymentErr.message);
        }

        // Chưa thanh toán -> load stack
        const stackRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/stack`
        );
        const raw = stackRes.data;
        const stacks = Array.isArray(raw) ? raw : raw.stacks || raw.data || [];
        const personal = pickStudentPersonalStack(stacks || []);
        setStack(personal || null);
      }

      // Load chat history (only if userId exists)
      if (userId) {
        const loadedChats = loadChatHistory(userId);
        setChats(loadedChats);

        // Select latest chat or start new one
        if (loadedChats.length > 0) {
          // Get the latest chat
          const latestChat = loadedChats[loadedChats.length - 1];
          handleSelectChat(latestChat.id);
        } else {
          startNewChat();
        }
      }
    } catch (err) {
      console.error("Lỗi tải My AI:", err);
      toast.error("Không thể tải My AI");
    } finally {
      setLoading(false);
    }
  }, [userId, setBot, setStack, startNewChat, handleSelectChat]);

  useEffect(() => {
    // Chỉ fetch data khi userId đã có
    if (!userId) {
      console.log('Waiting for userId to load...');
      return;
    }

    const p = new URLSearchParams(location.search);
    if (p.get("payment") === "failed")
      toast.error("Thanh toán thất bại hoặc đã hủy.");
    if (p.get("payment") === "success")
      toast.success("Kích hoạt gói thành công! Bot đã sẵn sàng.");
    if (p.get("payment") === "error")
      toast.error("Có lỗi khi xác thực thanh toán, vui lòng thử lại.");

    fetchData();
  }, [userId, fetchData, location.search]);

  // handleAskBot
  const handleAskBot = useCallback(
    async (qFromSuggestion) => {
      const text = (qFromSuggestion ?? question).trim();
      if (!text || !activeChatId) return;

      const id = bot?._id || bot?.id;
      if (!id) {
        toast.error("Không tìm thấy bot để gửi câu hỏi.");
        return;
      }

      // 1. Send User message
      const userMessage = { role: "user", content: text };
      setMessages((prev) => [...prev, userMessage]);

      // Clear input
      setQuestion("");

      try {
        setAsking(true);

        const url = `${
          import.meta.env.VITE_BE_URL
        }/api/aibot/${id}/${encodeURIComponent(text)}`;

        const res = await axios.get(url);

        const botResponseText =
          res?.data?.response?.response || res?.data?.response || "";

        const botMessage = {
          role: "assistant",
          content:
            botResponseText ||
            "Bot chưa có phản hồi hoặc trả về nội dung rỗng.",
        };

        // 2. Update Bot message and save
        setMessages((prev) => {
          const updatedMsgs = [...prev, botMessage];
          saveMessages(activeChatId, updatedMsgs);
          return updatedMsgs;
        });

        // 3. Update chat title if first message
        if (messages.length === 0 && userId) {
          setChats((prevChats) => {
            const updatedChats = prevChats.map((chat) =>
              chat.id === activeChatId
                ? {
                    ...chat,
                    title:
                      text.length > 30 ? text.substring(0, 30) + "..." : text,
                  }
                : chat
            );
            saveChatHistory(userId, updatedChats);
            return updatedChats;
          });
        }
      } catch (err) {
        console.error("[MyAi] Lỗi hỏi bot:", err);
        const errorMessage = {
          role: "assistant",
          content:
            "Xin lỗi, đã xảy ra lỗi khi kết nối đến AI. Vui lòng thử lại.",
        };
        // 2.1 Update error message and save
        setMessages((prev) => {
          const updatedMsgs = [...prev, errorMessage];
          saveMessages(activeChatId, updatedMsgs);
          return updatedMsgs;
        });
        toast.error("Không thể gửi câu hỏi cho bot.");
      } finally {
        setAsking(false);
      }
    },
    [bot, question, activeChatId, messages.length, userId]
  );

  // handlePickSuggestion
  const handlePickSuggestion = useCallback(
    (s) => {
      setQuestion(s);
      handleAskBot(s);
    },
    [handleAskBot]
  );

  // handleActivateStack
  const handleActivateStack = useCallback(
    async (selectedStack) => {
      try {
        setPaymentLoading(true);

        const be = import.meta.env.VITE_BE_URL;
        if (!be) {
          throw new Error("Thiếu cấu hình máy chủ (VITE_BE_URL)");
        }

        if (!userId || !selectedStack?._id) {
          throw new Error(
            `Thiếu thông tin ${!userId ? "người dùng" : "gói đăng ký"}`
          );
        }

        const paymentUrl = `${be}/api/payment`;
        const paymentData = {
          user_id: userId,
          stack_id: selectedStack._id,
        };

        const res = await axios.post(paymentUrl, paymentData);

        if (!res.data?.url) {
          console.error("[MyAi] Invalid response format:", res.data);
          throw new Error(
            "Không nhận được link thanh toán từ máy chủ. " +
              "Response data: " +
              JSON.stringify(res.data)
          );
        }

        window.location.href = res.data.url;
      } catch (err) {
        console.error("[MyAi] Payment initiation failed:", {
          error: err,
          response: err.response,
          stack: err.stack,
        });

        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể khởi tạo thanh toán";
        toast.error(message);

        if (err.message.includes("CORS")) {
          toast.error(
            "Lỗi kết nối tới máy chủ. Vui lòng kiểm tra CORS settings."
          );
        }
      } finally {
        setPaymentLoading(false);
      }
    },
    [userId]
  );

  // handleNavigateToKnowledge
  const handleNavigateToKnowledge = useCallback(() => {
    const id = bot?._id || bot?.id;
    if (id) navigate(`/dashboard/bot-knowledge/${id}`);
  }, [bot, navigate]);

  // Render
  if (loading) return <Loading />;

  // No bot -> show stack activation view
  if (!bot) {
    return (
      <NoBotView
        stack={stack}
        onActivate={handleActivateStack}
        isLoading={paymentLoading}
      />
    );
  }

  // Has bot -> show My AI chat interface
  return (
    <div className="ai-layout">
      <AIMainContent
        bot={bot}
        user={user}
        question={question}
        setQuestion={setQuestion}
        messages={messages}
        onAsk={handleAskBot}
        asking={asking}
        onPickSuggestion={handlePickSuggestion}
      />
      <AISidebar
        bot={bot}
        onNavigate={handleNavigateToKnowledge}
        chats={chats}
        onSelectChat={handleSelectChat}
        onNewChat={startNewChat}
        onDeleteChat={handleDeleteChat} // Gắn hàm xóa
        activeChatId={activeChatId}
      />
    </div>
  );
}
