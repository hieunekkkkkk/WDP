import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";

const StudentAiChat = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState(null);

  useEffect(() => {
    const fetchBot = async () => {
      if (!user) return;
      try {
        console.log(user.id);
        const res = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/aibot/owner/${user.id}`
        );
        if (res.data && res.data.length > 0) {
          setBot(res.data[0]); // mỗi user chỉ có 1 bot
          // ✅ điều hướng luôn sang KnowledgePage
          navigate(`/dashboard/bot-knowledge/${res.data[0]._id}`);
        } else {
          setBot(null);
        }
      } catch (err) {
        console.error("Error fetching bot:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBot();
  }, [user, navigate]);

  if (loading) return <p>Đang tải...</p>;

  if (!bot) {
    return (
      <div style={{ padding: "20px" }}>
        <h2>🤖 AI Bot</h2>
        <p>Bạn chưa có bot nào. Vui lòng liên hệ admin để được cấp bot.</p>
      </div>
    );
  }

  return null;
};

export default StudentAiChat;
