import React, { useState, useEffect } from "react";
import Modal from "react-modal";
import { toast } from "react-toastify";
import Header from "../../components/Header";
import HeroSectionAdmin from "../../components/HeroSectionAdmin";
import {
  getAllSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../api/ManagerSubject.jsx";
import "../../css/ManageSubjectPage.css";

Modal.setAppElement("#root");

function ManageSubjectPage() {
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const limit = 6;
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    author: "",
    category: "",
    driveUrl: "",
  });

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSubjects();
      setSubjects(data.subjects || data);
    } catch {
      toast.error("Không thể tải danh sách Subject");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleUsed = async (subject) => {
    try {
      const updated = await updateSubject(subject._id, { used: !subject.used });
      setSubjects((prev) =>
        prev.map((s) => (s._id === subject._id ? updated : s))
      );
      toast.success(
        updated.used
          ? `Đã bật Subject "${updated.title}"`
          : `Đã tắt Subject "${updated.title}"`
      );
    } catch {
      toast.error("Cập nhật trạng thái thất bại");
    }
  };

  const handleDelete = async (subject) => {
    if (!window.confirm(`Bạn có chắc muốn xóa subject "${subject.title}"?`))
      return;
    try {
      await deleteSubject(subject._id);
      setSubjects((prev) => prev.filter((s) => s._id !== subject._id));
      toast.success("Đã xóa thành công");
    } catch {
      toast.error("Không thể xóa subject");
    }
  };

  const handleAddNew = () => {
    setEditingSubject(null);
    setFormData({
      title: "",
      description: "",
      author: "",
      category: "",
      driveUrl: "",
    });
    setIsModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      title: subject.title,
      description: subject.description || "",
      author: subject.author || "",
      category: subject.category || "",
      driveUrl: subject.driveUrl || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Tiêu đề không được để trống");
      return;
    }

    try {
      if (editingSubject) {
        const updated = await updateSubject(editingSubject._id, formData);
        setSubjects((prev) =>
          prev.map((s) => (s._id === editingSubject._id ? updated : s))
        );
        toast.success(`Đã cập nhật "${updated.title}"`);
      } else {
        const created = await createSubject(formData);
        setSubjects((prev) => [created, ...prev]);
        toast.success(`Đã thêm subject "${created.title}"`);
      }

      setIsModalOpen(false);
      setEditingSubject(null);
      setFormData({
        title: "",
        description: "",
        author: "",
        category: "",
        driveUrl: "",
      });
    } catch {
      toast.error("Không thể lưu subject");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
  };

  const filtered = subjects.filter(
    (s) =>
      s.title.toLowerCase().includes(search.toLowerCase()) &&
      (category === "all" || s.category === category)
  );

  const startIndex = (currentPage - 1) * limit;
  const visible = filtered.slice(startIndex, startIndex + limit);
  const totalPages = Math.ceil(filtered.length / limit);

  // Categories cho filter dropdown
  const categories = [
    ...new Set(subjects.map((s) => s.category).filter(Boolean)),
  ];

  return (
    <>
      <Header />
      <HeroSectionAdmin message="Trang quản lý Subject" />

      <div className="subject-container">
        {/* Header với search và filter */}
        <div className="subject-header">
          <div className="subject-header-left">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="subject-search"
                placeholder="Tìm kiếm theo tiêu đề..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <select
              className="subject-filter"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">📂 Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <button className="subject-add-btn" onClick={handleAddNew}>
            <span className="btn-icon">+</span>
            Thêm Subject
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="table-wrapper">
              <table className="subject-table">
                <thead>
                  <tr>
                    <th className="col-title">Tiêu đề</th>
                    <th className="col-description">Mô tả</th>
                    <th className="col-category">Danh mục</th>
                    <th className="col-author">Tác giả</th>
                    <th className="col-status">Trạng thái</th>
                    <th className="col-actions">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length ? (
                    visible.map((s) => (
                      <tr key={s._id} className="table-row">
                        <td className="col-title">
                          <div className="title-cell">
                            <span className="title-text">{s.title}</span>
                            {s.driveUrl && (
                              <a
                                href={s.driveUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="drive-link"
                                title="Xem trên Drive"
                              >
                                🔗
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="col-description">
                          <div className="description-cell">
                            {s.description || "—"}
                          </div>
                        </td>
                        <td className="col-category">
                          <span className="category-badge">
                            {s.category || "—"}
                          </span>
                        </td>
                        <td className="col-author">{s.author || "—"}</td>
                        <td className="col-status">
                          <span
                            className={`status-badge ${
                              s.used ? "status-active" : "status-inactive"
                            }`}
                          >
                            <span className="status-dot"></span>
                            {s.used ? "Hoạt động" : "Ẩn"}
                          </span>
                        </td>
                        <td className="col-actions">
                          <div className="action-buttons">
                            <button
                              onClick={() => handleEdit(s)}
                              className="btn-action btn-edit"
                              title="Chỉnh sửa"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleToggleUsed(s)}
                              className="btn-action btn-toggle"
                              title={s.used ? "Ẩn subject" : "Hiện subject"}
                            >
                              {s.used ? "👁️" : "🔒"}
                            </button>
                            <button
                              onClick={() => handleDelete(s)}
                              className="btn-action btn-delete"
                              title="Xóa"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        <div className="empty-state">
                          <span className="empty-icon">📭</span>
                          <p className="empty-text">
                            {search || category !== "all"
                              ? "Không tìm thấy subject phù hợp"
                              : "Chưa có subject nào"}
                          </p>
                          {!search && category === "all" && (
                            <button
                              className="btn-empty-action"
                              onClick={handleAddNew}
                            >
                              Thêm subject đầu tiên
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="subject-pagination">
                <button
                  className="pagination-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ‹ Trước
                </button>
                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => {
                    const pageNum = i + 1;
                    // Hiển thị: trang đầu, trang cuối, và 2 trang xung quanh current
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={i}
                          className={`page-btn ${
                            currentPage === pageNum ? "active" : ""
                          }`}
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return (
                        <span key={i} className="page-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Sau ›
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal thêm / sửa */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={handleCloseModal}
        className="subject-modal"
        overlayClassName="subject-overlay"
        closeTimeoutMS={200}
      >
        <div className="modal-header">
          <h2>
            {editingSubject ? "✏️ Chỉnh sửa Subject" : "📝 Thêm Subject mới"}
          </h2>
          <button className="modal-close" onClick={handleCloseModal}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="subject-form">
          <div className="form-group">
            <label>
              Tiêu đề <span className="required">*</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Nhập tiêu đề subject..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              className="form-textarea"
              rows="3"
              placeholder="Nhập mô tả chi tiết..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tác giả</label>
              <input
                type="text"
                className="form-input"
                placeholder="Tên tác giả..."
                value={formData.author}
                onChange={(e) =>
                  setFormData({ ...formData, author: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label>Danh mục</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Toán học, Lập trình..."
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
            </div>
          </div>

          <div className="form-group">
            <label>Drive URL</label>
            <input
              type="url"
              className="form-input"
              placeholder="https://drive.google.com/..."
              value={formData.driveUrl}
              onChange={(e) =>
                setFormData({ ...formData, driveUrl: e.target.value })
              }
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleCloseModal}
            >
              Hủy
            </button>
            <button type="submit" className="btn-submit">
              {editingSubject ? "💾 Cập nhật" : "➕ Thêm mới"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

export default ManageSubjectPage;
