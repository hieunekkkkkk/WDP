import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useUser } from '@clerk/clerk-react';
import '../../components/ai-support/style/KnowledgePage.css';
import '../../components/ai-support/style/Modal.css';

const BotCreateModal = ({ onClose, onBotCreated }) => {
  const { user } = useUser();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên bot!');
      return;
    }

    if (!description.trim()) {
      toast.error('Vui lòng nhập mô tả cho bot!');
      return;
    }

    setIsCreating(true);
    try {
      // Tạo bot mới
      const botRes = await axios.post(
        `${import.meta.env.VITE_BE_URL}/api/aibot`,
        {
          owner_id: user.id,
          name: name.trim(),
          description: description.trim(),
          status: 'active',
        }
      );

      const newBot = botRes.data;

      toast.success('✅ Tạo bot thành công!');
      onBotCreated(newBot);
      onClose();
    } catch (err) {
      console.error('❌ Error creating bot:', err.response?.data || err.message);
      toast.error(
        `Có lỗi khi tạo bot: ${err.response?.data?.message || err.message}`
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={(e) => e.stopPropagation()}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 Thiết lập Bot của bạn</h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
            Bạn đã thanh toán thành công! Vui lòng điền thông tin để hoàn tất kích hoạt bot.
          </p>
        </div>

        <div className="form-group">
          <label>
            <span>📝 Tên bot</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: AI học tập của tôi"
            className="form-input"
            disabled={isCreating}
          />
        </div>

        <div className="form-group">
          <label>
            <span>📄 Mô tả</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="VD: Trợ lý AI hỗ trợ học tập cho sinh viên"
            className="form-textarea"
            rows={4}
            disabled={isCreating}
          />
        </div>

        <div className="form-buttons">
          <button
            className="button save-button"
            onClick={handleCreate}
            disabled={isCreating}
            style={{ width: '100%' }}
          >
            {isCreating ? (
              <>
                <div className="loading-spinner small" />
                <span>Đang tạo...</span>
              </>
            ) : (
              <span>💾 Tạo Bot</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotCreateModal;
