import React from "react";

const EmptyState = ({
  message = "Không tìm thấy công việc nào phù hợp",
  subtitle = "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm",
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">📋</div>
      <h3 className="empty-state-title">{message}</h3>
      <p className="empty-state-subtitle">{subtitle}</p>
    </div>
  );
};

export default EmptyState;
