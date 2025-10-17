// src/components/BusinessPlanSelection.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { PuffLoader } from 'react-spinners';

const BusinessPlanSelection = ({
  userId,
  paymentStack,
  setPaymentStack,
  paymentStatus,
  setPaymentStatus,
  setHavePaid,
  tooManyPaymentsToday,
  setTooManyPaymentsToday,
  paymentsTodayCount,
  setPaymentsTodayCount,
}) => {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [error, setError] = useState(null);

  const checkPaymentStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/payment/userid/${userId}`);
      const payments = response.data.data || [];

      const completedPayment = payments.find(payment => {
        if (payment.payment_status !== 'completed') return false;

        const paymentDate = new Date(payment.payment_date);
        const now = new Date();
        const diffInDays = (now - paymentDate) / (1000 * 60 * 60 * 24);
        return diffInDays <= 30;
      });

      if (completedPayment) {
        setPaymentStatus(completedPayment.payment_status);
        setPaymentStack(completedPayment.payment_stack._id);
        setHavePaid(true);
      }

      const today = new Date().toISOString().slice(0, 10);
      const paymentsToday = payments.filter(p => p.payment_date?.slice(0, 10) === today);

      setPaymentsTodayCount(paymentsToday.length);
      if (paymentsToday.length >= 5) setTooManyPaymentsToday(true);
    } catch (err) {
      console.error('Error checking payment status:', err);
    }
  };

  const fetchStacks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/stack`);
      setStacks(response.data.stacks || []);
    } catch (err) {
      console.error('Error fetching stacks:', err);
      setError('Không thể tải dữ liệu gói đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStacks();
    checkPaymentStatus();
  }, [userId]);

  const handlePlanClick = async (stackId) => {
    try {
      setLoadingPayment(true);
      const selectedStack = stacks.find(s => s._id === stackId);
      if (!selectedStack) {
        alert('Không tìm thấy gói đăng ký.');
        return;
      }

      const paymentResponse = await axios.post(`${import.meta.env.VITE_BE_URL}/api/payment`, {
        user_id: userId,
        stack_id: stackId,
      });

      if (paymentResponse.data?.url) {
        window.open(paymentResponse.data.url, '_self');
      } else {
        throw new Error('Thanh toán thất bại.');
      }
    } catch (err) {
      console.error('Error during payment:', err);
      alert(`Thanh toán thất bại. Chi tiết: ${err.message}`);
    } finally {
      setLoadingPayment(false);
      checkPaymentStatus();
    }
  };

  const formatPrice = (price) => {
    if (price >= 1000000000) return `${(price / 1000000000).toFixed(1)}B / tháng`;
    if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M / tháng`;
    if (price >= 1000) return `${(price / 1000).toFixed(1)}K / tháng`;
    return `${price}/tháng`;
  };

  return (
    <div className="business-register-pricing-plans">
      <h3 className="business-register-plan-title-step">Bước 1</h3>
      <h2 className="business-register-plan-title">Lựa chọn gói đăng ký</h2>

      {loadingPayment || loading ? (
        <div className="flex-center" style={{ justifyContent: "center", height: '428px', opacity: 0.3 }}>
          <PuffLoader size={90} />
        </div>
      ) : error ? (
        <p>{error}</p>
      ) : (
        <div className="business-register-plan-options">
          {stacks.map((stack) => (
            <div key={stack._id} className="business-register-plan-card">
              <h3>{stack.stack_name}</h3>
              <p><strong>{formatPrice(stack.stack_price)}</strong></p>
              <p>{stack.stack_detail}</p>

              {paymentStack !== stack._id ? (
                <button
                  type="button"
                  className={`business-register-plan-btn ${tooManyPaymentsToday ? 'inactive' : ''}`}
                  onClick={() => handlePlanClick(stack._id)}
                  disabled={tooManyPaymentsToday}
                >
                  {tooManyPaymentsToday ? 'Đã đạt giới hạn hôm nay' : 'Chọn gói'}
                </button>
              ) : (
                <button
                  type="button"
                  className="business-register-plan-btn inactive"
                  disabled
                >
                  Đang dùng
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {paymentsTodayCount >= 1 && (
        <div className='business-register-tries-left'>
          <p style={{ marginTop: '12px', textAlign: 'center', color: '#d9534f', fontWeight: 'bold' }}>
            Số lượt còn lại hôm nay: {Math.max(0, 5 - paymentsTodayCount)}
          </p>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanSelection;
