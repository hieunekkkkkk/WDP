import { useState, useEffect } from 'react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import '../../css/BusinessRegistrationPage.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId } from '../../utils/useCurrentUserId';
import { PuffLoader } from 'react-spinners';
import { toast } from 'react-toastify';
import useGeolocation from '../../utils/useGeolocation';
import { convertFilesToBase64 } from '../../utils/imageToBase64';
import { sendEmail } from '../../utils/sendEmail';
import { useUser } from '@clerk/clerk-react';

const StackPage = () => {
    const navigate = useNavigate();
    const [images, setImages] = useState(() => {
        const savedImages = localStorage.getItem('businessImages');
        return savedImages ? JSON.parse(savedImages) : [];
    });
    const [stacks, setStacks] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState(() => {
        const savedData = localStorage.getItem('businessFormData');
        return savedData
            ? JSON.parse(savedData)
            : {
                businessName: '',
                businessAddress: '',
                businessDescription: '',
                businessType: '',
                businessPhone: '',
                operatingHoursFrom: '',
                operatingHoursTo: '',
            };
    });
    const [paymentStatus, setPaymentStatus] = useState(null);
    const [paymentStack, setPaymentStack] = useState(null);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [havePaid, setHavePaid] = useState(false);
    const [tooManyPaymentsToday, setTooManyPaymentsToday] = useState(false);
    const [paymentsTodayCount, setPaymentsTodayCount] = useState(0);

    const userId = getCurrentUserId();

    const checkPaymentStatus = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/payment/userid/${userId}`);
            const payments = response.data.data || [];

            const completedPayment = payments.find(payment => {
                if (payment.payment_status !== 'completed') return false;

                const paymentDate = new Date(payment.payment_date);
                const now = new Date();

                const diffInDays = (now.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24);
                return diffInDays <= 30;
            });

            if (completedPayment) {
                setPaymentStatus(completedPayment.payment_status);
                setPaymentStack(completedPayment.payment_stack._id);
                setHavePaid(true);
            }

            const today = new Date().toISOString().slice(0, 10);

            const paymentsToday = payments.filter(payment => {
                const paymentDate = payment.payment_date?.slice(0, 10);
                return paymentDate === today;
            });

            if (paymentsToday.length >= 5) {
                setTooManyPaymentsToday(true);
            }
            setPaymentsTodayCount(paymentsToday.length);

        } catch (err) {
            console.error('Error checking payment status:', err);
        }
    };

    useEffect(() => {
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

        const fetchCategories = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/category`);
                setCategories(response.data.categories || []);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Không thể tải dữ liệu loại hình kinh doanh.');
            } finally {
                setLoading(false);
            }
        };

        fetchStacks();
        fetchCategories();
        checkPaymentStatus();

    }, [userId]);

    const handlePlanClick = async (stackId) => {
        try {
            setLoadingPayment(true);
            const selectedStack = stacks.find((stack) => stack._id === stackId);
            if (!selectedStack) {
                alert('Không tìm thấy gói đăng ký.');
                setLoadingPayment(false);
                return;
            }

            const paymentResponse = await axios.post(`${import.meta.env.VITE_BE_URL}/api/payment`, {
                user_id: userId,
                stack_id: stackId,
            });

            if (paymentResponse.data && paymentResponse.data.url) {
                window.open(paymentResponse.data.url, '_blank');
            } else {
                throw new Error('Thanh toán thất bại.');
            }
        } catch (err) {
            console.error('Error during payment:', err.response ? err.response.data : err.message);
            alert(`Thanh toán thất bại. Vui lòng thử lại. Chi tiết: ${err.message}`);
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
        <>
            <Header />
            <main className="business-register-container">
                <div className="business-register-intro-card">
                    <h2 className="business-register-intro-title">
                        Chọn gói đăng ký doanh nghiệp
                    </h2>
                    <div className="business-register-intro-section">
                        <div className="business-register-intro-text">
                            <p>
                                Để tiếp tục quản lý và hiển thị doanh nghiệp trên LocalLink, vui lòng chọn hoặc nâng cấp gói
                                đăng ký phù hợp với nhu cầu của bạn.
                            </p>
                            <ul>
                                <li><strong>BASIC1:</strong> Phù hợp với doanh nghiệp nhỏ, giới hạn số sản phẩm cơ bản.</li>
                                <li><strong>VIP1:</strong> Dành cho doanh nghiệp vừa và nhỏ, thêm tính năng ưu tiên hiển thị.</li>
                                <li><strong>SV1:</strong> Cho doanh nghiệp lớn, không giới hạn sản phẩm, hỗ trợ cao cấp.</li>
                            </ul>
                            <p>
                                Sau khi chọn gói, bạn sẽ được chuyển đến cổng thanh toán. Gói đăng ký có hiệu lực trong 30 ngày,
                                bạn có thể gia hạn hoặc thay đổi bất cứ lúc nào.
                            </p>
                        </div>
                        <div className="business-register-intro-image">
                            <img src="/1.png" alt="Subscription Plans Illustration" />
                        </div>
                    </div>
                </div>

                <div className="business-register-pricing-plans">
                    <h2 className="business-register-plan-title">Lựa chọn gói đăng ký</h2>
                    {loadingPayment ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            opacity: 0.3,
                            height: '428px'
                        }}>
                            <PuffLoader size={90} />
                            <p style={{ marginTop: '16px', fontSize: '18px', color: '#333' }}></p>
                        </div>
                    ) : loading ? (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            flexDirection: 'column',
                            opacity: 0.3,
                            height: '428px'
                        }}>
                            <PuffLoader size={90} />
                            <p style={{ marginTop: '16px', fontSize: '18px', color: '#333' }}></p>
                        </div>
                    ) : error ? (
                        <p>{error}</p>
                    ) : (
                        <div className="business-register-plan-options">
                            {stacks.map((stack) => (
                                <div key={stack._id} className="business-register-plan-card">
                                    <h3>{stack.stack_name}</h3>
                                    <p>
                                        <strong>{formatPrice(stack.stack_price)}</strong>
                                    </p>
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
                                            onClick={() => handlePlanClick(stack._id)}
                                            disabled={tooManyPaymentsToday}
                                        >
                                            Đang dùng
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div className='business-register-tries-left'>{paymentsTodayCount >= 1 && (
                    <p style={{ marginTop: '12px', textAlign: 'center', color: '#d9534f', fontWeight: 'bold' }}>
                        Số lượng chọn gói đã bị giới hạn thanh toán trong ngày. Số lượt còn lại: {Math.max(0, 5 - paymentsTodayCount)}
                    </p>
                )}
                </div>
            </main >
            <Footer />
        </>
    );
};

export default StackPage;
