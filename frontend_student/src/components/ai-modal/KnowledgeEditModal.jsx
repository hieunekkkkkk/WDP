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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    if (!form.content.trim()) {
      toast.error("Nội dung không được để trống");
      return;
    }

    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${knowledge._id}`,
        {
          title: form.title,
          content: form.content,
          tags: form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        },
        {
          validateStatus: (status) => status < 500, 
        }
      );

      if (!response.data.success && response.data.message) {
        throw new Error(response.data.message);
      }

      toast.success("Cập nhật kiến thức thành công!");
      onSave();
      onClose();
    } catch (err) {
      console.error("Error updating knowledge:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi khi cập nhật kiến thức";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Sửa kiến thức</h2>
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
          <button className="button save-button" onClick={handleSubmit}>
            💾 Lưu
          </button>
          <button className="button cancel-button" onClick={onClose}>
            ✗ Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeEditModal;
