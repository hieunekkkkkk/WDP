import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import '../css/BusinessFeedback.css';

const BusinessFeedback = ({ businessId }) => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [newFeedback, setNewFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [userInfoMap, setUserInfoMap] = useState({});

  const itemsPerPage = 5;

  // Fetch feedbacks when component mounts or businessId changes
  useEffect(() => {
    if (businessId) {
      fetchFeedbacks();
    }
  }, [businessId]);

  const fetchUserInfo = async (userId) => {
    if (!userId || userInfoMap[userId]) return;

    try {
      const response = await axios.get(`${import.meta.env.VITE_BE_URL}/api/user/${userId}`);
      const user = response.data?.users;
      const username = user?.fullName || user?.email?.split('@')[0] || 'Người dùng';
      setUserInfoMap((prev) => ({ ...prev, [userId]: username }));
    } catch (error) {
      console.error('Error fetching user info:', error);
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
      feedbackData.forEach(feedback => {
        if (feedback.user_id) {
          fetchUserInfo(feedback.user_id);
        }
      });

    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      if (err.response?.status === 404) {
        setFeedbacks([]); // No feedbacks found is not an error
      } else {
        setError('Không thể tải đánh giá');
        toast.error('Không thể tải đánh giá');
      }
    } finally {
      setLoading(false);
    }
  };

  // Calculate overall rating from feedbacks
  const calculateOverallRating = () => {
    if (feedbacks.length === 0) return 0;

    const totalRating = feedbacks.reduce((sum, feedback) => {
      return sum + (feedback.feedback_rating || 5); // Use actual rating or default to 5
    }, 0);

    return totalRating / feedbacks.length;
  };

  // Sort feedbacks based on selected option
  const getSortedFeedbacks = () => {
    const sorted = [...feedbacks];

    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.feedback_date) - new Date(a.feedback_date));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.feedback_date) - new Date(b.feedback_date));
      case 'most_helpful':
        return sorted.sort((a, b) => (b.feedback_like || 0) - (a.feedback_like || 0));
      case 'highest_rating':
        return sorted.sort((a, b) => (b.feedback_rating || 5) - (a.feedback_rating || 5));
      case 'lowest_rating':
        return sorted.sort((a, b) => (a.feedback_rating || 5) - (b.feedback_rating || 5));
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
    if (!newFeedback.trim()) {
      toast.error('Vui lòng nhập nội dung đánh giá');
      return;
    }

    try {
      setIsSubmitting(true);

      // Get current user ID from token
      const token = localStorage.getItem('accessToken');
      if (!token) {
        toast.error('Vui lòng đăng nhập để gửi đánh giá');
        return;
      }

      // Decode token to get user ID
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || payload.id;

      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/feedback`,
        {
          user_id: userId,
          business_id: businessId,
          feedback_type: 'business',
          feedback_comment: newFeedback.trim(),
          feedback_rating: selectedRating, // Include rating
          feedback_like: 0,
          feedback_dislike: 0
        }
      );

      if (response.data.message === 'Feedback created successfully') {
        setNewFeedback('');
        setSelectedRating(5);
        setShowWriteReview(false);
        fetchFeedbacks(); // Refresh feedbacks
        toast.success('Đánh giá đã được gửi thành công!');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      toast.error('Không thể gửi đánh giá. Vui lòng thử lại.');
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
      toast.success('Đã thích đánh giá này');
    } catch (err) {
      console.error('Error liking feedback:', err);
      toast.error('Không thể thích đánh giá này');
    }
  };

  const handleDislike = async (feedbackId) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}/dislike`
      );
      fetchFeedbacks(); // Refresh to get updated counts
      toast.success('Đã không thích đánh giá này');
    } catch (err) {
      console.error('Error disliking feedback:', err);
      toast.error('Không thể bỏ thích đánh giá này');
    }
  };

  // Render star rating
  const renderStars = (rating, interactive = false, onStarClick = null, onStarHover = null) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isActive = interactive ? (hoveredRating >= i || (!hoveredRating && selectedRating >= i)) : rating >= i;
      stars.push(
        <span
          key={i}
          className={`star ${isActive ? 'active' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onStarClick && onStarClick(i)}
          onMouseEnter={() => interactive && onStarHover && onStarHover(i)}
          onMouseLeave={() => interactive && onStarHover && onStarHover(0)}
        >
          {isActive ? '★' : '☆'}
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
    if (feedback.user_id && typeof feedback.user_id === 'string') {
      const userId = feedback.user_id;
      if (userId.length > 10) {
        const lastFour = userId.slice(-4);
        return `Người dùng ${lastFour.toUpperCase()}`;
      } else {
        return `Người dùng ${userId}`;
      }
    }

    return 'Người dùng ẩn danh';
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
            className={`page-btn ${currentPage === i ? 'active' : ''}`}
            onClick={() => handlePageChange(i)}
            aria-current={currentPage === i ? 'page' : undefined}
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
            <div className="rating-score">
              <span className="score">{overallRating.toFixed(1)}</span>
              <div className="stars">{renderStars(overallRating)}</div>
            </div>
            <span className="time-period">từ {feedbacks.length} đánh giá</span>

            <div className="review-actions">
              {!showWriteReview ? (
                <button
                  className="write-review-btn"
                  onClick={() => setShowWriteReview(true)}
                >
                  Viết đánh giá
                </button>
              ) : (
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
                      {selectedRating === 1 && 'Rất không hài lòng'}
                      {selectedRating === 2 && 'Không hài lòng'}
                      {selectedRating === 3 && 'Bình thường'}
                      {selectedRating === 4 && 'Hài lòng'}
                      {selectedRating === 5 && 'Rất hài lòng'}
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
                      {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                    </button>
                    <button
                      className="cancel-review-btn"
                      onClick={() => {
                        setShowWriteReview(false);
                        setNewFeedback('');
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

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* Customer Reviews Section */}
          <div className="customer-reviews-section">
            <div className="reviews-header">
              <h3 className="reviews-title">Đánh giá của khách hàng</h3>
              <div className="reviews-summary">
                <span className="total-reviews">{feedbacks.length} đánh giá</span>
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
                            <span className="stars">{renderStars(feedback.feedback_rating || 5)}</span>
                          </div>
                        </div>
                      </div>
                      <span className="review-date">
                        {new Date(feedback.feedback_date).toLocaleDateString('vi-VN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    <div className="review-content">
                      <p className="review-text">{feedback.feedback_comment}</p>

                      {feedback.feedback_response && (
                        <div className="business-response">
                          <div className="response-header">
                            <strong>Phản hồi từ doanh nghiệp:</strong>
                          </div>
                          <p className="response-text">{feedback.feedback_response}</p>
                        </div>
                      )}
                    </div>

                    <div className="review-footer">
                      <button
                        className="share-btn"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              text: feedback.feedback_comment,
                              url: window.location.href
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            toast.success('Đã sao chép link');
                          }
                        }}
                      >
                        <span className="share-icon">↗</span> Chia sẻ
                      </button>

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
                <p>Chưa có đánh giá nào cho doanh nghiệp này.</p>
                <p>Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination" role="navigation" aria-label="Phân trang đánh giá">
                {renderPagination()}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessFeedback;