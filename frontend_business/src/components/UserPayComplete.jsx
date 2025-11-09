import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import "../css/UserPayComplete.css";

const UserPayComplete = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [statusText, setStatusText] = useState("Đang khởi tạo...");
  const hasRunRef = useRef(false);

  const be = import.meta.env.VITE_BE_URL;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const provisionBusinessBot = async (userId) => {
    const got = await axios.get(`${be}/api/aibot/owner/${userId}`);

    if (Array.isArray(got.data) && got.data.length > 0) {
      return got.data[0];
    }

    const created = await axios.post(`${be}/api/aibot`, {
      owner_id: userId,
      name: "Bot tư vấn Doanh nghiệp",
      description: "Bot tư vấn tự động cho doanh nghiệp",
      status: "active",
    });
    return created.data;
  };

  const fetchPaymentWithRetry = async (userId, orderCode, attempts = 3) => {
    for (let i = 0; i < attempts; i++) {
      try {
        setStatusText(`Đang xác thực thanh toán (${i + 1}/${attempts})...`);
        const resp = await axios.get(`${be}/api/payment/userid/${userId}`);
        const payments = resp.data?.data || [];

        const currentPayment = payments.find(
          (p) => p.transaction_id === orderCode
        );

        if (!currentPayment) {
          console.log("Chưa tìm thấy payment, đang thử lại...");
          await wait(2000);
          continue;
        }

        if (currentPayment.payment_status === "completed") {
          console.log("Thanh toán đã hoàn tất!");
          return currentPayment;
        }

        if (
          currentPayment.payment_status === "cancelled" ||
          currentPayment.payment_status === "failed"
        ) {
          console.log("Thanh toán đã thất bại hoặc bị hủy");
          return null;
        }

        console.log("Thanh toán đang chờ xử lý, thử lại...");
        await wait(2000);
      } catch (err) {
        console.error("Lỗi khi kiểm tra thanh toán:", err);
        await wait(2000);
      }
    }
    return null;
  };

  useEffect(() => {
    const verifyAndProvision = async () => {
      if (!user?.id) return;

      const orderCode = searchParams.get("orderCode");
      if (!orderCode) {
        console.warn("Không tìm thấy orderCode trên URL");
        navigate("/business-dashboard", { replace: true });
        return;
      }

      try {
        const completedPayment = await fetchPaymentWithRetry(
          user.id,
          orderCode
        );

        if (!completedPayment) {
          console.log("Thanh toán chưa thành công sau khi retry");
          navigate("/business-dashboard", {
            replace: true,
          });
          return;
        }

        const stackName =
          completedPayment.payment_stack?.stack_name?.toLowerCase();

        if (stackName === "tăng view cho doanh nghiệp") {
          setStatusText("Đang nâng cấp gói ưu tiên...");
          try {
            const businessResponse = await axios.get(
              `${be}/api/business/owner/${user.id}`
            );
            const businesses = businessResponse.data;

            if (businesses && businesses.length > 0) {
              const businessId = businesses[0]._id;
              if (businessId) {
                await axios.post(
                  `${be}/api/business/${businessId}/increase-priority`
                );
              }
            } else {
              console.warn(
                `Không tìm thấy business nào được sở hữu bởi user ${user.id}.`
              );
            }
          } catch (priorityError) {
            console.error("Lỗi khi tăng độ ưu tiên:", priorityError);
          }
        } else if (stackName === "bot tư vấn viên") {
          setStatusText("Đang thiết lập bot tư vấn...");
          await provisionBusinessBot(user.id);
        } else {
          console.warn("Đã thanh toán stack không xác định:", stackName);
        }

        setStatusText("Hoàn tất! Đang chuyển hướng...");
        await wait(1000); 
        navigate("/business-dashboard", {
          replace: true,
        });
      } catch (err) {
        console.error("Lỗi nghiêm trọng trong quá trình xác minh:", err);
        navigate("/business-dashboard", { replace: true });
      }
    };

    if (user?.id && !hasRunRef.current) {
      hasRunRef.current = true;
      verifyAndProvision();
    }
  }, [user?.id, navigate, searchParams, be]);

  return (
    <div className="payment-verify-container">
      <div className="payment-verify-spinner" />
      <h2 className="payment-verify-title">Đang xử lý thanh toán</h2>
      <p className="payment-verify-text">{statusText}</p>
    </div>
  );
};

export default UserPayComplete;
