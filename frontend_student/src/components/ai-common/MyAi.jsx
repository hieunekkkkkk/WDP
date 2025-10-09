import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./style/MyAi.css";

// Constants
const SUGGESTIONS = [
  "How about an inspirational quote graphic for social me...",
  "I need a poster for our online store's seasonal sale",
  "Highlight my favorite hiking trail in a Facebook post",
  "Create an infographic showcasing the benefits of meditation...",
];

const CHAT_HISTORY = {
  Today: ["Brooklyn Sunrise Time", "Manhattan Bus Comparisons"],
  Yesterday: [
    "Tax Assistance Request",
    "Quadratic Function Plot",
    "Toyota Names Poetry",
    "Urban Green Spaces",
  ],
};

const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
const AI_AVATAR =
  "https://icdn.dantri.com.vn/a3HWDOlTcvMNT73KRccc/Image/2013/05/3-904f5.jpg";

// Loading Component
const Loading = () => <div className="loading">Đang tải My AI...</div>;

// Suggestion Button Component
const SuggestionButton = React.memo(({ text, onClick }) => (
  <button className="ai-suggestion" onClick={onClick}>
    {text}
  </button>
));

SuggestionButton.displayName = "SuggestionButton";

// Chat Item Component
const ChatItem = React.memo(({ chat, isActive }) => (
  <div className={`ai-chat-item ${isActive ? "active" : ""}`}>
    {chat}
    {isActive && <span className="ai-chat-arrow">↗</span>}
  </div>
));

ChatItem.displayName = "ChatItem";

// Chat Section Component
const ChatSection = React.memo(({ section, items, activeChat }) => (
  <div className="ai-chat-section">
    <div className="ai-chat-section-title">{section}</div>
    {items.map((chat, i) => (
      <ChatItem key={i} chat={chat} isActive={chat === activeChat} />
    ))}
  </div>
));

ChatSection.displayName = "ChatSection";

// No Bot View Component - Single Card in Center
const NoBotView = ({ stack, onActivate }) => (
  <div className="myai-container">
    {/* Blurred background content */}
    <div className="myai-blur-content">
      <div className="myai-center">
        <img src={DEFAULT_AVATAR} alt="AI avatar" className="myai-avatar" />
        <h2 className="myai-title">My AI</h2>
        <p className="myai-desc">
          Bạn chưa có AI cá nhân. Hãy kích hoạt gói bên dưới để sử dụng.
        </p>
      </div>
    </div>

    {/* Single centered stack card overlay */}
    <div className="stack-overlay">
      {!stack ? (
        <div className="stack-card">
          <h3>Không tìm thấy gói "Bot hỗ trợ cá nhân"</h3>
          <p>Vui lòng liên hệ quản trị viên</p>
        </div>
      ) : (
        <div className="stack-card">
          <h3>{stack.stack_name}</h3>
          <p>{stack.stack_detail}</p>
          <div className="stack-price">
            {stack.stack_price.toLocaleString()}₫
          </div>
          <button
            className="stack-activate-btn"
            onClick={() => onActivate(stack)}
          >
            🔓 Kích hoạt gói này
          </button>
        </div>
      )}
    </div>
  </div>
);

// AI Sidebar Component with Resize
const AISidebar = ({ bot, onNavigate }) => {
  const sidebarRef = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = window.innerWidth - e.clientX;

      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${newWidth}px`;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = "default";
      document.body.style.userSelect = "auto";
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ew-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    const rect = sidebarRef.current.getBoundingClientRect();
    if (e.clientX - rect.left <= 8) {
      setIsResizing(true);
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="ai-sidebar"
      style={{ width: `${sidebarWidth}px` }}
      onMouseDown={handleMouseDown}
    >
      <div className="ai-search">
        <input placeholder="Search chats..." />
        <button className="ai-close">✕</button>
      </div>
      <div className="ai-newchat">New chat</div>

      <div className="ai-chatlist">
        {Object.entries(CHAT_HISTORY).map(([section, items]) => (
          <ChatSection
            key={section}
            section={section}
            items={items}
            activeChat="Manhattan Bus Comparisons"
          />
        ))}
      </div>

      {/* Only show Knowledge button when user has AI */}
      <button
        className="button save-button"
        style={{ marginTop: "auto" }}
        onClick={onNavigate}
      >
        📚 My AI Knowledge
      </button>
    </div>
  );
};

// AI Main Content Component
const AIMainContent = ({ bot, user }) => {
  const displayName = useMemo(
    () => user?.fullName || user?.username || "User",
    [user]
  );

  const handleSuggestionClick = useCallback((suggestion) => {
    toast.info(`Đã chọn: ${suggestion}`);
  }, []);

  return (
    <div className="ai-main">
      <div className="ai-avatar">
        <img src={bot.avatar || AI_AVATAR} alt="AI avatar" />
      </div>
      <h2 className="ai-title">{bot.name || "My AI"}</h2>
      <p className="ai-subtitle">
        {displayName} <span title="Thông tin người dùng">ⓘ</span>
      </p>
      <p className="ai-desc">
        {bot.description ||
          "Effortlessly design anything: presentations, logos, social media posts and more."}
      </p>

      <div className="ai-suggestions">
        {SUGGESTIONS.map((suggestion, i) => (
          <SuggestionButton
            key={i}
            text={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
          />
        ))}
      </div>

      <div className="ai-input-bar">
        <span className="ai-plus">＋</span>
        <input placeholder="Ask anything..." />
        <button className="ai-mic">🎤</button>
      </div>
    </div>
  );
};

// Main Component
export default function MyAi() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [bot, setBot] = useState(null);
  const [stack, setStack] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Check if user has AI bot
      const botRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
      );

      if (botRes.data?.length > 0) {
        setBot(botRes.data[0]);
      } else {
        // Fetch stack services and find "Bot hỗ trợ cá nhân"
        const stackRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/stack`
        );
        const data = stackRes.data;
        const stackList = Array.isArray(data) ? data : data.stacks || [];

        // Find the specific stack
        const personalBotStack = stackList.find(
          (s) => s.stack_name.trim() === "Bot hỗ trợ cá nhân"
        );

        setStack(personalBotStack || null);
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải My AI:", err);
      toast.error("Không thể tải dữ liệu My AI");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActivateStack = useCallback((selectedStack) => {
    toast.info("Tính năng kích hoạt AI sẽ được cập nhật sớm!");
    console.log("Activating stack:", selectedStack);
  }, []);

  const handleNavigateToKnowledge = useCallback(() => {
    if (bot?._id) {
      navigate(`/dashboard/bot-knowledge/${bot._id}`);
    }
  }, [bot, navigate]);

  if (loading) return <Loading />;

  // Show activation view if no bot
  if (!bot) {
    return <NoBotView stack={stack} onActivate={handleActivateStack} />;
  }

  // Show AI chat interface if user has bot
  return (
    <div className="ai-layout">
      <AIMainContent bot={bot} user={user} />
      <AISidebar bot={bot} onNavigate={handleNavigateToKnowledge} />
    </div>
  );
}
