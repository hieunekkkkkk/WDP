import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import './style/MyAi.css';

// Constants
const SUGGESTIONS = [
  'How about an inspirational quote graphic for social me...',
  "I need a poster for our online store's seasonal sale",
  'Highlight my favorite hiking trail in a Facebook post',
  'Create an infographic showcasing the benefits of meditation...',
];

const CHAT_HISTORY = {
  Today: ['Brooklyn Sunrise Time', 'Manhattan Bus Comparisons'],
  Yesterday: [
    'Tax Assistance Request',
    'Quadratic Function Plot',
    'Toyota Names Poetry',
    'Urban Green Spaces',
  ],
};

const DEFAULT_AVATAR =
  'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';
const AI_AVATAR =
  'https://icdn.dantri.com.vn/a3HWDOlTcvMNT73KRccc/Image/2013/05/3-904f5.jpg';

// Loading Component
const Loading = () => <div className="loading">Đang tải My AI...</div>;

// Suggestion Button Component
const SuggestionButton = React.memo(({ text, onClick }) => (
  <button className="ai-suggestion" onClick={onClick}>
    {text}
  </button>
));

SuggestionButton.displayName = 'SuggestionButton';

// Chat Item Component
const ChatItem = React.memo(({ chat, isActive }) => (
  <div className={`ai-chat-item ${isActive ? 'active' : ''}`}>
    {chat}
    {isActive && <span className="ai-chat-arrow">↗</span>}
  </div>
));

ChatItem.displayName = 'ChatItem';

// Chat Section Component
const ChatSection = React.memo(({ section, items, activeChat }) => (
  <div className="ai-chat-section">
    <div className="ai-chat-section-title">{section}</div>
    {items.map((chat, i) => (
      <ChatItem key={i} chat={chat} isActive={chat === activeChat} />
    ))}
  </div>
));

ChatSection.displayName = 'ChatSection';

const PriorityTimer = ({ updatedAt }) => {
  const [remainingTime, setRemainingTime] = useState('');

  useEffect(() => {
    if (!updatedAt) return;

    const interval = setInterval(() => {
      // Tính 1 giờ sau khi updated_at
      const expirationTime = new Date(updatedAt).getTime() + 60 * 60 * 1000;
      const now = Date.now();
      const diff = expirationTime - now;

      if (diff <= 0) {
        setRemainingTime('Đã hết hạn');
        clearInterval(interval);
        return;
      }

      // Tính phút và giây còn lại
      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setRemainingTime(
        `Còn lại: ${String(minutes).padStart(2, '0')} phút ${String(
          seconds
        ).padStart(2, '0')} giây`
      );
    }, 1000); // Cập nhật mỗi giây

    return () => clearInterval(interval); // Cleanup khi component unmount
  }, [updatedAt]);

  if (!remainingTime) return null;

  return (
    <div
      className="stack-expiration-info"
      style={{
        marginBottom: '10px',
        fontSize: '14px',
        color: remainingTime === 'Đã hết hạn' ? '#dc3545' : '#28a745', // Đỏ nếu hết hạn, xanh nếu còn
        fontWeight: '500',
      }}
    >
      {remainingTime}
    </div>
  );
};

// No Bot View Component - Stack Cards Display
const NoBotView = ({ stacks = [], onActivate, isActivating, businessInfo }) => (
  <div className="myai-container">
    {/* Blurred background content */}
    <div className="myai-blur-content">
      <div className="myai-center">
        <img src={DEFAULT_AVATAR} alt="AI avatar" className="myai-avatar" />
        <h2 className="myai-title">My AI</h2>
        <p className="myai-desc">
          Bạn chưa có AI cá nhân. Hãy chọn một trong các gói dưới đây để sử
          dụng.
        </p>
      </div>
    </div>

    <div className="stack-overlay">
      {stacks.length === 0 ? (
        <div className="stack-card">
          <h3>Không tìm thấy gói AI nào</h3>
          <p>Vui lòng liên hệ quản trị viên</p>
        </div>
      ) : (
        <div className="stack-cards-container">
          {stacks.map((stack, index) => {
            // --- 2. LOGIC ĐIỀU KIỆN MỚI ---
            const isPriorityStack =
              stack.stack_name.toLowerCase() === 'tăng view cho doanh nghiệp';
            const hasPriority =
              businessInfo && businessInfo.business_priority > 0;
            const showPriorityInfo = isPriorityStack && hasPriority;

            // Xác định văn bản nút
            let buttonText = isActivating
              ? 'Đang xử lý...'
              : '🔓 Kích hoạt gói này';
            if (showPriorityInfo && !isActivating) {
              buttonText = `Đã mua ${businessInfo.business_priority} lần, mua thêm?`;
            }

            return (
              <div key={stack._id || index} className="stack-card">
                <h3>{stack.stack_name}</h3>
                <p>{stack.stack_detail}</p>
                <div className="stack-price">
                  {Number(stack.stack_price).toLocaleString()}₫
                </div>
                {showPriorityInfo && (
                  <PriorityTimer updatedAt={businessInfo.updated_at} />
                )}
                <button
                  className="stack-activate-btn"
                  onClick={() => onActivate(stack)}
                  disabled={isActivating}
                >
                  {buttonText} {/* <-- 3. Sử dụng văn bản nút động */}
                </button>
              </div>
            );
          })}
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
        style={{ marginTop: 'auto' }}
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
    () => user?.fullName || user?.username || 'User',
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
      <h2 className="ai-title">{bot.name || 'My AI'}</h2>
      <p className="ai-subtitle">
        {displayName} <span title="Thông tin người dùng">ⓘ</span>
      </p>
      <p className="ai-desc">
        {bot.description ||
          'Effortlessly design anything: presentations, logos, social media posts and more.'}
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
  const [isActivating, setIsActivating] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const botRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
      );

      if (botRes.data?.length > 0) {
        setBot(botRes.data[0]);
      } else {
        const stackRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/stack`
        );
        const data = stackRes.data;
        const stackList = Array.isArray(data) ? data : data.stacks || [];

        const filteredStacks = stackList.filter(
          (stack) =>
            stack.stack_name.toLowerCase() ===
              'dịch vụ tăng kéo view  hiếu béo pro' ||
            stack.stack_name.toLowerCase() === 'bot tư vấn viên'
        );

        setStacks(filteredStacks);

        try {
          const bizRes = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/owner/${user.id}`
          );
          if (bizRes.data && bizRes.data.length > 0) {
            setBusinessInfo(bizRes.data[0]); // Lưu thông tin business đầu tiên
          }
        } catch (bizErr) {
          // Không phải lỗi nghiêm trọng, user có thể chưa có business
          console.warn('Không tìm thấy thông tin business:', bizErr.message);
          setBusinessInfo(null); // Đảm bảo businessInfo là null nếu lỗi
        }
        // --- KẾT THÚC CẬP NHẬT FETCHDATA ---
      }
    } catch (err) {
      console.error('❌ Lỗi khi tải My AI:', err);
      toast.error('Không thể tải dữ liệu My AI');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleActivateStack = useCallback(
    async (selectedStack) => {
      if (isActivating) return;
      try {
        setIsActivating(true);
        console.log('[MyAi] handleActivateStack called with:', selectedStack);

        const be = import.meta.env.VITE_BE_URL;
        console.log('[MyAi] Backend URL:', be);

        if (!be) {
          throw new Error('Thiếu cấu hình máy chủ (VITE_BE_URL)');
        }

        console.log('[MyAi] User info:', {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
        });

        console.log('[MyAi] Stack info:', {
          id: selectedStack?._id,
          name: selectedStack?.stack_name,
          price: selectedStack?.stack_price,
        });

        if (!user?.id || !selectedStack?._id) {
          throw new Error(
            `Thiếu thông tin ${!user?.id ? 'người dùng' : 'gói đăng ký'}`
          );
        }

        const paymentUrl = `${be}/api/payment`;
        const paymentData = {
          user_id: user.id,
          stack_id: selectedStack._id,
        };

        console.log('[MyAi] Calling payment API:', {
          url: paymentUrl,
          data: paymentData,
        });

        const res = await axios.post(paymentUrl, paymentData);

        console.log('[MyAi] Payment API full response:', {
          status: res.status,
          headers: res.headers,
          data: res.data,
        });

        if (!res.data?.url) {
          console.error('[MyAi] Invalid response format:', res.data);
          throw new Error(
            'Không nhận được link thanh toán từ máy chủ. ' +
              'Response data: ' +
              JSON.stringify(res.data)
          );
        }

        console.log('[MyAi] Redirecting to payment URL:', res.data.url);
        window.location.href = res.data.url;
      } catch (err) {
        console.error('[MyAi] Payment initiation failed:', {
          error: err,
          response: err.response,
          stack: err.stack,
        });

        const message =
          err.response?.data?.message ||
          err.message ||
          'Không thể khởi tạo thanh toán';
        toast.error(message);

        if (err.message.includes('CORS')) {
          toast.error(
            'Lỗi kết nối tới máy chủ. Vui lòng kiểm tra CORS settings.'
          );
        }
      } finally {
        setIsActivating(false);
      }
    },
    [user?.id, user?.firstName, user?.lastName, isActivating]
  );

  const handleNavigateToKnowledge = useCallback(() => {
    if (bot?._id) {
      navigate(`/dashboard/bot-knowledge/${bot._id}`);
    }
  }, [bot, navigate]);

  if (loading) return <Loading />;

  if (!bot) {
    return (
      <NoBotView
        stacks={stacks}
        onActivate={handleActivateStack}
        isActivating={isActivating}
        businessInfo={businessInfo}
      />
    );
  }

  // Show AI chat interface if user has bot
  return (
    <div className="ai-layout">
      <AIMainContent bot={bot} user={user} />
      <AISidebar onNavigate={handleNavigateToKnowledge} />
    </div>
  );
}
