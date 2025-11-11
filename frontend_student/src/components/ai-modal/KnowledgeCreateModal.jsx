import React, { useState } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react';
import { toast } from 'react-toastify';
import '../../components/ai-support/style/KnowledgePage.css';

const KnowledgeCreateModal = ({ botId, onClose, onSave }) => {
  const { user } = useUser();
  const [form, setForm] = useState({
    title: '',
    content: '',
    tags: '',
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
      toast.error('Tên không được để trống');
      return;
    }

    if (!form.content.trim() && !file) {
      toast.error('Vui lòng nhập nội dung hoặc tải lên file!');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', form.title);

      if (file) {
        formData.append('file', file);
      } else {
        formData.append('content', form.content);
      }

      // Parse and filter tags
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      formData.append('tags', JSON.stringify(tags));
      formData.append('created_by', user.id);

      const response = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/botknowledge/${botId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          validateStatus: (status) => status < 500, // Treat 4xx as valid responses
        }
      );

      if (!response.data.success && response.data.message) {
        throw new Error(response.data.message);
      }

      toast.success('Tạo kiến thức thành công!');

      onSave();
      onClose();
    } catch (err) {
      console.error('❌ Error creating knowledge:', err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Có lỗi khi tạo kiến thức';
      toast.error(errorMessage);
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
          <label>
            <span>📝 Tên kiến thức</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="VD: Hướng dẫn sử dụng React Hooks"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label>
            <span>📄 Nội dung</span>
            <small style={{ color: '#6b7280', fontWeight: 'normal' }}>
              (hoặc tải file ở bên dưới)
            </small>
          </label>
          <textarea
            name="content"
            rows={6}
            value={form.content}
            onChange={handleChange}
            placeholder="Nhập nội dung chi tiết về kiến thức..."
            className="form-textarea"
          />
        </div>

        <div className="form-group">
          <label>
            <span>📎 Tải tài liệu</span>
            <small style={{ color: '#6b7280', fontWeight: 'normal' }}>
              (PDF, Word, TXT)
            </small>
          </label>
          <div
            style={{
              border: '2px dashed #e5e7eb',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'center',
              background: '#f9fafb',
              cursor: 'pointer',
            }}
            onClick={() => document.getElementById('file-input').click()}
          >
            <p style={{ margin: 0, color: '#6b7280' }}>
              Kéo thả file vào đây hoặc click để chọn file
            </p>
            <input
              id="file-input"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            {file && (
              <div
                style={{
                  marginTop: '10px',
                  color: '#059669',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                ✅ Đã chọn: {file.name}
              </div>
            )}
          </div>
        </div>

        <div className="form-group">
          <label>
            <span>🏷️ Tags</span>
            <small style={{ color: '#6b7280', fontWeight: 'normal' }}>
              (phân cách bằng dấu phẩy)
            </small>
          </label>
          <input
            name="tags"
            value={form.tags}
            onChange={handleChange}
            placeholder="VD: react, frontend, web-development"
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
