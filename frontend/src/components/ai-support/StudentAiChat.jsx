import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

// Định nghĩa các đối tượng style
const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "80vh", // Chiếm phần lớn chiều cao màn hình
    backgroundColor: "#f9fafb", // Nền xám nhạt
    padding: "20px",
    borderRadius: "8px",
  },
  loadingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "30px",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
  },
  loadingText: {
    marginTop: "15px",
    fontSize: "16px",
    color: "#4b5563",
    fontWeight: "500",
  },
  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #f3f3f3",
    borderTop: "4px solid #4f46e5",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  emptyContainer: {
    padding: "40px",
    backgroundColor: "#ffffff",
    border: "2px dashed #d1d5db",
    borderRadius: "12px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
  },
  emptyTitle: {
    fontSize: "24px",
    fontWeight: "700",
    color: "#1f2937", // gray-800
    marginBottom: "10px",
  },
  emptyMessage: {
    fontSize: "16px",
    color: "#6b7280", // gray-500
    lineHeight: "1.5",
  },
};

// Định nghĩa keyframes spinner cho trường hợp bạn sử dụng CSS Module hoặc Global CSS
const SpinnerStyles = () => (
  <style>
    {`
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .ai-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4f46e5;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        `}
  </style>
);

const StudentAiChat = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState(null);

  // Memoize the fetch function to stabilize the useEffect dependency
  const fetchBot = useCallback(async () => {
    // Kiểm tra user.id trước khi gọi API
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
      );
      console.log(user.id);
      console.log(res.data);

      if (res.data?.length > 0) {
        const userBot = res.data[0];
        setBot(userBot);
        navigate(`/dashboard/bot-knowledge/${userBot._id}`);
        return;
      }
      setBot(null);
    } catch (err) {
      console.error(" Error fetching bot:", err);
      setBot(null);
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user === undefined) return;

    if (user === null) {
      setLoading(false);
      return;
    }

    fetchBot();
  }, [user, fetchBot]);

  if (loading) {
    return (
      <div style={styles.container}>
        <SpinnerStyles />
        <div style={styles.loadingContainer}>
          <div className="ai-spinner" />
          <p style={styles.loadingText}>Đang tải bot của bạn...</p>
        </div>
      </div>
    );
  }

  if (!bot) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyContainer}>
          <h2 style={styles.emptyTitle}>
            <span role="img" aria-label="robot">
              🤖
            </span>{" "}
            AI Bot
          </h2>
          <p style={styles.emptyMessage}>
            Bạn chưa có bot nào được liên kết với tài khoản này. <br />
            Vui lòng **liên hệ quản trị viên** để được cấp bot và bắt đầu sử
            dụng.
          </p>
        </div>
      </div>
    );
  }

  return null;
};

export default StudentAiChat;
