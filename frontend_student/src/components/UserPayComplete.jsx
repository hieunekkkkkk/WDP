/* eslint-disable no-unused-vars */
import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { getCurrentUserRole } from "../utils/useCurrentUserRole";
import "./UserPayComplete.css";

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
  const [searchParams] = useSearchParams();
  const [verifyStep, setVerifyStep] = useState("Đang kiểm tra thanh toán...");

  // Check URL params immediately
  useEffect(() => {
    const status = searchParams.get("status");
    const orderCode = searchParams.get("orderCode");

    // If cancelled or failed status in URL, redirect immediately
    if (status === "CANCELLED" || status === "FAILED") {
      navigate("/my-ai?payment=failed", { replace: true });
      return;
    }
  }, [searchParams, navigate]);

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
      console.error("create default knowledge error:", err);
    }
  };

  useEffect(() => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchPaymentWithRetry = async (userId, attempts = 3) => {
      const be = import.meta.env.VITE_BE_URL;
      const orderCode = searchParams.get("orderCode");

      for (let i = 0; i < attempts; i++) {
        try {
          setVerifyStep(`Đang xác thực thanh toán (${i + 1}/${attempts})...`);
          const resp = await axios.get(`${be}/api/payment/userid/${userId}`);
          const payments = resp.data?.data || [];

          // Find the most recent payment for this orderCode
          const currentPayment = payments.find(
            (p) => p.transaction_id === orderCode
          );

          if (!currentPayment) {
            console.log(" Payment not found, retrying...");
            await wait(1500);
            continue;
          }

          // Check payment status
          if (currentPayment.payment_status === "completed") {
            console.log(" Payment completed!");
            return true;
          }

          if (
            currentPayment.payment_status === "cancelled" ||
            currentPayment.payment_status === "failed"
          ) {
            console.log(" Payment was cancelled or failed");
            return false;
          }

          console.log(" Payment pending, retrying...");
          await wait(1500);
        } catch (err) {
          console.error(" Lỗi khi kiểm tra thanh toán:", err);
          await wait(1500);
        }
      }
      return false;
    };

    const verifyAndProvision = async () => {
      try {
        if (!user?.id) return;

        console.log(" Bắt đầu xác minh thanh toán...");
        const isPaid = await fetchPaymentWithRetry(user.id, 3);

        if (!isPaid) {
          console.log(" Thanh toán chưa thành công sau retry");
          navigate("/my-ai?payment=failed", { replace: true });
          return;
        }

        await wait(1500);

        setVerifyStep("Đang thiết lập trợ lý AI của bạn...");
        const bot = await ensureStudentBot(user.id);
        await ensureDefaultKnowledge(bot._id || bot.id);

        console.log(" DONE — chuyển trang");
        navigate("/my-ai?payment=success", { replace: true });
      } catch (err) {
        console.error(" Lỗi xác minh thanh toán sau retry:", err);
        navigate("/my-ai?payment=error", { replace: true });
      }
    };

    verifyAndProvision();
  }, [user?.id, navigate, searchParams]);

  return (
    <div className="payment-verify-container">
      <div className="payment-verify-spinner" />
      <h2 className="payment-verify-title">Đang xử lý thanh toán</h2>
      <p className="payment-verify-text">{verifyStep}</p>
    </div>
  );
};

export default UserPayComplete;
