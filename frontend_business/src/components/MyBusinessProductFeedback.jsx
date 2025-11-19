import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../css/ProductFeedback.css";
import { FaRegCircleCheck } from "react-icons/fa6";
import { IoBanSharp } from "react-icons/io5";
import { FaTrash, FaPencilAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion"; // Đã thêm

// Đã XÓA component ConfirmToast

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

  // States cho modal ẩn/hiện
  const [toggleModalOpen, setToggleModalOpen] = useState(false);
  const [feedbackToToggle, setFeedbackToToggle] = useState(null); // Sẽ lưu { id, status }

  // States cho modal xóa phản hồi
  const [deleteReplyModalOpen, setDeleteReplyModalOpen] = useState(false);
  const [feedbackIdForReplyDelete, setFeedbackIdForReplyDelete] =
    useState(null);

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

  // ---- ĐÃ THAY ĐỔI: Logic Ẩn/Hiện Đánh giá ----
  // 1. Hàm mở modal
  const confirmToggleFeedbackStatus = (feedbackId, currentStatus) => {
    setFeedbackToToggle({ id: feedbackId, status: currentStatus });
    setToggleModalOpen(true);
  };

  // 2. Hàm thực thi logic sau khi xác nhận
  const executeToggleFeedbackStatus = async () => {
    if (!feedbackToToggle) return;

    const { id, status } = feedbackToToggle;
    const isInactive = status === "inactive";
    const newStatus = isInactive ? "active" : "inactive";

    setToggleModalOpen(false); // Đóng modal

    try {
      // Sử dụng toast.promise
      const promise = axios.put(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${id}`,
        { feedback_status: newStatus }
      );

      await toast.promise(promise, {
        pending: "Đang cập nhật trạng thái...",
        success: `Đánh giá đã được ${isInactive ? "hiện" : "ẩn"} thành công!`,
        error: "Không thể cập nhật trạng thái. Vui lòng thử lại.",
      });

      fetchFeedbacks();
    } catch (err) {
      console.error("Error updating feedback status:", err);
      // toast.promise đã xử lý toast lỗi
    } finally {
      setFeedbackToToggle(null); // Reset state
    }
  };
  // ---- KẾT THÚC THAY ĐỔI ----

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

  // ---- ĐÃ THAY ĐỔI: Logic Xóa Phản hồi ----
  // 1. Hàm mở modal
  const confirmDeleteReply = (feedbackId) => {
    setFeedbackIdForReplyDelete(feedbackId);
    setDeleteReplyModalOpen(true);
  };

  // 2. Hàm thực thi logic sau khi xác nhận
  const executeDeleteReply = async () => {
    if (!feedbackIdForReplyDelete) return;

    const feedbackId = feedbackIdForReplyDelete;
    setDeleteReplyModalOpen(false); // Đóng modal

    try {
      // Sử dụng toast.promise
      const promise = axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/response`,
        { response: null } // Gửi null để xóa
      );

      await toast.promise(promise, {
        pending: "Đang xóa phản hồi...",
        success: "Đã xóa phản hồi!",
        error: "Không thể xóa phản hồi.",
      });

      fetchFeedbacks();
      handleCancelEditReply();
    } catch (err) {
      console.error("Error deleting reply:", err);
      // toast.promise đã xử lý toast lỗi
    } finally {
      setFeedbackIdForReplyDelete(null); // Reset state
    }
  };
  // ---- KẾT THÚC THAY ĐỔI ----

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

  // Biến cho modal Ẩn/Hiện
  const isInactiveForModal = feedbackToToggle?.status === "inactive";
  const toggleModalActionText = isInactiveForModal ? "hiện" : "ẩn";
  const toggleModalButtonText = isInactiveForModal ? "Hiện" : "Ẩn";
  const toggleModalButtonColor = isInactiveForModal ? "green" : "red";

  return (
    <div
      className={`product-feedback-section ${isModal ? "modal-version" : ""}`}
    >
      <div className="product-feedback">
        <div className="feedback-container">
          {!isModal && <h2 className="feedback-title">Đánh giá sản phẩm</h2>}

          {/* Overall Rating */}
          <div className="my-business-overall-rating">
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
                                    // ---- THAY ĐỔI: Sử dụng hàm confirm ----
                                    confirmToggleFeedbackStatus(
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
                                    // ---- THAY ĐỔI: Sử dụng hàm confirm ----
                                    confirmToggleFeedbackStatus(
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
                                        // ---- THAY ĐỔI: Sử dụng hàm confirm ----
                                        confirmDeleteReply(feedback._id)
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
                                  onChange={(e) => {
                                    if (e.target.value.length <= 250) {
                                      setReplyText(e.target.value);
                                    }
                                  }}
                                  rows="3"
                                />
                                <p
                                  style={{
                                    fontStyle: "italic",
                                    fontSize: "0.85rem",
                                    marginTop: "4px",
                                    color: "grey",
                                  }}
                                >
                                  *Giới hạn 250 ký tự
                                </p>
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

      {/* ---- MODAL XÁC NHẬN ẨN/HIỆN ---- */}
      <AnimatePresence>
        {toggleModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setToggleModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "10px",
                maxWidth: "350px",
                width: "90%",
                textAlign: "center",
              }}
            >
              <h3>Xác nhận {toggleModalActionText}</h3>
              <p>
                Bạn có chắc chắn muốn {toggleModalActionText} đánh giá này
                không?
              </p>
              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() => setToggleModalOpen(false)}
                  style={{
                    marginRight: "10px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#ccc",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={executeToggleFeedbackStatus}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: toggleModalButtonColor,
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  {toggleModalButtonText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---- MODAL XÁC NHẬN XÓA PHẢN HỒI ---- */}
      <AnimatePresence>
        {deleteReplyModalOpen && (
          <div
            className="modal-overlay"
            onClick={() => setDeleteReplyModalOpen(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                backgroundColor: "#fff",
                padding: "30px",
                borderRadius: "10px",
                maxWidth: "350px",
                width: "90%",
                textAlign: "center",
              }}
            >
              <h3>Xác nhận xóa</h3>
              <p>Bạn có chắc chắn muốn xóa phản hồi này không?</p>
              <div style={{ marginTop: "20px" }}>
                <button
                  onClick={() => setDeleteReplyModalOpen(false)}
                  style={{
                    marginRight: "10px",
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "#ccc",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  Hủy
                </button>
                <button
                  onClick={executeDeleteReply}
                  style={{
                    padding: "10px 20px",
                    cursor: "pointer",
                    background: "red",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                  }}
                >
                  Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductFeedback;
