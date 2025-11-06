import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";

import Header from "../../components/Header";
import HeroSectionAdmin from "../../components/HeroSectionAdmin";
import "../../css/ManageAIBotsPage.css";
import { RiLoginCircleLine } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { FaTrash } from "react-icons/fa";

function ManageFeedbackPage() {
  const navigate = useNavigate();
  const [feedbacks, setFeedbacks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [typeFilter, setTypeFilter] = useState("business");
  const [minRating, setMinRating] = useState(1);
  const [maxRating, setMaxRating] = useState(5);
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");
  const [productBusinessMap, setProductBusinessMap] = useState({});
  const [productNameMap, setProductNameMap] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalComment, setModalComment] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    const fetchUsernames = async () => {
      try {
        const userIds = [...new Set(feedbacks.map((fb) => fb.user_id))];

        const userResponses = await Promise.all(
          userIds.map((id) =>
            axios
              .get(`${import.meta.env.VITE_BE_URL}/api/user/${id}`)
              .catch(() => null)
          )
        );

        const usernameMap = {};
        userResponses.forEach((res) => {
          const user = res?.data;
          if (user?.clerkId) usernameMap[user.clerkId] = user.fullName;
        });

        setFiltered((prev) =>
          prev.map((fb) => ({
            ...fb,
            user_fullName: usernameMap[fb.user_id] || "Loading",
          }))
        );
      } catch (err) {
        console.error("Failed to fetch usernames:", err);
      }
    };

    if (feedbacks.length > 0) fetchUsernames();
  }, [feedbacks]);

  useEffect(() => {
    const fetchProductBusinesses = async () => {
      const productFeedbacks = feedbacks.filter(
        (f) => f.feedback_type === "product"
      );
      const uniqueProductIds = [
        ...new Set(productFeedbacks.map((f) => f.product_id)),
      ];

      const productResponses = await Promise.all(
        uniqueProductIds.map((id) =>
          axios
            .get(`${import.meta.env.VITE_BE_URL}/api/product/${id}`)
            .catch(() => null)
        )
      );

      const businessMap = {};
      const productMap = {};
      productResponses.forEach((res) => {
        if (res?.data?._id) {
          businessMap[res.data._id] =
            res.data.business_id?.business_name || "N/A";
          productMap[res.data._id] = res.data.product_name || "N/A";
        }
      });
      setProductBusinessMap(businessMap);
      setProductNameMap(productMap);
    };

    if (feedbacks.some((f) => f.feedback_type === "product")) {
      fetchProductBusinesses();
    }
  }, [feedbacks]);

  const fetchFeedbacks = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BE_URL}/api/feedback/`
      );
      const data = res.data?.data || [];
      setFeedbacks(data);
      setFiltered(data);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách feedback.");
    }
  };

  useEffect(() => {
    let data = [...feedbacks];

    if (typeFilter !== "all") {
      data = data.filter((f) => f.feedback_type === typeFilter);
    }

    data = data.filter(
      (f) => f.feedback_rating >= minRating && f.feedback_rating <= maxRating
    );

    if (search.trim()) {
      data = data.filter(
        (f) =>
          f.feedback_comment.toLowerCase().includes(search.toLowerCase()) ||
          f.business_id?.business_name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          f.product_id?.toLowerCase().includes(search.toLowerCase())
      );
    }

    data.sort((a, b) => {
      const da = new Date(a.feedback_date);
      const db = new Date(b.feedback_date);
      return sortOrder === "desc" ? db - da : da - db;
    });

    setFiltered(data);
  }, [typeFilter, minRating, maxRating, sortOrder, search, feedbacks]);

  const openCommentModal = (comment) => {
    setModalComment(comment);
    setModalOpen(true);
  };

  const closeCommentModal = () => {
    setModalOpen(false);
    setModalComment("");
  };

  const handleEnterBusiness = (id) => navigate(`/business/${id}`);

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phản hồi này không?")) {
      return;
    }

    try {
      await axios.delete(
        `${import.meta.env.VITE_BE_URL}/api/feedback/${feedbackId}`
      );
      toast.success("Đã xóa phản hồi thành công!");

      setFeedbacks((prev) => prev.filter((fb) => fb._id !== feedbackId));
      setFiltered((prev) => prev.filter((fb) => fb._id !== feedbackId));
      setCurrentPage(1);
    } catch (err) {
      console.error("Lỗi khi xóa phản hồi:", err);
      toast.error("Không thể xóa phản hồi. Vui lòng thử lại.");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFeedbacks = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  return (
    <>
      <Header />
      <HeroSectionAdmin
        message={
          <>
            Trang quản lý <br /> Phản hồi người dùng
          </>
        }
      />

      <div className="manage-business-container">
        {/* Filters */}
        <div className="manage-business-table-header">
          <div className="manage-business-search-bar">
            <input
              type="text"
              placeholder="Tìm nội dung phản hồi, doanh nghiệp..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="manage-business-search-bar"
            />
          </div>

          <div className="manage-business-sort-select">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="manage-business-sort-select"
            >
              <option value="business">Doanh nghiệp</option>
              <option value="product">Sản phẩm</option>
            </select>
          </div>

          <div>
            <label>Từ</label>
            <input
              type="number"
              min="1"
              max="5"
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="feedback-rating-filter"
            />
            <label>đến</label>
            <input
              type="number"
              min="1"
              max="5"
              value={maxRating}
              onChange={(e) => setMaxRating(Number(e.target.value))}
              className="feedback-rating-filter"
            />
            <span>⭐</span>
          </div>

          <div className="manage-business-sort-select">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="manage-business-sort-select"
            >
              <option value="desc">Mới nhất</option>
              <option value="asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="manage-business-table-container">
          <table className="manage-feedback-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Loại</th>
                <th>Đối tượng</th>
                {typeFilter === "product" && <th>Thuộc doanh nghiệp</th>}
                <th>Bình luận</th>
                <th>⭐</th>
                <th>👍</th>
                <th>👎</th>
                <th>Ngày</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="wait">
                {currentFeedbacks.length > 0 ? (
                  currentFeedbacks.map((fb) => (
                    <motion.tr
                      key={fb._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <td>{fb.user_fullName || "Loading"}</td>
                      <td>{fb.feedback_type.toUpperCase()}</td>
                      <td>
                        {fb.feedback_type === "business"
                          ? fb.business_id?.business_name
                          : productNameMap[fb.product_id] || "Loading"}
                      </td>
                      {fb.feedback_type === "product" && (
                        <td>
                          {productBusinessMap[fb.product_id] || "Loading"}
                        </td>
                      )}
                      <td>
                        {fb.feedback_comment.length <= 20 ? (
                          fb.feedback_comment
                        ) : (
                          <>
                            {fb.feedback_comment.slice(0, 20)}...
                            <button
                              onClick={() =>
                                openCommentModal(fb.feedback_comment)
                              }
                              style={{
                                marginLeft: "5px",
                                cursor: "pointer",
                                color: "blue",
                                background: "none",
                                border: "none",
                                textDecoration: "underline",
                              }}
                            >
                              Xem thêm
                            </button>
                          </>
                        )}
                      </td>
                      <td>{fb.feedback_rating}</td>
                      <td>{fb.feedback_like}</td>
                      <td>{fb.feedback_dislike}</td>
                      <td>
                        {new Date(fb.feedback_date).toLocaleString("vi-VN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td style={{display: "flex", alignItems: "center"}}>
                        <FaTrash
                          className="manage-business-actions delete"
                          onClick={() => handleDeleteFeedback(fb._id)}
                          title="Xóa phản hồi"
                        />
                        <RiLoginCircleLine
                          className="manage-business-actions enter"
                          onClick={() =>
                            handleEnterBusiness(fb?.business_id?._id)
                          }
                          title="Truy cập doanh nghiệp"
                        />
                      </td>
                    </motion.tr>
                  ))
                ) : (
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td colSpan="9" className="no-data">
                      Không có feedback nào.
                    </td>
                  </motion.tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="page-btn"
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`page-btn ${currentPage === num ? "active" : ""}`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="page-btn"
          >
            ›
          </button>
        </div>
      </div>

      {modalOpen && (
        <div
          className="modal-overlay"
          onClick={closeCommentModal}
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
              padding: "20px",
              borderRadius: "10px",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <p>{modalComment}</p>
            <button className="modal-close-button" onClick={closeCommentModal}>
              Đóng
            </button>
          </motion.div>
        </div>
      )}
    </>
  );
}

export default ManageFeedbackPage;
