import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getCurrentUserRole } from "../utils/useCurrentUserRole";

/**
 * Trang này là đích BE redirect sau PayOS callback:
 *  - Kiểm tra lịch sử thanh toán của user:
 *      + Nếu có payment_status === "completed" -> cấp bot + tạo knowledge mặc định -> điều hướng /my-ai?payment=success
 *      + Nếu không -> điều hướng /my-ai?payment=failed (sinh viên vẫn chỉ thấy 1 gói)
 *  - Logic idempotent: nếu đã có bot/knowledge thì bỏ qua tạo mới
 */

const UserPayComplete = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  // Đảm bảo user có 1 bot (nếu chưa thì tạo)
  const ensureStudentBot = async (userId) => {
    const be = import.meta.env.VITE_BE_URL;

    // Nếu đã có bot -> lấy bot đầu tiên
    const got = await axios.get(`${be}/api/aibot/owner/${userId}`);
    if (Array.isArray(got.data) && got.data.length > 0) return got.data[0];

    // Chưa có -> tạo mới
    const created = await axios.post(`${be}/api/aibot`, {
      owner_id: userId,
      name: "AI học tập của tôi",
      description: "Trợ lý AI hỗ trợ học tập cho sinh viên",
      status: "active",
    });
    return created.data;
  };

  // Tạo knowledge mặc định nếu chưa có
  const ensureDefaultKnowledge = async (botId) => {
    try {
      const be = import.meta.env.VITE_BE_URL;

      // Lấy toàn bộ knowledge rồi filter theo botId (khớp với router hiện có)
      const all = await axios.get(`${be}/api/botknowledge`);
      const list = Array.isArray(all.data)
        ? all.data.filter((k) => k.aibot_id === botId)
        : [];

      if (list.length > 0) return; // đã có -> bỏ qua

      // Tạo 1 knowledge mặc định
      await axios.post(`${be}/api/botknowledge`, {
        aibot_id: botId,
        title: "Bắt đầu học hiệu quả với My AI",
        content:
          "• Giới thiệu môn/lớp để AI gợi ý phù hợp.\n" +
          "• Hỏi theo mẫu: “Giải thích khái niệm … như cho học sinh lớp …”.\n" +
          "• Yêu cầu ví dụ, bài tập, đề cương theo từng chương.\n" +
          "• Tải tài liệu học lên phần Knowledge để AI tham chiếu.",
        tags: ["onboarding", "student", "guide"],
      });
    } catch (err) {
      // Không chặn luồng nếu lỗi
      console.error("create default knowledge error:", err);
    }
  };

  useEffect(() => {
    const verifyAndProvision = async () => {
      try {
        if (!user?.id) return;
        const be = import.meta.env.VITE_BE_URL;
        const resp = await axios.get(`${be}/api/payment/userid/${user.id}`);
        const payments = resp.data?.data || [];
        const completedPayment = payments.find(
          (p) => p.payment_status === "completed"
        );

        if (!completedPayment) {
          navigate("/my-ai?payment=failed", { replace: true });
          return;
        }
        const bot = await ensureStudentBot(user.id);
        await ensureDefaultKnowledge(bot._id || bot.id);
        navigate("/my-ai?payment=success", { replace: true });
      } catch (err) {
        console.error("Lỗi xác minh thanh toán:", err);
        navigate("/my-ai?payment=error", { replace: true });
      }
    };

    verifyAndProvision();
  }, [user?.id, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Đang xác nhận thanh toán...</h2>
    </div>
  );
};

export default UserPayComplete;
