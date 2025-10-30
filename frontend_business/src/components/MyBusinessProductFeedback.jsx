import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../css/ProductFeedback.css";
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoBanSharp } from "react-icons/io5";
import { FaTrash, FaPencilAlt } from "react-icons/fa"; // Thêm icons

// Thêm component ConfirmToast
const ConfirmToast = ({ closeToast, onConfirm, message }) => (
  <div>
    <p>{message}</p>
    <div className="confirm-toast-buttons">
      <button
        className="confirm-btn ok"
        onClick={() => {
          onConfirm();
          closeToast();
        }}
      >
        OK
      </button>
      <button className="confirm-btn cancel" onClick={closeToast}>
        Hủy
      </button>
    </div>
  </div>
);

const ProductFeedback = ({ productId, isModal = false, canDelete = false }) => {
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
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedReplyText, setEditedReplyText] = useState("");

  const itemsPerPage = isModal ? 3 : 5;

  useEffect(() => {
    if (productId) {
      fetchFeedbacks();
    }
  }, [productId]);

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
        `${import.meta.env.VITE_BE_URL}/api/feedback/product/${productId}`
      );

      let feedbackData = [];
      if (response.data.success) {
        feedbackData = response.data.data || [];
      } else if (Array.isArray(response.data)) {
        feedbackData = response.data;
      } else {
        feedbackData = [];
      }

      setFeedbacks(feedbackData);

      feedbackData.forEach((feedback) => {
        if (feedback.user_id) {
          fetchUserInfo(feedback.user_id);
        }
      });
    } catch (err) {
      console.error("Error fetching feedbacks:", err);
      if (err.response?.status === 404) {
        setFeedbacks([]);
      } else {
        setError("Không thể tải đánh giá");
        toast.error("Không thể tải đánh giá");
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallRating = () => {
    let relevantFeedbacks = feedbacks;

    if (showActiveOnly) {
      relevantFeedbacks = feedbacks.filter(
        (f) => f.feedback_status === "active"
      );
    }

    if (relevantFeedbacks.length === 0) return 0;

    const totalRating = relevantFeedbacks.reduce((sum, feedback) => {
      return sum + (feedback.feedback_rating || 5);
    }, 0);

    return totalRating / relevantFeedbacks.length;
  };

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

  // Get paginated feedbacks
  const getPaginatedFeedbacks = () => {
    const sorted = getSortedFeedbacks();
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sorted.slice(startIndex, startIndex + itemsPerPage);
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
                fetchFeedbacks(); // refresh list
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

  // Handle like/dislike
  const handleLike = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/like`
      );
      fetchFeedbacks();
    } catch (err) {
      console.error("Error liking feedback:", err);
    }
  };

  const handleDislike = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/dislike`
      );
      fetchFeedbacks();
    } catch (err) {
      console.error("Error disliking feedback:", err);
    }
  };

  // --- Thêm các hàm xử lý cho Phản hồi ---

  // Gửi phản hồi MỚI
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

  // Bắt đầu SỬA phản hồi
  const handleStartEditReply = (feedback) => {
    setEditingReplyId(feedback._id);
    setEditedReplyText(feedback.feedback_response);
    setReplyingTo(null); // Đóng box "phản hồi mới"
    setReplyText("");
  };

  // Hủy SỬA phản hồi
  const handleCancelEditReply = () => {
    setEditingReplyId(null);
    setEditedReplyText("");
  };

  // Gửi SỬA phản hồi
  const handleSubmitEditReply = async (feedbackId) => {
    if (!editedReplyText.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }
    setIsReplying(true); // Tái sử dụng state loading
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/response`,
        { response: editedReplyText.trim() }
      );
      toast.success("Đã cập nhật phản hồi!");
      handleCancelEditReply();
      fetchFeedbacks();
    } catch (err) {
      console.error("Error updating reply:", err);
      toast.error("Không thể cập nhật phản hồi.");
    } finally {
      setIsReplying(false);
    }
  };

  // Logic XÓA phản hồi (gửi patch với null)
  const executeDeleteReply = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/response`,
        { response: null } // Gửi null để xóa
      );
      toast.success("Đã xóa phản hồi!");
      fetchFeedbacks();
      handleCancelEditReply();
    } catch (err) {
      console.error("Error deleting reply:", err);
      toast.error("Không thể xóa phản hồi.");
    }
  };

  // Hiển thị toast XÁC NHẬN XÓA phản hồi
  const handleDeleteReply = (feedbackId) => {
    toast.warn(
      <ConfirmToast
        message="Bạn có chắc chắn muốn xóa phản hồi này?"
        onConfirm={() => executeDeleteReply(feedbackId)}
      />,
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        pauseOnHover: true,
        draggable: false,
        closeButton: false,
        theme: "colored",
      }
    );
  };

  // --- Kết thúc các hàm xử lý phản hồi ---

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
  const totalPages = Math.ceil(feedbacks.length / itemsPerPage);

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
  const paginatedFeedbacks = getPaginatedFeedbacks().filter(
    (f) => !showActiveOnly || f.feedback_status === "active"
  );

  if (loading) {
    return (
      <div
        className={`product-feedback-section ${isModal ? "modal-version" : ""}`}
      >
        <div className="product-feedback">
          <div className="feedback-container">
            <div className="loading-state">Đang tải đánh giá sản phẩm...</div>
          </div>
        </div>
      </div>
    );
  }

  const displayedFeedbacks = showActiveOnly
    ? feedbacks.filter((f) => f.feedback_status === "active")
    : feedbacks;

  return (
    <div
      className={`product-feedback-section ${isModal ? "modal-version" : ""}`}
    >
      <div className="product-feedback">
        <div className="feedback-container">
          {!isModal && <h2 className="feedback-title">Đánh giá sản phẩm</h2>}

          {/* Overall Rating */}
          <div className="overall-rating">
            <div className="rating-section">
              <div className="rating-score">
                <span className="score">{overallRating.toFixed(1)}</span>
                <div className="stars">{renderStars(overallRating)}</div>
              </div>
              <span className="time-period">
                {displayedFeedbacks.length} đánh giá
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
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Customer Reviews Section */}
          <div className="customer-reviews-section">
            <div className="reviews-header">
              <h3 className="reviews-title">Đánh giá của khách hàng</h3>
              <div className="reviews-summary">
                <span className="total-reviews">
                  {displayedFeedbacks.length} đánh giá
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

                    {/* === CẬP NHẬT LOGIC PHẢN HỒI / SỬA / XÓA === */}
                    <div className="review-content">
                      <p className="review-text">{feedback.feedback_comment}</p>

                      {feedback.feedback_response ? (
                        <>
                          {editingReplyId === feedback._id ? (
                            // --- Chế độ SỬA PHẢN HỒI ---
                            <div
                              className="reply-section"
                              style={{ marginTop: "10px" }}
                            >
                              <textarea
                                className="reply-textarea"
                                value={editedReplyText}
                                onChange={(e) =>
                                  setEditedReplyText(e.target.value)
                                }
                                rows="3"
                              />
                              <div className="reply-actions">
                                <button
                                  className="submit-reply-btn"
                                  onClick={() =>
                                    handleSubmitEditReply(feedback._id)
                                  }
                                  disabled={
                                    isReplying || !editedReplyText.trim()
                                  }
                                >
                                  {isReplying ? "Đang lưu..." : "Lưu"}
                                </button>
                                <button
                                  className="cancel-reply-btn"
                                  onClick={handleCancelEditReply}
                                  disabled={isReplying}
                                >
                                  Hủy
                                </button>
                              </div>
                            </div>
                          ) : (
                            // --- Chế độ HIỂN THỊ PHẢN HỒI ---
                            <div className="business-response">
                              <div className="response-header">
                                <strong>Phản hồi từ doanh nghiệp:</strong>
                                {canDelete && (
                                  <div
                                    className="review-owner-controls"
                                    style={{ marginLeft: "auto" }}
                                  >
                                    <button
                                      className="edit-review-btn"
                                      onClick={() =>
                                        handleStartEditReply(feedback)
                                      }
                                      aria-label="Sửa phản hồi"
                                      title="Sửa phản hồi này"
                                    >
                                      <FaPencilAlt />
                                    </button>
                                    <button
                                      className="delete-review-btn"
                                      onClick={() =>
                                        handleDeleteReply(feedback._id)
                                      }
                                      aria-label="Xóa phản hồi"
                                      title="Xóa phản hồi này"
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <p className="response-text">
                                {feedback.feedback_response}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        // --- Chế độ TẠO PHẢN HỒI MỚI ---
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
                                onClick={() => {
                                  setReplyingTo(feedback._id);
                                  handleCancelEditReply(); // Đóng box edit nếu đang mở
                                }}
                              >
                                💬 Phản hồi
                              </button>
                            )}
                          </>
                        )
                      )}
                    </div>
                    {/* === KẾT THÚC LOGIC PHẢN HỒI === */}

                    {feedback.feedback_status !== "inactive" && (
                      <div className="review-footer">
                        <div className="helpful-section">
                          <span className="helpful-text">
                            Đánh giá này có hữu ích không?
                          </span>
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
                <p>Chưa có đánh giá nào cho sản phẩm này.</p>
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
    </div>
  );
};

export default ProductFeedback;