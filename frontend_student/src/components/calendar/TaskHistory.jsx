import React, { useState, useEffect } from "react"; // FIX: Added useEffect here
import axios from "axios";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useAuth } from "@clerk/clerk-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./style/TaskHistory.css";
import { useNavigate } from "react-router-dom";
import {
  FaCalendarAlt,
  FaList,
  FaChartBar,
  FaClock,
  FaCheckCircle,
  FaChevronDown,
  FaTimesCircle,
} from "react-icons/fa";

// Helper function to format date strings for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const TaskHistory = () => {
  const { userId } = useAuth();
  const nav = useNavigate();
  const [allTasks, setAllTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const CALENDAR_URL = import.meta.env.VITE_BE_URL + "/api/calendar";
  const CALENDAR_BY_CREATOR_URL = `${CALENDAR_URL}/creator/${userId}`;

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchHistoryTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(CALENDAR_BY_CREATOR_URL);
        const allData = res.data?.data || res.data || [];

        const historyData = allData.filter(
          (task) =>
            task.task_status === "đã hoàn thành" ||
            task.task_status === "đã huỷ"
        );

        setAllTasks(historyData);
        setFilteredTasks(historyData);
        toast.success("Tải lịch sử công việc thành công!");
      } catch (error) {
        console.error("Failed to fetch task history:", error);
        toast.error("Không thể tải được lịch sử công việc.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryTasks();
  }, [userId]);

  useEffect(() => {
    let result = allTasks;

    if (searchTerm) {
      result = result.filter((task) =>
        task.task_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((task) => task.task_status === filterStatus);
    }

    if (startDate) {
      result = result.filter((task) => new Date(task.end_time) >= startDate);
    }
    if (endDate) {
      const adjustedEndDate = new Date(endDate);
      adjustedEndDate.setHours(23, 59, 59, 999);
      result = result.filter(
        (task) => new Date(task.end_time) <= adjustedEndDate
      );
    }

    setFilteredTasks(result);
  }, [searchTerm, filterStatus, startDate, endDate, allTasks]);

  //  Hàm khôi phục task bị huỷ
  const restoreTask = async (taskId) => {
    try {
      // Gọi API cập nhật trạng thái task về "chưa làm"
      await axios.put(`${CALENDAR_URL}/${taskId}`, {
        task_status: "chưa làm",
      });

      toast.success(" Khôi phục công việc thành công!");

      // Cập nhật lại danh sách task sau khi khôi phục
      const res = await axios.get(CALENDAR_BY_CREATOR_URL);
      const allData = res.data?.data || res.data || [];
      const historyData = allData.filter(
        (task) =>
          task.task_status === "đã hoàn thành" || task.task_status === "đã huỷ"
      );

      setAllTasks(historyData);
      setFilteredTasks(historyData);
    } catch (error) {
      console.error("Lỗi khi khôi phục công việc:", error);
      toast.error(" Không thể khôi phục công việc!");
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-message">Đang tải lịch sử công việc...</div>
      );
    }

    if (filteredTasks.length === 0) {
      return (
        <div className="empty-message">
          Không tìm thấy công việc nào phù hợp trong lịch sử.
        </div>
      );
    }

    return filteredTasks.map((task) => (
      <div key={task._id} className="history-item-card">
        <div className="history-item-main">
          <h2 className="history-item-title">{task.task_name}</h2>
          <p className="history-item-description">{task.task_description}</p>
          <div className="history-item-tags">
            <span
              className={`history-item-tag level-${task.task_level.replace(
                " ",
                "-"
              )}`}
            >
              {task.task_level}
            </span>
            <span
              className={`history-item-tag status-${
                task.task_status === "đã hoàn thành" ? "completed" : "cancelled"
              }`}
            >
              {task.task_status === "đã hoàn thành" ? (
                <FaCheckCircle />
              ) : (
                <FaTimesCircle />
              )}
              {task.task_status}
            </span>
          </div>

          {/*  Thêm nút khôi phục nếu task bị huỷ */}
          {task.task_status === "đã huỷ" && (
            <button
              className="restore-btn"
              onClick={() => restoreTask(task._id)}
              style={{
                marginTop: "8px",
                padding: "6px 12px",
                borderRadius: "6px",
                backgroundColor: "#4caf50",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              🔄 Khôi phục công việc
            </button>
          )}
        </div>
        <div className="history-item-details">
          <div className="history-item-date-group">
            <span className="date-label">
              <FaCalendarAlt size={12} /> Bắt đầu:
            </span>
            <span className="date-value">{formatDate(task.start_time)}</span>
          </div>
          <div className="history-item-date-group">
            <span className="date-label">
              <FaClock size={12} /> Kết thúc:
            </span>
            <span className="date-value">{formatDate(task.end_time)}</span>
          </div>
        </div>
        <div className="history-item-action">
          <FaChevronDown />
        </div>
      </div>
    ));
  };

  return (
    <div className="history-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <div className="history-wrapper">
        <header className="history-header">
          <h1 className="history-title">Lịch sử công việc</h1>
          <nav className="history-nav-buttons">
            <button
              className="history-nav-btn"
              onClick={() => nav("/dashboard/calendar")}
            >
              <FaCalendarAlt /> Xem lịch
            </button>
            <button
              className="history-nav-btn"
              onClick={() => nav("/dashboard/tasks")}
            >
              <FaList /> Danh sách tasks
            </button>
            <button
              className="history-nav-btn active"
              onClick={() => nav("/dashboard/task-history")}
            >
              <FaClock /> Lịch sử tasks
            </button>
            <button
              className="history-nav-btn"
              onclick={() => nav("/dashboard/analytics")}
            >
              <FaChartBar /> Phân tích dữ liệu
            </button>
          </nav>
        </header>

        <div className="filter-card">
          <div className="filter-group">
            <label>Tìm kiếm theo tên:</label>
            <input
              type="text"
              placeholder="Nhập tên công việc..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Từ ngày:</label>
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              className="date-picker-input"
              isClearable
            />
          </div>
          <div className="filter-group">
            <label>Đến ngày:</label>
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="dd/mm/yyyy"
              className="date-picker-input"
              isClearable
              minDate={startDate}
            />
          </div>
          <div className="filter-group">
            <label>Lọc theo trạng thái:</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="đã hoàn thành">Đã hoàn thành</option>
              <option value="đã huỷ">Đã huỷ</option>
            </select>
          </div>
        </div>

        <main className="task-history-list">{renderContent()}</main>
      </div>
    </div>
  );
};

export default TaskHistory;
