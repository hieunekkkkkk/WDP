import React, { useState } from "react";
import {
  FaCalendarAlt,
  FaList,
  FaChartBar,
  FaPlus,
  FaClock,
  FaChevronDown,
} from "react-icons/fa";
import "./style/TaskCalender.css";

const TaskCalendar = () => {
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: "hhh",
      description: "",
      priority: "very-important",
      status: "in-progress",
      startTime: "17:00 Th 3, 21/10/2025",
      endTime: "16:59 Th 5, 23/10/2025",
    },
    {
      id: 2,
      title: "rrf",
      description: "r",
      priority: "important",
      status: "in-progress",
      startTime: "17:00 Th 3, 21/10/2025",
      endTime: "16:59 Th 5, 23/10/2025",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");

  const priorityConfig = {
    "very-important": {
      label: "Rất quan trọng",
      color: "priority-very-important",
    },
    important: { label: "Quan trọng", color: "priority-important" },
    normal: { label: "Bình thường", color: "priority-normal" },
    free: { label: "Rảnh rỗi", color: "priority-free" }, // MỚI
  };

  const statusConfig = {
    "in-progress": { label: "Đang làm", color: "status-in-progress" },
    pending: { label: "Chưa làm", color: "status-pending" },
    completed: { label: "Hoàn thành", color: "status-completed" },
    cancel: { label: "Hủy bỏ", color: "status-cancel" }, // MỚI
  };

  return (
    <div className="app-container">
      <div className="content-wrapper">
        {/* Header */}
        <div className="header">
          <h1 className="title">
            Chào mừng bạn đã đến lịch hoạt động của bạn ✨
          </h1>

          {/* Navigation Buttons */}
          <div className="nav-buttons">
            <button className="nav-btn nav-btn-blue">
              <FaPlus />
              Thêm tasks
            </button>
            <button className="nav-btn nav-btn-purple">
              <FaPlus />
              Thêm work
            </button>
            <button className="nav-btn nav-btn-cyan">
              <FaCalendarAlt />
              Xem lịch
            </button>
            <button className="nav-btn nav-btn-teal">
              <FaList />
              Danh sách tasks
            </button>
            <button className="nav-btn nav-btn-pink">
              <FaClock />
              Lịch sử tasks
            </button>
            <button className="nav-btn nav-btn-green">
              <FaChartBar />
              Phân tích dữ liệu
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="search-filter-container">
          {/* Search Row */}
          <div className="search-row">
            <input
              type="text"
              placeholder="Tìm kiếm công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filters Row */}
          <div className="filters-row">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="in-progress">Đang làm</option>
              <option value="pending">Chưa Làm</option>
              <option value="completed">Hoàn thành</option>
              <option value="cancel">Hủy bỏ</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="very-important">Rất quan trọng</option>
              <option value="important">Quan trọng</option>
              <option value="normal">Bình thường</option>
              <option value="normal">rảnh rỗi</option>
            </select>
          </div>
        </div>

        {/* Tasks List */}
        <div className="tasks-list">
          {tasks.map((task) => (
            <div key={task.id} className="task-card">
              {/* Status Ribbon */}
              <div
                className={`status-ribbon ${statusConfig[task.status].color}`}
              >
                {statusConfig[task.status].label}
              </div>

              <div className="task-content">
                <div className="task-header">
                  <div className="task-info">
                    <h3 className="task-title">{task.title}</h3>
                    <p className="task-description">
                      {task.description || '""'}
                    </p>

                    <span
                      className={`priority-badge ${
                        priorityConfig[task.priority].color
                      }`}
                    >
                      {priorityConfig[task.priority].label}
                    </span>
                  </div>
                </div>

                {/* Time Info */}
                <div className="time-info">
                  <div className="time-item">
                    <p className="time-label">Bắt đầu:</p>
                    <p className="time-value">{task.startTime}</p>
                  </div>
                  <div className="time-item">
                    <p className="time-label">Kết thúc:</p>
                    <p className="time-value">{task.endTime}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="action-buttons">
                  <button className="action-btn action-btn-blue">
                    Xem chi tiết
                  </button>
                  <button className="action-btn action-btn-yellow">Sửa</button>
                  <button className="action-btn action-btn-yellow action-btn-dropdown">
                    Đang làm
                    <FaChevronDown />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TaskCalendar;
