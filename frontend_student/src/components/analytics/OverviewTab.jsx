// src/components/analytics/OverviewTab.jsx
import React from "react";

const OverviewTab = ({ data }) => {
  if (!data)
    return <div className="info-message">Không có dữ liệu tổng quan.</div>;

  return (
    <div className="overview-grid">
      <div className="overview-card">
        <h3>Upcoming Start Tasks</h3>
        <ul>
          {data.upcomingStartTasks?.map((task) => (
            <li key={task._id} className="overview-list-item">
              {task.task_name}
            </li>
          ))}
        </ul>
      </div>
      <div className="overview-card">
        <h3>Upcoming Deadlines</h3>
        <ul>
          {data.upcomingDeadlines?.map((task) => (
            <li key={task._id} className="overview-list-item">
              {task.task_name}
            </li>
          ))}
        </ul>
      </div>
      <div className="overview-card">
        <h3>Important Tasks Progress</h3>
        <ul>
          {data.importantTasksProgress?.map((task) => (
            <li key={task._id} className="overview-list-item">
              {task.task_name} - <small>{task.task_status}</small>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default OverviewTab;
