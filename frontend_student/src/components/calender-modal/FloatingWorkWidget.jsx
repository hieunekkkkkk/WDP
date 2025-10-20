import React, { useState, useMemo } from "react";
import { FaBriefcase, FaTimes, FaPen, FaTrash } from "react-icons/fa";
import "./style/FloatingWorkWidget.css";

const getDayCode = (date) => {
  const dayMap = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  return dayMap[date.getDay()];
};

const FloatingWorkWidget = ({ tasks, onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState("today");

  const filteredTasks = useMemo(() => {
    if (viewMode === "today") {
      const todayCode = getDayCode(new Date());
      const dayFullNames = {
        MON: "Monday",
        TUE: "Tuesday",
        WED: "Wednesday",
        THU: "Thursday",
        FRI: "Friday",
        SAT: "Saturday",
        SUN: "Sunday",
      };
      const todayFullName = dayFullNames[todayCode];
      return tasks.filter((task) => task.task_day === todayFullName);
    }
    return tasks;
  }, [tasks, viewMode]);

  if (!tasks) return null;

  return (
    <div className="fab-container">
      {/* Popup danh sách công việc */}
      <div className={`work-widget-popup ${isOpen ? "open" : ""}`}>
        <div className="widget-header">
          <FaBriefcase className="widget-header-icon" />
          <button
            className="widget-title-toggle"
            onClick={() => setViewMode(viewMode === "today" ? "all" : "today")}
          >
            {viewMode === "today" ? "Công việc hôm nay" : "Tất cả công việc"}
          </button>
          <FaTimes
            className="widget-close-btn"
            onClick={() => setIsOpen(false)}
          />
        </div>
        <div className="widget-task-list">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <div key={task._id} className="widget-task-item">
                <div className="widget-task-info">
                  <span className="widget-task-name">{task.task_name}</span>
                  <span className="widget-task-time">
                    {new Date(task.start_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" - "}
                    {new Date(task.end_time).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="widget-task-actions">
                  <button
                    className="widget-action-btn edit"
                    onClick={() => onEdit(task)}
                  >
                    <FaPen />
                  </button>
                  <button
                    className="widget-action-btn delete"
                    onClick={() => onDelete(task._id)}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="widget-empty-message">Không có công việc nào.</div>
          )}
        </div>
      </div>

      {/* Nút tròn nhỏ */}
      <button className="fab" onClick={() => setIsOpen(!isOpen)}>
        <FaBriefcase />
      </button>
    </div>
  );
};

export default FloatingWorkWidget;
