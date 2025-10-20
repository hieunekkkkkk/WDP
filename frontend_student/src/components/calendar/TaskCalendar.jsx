import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FaCalendarAlt,
  FaList,
  FaChartBar,
  FaPlus,
  FaClock,
  FaEye,
  FaEdit,
} from "react-icons/fa";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import TaskModal from "../../components/calender-modal/TaskModal.jsx";
import EmptyState from "../../components/card/EmptyState.jsx";
import TaskCard from "../../components/card/TaskCard.jsx";
import WorkModal from "../../components/calender-modal/WorkModal.jsx";
import DetailModal from "../../components/calender-modal/DetailModal.jsx";
import "../calender-modal/style/DetailModal.css";
import FloatingWorkWidget from "../calender-modal/FloatingWorkWidget.jsx";
const TaskCalendar = (props) => {
  const { userId } = useAuth();
  const navigate = useNavigate();

  // ===== State =====
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [openWorkModal, setOpenWorkModal] = useState(false);
  const [taskDraft, setTaskDraft] = useState(null);
  const [workDraft, setWorkDraft] = useState(null);
  const [workTasks, setWorkTasks] = useState([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // ===== Config =====
  const CALENDAR_URL = import.meta.env.VITE_BE_URL + "/api/calendar";
  const CALENDAR_BY_CREATOR_URL = `${CALENDAR_URL}/creator/${userId}`;

  const priorityConfig = {
    "quan trọng": { label: "Quan trọng", bg: "#fee2e2", color: "#b91c1c" },
    "bình thường": { label: "Bình thường", bg: "#dbeafe", color: "#1e40af" },
    "rảnh rỗi": { label: "Rảnh rỗi", bg: "#d1fae5", color: "#065f46" },
  };

  const statusConfig = {
    "chưa làm": { label: "Chưa làm", bg: "#9ca3af", color: "#ffffff" },
    "đang làm": { label: "Đang làm", bg: "#fbbf24", color: "#ffffff" },
    "đã hoàn thành": { label: "Hoàn thành", bg: "#10b981", color: "#ffffff" },
    "đã huỷ": { label: "Đã huỷ", bg: "#ef4444", color: "#ffffff" },
  };

  // ===== API logic =====
  const fetchTasks = async (showToast = false) => {
    if (!userId) return;
    try {
      const res = await axios.get(CALENDAR_BY_CREATOR_URL);
      const all = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data || [];

      // Lọc các task thuộc loại "project" hoặc "dài hạn"
      const projectTasks = all.filter(
        (t) =>
          t.task_type === "project" ||
          t.task_mode === "dài hạn" ||
          (t.task_type !== "work" && t.task_mode !== "hàng ngày")
      );
      setTasks(projectTasks);
      const recurringTasks = all.filter((t) => t.task_mode === "hàng ngày");
      setWorkTasks(recurringTasks);
      const activeTasks = projectTasks.filter(
        (t) => t.task_status !== "đã hoàn thành" && t.task_status !== "đã huỷ"
      );

      // Áp dụng bộ lọc từ UI (tìm kiếm, trạng thái, mức độ)
      let filtered = activeTasks;
      if (filterStatus !== "all") {
        filtered = filtered.filter((t) => t.task_status === filterStatus);
      }
      if (filterPriority !== "all") {
        filtered = filtered.filter((t) => t.task_level === filterPriority);
      }
      if (searchTerm) {
        filtered = filtered.filter((t) =>
          (t.task_name || "").toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setTasks(filtered);
      if (showToast) {
        toast.success("Đã lọc danh sách công việc!");
      }
    } catch (err) {
      console.error("Fetch tasks failed:", err);
      toast.error("Không thể tải danh sách công việc");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [userId, searchTerm, filterStatus, filterPriority]);

  // ===== CRUD Functions =====
  const postTask = async (payload) => {
    if (!payload || !payload.task_name) {
      toast.warn("Vui lòng nhập tên công việc.");
      return;
    }
    try {
      const body = {
        task_name: payload.task_name,
        task_description: payload.task_description,
        task_type: "project",
        task_mode: "dài hạn",
        task_status: payload.task_status || "chưa làm",
        task_level: payload.task_level || "bình thường",
        task_day: null,
        start_time: new Date(payload.start_time).toISOString(),
        end_time: new Date(payload.end_time).toISOString(),
        creator_id: userId,
      };
      await axios.post(CALENDAR_URL, body);
      await fetchTasks();
      setOpenTaskModal(false);
      setTaskDraft(null);
      toast.success("Tạo công việc thành công!");
    } catch (err) {
      console.error("Tạo task thất bại:", err);
      toast.error("Thêm công việc thất bại.");
    }
  };

  const saveEditedTask = async (payload) => {
    if (!payload?._id) {
      return postTask(payload);
    }
    try {
      const body = {
        ...payload,
        start_time: new Date(payload.start_time).toISOString(),
        end_time: new Date(payload.end_time).toISOString(),
        creator_id: userId,
      };
      await axios.put(`${CALENDAR_URL}/${payload._id}`, body);
      await fetchTasks();
      setOpenTaskModal(false);
      setTaskDraft(null);
      toast.success("Cập nhật công việc thành công!");
    } catch (err) {
      console.error("Cập nhật công việc thất bại:", err);
      toast.error("Cập nhật công việc thất bại.");
    }
  };

  const saveWork = async (payload) => {
    if (!payload || !payload.task_name) {
      toast.warn("Vui lòng nhập tên và chọn ngày lặp lại.");
      return;
    }
    try {
      const startISO = new Date(payload.start_time).toISOString();
      const endISO = new Date(payload.end_time).toISOString();
      const base = {
        task_name: payload.task_name,
        task_description: payload.task_description,
        task_type: "work",
        task_mode: "hàng ngày",
        start_time: startISO,
        end_time: endISO,
        task_status: "chưa làm",
        task_level: "bình thường",
        creator_id: userId,
      };
      const dayFullNames = {
        MON: "Monday",
        TUE: "Tuesday",
        WED: "Wednesday",
        THU: "Thursday",
        FRI: "Friday",
        SAT: "Saturday",
        SUN: "Sunday",
      };
      for (const dayCode of payload.selectedDays) {
        const fullName = dayFullNames[dayCode];
        if (fullName) {
          const body = { ...base, task_day: fullName };
          await axios.post(CALENDAR_URL, body);
        }
      }
      await fetchTasks(); // Tải lại danh sách
      setOpenWorkModal(false);
      setWorkDraft(null);
      toast.success("Tạo công việc lặp lại thành công!");
    } catch (err) {
      toast.error("Tạo công việc lặp lại thất bại.");
      console.error("Tạo công việc lặp lại thất bại:", err);
    }
  };

  const updateStatus = async (idOrTask, newStatus) => {
    try {
      const task =
        typeof idOrTask === "string"
          ? tasks.find((t) => t._id === idOrTask)
          : idOrTask;

      if (!task) {
        toast.error("Không tìm thấy task để cập nhật.");
        return;
      }

      if ((task.task_status ?? task.status) === newStatus) {
        toast.info("Trạng thái không thay đổi.");
        return;
      }
      const updated = {
        ...task,
        task_status: newStatus,
      };


      const payload = {
        ...updated,
        ...(updated.start_time && !isNaN(new Date(updated.start_time))
          ? { start_time: new Date(updated.start_time).toISOString() }
          : {}),
        ...(updated.end_time && !isNaN(new Date(updated.end_time))
          ? { end_time: new Date(updated.end_time).toISOString() }
          : {}),
      };

      await axios.put(`${CALENDAR_URL}/${task._id}`, payload);

      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, task_status: newStatus } : t
        )
      );
      await fetchTasks();

      toast.info(
        `Đã cập nhật trạng thái thành "${statusConfig[newStatus].label}"`
      );
    } catch (err) {
      console.error("Cập nhật trạng thái lỗi:", err);
      toast.error("Cập nhật trạng thái thất bại.");
    }
  };

  const handleDeleteWork = async (taskId) => {
    if (window.confirm("Bạn có chắc muốn xóa công việc này?")) {
      try {
        await axios.delete(`${CALENDAR_URL}/${taskId}`);
        toast.success("Đã xóa công việc!");
        fetchTasks(); // Tải lại dữ liệu
      } catch (error) {
        toast.error("Xóa công việc thất bại.");
        console.error("Delete work failed:", error);
      }
    }
  };
  // ===== Helpers for opening modals =====
  const handleView = (task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleEdit = (task) => {
    setTaskDraft({
      _id: task._id,
      task_name: task.task_name,
      task_description: task.task_description,
      task_status: task.task_status,
      task_level: task.task_level,
      start_time: new Date(task.start_time),
      end_time: new Date(task.end_time),
      task_day: task.task_day,
      task_type: task.task_type,
      task_mode: task.task_mode,
    });
    setOpenTaskModal(true);
  };

  const handleAddTask = () => {
    setTaskDraft({
      task_name: "",
      task_description: "",
      task_status: "chưa làm",
      task_level: "bình thường",
      start_time: new Date(),
      end_time: new Date(Date.now() + 60 * 60 * 1000),
    });
    setOpenTaskModal(true);
  };

  const handleAddWork = () => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(9, 0, 0, 0);
    const end = new Date(now);
    end.setHours(17, 0, 0, 0);
    setWorkDraft({
      task_name: "",
      task_description: "",
      selectedDays: [],
      start_time: start,
      end_time: end,
    });
    setOpenWorkModal(true);
  };
  const handleEditWork = (task) => {
    // Chuyển đổi task_day từ tên đầy đủ (Monday) về mã (MON)
    const dayNameMap = {
      Monday: "MON",
      Tuesday: "TUE",
      Wednesday: "WED",
      Thursday: "THU",
      Friday: "FRI",
      Saturday: "SAT",
      Sunday: "SUN",
    };

    setWorkDraft({
      _id: task._id, // Quan trọng để phân biệt edit và create
      task_name: task.task_name,
      task_description: task.task_description,
      start_time: new Date(task.start_time),
      end_time: new Date(task.end_time),
      selectedDays: [dayNameMap[task.task_day]], // Chỉ có 1 ngày được chọn
    });
    setOpenWorkModal(true);
  };
  const saveEditedWork = async (payload) => {
    if (!payload?._id) return;
    try {
      const dayCodeToFullName = {
        MON: "Monday",
        TUE: "Tuesday",
        WED: "Wednesday",
        THU: "Thursday",
        FRI: "Friday",
        SAT: "Saturday",
        SUN: "Sunday",
      };

      const dayCode = payload.selectedDays[0]; // Ví dụ: "MON"
      const dayFullName = dayCodeToFullName[dayCode]; // Chuyển thành "Monday"

      if (!dayFullName) {
        toast.error("Ngày không hợp lệ.");
        return;
      }

      const body = {
        task_name: payload.task_name,
        task_description: payload.task_description,
        start_time: new Date(payload.start_time).toISOString(),
        end_time: new Date(payload.end_time).toISOString(),
        task_day: dayFullName, // Gửi đi tên đầy đủ
        // Giữ nguyên các thuộc tính khác từ payload
        task_type: "work",
        task_mode: "hàng ngày",
        creator_id: userId,
        task_status: payload.task_status || "chưa làm",
        task_level: payload.task_level || "bình thường",
      };

      await axios.put(`${CALENDAR_URL}/${payload._id}`, body);
      await fetchTasks();
      setOpenWorkModal(false);
      setWorkDraft(null);
      toast.success("Cập nhật công việc thành công!");
    } catch (err) {
      console.error("Cập nhật work thất bại:", err);
      toast.error("Cập nhật công việc thất bại.");
    }
  };
  // ===== UI Render =====
  return (
    <div className="task-calendar-container">
      <div className="task-calendar-wrapper">
        <h1 className="task-calendar-title">
          Chào mừng bạn đến với danh sách công việc ✨
        </h1>

        {/* Navigation */}
        <div className="task-nav-buttons">
          <button className="task-nav-btn btn-blue" onClick={handleAddTask}>
            {" "}
            <FaPlus size={14} /> Thêm Task{" "}
          </button>
          <button className="task-nav-btn btn-purple" onClick={handleAddWork}>
            {" "}
            <FaPlus size={14} /> Thêm Work{" "}
          </button>
          <button
            className="task-nav-btn btn-cyan"
            onClick={() => navigate("/dashboard/calendar")}
          >
            {" "}
            <FaCalendarAlt size={14} /> Xem lịch{" "}
          </button>
          <button className="task-nav-btn btn-teal">
            {" "}
            <FaList size={14} /> Danh sách tasks{" "}
          </button>
          <button
            className="task-nav-btn btn-pink"
            onClick={() => navigate("/dashboard/task-history")}
          >
            {" "}
            <FaClock size={14} /> Lịch sử tasks{" "}
          </button>
          <button
            className="task-nav-btn btn-green"
            onClick={() => navigate("/dashboard/analytics")}
          >
            {" "}
            <FaChartBar size={14} /> Phân tích dữ liệu{" "}
          </button>
        </div>

        {/* Search + Filter */}
        <div className="filter-container">
          <input
            type="text"
            placeholder="Tìm kiếm công việc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-search-input"
          />
          <div className="filter-selects">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả trạng thái (còn lại)</option>
              {Object.keys(statusConfig)
                .filter((s) => s !== "đã hoàn thành")
                .map((status) => (
                  <option key={status} value={status}>
                    {statusConfig[status].label}
                  </option>
                ))}
            </select>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả mức độ</option>
              {Object.keys(priorityConfig).map((prio) => (
                <option key={prio} value={prio}>
                  {priorityConfig[prio].label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {tasks.length === 0 ? (
          <EmptyState />
        ) : (
          tasks.map((t) => (
            <TaskCard
              key={t._id}
              task={t}
              statusConfig={statusConfig}
              priorityConfig={priorityConfig}
              onView={handleView}
              onEdit={handleEdit}
              onChangeStatus={updateStatus}
            />
          ))
        )}
      </div>

      {/* ==== MODALS ==== */}
      {openTaskModal && (
        <TaskModal
          value={taskDraft}
          onChange={setTaskDraft}
          onClose={() => {
            setOpenTaskModal(false);
            setTaskDraft(null);
          }}
          onSave={() => {
            if (taskDraft._id) {
              saveEditedTask(taskDraft);
            } else {
              postTask(taskDraft);
            }
          }}
          statusOptions={Object.keys(statusConfig)}
          levelOptions={Object.keys(priorityConfig)}
        />
      )}
      {openWorkModal && (
        <WorkModal
          value={workDraft}
          onChange={setWorkDraft}
          onClose={() => {
            setOpenWorkModal(false);
            setWorkDraft(null);
          }}
          onSave={() => {
            if (workDraft._id) {
              saveEditedWork(workDraft);
            } else {
              saveWork(workDraft);
            }
          }}
        />
      )}
      {detailOpen && selectedTask && (
        <DetailModal
          task={selectedTask}
          onClose={() => {
            setDetailOpen(false);
            setSelectedTask(null);
          }}
          // THÊM: Truyền các config cần thiết
          statusConfig={statusConfig}
          priorityConfig={priorityConfig}
        />
      )}
      <FloatingWorkWidget
        tasks={workTasks}
        onEdit={handleEditWork}
        onDelete={handleDeleteWork}
      />
    </div>
  );
};

export default TaskCalendar;
