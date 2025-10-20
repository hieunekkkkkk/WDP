import React from "react";

const DetailModal = ({ task, onClose, statusConfig, priorityConfig }) => {
  if (!task) {
    return null;
  }

  const statusInfo = statusConfig[task.task_status] || {
    label: task.task_status,
    bg: "#6c757d",
    color: "#fff",
  };
  const levelInfo = priorityConfig[task.task_level] || {
    label: task.task_level,
    bg: "#6c757d",
    color: "#fff",
  };

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div
        className="detail-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detail-modal-header">
          <h3 className="detail-modal-title">{task.task_name}</h3>
          <button className="detail-modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="detail-modal-body">
          <p className="detail-modal-description">
            {task.task_description ||
              "Không có mô tả chi tiết cho công việc này."}
          </p>

          <div className="detail-modal-grid">
            <div className="detail-modal-item">
              <span className="detail-modal-label">Trạng thái</span>
              <span className="detail-modal-value">
                <span
                  className="detail-modal-tag"
                  style={{
                    backgroundColor: statusInfo.bg,
                    color: statusInfo.color,
                  }}
                >
                  {statusInfo.label}
                </span>
              </span>
            </div>

            <div className="detail-modal-item">
              <span className="detail-modal-label">Mức độ</span>
              <span className="detail-modal-value">
                <span
                  className="detail-modal-tag"
                  style={{
                    backgroundColor: levelInfo.bg,
                    color: levelInfo.color,
                  }}
                >
                  {levelInfo.label}
                </span>
              </span>
            </div>

            <div className="detail-modal-item">
              <span className="detail-modal-label">Bắt đầu</span>
              <span className="detail-modal-value detail-modal-time">
                {new Date(task.start_time).toLocaleString("vi-VN")}
              </span>
            </div>

            <div className="detail-modal-item">
              <span className="detail-modal-label">Kết thúc</span>
              <span className="detail-modal-value detail-modal-time">
                {new Date(task.end_time).toLocaleString("vi-VN")}
              </span>
            </div>
          </div>
        </div>
        <div className="detail-modal-footer">
          <button
            className="detail-modal-btn detail-modal-btn-secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
