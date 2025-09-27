import React, { useState } from "react";
import axios from "axios";
import "../../components/ai-support/style/KnowledgePage.css";

const KnowledgeEditModal = ({ knowledge, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: knowledge.title || "",
    content: knowledge.content || "",
    tags: knowledge.tags ? knowledge.tags.join(", ") : "",
    type: knowledge.type || "Liên kết",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert("Tên không được để trống");
    try {
      await axios.put(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${knowledge._id}`,
        {
          title: form.title,
          content: form.content,
          tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
          type: form.type,
        }
      );
      onSave();
      onClose();
    } catch (err) {
      console.error("Error updating knowledge:", err);
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
            placeholder="Nhập tên file"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>Loại</label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="form-select"
          >
            <option>Liên kết</option>
            <option>Văn bản</option>
          </select>
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
            placeholder="VD: C++, Source"
            className="form-input"
          />
        </div>

        <div className="form-buttons">
          <button className="button save-button" onClick={handleSubmit}>
            💾 Lưu thay đổi
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