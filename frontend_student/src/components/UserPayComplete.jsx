/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getCurrentUserRole } from '../utils/useCurrentUserRole';
import '../css/UserPayComplete.css';

const UserPayComplete = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifyStep, setVerifyStep] = useState('Đang kiểm tra thanh toán...');

  // Check URL params immediately
  useEffect(() => {
    const status = searchParams.get('status');
    const orderCode = searchParams.get('orderCode');

    // If cancelled or failed status in URL, redirect immediately
    if (status === 'CANCELLED' || status === 'FAILED') {
      const userId = user?.id;
      if (userId) {
        navigate(`/dashboard/my-ai?payment=failed&userId=${userId}`, { replace: true });
      } else {
        navigate('/dashboard/my-ai?payment=failed', { replace: true });
      }
      return;
    }
  }, [searchParams, navigate, user?.id]);

  useEffect(() => {
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchPaymentWithRetry = async (userId, attempts = 3) => {
      const be = import.meta.env.VITE_BE_URL;
      const orderCode = searchParams.get('orderCode');

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
            await wait(1500);
            continue;
          }

          // Check payment status
          if (currentPayment.payment_status === 'completed') {
            return true;
          }

          if (
            currentPayment.payment_status === 'cancelled' ||
            currentPayment.payment_status === 'failed'
          ) {
            return false;
          }

          await wait(1500);
        } catch (err) {
          console.error('❌ Lỗi khi kiểm tra thanh toán:', err);
          await wait(1500);
        }
      }
      return false;
    };

    const verifyAndProvision = async () => {
      try {
        if (!user?.id) return;

        const isPaid = await fetchPaymentWithRetry(user.id, 3);

        if (!isPaid) {
          navigate(`/dashboard/my-ai?payment=failed&userId=${user.id}`, { replace: true });
          return;
        }

        // Lấy bot của user (nếu có)
        const be = import.meta.env.VITE_BE_URL;
        const botRes = await axios.get(`${be}/api/aibot/owner/${user.id}`);
        const bot = botRes.data;

        // API trả về một bot object hoặc null
        if (bot && bot.id) {
          // Đã có bot -> redirect về knowledge page của bot đó
          const botId = bot._id || bot.id;
          navigate(`/dashboard/knowledge/${botId}?payment=success`, { replace: true });
        } else {
          // Chưa có bot -> redirect để hiện modal tạo bot
          navigate('/dashboard/knowledge/create-bot?payment=success', { replace: true });
        }
      } catch (err) {
        console.error('❌ Lỗi xác minh thanh toán sau retry:', err);
        const userId = user?.id;
        if (userId) {
          navigate(`/dashboard/my-ai?payment=error&userId=${userId}`, { replace: true });
        } else {
          navigate('/dashboard/my-ai?payment=error', { replace: true });
        }
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
