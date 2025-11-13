import React, { useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import "../../components/ai-support/style/KnowledgePage.css";

const KnowledgeCreateModal = ({ botId, onClose, onSave }) => {
  const { user } = useUser();
  const [form, setForm] = useState({
    title: "",
    content: "",
    tags: "",
  });
  const [file, setFile] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", form.title);

      if (file) {
        formData.append("file", file);
      } else {
        formData.append("content", form.content);
      }

      formData.append(
        "tags",
        JSON.stringify(
          form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        )
      );

      formData.append("created_by", user.id);

      await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      toast.success("✅ Tạo kiến thức thành công!");

      onSave();
      onClose();
    } catch (err) {
      console.error(
        "❌ Error creating knowledge:",
        err.response?.data || err.message
      );

      const errorMessage = err.response?.data?.message || err.message || "Có lỗi khi tạo kiến thức";

      // Kiểm tra nếu là lỗi Qdrant
      if (errorMessage.includes("Qdrant") || errorMessage.includes("ECONNREFUSED")) {
        toast.warning("⚠️ Kiến thức đã được lưu nhưng chưa được đánh index. Vui lòng khởi động Qdrant service!");
      } else {
        toast.error(`❌ Lỗi: ${errorMessage}`);
      }
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2>Thêm kiến thức</h2>
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
          <label>Nội dung (nếu không tải file)</label>
          <textarea
            name="content"
            rows={6}
            value={form.content}
            onChange={handleChange}
            placeholder="Nhập nội dung văn bản..."
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>Tải file (PDF, Word, TXT...)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="form-input"
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

export default KnowledgeCreateModal;
