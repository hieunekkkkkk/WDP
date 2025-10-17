// src/components/analytics/ProgressTab.jsx
import React from "react";

const ProgressTab = ({ data }) => {
  if (!data || data.length === 0)
    return (
      <div className="info-message">Không có công việc nào đang tiến hành.</div>
    );

  const levelColor = {
    "quan trọng": "#fee2e2",
    "bình thường": "#dbeafe",
    "rảnh rỗi": "#d1fae5",
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
              <td>{task.task_description}</td>
              <td>{new Date(task.end_time).toLocaleDateString("vi-VN")}</td>
              <td>
                <span
                  className="progress-tag"
                  style={{
                    backgroundColor:
                      task.task_status === "đang làm" ? "#ff9f43" : "#9ca3af",
                  }}
                >
                  {task.task_status}
                </span>
              </td>
              <td>
                <span
                  className="progress-tag"
                  style={{
                    backgroundColor: levelColor[task.task_level],
                    color: "#333",
                  }}
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
