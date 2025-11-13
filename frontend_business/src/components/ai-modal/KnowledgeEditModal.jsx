import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "../../components/ai-support/style/KnowledgePage.css";

const KnowledgeEditModal = ({ knowledge, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: knowledge.title || "",
    content: knowledge.content || "",
    tags: knowledge.tags ? knowledge.tags.join(", ") : "",
  });
  // THÊM: State loading
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    // 1. Validate Tên (đã có)
    if (!form.title.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    // 2. MỚI: Validate Nội dung
    if (!form.content.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    setIsLoading(true); // Bắt đầu loading

    try {
      // 3. MỚI: Dùng toast.promise
      const updatePromise = axios.put(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${knowledge._id}`,
        {
          title: form.title,
          content: form.content,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }
      );

      await toast.promise(updatePromise, {
        pending: "Đang cập nhật kiến thức...",
        success: "Cập nhật kiến thức thành công!",
        error: "Có lỗi khi cập nhật kiến thức",
      });

      onSave();
      onClose();
    } catch (err) {
      console.error(" Error updating knowledge:", err.response?.data || err);
      // toast.promise đã xử lý lỗi chung
      if (err.response?.data?.message) {
        toast.error(`Lỗi: ${err.response.data.message}`);
      }
    } finally {
      setIsLoading(false); // Dừng loading
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ margin: 0 }}>Sửa kiến thức</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="form-group">
          <label>Tên</label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Nhập tên kiến thức"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Nội dung</label>
          <textarea
            name="content"
            rows={6}
            value={form.content}
            onChange={handleChange}
            placeholder="Dán nội dung code hoặc text..."
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Tags (cách nhau bằng dấu phẩy)</label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="VD: AI, NodeJS"
            className="form-input"
          />
        </div>

        <div className="form-buttons">
          <button
            className="button save-button"
            onClick={handleSubmit}
            style={{ margin: 0 }}
            disabled={isLoading} // Thêm disabled
          >
            {isLoading ? "Đang lưu..." : "Lưu thay đổi"}{" "}
          </button>
          <button
            className="button cancel-button"
            onClick={onClose}
            disabled={isLoading} // Thêm disabled
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeEditModal;