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
  // Thêm state loading để vô hiệu hóa nút
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    // 1. Validate Tên
    if (!form.title.trim()) {
      toast.error("Tên không được để trống");
      return;
    }

    // 2. MỚI: Validate Nội dung HOẶC File
    if (!file && !form.content.trim()) {
      toast.error("Vui lòng nhập nội dung hoặc tải lên một file.");
      return;
    }

    setIsLoading(true); // Vô hiệu hóa nút

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

      const createPromise = axios.post(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log(createPromise);
      

      await toast.promise(createPromise, {
        pending: "Đang tạo kiến thức...",
        success: "Tạo kiến thức thành công!",
        error: "Có lỗi khi tạo kiến thức",
      });

      onSave();
      onClose();
    } catch (err) {
      console.error(
        "❌ Error creating knowledge:",
        err.response?.data?.message
      );
      // toast.promise đã hiển thị lỗi chung
      // Bạn có thể thêm lỗi cụ thể hơn nếu máy chủ trả về
      if (err.response?.data?.message) {
        toast.error(`Lỗi: ${err.response.data.message}`);
      }
    } finally {
      setIsLoading(false); // Kích hoạt lại nút
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <h2 style={{ margin: 0 }}>Thêm kiến thức</h2>
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
            disabled={!!file} // Vô hiệu hóa nếu đã chọn file
          />
        </div>

        <div className="form-group">
          <label>Tải file (PDF, Word, TXT...)</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileChange}
            className="form-input"
            disabled={!!form.content.trim()} // Vô hiệu hóa nếu đã nhập nội dung
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
            disabled={isLoading}
          >
            {isLoading ? "Đang lưu..." : "Lưu"}
          </button>
          <button
            className="button cancel-button"
            onClick={onClose}
            disabled={isLoading} 
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeCreateModal;