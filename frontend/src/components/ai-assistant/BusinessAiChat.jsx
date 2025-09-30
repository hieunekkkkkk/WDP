import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";


const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh",
    backgroundColor: "#f8fafc", // Slightly different background
    padding: "24px",
    borderRadius: "12px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "35px",
    backgroundColor: "#ffffff",
    borderRadius: "16px",
    boxShadow: "0 8px 16px rgba(0, 0, 0, 0.08)", // More subtle shadow
    border: "1px solid #e2e8f0", // Subtle border
  },
  loadingText: {
    marginTop: "18px",
    fontSize: "17px",
    color: "#334155", // More business-like color
    fontWeight: "500",
    fontFamily: "'Inter', sans-serif",
  },
  spinner: {
    width: "45px",
    height: "45px",
    border: "4px solid #f1f5f9",
    borderTop: "4px solid #0284c7", // Business blue color
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  emptyContainer: {
    padding: "48px",
    backgroundColor: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "16px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.06)",
    maxWidth: "550px",
    width: "100%",
  },
  emptyTitle: {
    fontSize: "28px",
    fontWeight: "700",
    color: "#0f172a", // Dark business blue
    marginBottom: "16px",
    fontFamily: "'Inter', sans-serif",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
  },
  emptyMessage: {
    fontSize: "16px",
    color: "#475569", // Business gray
    lineHeight: "1.6",
    fontFamily: "'Inter', sans-serif",
  },
  businessBadge: {
    backgroundColor: "#0284c7", // Business blue
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "20px",
    display: "inline-block",
  },
};

// Spinner animation styles
const SpinnerStyles = () => (
  <style>
    {`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .business-spinner {
            width: 45px;
            height: 45px;
            border: 4px solid #f1f5f9;
            border-top: 4px solid #0284c7;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        `}
  </style>
);

const BusinessAiChat = ({ businessId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState(null);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }

    const fetchBot = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${businessId}`
        );

        if (res.data?.length > 0) {
          const bizBot = res.data[0];
          setBot(bizBot);
          navigate(`/dashboard/bot-knowledge/${bizBot._id}`);
          return;
        }
        setBot(null);
      } catch (err) {
        console.error("Error fetching business bot:", err);
        setBot(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [businessId, navigate]);

  if (loading) {
    return (
      <div style={styles.container}>
        <SpinnerStyles />
        <div style={styles.loadingContainer}>
          <div className="business-spinner" />
          <p style={styles.loadingText}>Đang tải Business AI Bot...</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyContainer}>
          <span style={styles.businessBadge}>Business AI</span>
          <h2 style={styles.emptyTitle}>
            <span role="img" aria-label="business">
              💼
            </span>
            Business Bot
          </h2>
          <p style={styles.emptyMessage}>
            Doanh nghiệp của bạn chưa có bot AI nào được liên kết. <br />
            Vui lòng <strong>liên hệ quản trị viên</strong> để được cấp quyền sử
            dụng bot và bắt đầu tương tác với khách hàng.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default BusinessAiChat;
