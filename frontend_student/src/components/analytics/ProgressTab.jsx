// src/components/analytics/ProgressTab.jsx
import React from "react";

const ProgressTab = ({ data }) => {
  if (!data || data.length === 0)
    return (
      <div className="info-message">Không có công việc nào đang tiến hành.</div>
    );

  const levelStyle = {
    "quan trọng": { backgroundColor: "#fee2e2", color: "#b91c1c" },
    "bình thường": { backgroundColor: "#dbeafe", color: "#1d4ed8" },
    "rảnh rỗi": { backgroundColor: "#d1fae5", color: "#047857" },
  };

  const statusColor = {
    "chưa làm": "#9ca3af",
    "đang làm": "#f97316",
    "đã huỷ": "#ef4444",
    "đã hoàn thành": "#22c55e",
  };

  return (
    <div>
      <table className="progress-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Detail</th>
            <th>End Time</th>
            <th>Progress</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          {data.map((task) => (
            <tr key={task._id}>
              <td>{task.task_name}</td>
              <td>{task.task_description || "-"}</td>
              <td>{new Date(task.end_time).toLocaleDateString("vi-VN")}</td>
              <td>
                {/* Sử dụng bảng màu mới */}
                <span
                  className="progress-tag"
                  style={{
                    backgroundColor: statusColor[task.task_status] || "#6b7280",
                  }}
                >
                  {task.task_status}
                </span>
              </td>
              <td>
                <span
                  className="progress-tag"
                  style={levelStyle[task.task_level]}
                >
                  {task.task_level}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProgressTab;
