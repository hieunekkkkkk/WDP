// AboutLandingPage.jsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import Footer from "../../components/Footer";
import LoadingScreen from "../../components/LoadingScreen";
import Header from "../../components/Header";
import "../../css/AboutLandingPage.css";
import {
  FaStar,
  FaQuoteLeft,
  FaHeart,
  FaThumbsDown,
  FaPaperPlane,
  FaBuilding,
  FaUsers,
  FaHandshake,
  FaAward,
  FaThumbsUp,
} from "react-icons/fa";

function AboutLandingPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [partners, setPartners] = useState([]);
  const [stats, setStats] = useState({
    totalBusinesses: 50,
    totalUsers: 50,
    satisfactionRate: 95,
    totalFeedbacks: 100,
  });
  const [currentTestimonialPage, setCurrentTestimonialPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: "",
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const navigate = useNavigate();

  // --------------------------
  // Helper: realistic Vietnamese names & sample comments
  // --------------------------
  const VN_FIRST_NAMES = [
    "Nguyễn",
    "Trần",
    "Lê",
    "Phạm",
    "Hoàng",
    "Vũ",
    "Đỗ",
    "Phan",
    "Võ",
    "Bùi",
    "Đặng",
    "Lý",
    "Hồ",
    "Dương",
    "Ngô",
    "Lâm",
    "Hà",
    "Trịnh",
    "Mai",
    "Trương",
  ];

  const VN_MIDDLE_NAMES = [
    "Văn",
    "Thị",
    "Ngọc",
    "Quang",
    "Minh",
    "Tuấn",
    "Hữu",
    "Thanh",
    "Thế",
    "Thùy",
    "Hoàng",
    "Anh",
    "Kim",
    "Bảo",
    "Phương",
    "Thúy",
  ];

  const VN_LAST_NAMES = [
    "An",
    "Bình",
    "Cường",
    "Dũng",
    "Hạnh",
    "Hiếu",
    "Huy",
    "Khanh",
    "Khánh",
    "Lan",
    "Long",
    "Nam",
    "Nguyên",
    "Phúc",
    "Quỳnh",
    "Sơn",
    "Thảo",
    "Tiến",
    "Tuệ",
    "Vy",
    "Vân",
  ];

  const SAMPLE_COMMENTS = [
    "Ứng dụng rất hữu ích, giúp mình tìm được quán cà phê gần trường nhanh chóng.",
    "Giao diện dễ dùng, thông tin mô tả đầy đủ. Mong team phát triển thêm tính năng tìm việc.",
    "Hỗ trợ nhanh và hữu ích. Chúc dự án ngày càng phát triển!",
    "Rất tiện lợi cho sinh viên mới vào khu vực, recommend cho mọi người.",
    "Tính năng đánh giá minh bạch, mình thấy đáng tin cậy.",
    "Cần thêm bộ lọc theo giá cả nhưng nhìn chung trải nghiệm tốt.",
    "Đã sử dụng nhiều lần, hàng quán cập nhật thường xuyên.",
    "Ứng dụng nhẹ, chạy mượt trên điện thoại của mình.",
    "Mong có thêm chương trình khuyến mãi cho sinh viên.",
    "Tìm kiếm chính xác, kết quả trả về nhanh.",
    "Nhân viên hỗ trợ nhiệt tình, giải quyết vấn đề kịp thời.",
    "Thiết kế đẹp, màu sắc hài hoà, dễ chịu khi dùng lâu.",
    "Tuyệt vời! Giúp mình tiết kiệm thời gian khám phá địa phương.",
    "Đánh giá khách quan, phù hợp cho du học sinh và sinh viên.",
    "Nội dung doanh nghiệp rõ ràng, có ảnh minh hoạ rất hữu dụng.",
  ];

  const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

  function generateFullName() {
    const first = randomFrom(VN_FIRST_NAMES);
    const middle = Math.random() < 0.6 ? randomFrom(VN_MIDDLE_NAMES) : "";
    const last = randomFrom(VN_LAST_NAMES);
    // ensure proper spacing
    return [first, middle, last].filter(Boolean).join(" ");
  }

  function generateRandomDateWithinMonths(months = 12) {
    const now = new Date();
    const past = new Date();
    past.setMonth(now.getMonth() - months);
    const t = past.getTime() + Math.random() * (now.getTime() - past.getTime());
    return new Date(t).toISOString();
  }

  // generate N mock feedback objects consistent with API shape used later
  function generateMockFeedbacks(n = 30) {
    const arr = [];
    for (let i = 0; i < n; i++) {
      const name = generateFullName();
      const comment = randomFrom(SAMPLE_COMMENTS);
      arr.push({
        _id: `mock-${i}-${Date.now()}`,
        user_id: name,
        feedback_comment: comment,
        feedback_date: generateRandomDateWithinMonths(12),
        feedback_like: Math.floor(Math.random() * 50),
        feedback_dislike: Math.floor(Math.random() * 8),
      });
    }
    return arr;
  }

  // --------------------------
  // Load initial data
  // --------------------------
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const baseURL = import.meta.env.VITE_BE_URL || "";

      const results = await Promise.allSettled([
        axios.get(`${baseURL}/api/feedback`),
        axios.get(`${baseURL}/api/business?limit=100`),
      ]);

      let feedbackData = [];
      if (results[0].status === "fulfilled") {
        feedbackData = results[0].value.data?.data || [];
      }

      // If API returned too few feedbacks, generate mock ones to reach ~30
      const MIN_FEEDBACK_COUNT = 30;
      if (!feedbackData || feedbackData.length < MIN_FEEDBACK_COUNT) {
        const produced = generateMockFeedbacks(
          MIN_FEEDBACK_COUNT - (feedbackData?.length || 0)
        );
        // keep real ones first (if any), then append mock
        feedbackData = [...(feedbackData || []), ...produced];
      }

      setFeedbacks(feedbackData);

      // compute stats from feedbacks (likes/dislikes)
      const totalLikes = feedbackData.reduce(
        (sum, f) => sum + (f.feedback_like || 0),
        0
      );
      const totalDislikes = feedbackData.reduce(
        (sum, f) => sum + (f.feedback_dislike || 0),
        0
      );
      const satisfactionRate =
        totalLikes + totalDislikes > 0
          ? Math.round((totalLikes / (totalLikes + totalDislikes)) * 100)
          : 95;

      setStats((prev) => ({
        ...prev,
        totalFeedbacks: feedbackData.length,
        satisfactionRate,
      }));

      // Process businesses for stats
      if (results[1].status === "fulfilled") {
        const businessData = results[1].value.data?.businesses || [];
        const activeBusinesses = businessData.filter(
          (b) => b.business_active === "active"
        );

        setStats((prev) => ({
          ...prev,
          totalBusinesses: activeBusinesses.length,
          totalUsers: Math.floor(activeBusinesses.length * 2.5), // Estimate users
        }));
      }

      // Mock partner data (replace with real API)
      setPartners([
        {
          id: 1,
          name: "FPT UNIVERSITY",
          logo: "/fpt.jpg",
          type: "Đại học đối tác",
        },
        {
          id: 2,
          name: "HÒA LẠC TECH PARK",
          logo: "/holaTeck.png",
          type: "Khu công nghệ",
        },
        {
          id: 3,
          name: "VNPT TECHNOLOGY",
          logo: "/vnptTech.jpg",
          type: "Đối tác công nghệ",
        },
        {
          id: 4,
          name: "VIETTEL DIGITAL",
          logo: "/viettel.jpg",
          type: "Đối tác số",
        },
        {
          id: 5,
          name: "CMC CORPORATION",
          logo: "/cmcGlobal.jpg",
          type: "Đối tác phần mềm",
        },
        {
          id: 6,
          name: "HÒA LẠC CHAMBER",
          logo: "/HolaChambel.jpg",
          type: "Hiệp hội doanh nghiệp",
        },
        {
          id: 7,
          name: "FPT TELECOM",
          logo: "/fpt-telecom-1176.jpg",
          type: "Hiệp hội doanh nghiệp",
        },
        {
          id: 8,
          name: "VTI TECHLONOGY",
          logo: "/vti-offices-hanoi-7.jpg",
          type: "Đối tác phần mềm",
        },
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
      // fallback to mock if API fails entirely
      const fallback = generateMockFeedbacks(30);
      setFeedbacks(fallback);
      setStats((prev) => ({
        ...prev,
        totalFeedbacks: fallback.length,
      }));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------
  // Process testimonials from feedback (use up to 30)
  // --------------------------
  const processedTestimonials = useMemo(() => {
    return feedbacks
      .filter(
        (feedback) =>
          feedback.feedback_comment && feedback.feedback_comment.trim() !== ""
      )
      .slice(0, 30) // take up to 30 testimonials
      .map((feedback) => ({
        id: feedback._id,
        text: feedback.feedback_comment,
        // prefer user_id (if it's a name), else try to construct from profile
        author:
          typeof feedback.user_id === "string" && feedback.user_id.trim() !== ""
            ? feedback.user_id
            : feedback.user_name || "Người dùng ẩn danh",
        date: new Date(feedback.feedback_date || Date.now()).toLocaleDateString(
          "vi-VN"
        ),
        rating: Math.min(5, Math.max(1, Math.floor(Math.random() * 2) + 4)), // 4-5 stars
        likes: feedback.feedback_like || 0,
        dislikes: feedback.feedback_dislike || 0,
      }));
  }, [feedbacks]);

  // Testimonial navigation (3 per page)
  const visibleTestimonials = useMemo(() => {
    const startIndex = currentTestimonialPage * 3;
    return processedTestimonials.slice(startIndex, startIndex + 3);
  }, [processedTestimonials, currentTestimonialPage]);

  const handleNextTestimonial = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(processedTestimonials.length / 3));
    setCurrentTestimonialPage((prev) => (prev + 1) % totalPages);
  }, [processedTestimonials.length]);

  const handlePrevTestimonial = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(processedTestimonials.length / 3));
    setCurrentTestimonialPage((prev) =>
      prev === 0 ? totalPages - 1 : prev - 1
    );
  }, [processedTestimonials.length]);

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    try {
      // Simulate API call (replace with real endpoint)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSubmitMessage(
        "Cảm ơn bạn đã gửi đánh giá! Chúng tôi sẽ xem xét và phản hồi sớm."
      );
      setNewReview({ name: "", email: "", rating: 5, comment: "" });

      // Clear message after 5 seconds
      setTimeout(() => setSubmitMessage(""), 5000);
    } catch (error) {
      setSubmitMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setNewReview((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <>
        <Header />
        <LoadingScreen />
      </>
    );
  }

  return (
    <div className="about-landing-page">
      <Header />

      {/* Hero Section - About */}
      <section className="hero-section-about">
        <div className="hero-background-about">
          <img src="/1.png" alt="Background" />
        </div>

        <div className="hero-content-about">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">
              LocalAssistant
              <span className="highlight">Hola Platform</span>
            </h1>
            <p className="hero-subtitle">
              Kết nối sinh viên với doanh nghiệp địa phương tại Hòa Lạc - Nền
              tảng khám phá và hỗ trợ toàn diện
            </p>
            <div className="hero-cta">
              <button
                onClick={() => navigate("/discover")}
                className="hero-btn-primary"
              >
                Khám phá ngay
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section-about">
        <div className="stats-grid-about">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="stat-item-about"
          >
            <div className="stat-icon-about blue">
              <FaBuilding />
            </div>
            <div className="stat-number">{stats.totalBusinesses}+</div>
            <p className="stat-label">Doanh nghiệp đối tác</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="stat-item-about"
          >
            <div className="stat-icon-about green">
              <FaUsers />
            </div>
            <div className="stat-number">{stats.totalUsers}+</div>
            <p className="stat-label">Người dùng hoạt động</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="stat-item-about"
          >
            <div className="stat-icon-about yellow">
              <FaAward />
            </div>
            <div className="stat-number">{stats.satisfactionRate}%</div>
            <p className="stat-label">Hài lòng</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="stat-item-about"
          >
            <div className="stat-icon-about purple">
              <FaHandshake />
            </div>
            <div className="stat-number">{stats.totalFeedbacks}+</div>
            <p className="stat-label">Đánh giá & phản hồi</p>
          </motion.div>
        </div>
      </section>

      {/* About Project Section */}
      <section className="about-project-section">
        <div className="about-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="section-title">Về LocalAssistant Hola</h2>
            <p className="section-subtitle">
              Nền tảng số đầu tiên tại Việt Nam kết nối sinh viên với hệ sinh
              thái doanh nghiệp địa phương
            </p>
          </motion.div>

          <div className="about-grid">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="about-text"
            >
              <h3>Sứ mệnh của chúng tôi</h3>
              <p>
                LocalAssistant Hola được sinh ra với sứ mệnh kết nối cộng đồng
                sinh viên tại Hòa Lạc với hệ sinh thái doanh nghiệp địa phương,
                tạo ra một mạng lưới hỗ trợ toàn diện.
              </p>
              <p>
                Chúng tôi tin rằng việc tạo ra cầu nối giữa sinh viên và doanh
                nghiệp không chỉ giúp sinh viên có trải nghiệm tốt hơn mà còn
                thúc đẩy sự phát triển của kinh tế địa phương.
              </p>

              <ul className="feature-list">
                <li className="feature-item" data-emoji="🎯">
                  Khám phá doanh nghiệp địa phương dễ dàng
                </li>
                <li className="feature-item" data-emoji="🤝">
                  Kết nối cộng đồng sinh viên và doanh nghiệp
                </li>
                <li className="feature-item" data-emoji="📊">
                  Hệ thống đánh giá minh bạch và tin cậy
                </li>
                <li className="feature-item" data-emoji="🚀">
                  Công nghệ AI hỗ trợ tìm kiếm thông minh
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="about-image"
            >
              <img src="/2.png" alt="About Us" />
              <div className="vision-badge">
                <h4>Tầm nhìn 2030</h4>
                <p>
                  Trở thành nền tảng hàng đầu kết nối sinh viên - doanh nghiệp
                  tại Việt Nam
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      {processedTestimonials.length > 0 && (
        <section className="testimonials-section-about">
          <div className="testimonials-container-about">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="section-header"
            >
              <h2 className="section-title">Người dùng nói gì về chúng tôi</h2>
              <p className="section-subtitle"></p>
            </motion.div>

            <div className="testimonials-wrapper">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentTestimonialPage}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="testimonials-grid-about"
                >
                  {visibleTestimonials.map((testimonial) => (
                    <TestimonialCard
                      key={testimonial.id}
                      testimonial={testimonial}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>

              {processedTestimonials.length > 3 && (
                <div className="testimonial-nav">
                  <button
                    onClick={handlePrevTestimonial}
                    className="testimonial-nav-btn"
                    aria-label="Xem đánh giá trước"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNextTestimonial}
                    className="testimonial-nav-btn"
                    aria-label="Xem đánh giá tiếp theo"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Review Submission Section */}
      <section className="review-form-section">
        <div className="review-form-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="section-title">Gửi đánh giá của bạn</h2>
            <p className="section-subtitle">
              Chia sẻ trải nghiệm của bạn để giúp chúng tôi phát triển tốt hơn
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmitReview}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="review-form"
          >
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên *</label>
                <input
                  type="text"
                  required
                  value={newReview.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="form-input"
                  placeholder="Nhập họ tên của bạn"
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={newReview.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="form-input"
                  placeholder="Nhập email của bạn"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Đánh giá *</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleInputChange("rating", star)}
                    className={`rating-star ${
                      star <= newReview.rating ? "active" : ""
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Nhận xét *</label>
              <textarea
                required
                value={newReview.comment}
                onChange={(e) => handleInputChange("comment", e.target.value)}
                className="form-input form-textarea"
                placeholder="Chia sẻ trải nghiệm của bạn với LocalAssistant Hola..."
              />
            </div>

            {submitMessage && (
              <div
                className={`submit-message ${
                  submitMessage.includes("Cảm ơn") ? "success" : "error"
                }`}
              >
                {submitMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={submitLoading}
              className="submit-btn"
            >
              {submitLoading ? (
                <div className="loading-spinner"></div>
              ) : (
                <>
                  <FaPaperPlane />
                  <span>Gửi đánh giá</span>
                </>
              )}
            </button>
          </motion.form>
        </div>
      </section>

      {/* Partners Section */}
      <section className="partners-section">
        <div className="about-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="section-header"
          >
            <h2 className="section-title">Đối tác đồng hành</h2>
            <p className="section-subtitle">
              Chúng tôi tự hào hợp tác cùng những tổ chức hàng đầu tại Hòa Lạc
            </p>
          </motion.div>

          <div className="partners-grid">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="partner-card"
              >
                <img
                  src={partner.logo}
                  alt={partner.name}
                  className="partner-logo"
                />
                <h3 className="partner-name">{partner.name}</h3>
                <p className="partner-type">{partner.type}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA Section */}
      <section className="contact-cta-section">
        <div className="contact-cta-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="contact-cta-title">Sẵn sàng trải nghiệm?</h2>
            <p className="contact-cta-subtitle">
              Tham gia cộng đồng LocalAssistant Hola ngay hôm nay và khám phá
              những cơ hội tuyệt vời
            </p>
            <div className="contact-cta-buttons">
              <button
                onClick={() => navigate("/register")}
                className="hero-btn-primary"
              >
                Đăng ký ngay
              </button>
              <button
                onClick={() => navigate("/contact")}
                className="hero-btn-secondary"
              >
                Liên hệ với chúng tôi
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

// Testimonial Card Component
const TestimonialCard = React.memo(({ testimonial }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    className="testimonial-card-about"
  >
    <div className="testimonial-quote">
      <FaQuoteLeft />
    </div>

    <div className="testimonial-rating">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          className={`star ${i < testimonial.rating ? "active" : "inactive"}`}
        />
      ))}
    </div>

    <p className="testimonial-text">"{testimonial.text}"</p>

    <div className="testimonial-footer">
      <div className="testimonial-author">
        <h4>{testimonial.author}</h4>
        <p>{testimonial.date}</p>
      </div>

      <div className="testimonial-reactions">
        <div className="testimonial-reaction likes">
          <FaThumbsUp /> {testimonial.likes}
        </div>
        <div className="testimonial-reaction dislikes">
          <FaThumbsDown /> {testimonial.dislikes}
        </div>
      </div>
    </div>
  </motion.div>
));

export default AboutLandingPage;
