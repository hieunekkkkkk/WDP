import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserPayComplete = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAndUpdatePlan = async () => {
      if (!user || !user.id) {
        console.log("Đang chờ thông tin user...");
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BE_URL}/api/payment/userid/${user.id}`
        );
        const payments = response.data.data || [];

        const completedPayment = payments.find(
          (payment) => payment.payment_status === "completed"
        );

        if (!completedPayment) {
          navigate("/business-dashboard/my-ai");
          return;
        }

        const stackName =
          completedPayment.payment_stack?.stack_name?.toLowerCase();

        if (stackName === "tăng view cho doanh nghiệp") {
          console.log(
            'Phát hiện gói "Tăng view cho doanh nghiệp", đang tìm business ID...'
          );
          try {
            const businessResponse = await axios.get(
              `${import.meta.env.VITE_BE_URL}/api/business/owner/${user.id}`
            );

            const businesses = businessResponse.data;
            if (businesses && businesses.length > 0) {
              const businessId = businesses[0]._id;

              if (businessId) {
                console.log(`Tìm thấy business ID: ${businessId}. Đang gọi API ưu tiên...`);
                
                await axios.post(
                  `${import.meta.env.VITE_BE_URL}/api/business/${
                    businessId
                  }/increase-priority`
                );

                console.log("Tăng độ ưu tiên cho business thành công!");
              } else {
                 console.warn("Không tìm thấy business ID trong đối tượng business.");
              }
            } else {
              console.warn(`Không tìm thấy business nào được sở hữu bởi user ${user.id}.`);
            }
          } catch (priorityError) {
            console.error("Lỗi trong quá trình lấy business ID hoặc tăng độ ưu tiên:", priorityError);
          }
        }
        navigate("/business-dashboard/my-ai");
      } catch (err) {
        console.error("Error verifying payment and updating plan:", err);
      }
    };

    verifyAndUpdatePlan();
  }, [user, navigate]);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Đang xác nhận thanh toán...</h2>
    </div>
  );
};

export default UserPayComplete;