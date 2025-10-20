// src/components/analytics/OverviewTab.jsx
import React from "react";
import { FaPlayCircle, FaExclamationCircle, FaStar } from "react-icons/fa";

// Component con để render từng mục task cho gọn
const TaskListItem = ({ task }) => (
  <li className="overview-task-item">
    <div className="task-item-header">
      <strong className="task-name">{task.task_name}</strong>
      <span className={`tag-level level-${task.task_level}`}>
        {task.task_level}
      </span>
    </div>
    <div className="task-item-body">
      <p className="task-description">
        {task.task_description || "Không có mô tả chi tiết."}
      </p>
    </div>
    <div className="task-item-footer">
      <span>
        Bắt đầu:{" "}
        <strong>
          {new Date(task.start_time).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </strong>
      </span>
      <span>
        Kết thúc:{" "}
        <strong>
          {new Date(task.end_time).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </strong>
      </span>
    </div>
  </li>
);

const OverviewTab = ({ data }) => {
  if (!data) {
    return <div className="info-message">Không có dữ liệu tổng quan.</div>;
  }

  const { upcomingStartTasks, upcomingDeadlines, importantTasksProgress } =
    data;

  return (
    <div className="overview-grid">
      <div className="overview-column">
        <div className="overview-column-header color-blue">
          <FaPlayCircle />
          <h3>Công việc sắp bắt đầu</h3>
        </div>
        {upcomingStartTasks?.length > 0 ? (
          <ul className="overview-task-list">
            {upcomingStartTasks.map((task) => (
              <TaskListItem key={task._id} task={task} />
            ))}
          </ul>
        ) : (
          <p className="no-data-message">Không có công việc nào sắp bắt đầu.</p>
        )}
      </div>

      <div className="overview-column">
        <div className="overview-column-header color-orange">
          <FaExclamationCircle />
          <h3>Deadline sắp tới</h3>
        </div>
        {upcomingDeadlines?.length > 0 ? (
          <ul className="overview-task-list">
            {upcomingDeadlines.map((task) => (
              <TaskListItem key={task._id} task={task} />
            ))}
          </ul>
        ) : (
          <p className="no-data-message">Không có deadline nào sắp tới.</p>
        )}
      </div>

      <div className="overview-column">
        <div className="overview-column-header color-red">
          <FaStar />
          <h3>Việc quan trọng</h3>
        </div>
        {importantTasksProgress?.length > 0 ? (
          <ul className="overview-task-list">
            {importantTasksProgress.map((task) => (
              <TaskListItem key={task._id} task={task} />
            ))}
          </ul>
        ) : (
          <p className="no-data-message">
            Không có công việc quan trọng nào đang tiến hành.
          </p>
        )}
      </div>
    </div>
  );
};

export default OverviewTab;
