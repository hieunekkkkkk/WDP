// components/ProductFeedback.jsx
import React, { useState, useEffect, useMemo } from "react"; // Added useMemo
import axios from "axios";
import { toast } from "react-toastify";
import { FaTrash, FaPencilAlt } from "react-icons/fa"; // Added icons
import "../css/ProductFeedback.css";
// Make sure styles from BusinessFeedback.css (like .edit-review-btn) are also available

// 1. Added canDelete prop
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

  // 2. Added new state for editing
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editedComment, setEditedComment] = useState("");
  const [editedRating, setEditedRating] = useState(5);
  const [isUpdating, setIsUpdating] = useState(false);

  const itemsPerPage = isModal ? 3 : 5;

  // 3. Added memo to get current user ID
  const currentUserId = useMemo(() => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub || payload.id; // Get user ID from token
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  }, []);

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
    const activeFeedbacks = getActiveFeedbacks();
    if (activeFeedbacks.length === 0) return 0;

    const totalRating = activeFeedbacks.reduce((sum, feedback) => {
      return sum + (feedback.feedback_rating || 5);
    }, 0);

    return totalRating / activeFeedbacks.length;
  };
  const getActiveFeedbacks = () => {
    return feedbacks.filter((f) => f.feedback_status !== "inactive");
  };

  const getSortedFeedbacks = () => {
    const activeFeedbacks = getActiveFeedbacks();
    const sorted = [...activeFeedbacks];

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

  // Handle feedback submission
  const handleSubmitFeedback = async () => {
    if (!newFeedback.trim()) return;

    try {
      setIsSubmitting(true);

      const token = localStorage.getItem("accessToken");
      if (!token || !currentUserId) {
        toast.error("Vui lòng đăng nhập để gửi đánh giá");
        setIsSubmitting(false);
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/feedback`,
        {
          user_id: currentUserId,
          product_id: productId,
          feedback_type: "product",
          feedback_comment: newFeedback.trim(),
          feedback_rating: selectedRating,
          feedback_like: 0,
          feedback_dislike: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.message === "Feedback created successfully") {
        setNewFeedback("");
        setSelectedRating(5);
        fetchFeedbacks();
        toast.success("Đánh giá sản phẩm đã được gửi thành công!");
      }
    } catch (err) {
      console.error("Error submitting product feedback:", err);
      toast.error("Không thể gửi đánh giá. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeDelete = async (feedbackId) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại để thực hiện hành động này.");
        return;
      }

      await axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Đã xóa đánh giá thành công!");
      fetchFeedbacks(); // Refresh the list
    } catch (err) {
      console.error("Error deleting feedback:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Bạn không có quyền xóa đánh giá này.");
      } else {
        toast.error("Không thể xóa đánh giá. Vui lòng thử lại.");
      }
    }
  };

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

  const handleDeleteFeedback = (feedbackId) => {
    toast.warn(
      <ConfirmToast
        message="Bạn có chắc chắn muốn xóa đánh giá này không?"
        onConfirm={() => executeDelete(feedbackId)}
      />,
      {
        position: "top-center",
        autoClose: false, // Don't auto-close
        closeOnClick: false, // Don't close on click
        pauseOnHover: true,
        draggable: false,
        closeButton: false, // Hide the default 'x' button
        theme: "colored", // Use the warning color theme
      }
    );
  };

  const handleEditClick = (feedback) => {
    setEditingFeedbackId(feedback._id);
    setEditedComment(feedback.feedback_comment);
    setEditedRating(feedback.feedback_rating || 5);
    setHoveredRating(0); // Reset hover state for stars
  };

  const handleCancelEdit = () => {
    setEditingFeedbackId(null);
    setEditedComment("");
    setEditedRating(5);
    setIsUpdating(false);
  };

  const handleUpdateFeedback = async () => {
    if (!editedComment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá");
      return;
    }
    if (!editingFeedbackId) return;

    setIsUpdating(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("Vui lòng đăng nhập lại.");
        setIsUpdating(false);
        return;
      }

      // Using PUT as requested
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${editingFeedbackId}`,
        {
          feedback_comment: editedComment.trim(),
          feedback_rating: editedRating,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success("Đã cập nhật đánh giá!");
      handleCancelEdit(); // Exit edit mode
      fetchFeedbacks(); // Refresh the list
    } catch (err) {
      console.error("Error updating feedback:", err);
      toast.error("Không thể cập nhật đánh giá.");
      setIsUpdating(false);
    }
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

  const renderStars = (
    rating,
    interactive = false,
    onStarClick = null,
    onStarHover = null
  ) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      // Determine which rating to use for interactive mode
      const currentRating = interactive ? editedRating : selectedRating;
      const isActive = interactive
        ? hoveredRating >= i || (!hoveredRating && currentRating >= i)
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
  const totalPages = Math.ceil(getActiveFeedbacks().length / itemsPerPage);

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

  return (
    <div
      className={`product-feedback-section ${isModal ? "modal-version" : ""}`}
    >
      <div className="product-feedback">
        <div className="feedback-container">
          {!isModal && <h2 className="feedback-title">Đánh giá sản phẩm</h2>}

          {/* Overall Rating */}
          <div className="overall-rating">
            <div className="rating-score">
              <span className="score">{overallRating.toFixed(1)}</span>
              <div className="stars">{renderStars(overallRating)}</div>
            </div>
            <span className="time-period">
              từ {getActiveFeedbacks().length} đánh giá
            </span>

            {!isModal && (
              <div className="review-actions-modal">
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
                    placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..."
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
                  </div>
                </div>
              </div>
            )}
          </div>

          {error && <div className="error-message">{error}</div>}

          {/* Customer Reviews Section */}
          <div className="customer-reviews-section">
            <div className="reviews-header">
              <h3 className="reviews-title">Đánh giá của khách hàng</h3>
              <div className="reviews-summary">
                <span className="total-reviews">
                  {getActiveFeedbacks().length} đánh giá
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
                  <div key={feedback._id} className="review-item">
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
                        {canDelete &&
                          currentUserId &&
                          currentUserId === feedback.user_id && (
                            <div className="review-owner-controls">
                              <button
                                className="edit-review-btn"
                                onClick={() => handleEditClick(feedback)}
                                aria-label="Sửa đánh giá"
                                title="Sửa đánh giá này"
                                disabled={editingFeedbackId === feedback._id}
                              >
                                <FaPencilAlt />
                              </button>
                              <button
                                className="delete-review-btn"
                                onClick={() =>
                                  handleDeleteFeedback(feedback._id)
                                }
                                aria-label="Xóa đánh giá"
                                title="Xóa đánh giá này"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          )}
                      </span>
                    </div>

                    {/* 6. ADDED CONDITIONAL EDIT FORM */}
                    {editingFeedbackId === feedback._id ? (
                      <div className="edit-feedback-form">
                        <div className="rating-input-section">
                          <label className="rating-label">Sửa đánh giá:</label>
                          <div className="interactive-stars">
                            {renderStars(
                              editedRating,
                              true,
                              setEditedRating, // Use the setter for the edited rating
                              setHoveredRating
                            )}
                          </div>
                        </div>
                        <textarea
                          className="feedback-textarea-edit" // Reuses CSS
                          value={editedComment}
                          onChange={(e) => setEditedComment(e.target.value)}
                          rows="3"
                        />
                        <div className="review-form-actions">
                          <button
                            className="submit-review-btn"
                            onClick={handleUpdateFeedback}
                            disabled={isUpdating || !editedComment.trim()}
                          >
                            {isUpdating ? "Đang lưu..." : "Lưu"}
                          </button>
                          <button
                            className="cancel-review-btn"
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Original review content
                      <div className="review-content">
                        <p className="review-text">
                          {feedback.feedback_comment}
                        </p>

                        {feedback.feedback_response && (
                          <div className="business-response">
                            <div className="response-header">
                              <strong>Phản hồi từ doanh nghiệp:</strong>
                            </div>
                            <p className="response-text">
                              {feedback.feedback_response}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

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
