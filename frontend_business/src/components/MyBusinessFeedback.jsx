import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../css/BusinessFeedback.css";
import { IoBanSharp } from "react-icons/io5";
import { FaRegCircleCheck } from "react-icons/fa6";

const MyBusinessFeedback = ({ businessId, canDelete = false }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("newest");
  const [newFeedback, setNewFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userInfoMap, setUserInfoMap] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  const itemsPerPage = 5;

  useEffect(() => {
    if (businessId) {
      fetchFeedbacks();
    }
  }, [businessId]);

  const fetchUserInfo = async (userId) => {
    if (!userId || userInfoMap[userId]) return;

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/user/${userId}`
      );
      const username = response.data?.fullName;
      setUserInfoMap((prev) => ({ ...prev, [userId]: username }));
    } catch (error) {
      console.error("Error fetching user info:", error);
      const fallbackName =
        userId.length > 10
          ? `Người dùng ${userId.slice(-4).toUpperCase()}`
          : `Người dùng ${userId}`;
      setUserInfoMap((prev) => ({ ...prev, [userId]: fallbackName }));
    }
  };

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/feedback/business/${businessId}`
      );

      // Check if response has success property or data directly
      let feedbackData = [];
      if (response.data.success) {
        feedbackData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        feedbackData = response.data;
      } else {
        feedbackData = [];
      }

      setFeedbacks(feedbackData);

      // Fetch user info for each feedback
      feedbackData.forEach((feedback) => {
        if (feedback.user_id) {
          fetchUserInfo(feedback.user_id);
        }
      });
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      if (err.response?.status === 404) {
        setFeedbacks([]); // No feedbacks found is not an error
      } else {
        setError("Không thể tải đánh giá");
        toast.error("Không thể tải đánh giá");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = () => {
    const relevantFeedbacks = showActiveOnly
      ? feedbacks.filter((f) => f.feedback_status === "active")
      : feedbacks;

    if (relevantFeedbacks.length === 0) return 0;

    const totalRating = relevantFeedbacks.reduce((sum, feedback) => {
      return sum + (feedback.feedback_rating || 5);
    }, 0);

    return totalRating / relevantFeedbacks.length;
  };

  // Sort feedbacks based on selected option
  const getSortedFeedbacks = () => {
    const sorted = [...feedbacks];

    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.feedback_date) - new Date(a.feedback_date)
        );
      case "oldest":
        return sorted.sort(
          (a, b) => new Date(a.feedback_date) - new Date(b.feedback_date)
        );
      case "most_helpful":
        return sorted.sort(
          (a, b) => (b.feedback_like || 0) - (a.feedback_like || 0)
        );
      case "highest_rating":
        return sorted.sort(
          (a, b) => (b.feedback_rating || 5) - (a.feedback_rating || 5)
        );
      case "lowest_rating":
        return sorted.sort(
          (a, b) => (a.feedback_rating || 5) - (b.feedback_rating || 5)
        );
      default:
        return sorted;
    }
  };

  const getFilteredFeedbacks = () => {
    let filtered = [...feedbacks];
    if (showActiveOnly) {
      filtered = filtered.filter((f) => f.feedback_status === "active");
    }
    return filtered;
  };

  const getPaginatedFeedbacks = () => {
    const sorted = getSortedFeedbacks();
    const filtered = showActiveOnly
      ? sorted.filter((f) => f.feedback_status === "active")
      : sorted;

    const startIndex = (currentPage - 1) * itemsPerPage;
    return filtered.slice(startIndex, startIndex + itemsPerPage);
  };
  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user ID from token
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Vui lòng đăng nhập để gửi đánh giá");
        return;
      }

      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userId = payload.sub || payload.id;

      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/feedback`,
        {
          user_id: userId,
          business_id: businessId,
          feedback_type: "business",
          feedback_comment: newFeedback.trim(),
          feedback_rating: selectedRating, // Include rating
          feedback_like: 0,
          feedback_dislike: 0,
        }
      );

      if (response.data.message === "Feedback created successfully") {
        setNewFeedback("");
        setSelectedRating(5);
        setShowWriteReview(false);
        fetchFeedbacks(); // Refresh feedbacks
        toast.success("Đánh giá đã được gửi thành công!");
      }
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle like/dislike
  const handleLike = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/like`
      );
      fetchFeedbacks(); // Refresh to get updated counts
      toast.success("Đã thích đánh giá này");
    } catch (err) {
      console.error("Error liking feedback:", err);
      toast.error("Không thể thích đánh giá này");
    }
  };

  const handleDislike = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/dislike`
      );
      fetchFeedbacks(); // Refresh to get updated counts
      toast.success("Đã không thích đánh giá này");
    } catch (err) {
      console.error("Error disliking feedback:", err);
      toast.error("Không thể bỏ thích đánh giá này");
    }
  };

  const handleToggleFeedbackStatus = (feedbackId, currentStatus) => {
    const isInactive = currentStatus === "inactive";
    const actionText = isInactive ? "hiện lại" : "ẩn";
    const newStatus = isInactive ? "active" : "inactive";

    const confirmToast = toast.info(
      <div>
        <p>Bạn có chắc chắn muốn {actionText} đánh giá này?</p>
        <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={async () => {
              toast.dismiss(confirmToast);
              try {
                await axios.put(
                  `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}`,
                  { feedback_status: newStatus }
                );

                toast.success(
                  `Đánh giá đã được ${isInactive ? "hiện" : "ẩn"} thành công!`
                );
                fetchFeedbacks();
              } catch (err) {
                console.error("Error updating feedback status:", err);
                toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
              }
            }}
            style={{
              background: isInactive ? "green" : "red",
              color: "white",
              border: "none",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            {isInactive ? "Hiện" : "Ẩn"}
          </button>
          <button
            onClick={() => toast.dismiss(confirmToast)}
            style={{
              background: "#ccc",
              border: "none",
              padding: "5px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: 14,
            }}
          >
            Hủy
          </button>
        </div>
      </div>,
      {
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleSubmitReply = async (feedbackId) => {
    if (!replyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    try {
      setIsReplying(true);
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/response`,
        { response: replyText.trim() }
      );
      toast.success("Phản hồi đã được gửi thành công!");
      setReplyText("");
      setReplyingTo(null);
      fetchFeedbacks(); // refresh list
    } catch (err) {
      console.error("Error submitting feedback response:", err);
      toast.error("Không thể gửi phản hồi. Vui lòng thử lại.");
    } finally {
      setIsReplying(false);
    }
  };

  // Render star rating
  const renderStars = (
    rating,
    interactive = false,
    onStarClick = null,
    onStarHover = null
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = interactive
        ? hoveredRating >= i || (!hoveredRating && selectedRating >= i)
        : rating >= i;
      stars.push(
        <span
          key={i}
          className={`star ${isActive ? "active" : ""} ${
            interactive ? "interactive" : ""
          }`}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
          onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
        >
          {isActive ? "★" : "☆"}
        </span>
      );
    }
    return <div className="stars-container">{stars}</div>;
  };

  // Get user display name
  const getUserDisplayName = (feedback) => {
    if (feedback.user_id && userInfoMap[feedback.user_id]) {
      return userInfoMap[feedback.user_id];
    }

    // Fallback nếu chưa có thông tin user
    if (feedback.user_id && typeof feedback.user_id === "string") {
      const userId = feedback.user_id;
      if (userId.length > 10) {
        const lastFour = userId.slice(-4);
        return `Người dùng ${lastFour.toUpperCase()}`;
      } else {
        return `Người dùng ${userId}`;
      }
    }

    return "Người dùng ẩn danh";
  };

  // Get user avatar initial
  const getUserAvatar = (feedback) => {
    const displayName = getUserDisplayName(feedback);
    return displayName.charAt(0).toUpperCase();
  };

  // Handle pagination
  const totalPages = Math.ceil(
    (showActiveOnly
      ? feedbacks.filter((f) => f.feedback_status === "active").length
      : feedbacks.length) / itemsPerPage
  );

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          className="page-btn"
          onClick={() => handlePageChange(currentPage - 1)}
          aria-label="Previous page"
        >
          ‹
        </button>
      );
    }

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        pages.push(
          <button
            key={i}
            className={`page-btn ${currentPage === i ? "active" : ""}`}
            onClick={() => handlePageChange(i)}
            aria-current={currentPage === i ? "page" : undefined}
          >
            {i}
          </button>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pages.push(
          <span key={`dots-${i}`} className="page-dots" aria-hidden="true">
            ...
          </span>
        );
      }
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          className="page-btn"
          onClick={() => handlePageChange(currentPage + 1)}
          aria-label="Next page"
        >
          ›
        </button>
      );
    }

    return pages;
  };

  const overallRating = calculateOverallRating();
  const paginatedFeedbacks = getPaginatedFeedbacks();

  if (loading) {
    return (
      <section className="business-feedback-section">
        <div className="business-feedback">
          <div className="feedback-container">
            <div className="loading-state">Đang tải đánh giá...</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="business-feedback-section">
      <div className="business-feedback">
        <div className="feedback-container">
          <h2 className="feedback-title">Đánh giá từ khách hàng</h2>

          {/* Overall Rating */}
          <div className="overall-rating">
            <div className="rating-section">
              <div className="rating-score">
                <span className="score">{overallRating.toFixed(1)}</span>
                <div className="stars">{renderStars(overallRating)}</div>
              </div>
              <span className="time-period">
                {showActiveOnly
                  ? feedbacks.filter((f) => f.feedback_status === "active")
                      .length
                  : feedbacks.length}{" "}
                đánh giá
              </span>
              <label
                className="toggle-container"
                style={{ marginLeft: "1rem" }}
              >
                <input
                  type="checkbox"
                  checked={showActiveOnly}
                  onChange={() => setShowActiveOnly((prev) => !prev)}
                  className="toggle-input"
                />
                <span className="toggle-slider"></span>
                <span className="status-text">
                  {showActiveOnly ? "Chỉ active" : "Tất cả"}
                </span>
              </label>
            </div>
            <div className="review-actions">
              {!showWriteReview ? null : (
                <div className="write-review-section">
                  {/* Rating Selection */}
                  <div className="rating-input-section">
                    <label className="rating-label">Đánh giá của bạn:</label>
                    <div className="interactive-stars">
                      {renderStars(
                        selectedRating,
                        true,
                        setSelectedRating,
                        setHoveredRating
                      )}
                    </div>
                    <span className="rating-text">
                      {selectedRating === 1 && "Rất không hài lòng"}
                      {selectedRating === 2 && "Không hài lòng"}
                      {selectedRating === 3 && "Bình thường"}
                      {selectedRating === 4 && "Hài lòng"}
                      {selectedRating === 5 && "Rất hài lòng"}
                    </span>
                  </div>

                  <textarea
                    className="feedback-textarea"
                    placeholder="Chia sẻ trải nghiệm của bạn..."
                    value={newFeedback}
                    onChange={(e) => setNewFeedback(e.target.value)}
                    rows="4"
                  />
                  <div className="review-form-actions">
                    <button
                      className="submit-review-btn"
                      onClick={handleSubmitFeedback}
                      disabled={isSubmitting || !newFeedback.trim()}
                    >
                      {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                    <button
                      className="cancel-review-btn"
                      onClick={() => {
                        setShowWriteReview(false);
                        setNewFeedback("");
                        setSelectedRating(5);
                      }}
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Customer Reviews Section */}
          <div className="customer-reviews-section">
            <div className="reviews-header">
              <h3 className="reviews-title">Đánh giá của khách hàng</h3>
              <div className="reviews-summary">
                <span className="total-reviews">
                  {showActiveOnly
                    ? feedbacks.filter((f) => f.feedback_status === "active")
                        .length
                    : feedbacks.length}{" "}
                  đánh giá
                </span>
                <select
                  className="sort-dropdown"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  aria-label="Sắp xếp đánh giá"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="oldest">Cũ nhất</option>
                  <option value="most_helpful">Hữu ích nhất</option>
                  <option value="highest_rating">Đánh giá cao nhất</option>
                  <option value="lowest_rating">Đánh giá thấp nhất</option>
                </select>
              </div>
            </div>

            {paginatedFeedbacks.length > 0 ? (
              <div className="reviews-list">
                {paginatedFeedbacks.map((feedback) => (
                  <div
                    key={feedback._id}
                    className={`review-item ${
                      feedback.feedback_status === "inactive" ? "inactive" : ""
                    }`}
                  >
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {getUserAvatar(feedback)}
                        </div>
                        <div className="reviewer-details">
                          <span className="reviewer-name">
                            {getUserDisplayName(feedback)}
                          </span>
                          <div className="review-rating">
                            <span className="stars">
                              {renderStars(feedback.feedback_rating || 5)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className="review-date">
                        {new Date(feedback.feedback_date).toLocaleDateString(
                          "vi-VN",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          }
                        )}
                        {canDelete && (
                          <span className="status-feedback-btn">
                            {feedback.feedback_status === "inactive" ? (
                              <span className="active-feedback-btn">
                                <FaRegCircleCheck
                                  onClick={() =>
                                    handleToggleFeedbackStatus(
                                      feedback._id,
                                      feedback.feedback_status
                                    )
                                  }
                                  size={20}
                                  title="Hiện đánh giá này"
                                  style={{ cursor: "pointer" }}
                                />
                              </span>
                            ) : (
                              <span className="delete-feedback-btn">
                                <IoBanSharp
                                  onClick={() =>
                                    handleToggleFeedbackStatus(
                                      feedback._id,
                                      feedback.feedback_status
                                    )
                                  }
                                  size={20}
                                  title="Ẩn đánh giá này"
                                  style={{ cursor: "pointer" }}
                                />
                              </span>
                            )}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="review-content">
                      <p className="review-text">{feedback.feedback_comment}</p>

                      {feedback.feedback_response ? (
                        <div className="business-response">
                          <div className="response-header">
                            <strong>Phản hồi từ doanh nghiệp:</strong>
                          </div>
                          <p className="response-text">
                            {feedback.feedback_response}
                          </p>
                        </div>
                      ) : (
                        canDelete && (
                          <>
                            {replyingTo === feedback._id ? (
                              <div className="reply-section">
                                <textarea
                                  className="reply-textarea"
                                  placeholder="Nhập phản hồi của bạn..."
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows="3"
                                />
                                <div className="reply-actions">
                                  <button
                                    className="submit-reply-btn"
                                    onClick={() =>
                                      handleSubmitReply(feedback._id)
                                    }
                                    disabled={isReplying || !replyText.trim()}
                                  >
                                    {isReplying
                                      ? "Đang gửi..."
                                      : "Gửi phản hồi"}
                                  </button>
                                  <button
                                    className="cancel-reply-btn"
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText("");
                                    }}
                                  >
                                    Hủy
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                className="reply-toggle-btn"
                                onClick={() => setReplyingTo(feedback._id)}
                              >
                                💬 Phản hồi
                              </button>
                            )}
                          </>
                        )
                      )}
                    </div>

                    {feedback.feedback_status !== "inactive" && (
                      <div className="review-footer">
                        <button
                          className="share-btn"
                          onClick={() => {
                            if (navigator.share) {
                              navigator.share({
                                text: feedback.feedback_comment,
                                url: window.location.href,
                              });
                            } else {
                              navigator.clipboard.writeText(
                                window.location.href
                              );
                              toast.success("Đã sao chép link");
                            }
                          }}
                        >
                          <span className="share-icon">↗</span> Chia sẻ
                        </button>

                        <div className="helpful-section">
                          <div className="helpful-buttons">
                            <button
                              className="helpful-btn like-btn"
                              onClick={() => handleLike(feedback._id)}
                            >
                              👍 {feedback.feedback_like || 0}
                            </button>
                            <button
                              className="helpful-btn dislike-btn"
                              onClick={() => handleDislike(feedback._id)}
                            >
                              👎 {feedback.feedback_dislike || 0}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-reviews">
                <p>Chưa có đánh giá nào cho doanh nghiệp này.</p>
                <p>Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                className="pagination"
                role="navigation"
                aria-label="Phân trang đánh giá"
              >
                {renderPagination()}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBusinessFeedback;
