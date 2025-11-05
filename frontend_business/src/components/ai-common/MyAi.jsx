import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./style/MyAi.css";

const DEFAULT_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/4712/4712035.png";

// Loading Component
const Loading = () => <div className="loading">Đang tải My AI...</div>;

// Priority Timer cho gói đặc biệt
const PriorityTimer = ({ updatedAt }) => {
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    if (!updatedAt) return;

    const interval = setInterval(() => {
      const expirationTime = new Date(updatedAt).getTime() + 60 * 60 * 1000;
      const now = Date.now();
      const diff = expirationTime - now;

      if (diff <= 0) {
        setRemainingTime("Đã hết hạn");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor((diff / 1000 / 60) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setRemainingTime(
        `Còn lại: ${String(minutes).padStart(2, "0")} phút ${String(
          seconds
        ).padStart(2, "0")} giây`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [updatedAt]);

  if (!remainingTime) return null;

  return (
    <div
      className="stack-expiration-info"
      style={{
        marginBottom: "10px",
        fontSize: "14px",
        color: remainingTime === "Đã hết hạn" ? "#dc3545" : "#28a745",
        fontWeight: "500",
      }}
    >
      {remainingTime}
    </div>
  );
};

// No Bot View (hiển thị danh sách gói)
const NoBotView = ({ stacks = [], onActivate, isActivating, businessInfo }) => (
  <div className="myai-container">
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
            const isPriorityStack =
              stack.stack_name.toLowerCase() === "tăng view cho doanh nghiệp";
            const hasPriority =
              businessInfo && businessInfo.business_priority > 0;
            const showPriorityInfo = isPriorityStack && hasPriority;

            let buttonText = isActivating
              ? "Đang xử lý..."
              : "🔓 Kích hoạt gói này";
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
                  {buttonText}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
);

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

      // Lấy bot của user
      const botRes = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
      );

      if (botRes.data?.length > 0) {
        const userBot = botRes.data[0];
        setBot(userBot);
        navigate(`/business-dashboard/bot-knowledge/${userBot._id}`);
      } else {
        // Lấy danh sách stack
        const stackRes = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/stack`
        );
        const data = stackRes.data;
        const stackList = Array.isArray(data) ? data : data.stacks || [];

        const filteredStacks = stackList.filter(
          (stack) =>
            // stack.stack_name.toLowerCase() === 'tăng view cho doanh nghiệp' ||
            stack.stack_name.toLowerCase() === 'bot tư vấn viên'
        );

        setStacks(filteredStacks);

        // Lấy thông tin business
        try {
          const bizRes = await axios.get(
            `${import.meta.env.VITE_BE_URL}/api/business/owner/${user.id}`
          );
          if (bizRes.data && bizRes.data.length > 0) {
            setBusinessInfo(bizRes.data[0]);
          }
        } catch (bizErr) {
          console.warn("Không tìm thấy thông tin business:", bizErr.message);
          setBusinessInfo(null);
        }
      }
    } catch (err) {
      console.error("❌ Lỗi khi tải My AI:", err);
      toast.error("Không thể tải dữ liệu My AI");
    } finally {
      setLoading(false);
    }
  }, [user?.id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Xử lý kích hoạt stack (thanh toán)
  const handleActivateStack = useCallback(
    async (selectedStack) => {
      if (isActivating) return;
      try {
        setIsActivating(true);

        const be = import.meta.env.VITE_BE_URL;
        const paymentUrl = `${be}/api/payment`;
        const paymentData = {
          user_id: user.id,
          stack_id: selectedStack._id,
        };

        const res = await axios.post(paymentUrl, paymentData);

        if (!res.data?.url) {
          throw new Error("Không nhận được link thanh toán từ máy chủ");
        }

        window.location.href = res.data.url;
      } catch (err) {
        console.error("Lỗi thanh toán:", err);
        const message =
          err.response?.data?.message ||
          err.message ||
          "Không thể khởi tạo thanh toán";
        toast.error(message);
      } finally {
        setIsActivating(false);
      }
    },
    [user?.id, isActivating]
  );

  if (loading) return <Loading />;

  // Nếu chưa có bot → hiển thị chọn gói
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

  return (
    <div className="myai-container">
      <div className="myai-center">
        <img src={DEFAULT_AVATAR} alt="AI avatar" className="myai-avatar" />
        <h2 className="myai-title">{bot.name || "My AI"}</h2>
        <p className="myai-desc">{bot.description || "AI cá nhân của bạn."}</p>
      </div>
    </div>
  );
}
