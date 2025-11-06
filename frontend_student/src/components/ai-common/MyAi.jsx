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
  "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";
const AI_AVATAR =
  "https://icdn.dantri.com.vn/a3HWDOlTcvMNT73KRccc/Image/2013/05/3-904f5.jpg";

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

// Small UI bits (không thay đổi layout tổng thể)
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

const SuggestionButton = React.memo(({ text, onClick }) => (
  <button className="ai-suggestion" onClick={onClick}>
    {text}
  </button>
));

// Khi chưa có bot => hiển thị đúng 1 gói cho sinh viên
const NoBotView = ({ stack, onActivate }) => (
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
            <div className="stack-feature">✓ Tạo đề cương</div>
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
          >
            🎓 Kích hoạt ngay
          </button>
        </div>
      )}
    </div>
  </div>
);

// Sidebar chat (giữ class UI cũ)
const AISidebar = ({ bot, onNavigate }) => {
  const ref = useRef(null);
  const [isResizing, setIsResizing] = useState(false);
  const [w, setW] = useState(360);

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
      <div className="ai-newchat">
        <span className="newchat-icon">✨</span>
        <span>Cuộc trò chuyện mới</span>
      </div>

      {/* Bot info nhỏ ở cuối */}
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
        style={{ marginTop: "auto" }}
        onClick={onNavigate}
      >
        📚 My AI Knowledge
      </button>
    </div>
  );
};

// Khu vực chính khi đã có bot
const AIMainContent = ({ bot, user }) => {
  const displayName = useMemo(
    () => user?.fullName || user?.username || "User",
    [user]
  );
  const onPick = useCallback((s) => toast.info(`Đã chọn: ${s}`), []);
  return (
    <div className="ai-main">
      <div className="ai-avatar">
        <img src={bot?.avatar || AI_AVATAR} alt="AI avatar" />
      </div>
      <h2 className="ai-title">{bot?.name || "My AI"}</h2>
      <p className="ai-subtitle">
        {displayName} <span title="Thông tin người dùng">ⓘ</span>
      </p>
      <p className="ai-desc">
        {bot?.description || "Bạn có thể hỏi mọi thứ liên quan học tập."}
      </p>
      <div className="ai-suggestions">
        {SUGGESTIONS.map((s) => (
          <SuggestionButton key={s} text={s} onClick={() => onPick(s)} />
        ))}
      </div>
      <div className="ai-input-bar">
        <span className="ai-plus">＋</span>
        <input placeholder="Hỏi gì cũng được..." />
        <button className="ai-mic">🎤</button>
      </div>
    </div>
  );
};

export default function MyAi() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const [bot, setBot] = useState(null);
  const [stack, setStack] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      console.log(user.id);

      // 1) Kiểm tra user đã có bot hay chưa
      //    BE cần hỗ trợ GET /api/aibot/owner/:userId
      const botRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
      );
      if (Array.isArray(botRes.data) && botRes.data.length > 0) {
        setBot(botRes.data[0]);
        return;
      }

      // 2) Chưa có bot => chỉ hiển thị 1 gói duy nhất “Bot hỗ trợ cá nhân”
      const stackRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/stack`
      );
      const raw = stackRes.data;
      console.log(stackRes);
      const stacks = Array.isArray(raw) ? raw : raw.stacks || raw.data || [];
      const personal = pickStudentPersonalStack(stacks || []);
      setStack(personal || null);
    } catch (err) {
      console.error("Lỗi tải My AI:", err);
      toast.error("Không thể tải My AI");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    const p = new URLSearchParams(location.search);
    if (p.get("payment") === "failed")
      toast.error("Thanh toán thất bại hoặc đã hủy.");
    if (p.get("payment") === "success")
      toast.success("Kích hoạt gói thành công! Bot đã sẵn sàng.");
    if (p.get("payment") === "error")
      toast.error("Có lỗi khi xác thực thanh toán, vui lòng thử lại.");

    fetchData();
  }, [fetchData, location.search]);
  // start flow payment
  // Bấm thanh toán -> tạo link PayOS
  const handleActivateStack = useCallback(
    async (selectedStack) => {
      try {
        // 1) Log bắt đầu function
        console.log("[MyAi] handleActivateStack called with:", selectedStack);

        // 2) Kiểm tra VITE_BE_URL
        const be = import.meta.env.VITE_BE_URL;
        console.log("[MyAi] Backend URL:", be);

        if (!be) {
          throw new Error("Thiếu cấu hình máy chủ (VITE_BE_URL)");
        }

        // 3) Kiểm tra user và stack
        console.log("[MyAi] User info:", {
          id: user?.id,
          firstName: user?.firstName,
          lastName: user?.lastName,
        });

        console.log("[MyAi] Stack info:", {
          id: selectedStack?._id,
          name: selectedStack?.stack_name,
          price: selectedStack?.stack_price,
        });

        if (!user?.id || !selectedStack?._id) {
          throw new Error(
            `Thiếu thông tin ${!user?.id ? "người dùng" : "gói đăng ký"}`
          );
        }

        // 4) Gọi API tạo payment
        const paymentUrl = `${be}/api/payment`;
        const paymentData = {
          user_id: user.id,
          stack_id: selectedStack._id,
        };

        console.log("[MyAi] Calling payment API:", {
          url: paymentUrl,
          data: paymentData,
        });

        const res = await axios.post(paymentUrl, paymentData);

        // 5) Log response đầy đủ
        console.log("[MyAi] Payment API full response:", {
          status: res.status,
          headers: res.headers,
          data: res.data,
        });

        // 6) Validate response URL
        if (!res.data?.url) {
          console.error("[MyAi] Invalid response format:", res.data);
          throw new Error(
            "Không nhận được link thanh toán từ máy chủ. " +
              "Response data: " +
              JSON.stringify(res.data)
          );
        }

        // 7) Chuyển hướng với window.open
        console.log("[MyAi] Redirecting to payment URL:", res.data.url);
        window.location.href = res.data.url;
      } catch (err) {
        // 8) Log lỗi chi tiết
        console.error("[MyAi] Payment initiation failed:", {
          error: err,
          response: err.response,
          stack: err.stack,
        });

        // 9) Toast với message rõ ràng
        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể khởi tạo thanh toán";
        toast.error(message);

        // 10) Thông báo thêm nếu là lỗi CORS
        if (err.message.includes("CORS")) {
          toast.error(
            "Lỗi kết nối tới máy chủ. Vui lòng kiểm tra CORS settings."
          );
        }
      }
    },
    [user?.id, user?.firstName, user?.lastName]
  );

  const handleNavigateToKnowledge = useCallback(() => {
    const id = bot?._id || bot?.id;
    if (id) navigate(`/dashboard/bot-knowledge/${id}`);
  }, [bot, navigate]);

  // Render
  if (loading) return <Loading />;

  // Chưa có bot -> chỉ thấy đúng 1 gói
  if (!bot) {
    return <NoBotView stack={stack} onActivate={handleActivateStack} />;
  }

  // Đã có bot -> giao diện My AI
  return (
    <div className="ai-layout">
      <AIMainContent bot={bot} user={user} />
      <AISidebar bot={bot} onNavigate={handleNavigateToKnowledge} />
    </div>
  );
}
