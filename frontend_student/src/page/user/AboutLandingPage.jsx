import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

import Footer from "../../components/Footer";
import LoadingScreen from "../../components/LoadingScreen";
import Header from "../../components/Header";
import "../../css/AboutLandingPage.css";
import {
  FaStar,
  FaQuoteLeft,
  FaThumbsDown,
  FaPaperPlane,
  FaBuilding,
  FaUsers,
  FaHandshake,
  FaAward,
  FaThumbsUp,
  FaUser,
} from "react-icons/fa";

// Fallback id generator for older browsers
const genId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return String(Date.now()) + Math.random().toString(16).slice(2);
  }
};

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
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();

  // Get display name from feedback safely
  const getUserDisplayName = (feedback) => {
    if (
      feedback?.user_name &&
      typeof feedback.user_name === "string" &&
      feedback.user_name.trim()
    ) {
      return feedback.user_name.trim();
    }
    if (
      feedback?.fullName &&
      typeof feedback.fullName === "string" &&
      feedback.fullName.trim()
    ) {
      return feedback.fullName.trim();
    }
    if (feedback?.firstName || feedback?.lastName) {
      const fn = feedback.firstName || "";
      const ln = feedback.lastName || "";
      const full = `${fn} ${ln}`.trim();
      if (full) return full;
    }
    return "Người dùng ẩn danh";
  };

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
        feedbackData = results[0].value.data?.data?.filter(Boolean) || [];
      }
      setFeedbacks(feedbackData);

      const totalLikes = feedbackData.reduce(
        (sum, f) => sum + (f?.feedback_like || 0),
        0
      );
      const totalDislikes = feedbackData.reduce(
        (sum, f) => sum + (f?.feedback_dislike || 0),
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

      if (results[1].status === "fulfilled") {
        const businessData = results[1].value.data?.businesses || [];
        const active = businessData.filter(
          (b) => b?.business_active === "active"
        );
        setStats((prev) => ({
          ...prev,
          totalBusinesses: active.length,
          totalUsers: Math.floor(active.length * 2.5),
        }));
      }

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
    } catch (err) {
      console.error("Error loading data:", err);
      setFeedbacks([]);
    } finally {
      setLoading(false);
    }
  };

  const processedTestimonials = useMemo(() => {
    return feedbacks
      .filter(
        (f) => f && f.feedback_comment && String(f.feedback_comment).trim()
      )
      .slice(0, 30)
      .map((f) => ({
        id: f._id || genId(),
        text: f.feedback_comment,
        author: getUserDisplayName(f),
        date: new Date(f.feedback_date || Date.now()).toLocaleDateString(
          "vi-VN"
        ),
        rating: f.feedback_rating || 5,
        likes: f.feedback_like || 0,
        dislikes: f.feedback_dislike || 0,
      }));
  }, [feedbacks]);

  const visibleTestimonials = useMemo(() => {
    const start = currentTestimonialPage * 3;
    return processedTestimonials.slice(start, start + 3);
  }, [processedTestimonials, currentTestimonialPage]);

  const handleNext = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(processedTestimonials.length / 3));
    setCurrentTestimonialPage((p) => (p + 1) % totalPages);
  }, [processedTestimonials.length]);

  const handlePrev = useCallback(() => {
    const totalPages = Math.max(1, Math.ceil(processedTestimonials.length / 3));
    setCurrentTestimonialPage((p) => (p === 0 ? totalPages - 1 : p - 1));
  }, [processedTestimonials.length]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isSignedIn) {
      alert("Vui lòng đăng nhập trước khi gửi đánh giá.");
      return;
    }
    if (!newReview.comment.trim()) {
      return setSubmitMessage("⚠️ Vui lòng nhập nhận xét.");
    }

    setSubmitLoading(true);
    try {
      const baseURL = import.meta.env.VITE_BE_URL || "";
      const payload = {
        user_id: user.id,
        user_name: user.fullName || user.username || "Người dùng",
        email: user.emailAddresses?.[0]?.emailAddress || "",
        feedback_comment: newReview.comment,
        feedback_rating: newReview.rating,
        feedback_type: "business",
      };
      await axios.post(`${baseURL}/api/feedback`, payload);
      setSubmitMessage("🎉 Cảm ơn bạn đã gửi đánh giá!");
      setNewReview({ rating: 5, comment: "" });
      setTimeout(() => setSubmitMessage(""), 4000);
      await loadData();
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitMessage("⚠️ Có lỗi xảy ra. Vui lòng thử lại sau.");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading)
    return (
      <>
        <Header />
        <LoadingScreen />
      </>
    );

  return (
    <div className="about-landing-page">
      <Header />

      {/* Hero Section */}
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
              LocalAssistant<span className="highlight">Hola Platform</span>
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
          {[
            {
              icon: <FaBuilding />,
              color: "blue",
              number: stats.totalBusinesses + "+",
              label: "Doanh nghiệp đối tác",
            },
            {
              icon: <FaUsers />,
              color: "green",
              number: stats.totalUsers + "+",
              label: "Người dùng hoạt động",
            },
            {
              icon: <FaAward />,
              color: "yellow",
              number: stats.satisfactionRate + "%",
              label: "Hài lòng",
            },
            {
              icon: <FaHandshake />,
              color: "purple",
              number: stats.totalFeedbacks + "+",
              label: "Đánh giá & phản hồi",
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              className="stat-item-about"
            >
              <div className={`stat-icon-about ${item.color}`}>{item.icon}</div>
              <div className="stat-number">{item.number}</div>
              <p className="stat-label">{item.label}</p>
            </motion.div>
          ))}
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
              <p className="section-subtitle">
                Trải nghiệm thực tế từ cộng đồng người dùng LocalAssistant Hola
              </p>
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
                  {visibleTestimonials.map((t) => (
                    <TestimonialCard key={t.id} testimonial={t} />
                  ))}
                </motion.div>
              </AnimatePresence>

              {processedTestimonials.length > 3 && (
                <div className="testimonial-nav">
                  <button
                    onClick={handlePrev}
                    className="testimonial-nav-btn"
                    aria-label="Xem đánh giá trước"
                  >
                    ←
                  </button>
                  <button
                    onClick={handleNext}
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

      {/* Review Form */}
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
            <div className="form-group">
              <label>Đánh giá *</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() =>
                      setNewReview((p) => ({ ...p, rating: star }))
                    }
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
                onChange={(e) =>
                  setNewReview((p) => ({ ...p, comment: e.target.value }))
                }
                className="form-input form-textarea"
                placeholder="Chia sẻ trải nghiệm của bạn với LocalAssistant Hola..."
              ></textarea>
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
            {partners.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                className="partner-card"
              >
                <img src={p.logo} alt={p.name} className="partner-logo" />
                <h3 className="partner-name">{p.name}</h3>
                <p className="partner-type">{p.type}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
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

// Testimonial Card
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
        <div className="author-avatar">
          <FaUser />
        </div>
        <div className="author-info">
          <h4 className="author-name">{testimonial.author}</h4>
          <p className="author-date">{testimonial.date}</p>
        </div>
      </div>

      <div className="testimonial-reactions">
        <div className="testimonial-reaction likes">
          <FaThumbsUp /> <span>{testimonial.likes}</span>
        </div>
        <div className="testimonial-reaction dislikes">
          <FaThumbsDown /> <span>{testimonial.dislikes}</span>
        </div>
      </div>
    </div>
  </motion.div>
));

export default AboutLandingPage;
