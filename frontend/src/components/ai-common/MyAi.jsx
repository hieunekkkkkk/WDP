import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
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

const DEFAULT_AVATAR = "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
const AI_AVATAR = "https://icdn.dantri.com.vn/a3HWDOlTcvMNT73KRccc/Image/2013/05/3-904f5.jpg";

// Loading Component
const Loading = () => <div className="loading">Đang tải My AI...</div>;

// Suggestion Button Component
const SuggestionButton = React.memo(({ text, onClick }) => (
  <button className="ai-suggestion" onClick={onClick}>
    {text}
  </button>
));

SuggestionButton.displayName = "SuggestionButton";

// Stack Card Component
const StackCard = React.memo(({ stack, onActivate }) => (
  <div className="stack-card">
    <h3>{stack.stack_name}</h3>
    <p>{stack.stack_detail}</p>
    <div className="stack-price">{stack.stack_price}₫</div>
    <button className="button save-button" onClick={() => onActivate(stack)}>
      🔓 Kích hoạt gói này
    </button>
  </div>
));

StackCard.displayName = "StackCard";

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

// No Bot View Component
const NoBotView = ({ stacks, onActivate }) => (
  <div className="myai-container">
    <div className="myai-blur-background">
      <div className="myai-center">
        <img src={DEFAULT_AVATAR} alt="AI avatar" className="myai-avatar" />
        <h2 className="myai-title">My AI</h2>
        <p className="myai-desc">
          Bạn chưa có AI cá nhân. Hãy chọn gói bên dưới để kích hoạt.
        </p>
      </div>
    </div>

    <div className="stack-overlay">
      {stacks.length === 0 ? (
        <div className="stack-card">
          <h3>Không có dịch vụ khả dụng</h3>
        </div>
      ) : (
        stacks.slice(0, 3).map((stack) => (
          <StackCard key={stack._id} stack={stack} onActivate={onActivate} />
        ))
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
      
      // Min width: 280px, Max width: 600px
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
        if (sidebarRef.current) {
          sidebarRef.current.style.width = `${newWidth}px`;
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleMouseDown = (e) => {
    // Only trigger if clicking on the left edge (first 8px)
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
        <img src={AI_AVATAR} alt="AI avatar" />
      </div>
      <h2 className="ai-title">{bot.name || "My AI"}</h2>
      <p className="ai-subtitle">
        {displayName} <span title="Thông tin người dùng">ⓘ</span>
      </p>
      <p className="ai-desc">
        Effortlessly design anything: presentations, logos, social media posts
        and more.
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
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch bot and stacks data
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
        // If no bot, fetch available stack services
        const stackRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/stack`
        );
        const data = stackRes.data;
        const stackList = Array.isArray(data) ? data : data.stacks || [];
        setStacks(stackList);
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

  // Handle stack activation
  const handleActivateStack = useCallback((stack) => {
    toast.info("Tính năng kích hoạt AI sẽ được cập nhật sớm!");
    console.log("Activating stack:", stack);
  }, []);

  // Navigate to bot knowledge
  const handleNavigateToKnowledge = useCallback(() => {
    if (bot?._id) {
      navigate(`/dashboard/bot-knowledge/${bot._id}`);
    }
  }, [bot, navigate]);

  // Render loading state
  if (loading) return <Loading />;

  // Render no bot view
  if (!bot) {
    return <NoBotView stacks={stacks} onActivate={handleActivateStack} />;
  }

  // Render AI layout with bot
  return (
    <div className="ai-layout">
      <AIMainContent bot={bot} user={user} />
      <AISidebar bot={bot} onNavigate={handleNavigateToKnowledge} />
    </div>
  );
}