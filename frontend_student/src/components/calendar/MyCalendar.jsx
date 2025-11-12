import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import "./style/MyCalendar.css";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import TaskModal from "../../components/calender-modal/TaskModal.jsx";
import WorkModal from "../../components/calender-modal/WorkModal.jsx";
import ConflictModal from "../../components/calender-modal/ConflictModal.jsx";
import WeekView from "./views/WeekView.jsx";
import DayView from "./views/DayView.jsx";
import AgendaView from "./views/AgendaView.jsx";
import {
  getDaysInMonth,
  getTasksForDate,
  changeMonth,
  WEEKDAY_ENUM,
  normalizeDayForEnum,
} from "../../utils/calendar-utils.js";

// ====== Config ======
const API_BASE = import.meta.env.VITE_BE_URL;
const CALENDAR_URL = `${API_BASE}/api/calendar`;

const STATUS_OPTIONS = ["chưa làm", "đang làm", "đã hoàn thành", "đã huỷ"];
const LEVEL_OPTIONS = ["quan trọng", "bình thường", "rảnh rỗi"];
const levelColor = {
  "quan trọng": "red",
  "bình thường": "blue",
  "rảnh rỗi": "hotpink",
};

// Ánh xạ từ mã ngày (FE) sang tên đầy đủ (BE)
const DAY_CODE_TO_FULL_NAME = {
  MON: "Monday",
  TUE: "Tuesday",
  WED: "Wednesday",
  THU: "Thursday",
  FRI: "Friday",
  SAT: "Saturday",
  SUN: "Sunday",
};

// Chuẩn hóa dữ liệu từ BE để hiển thị trên FE
const normalizeItem = (raw) => ({
  ...raw,
  start_time: raw.start_time ? new Date(raw.start_time) : new Date(),
  end_time: raw.end_time ? new Date(raw.end_time) : new Date(),
  task_status: raw.task_status ?? "chưa làm",
  task_level: raw.task_level ?? "bình thường",
  task_day: raw.task_day ? normalizeDayForEnum(String(raw.task_day)) : null,
});

export default function MyCalendar() {
  const { user } = useUser();
  const userId = user?.id;

  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("month");

  // modal states
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [taskDraft, setTaskDraft] = useState({});
  const [openWorkModal, setOpenWorkModal] = useState(false);
  const [workDraft, setWorkDraft] = useState({ selectedDays: [] });
  const [expandedDay, setExpandedDay] = useState(null); // Track which day's popup is open
  const [conflicts, setConflicts] = useState([]);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // Lưu action cần thực hiện sau khi xác nhận
  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  // URL API để lấy task theo creator_id
  const CALENDAR_BY_CREATOR_URL = userId
    ? `${CALENDAR_URL}/creator/${userId}`
    : null;

  // ===== Fetch toàn bộ task của người dùng / lọc theo view =====
  useEffect(() => {
    const fetchTasks = async () => {
      if (!CALENDAR_BY_CREATOR_URL) return;

      try {
        setLoading(true);
        // 1) Lấy toàn bộ task
        const res = await axios.get(CALENDAR_BY_CREATOR_URL);
        const all = Array.isArray(res.data?.data)
          ? res.data.data
          : res.data || [];

        // 2) Tách recurring và one-off
        const recurring = all.filter((t) => t?.task_mode === "hàng ngày");
        let oneOff = all.filter((t) => t?.task_mode !== "hàng ngày");

        // 3) Áp filter theo view (chỉ cho one-off)
        if (activeFilter === "month") {
          const startOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            1
          );
          const endOfMonth = new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            0,
            23,
            59,
            59
          );
          oneOff = oneOff.filter(
            (t) =>
              t?.start_time &&
              new Date(t.start_time) >= startOfMonth &&
              new Date(t.start_time) <= endOfMonth
          );
        } else if (activeFilter === "week") {
          const sel = new Date(currentDate);
          const day = sel.getDay();
          const diffToMon = (day + 6) % 7;
          const mon = new Date(sel);
          mon.setDate(sel.getDate() - diffToMon);
          mon.setHours(0, 0, 0, 0);
          const sun = new Date(mon);
          sun.setDate(mon.getDate() + 6);
          sun.setHours(23, 59, 59, 999);
          oneOff = oneOff.filter(
            (t) =>
              t?.start_time &&
              new Date(t.start_time) >= mon &&
              new Date(t.start_time) <= sun
          );
        } else if (activeFilter === "agenda") {
          const now = new Date();
          const future = new Date(now);
          future.setDate(now.getDate() + 7);
          oneOff = oneOff.filter(
            (t) =>
              t?.start_time &&
              new Date(t.start_time) >= now &&
              new Date(t.start_time) <= future
          );
        }

        // 4) Gộp lại: recurring luôn "xuyên suốt"
        const byId = new Map();
        [...oneOff, ...recurring].forEach((t) => {
          if (t && (t._id || t.id)) byId.set(t._id || t.id, normalizeItem(t));
        });

        setTasks(Array.from(byId.values()));
      } catch (e) {
        console.error("Fetch tasks error:", e);
        alert("Không thể tải dữ liệu lịch");
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [activeFilter, currentDate, userId, CALENDAR_BY_CREATOR_URL]);
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        !e.target.closest(".calendar-tasks-popup") &&
        !e.target.classList.contains("calendar-show-more")
      ) {
        setExpandedDay(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // CHỈNH SỬA: Loại bỏ MonthView khỏi hàm này, nó sẽ được render trực tiếp bên ngoài.
  const renderActiveView = () => {
    const viewProps = { tasks, currentDate, navigate };
    switch (activeFilter) {
      case "week":
        return <WeekView {...viewProps} />;
      case "day":
        return <DayView {...viewProps} />;
      case "agenda":
        return <AgendaView {...viewProps} />;
      case "month":
      default:
        return null;
    }
  };

  // ===== Helpers để tạo draft với creator_id =====
  const emptyTaskDraft = (date = new Date()) => ({
    task_name: "",
    task_description: "",
    task_level: "bình thường",
    task_status: "chưa làm",
    start_time: date,
    end_time: new Date(date.getTime() + 60 * 60 * 1000),
    creator_id: userId,
  });

  const emptyWorkDraft = (date = new Date()) => ({
    task_name: "",
    task_description: "",
    selectedDays: [],
    start_time: new Date(date.setHours(9, 0, 0, 0)),
    end_time: new Date(date.setHours(17, 0, 0, 0)),
    creator_id: userId,
  });

  // ===== Click vào ô ngày -> mở modal tạo Task =====
  const handleDayClick = (day) => {
    if (!day.isCurrentMonth) return;
    const start = new Date(day.fullDate);
    start.setHours(9, 0, 0, 0);
    setTaskDraft(emptyTaskDraft(start));
    setOpenTaskModal(true);
  };

  // ✅ Hàm kiểm tra trùng lịch chung
  const checkConflict = async (checkData) => {
    try {
      const res = await axios.post(`${CALENDAR_URL}/check`, checkData);

      if (res.data.isConflict && res.data.conflicts?.length > 0) {
        return res.data.conflicts; // Trả về danh sách conflicts
      }
      return null; // Không có conflict
    } catch (err) {
      console.error("❌ Lỗi checkConflict:", err);
      toast.error(err.response?.data?.message || "Không thể kiểm tra trùng lịch!");
      throw err;
    }
  };

  // ====== POST TASK ======
  const postTask = async (payload, forceCreate = false) => {
    if (!userId) {
      toast.error("Không tìm thấy ID người dùng.");
      return;
    }

    const start = new Date(payload.start_time);
    const end = new Date(payload.end_time);
    const now = new Date();

    // Validate cơ bản
    if (isNaN(start) || isNaN(end)) {
      toast.error("Thời gian không hợp lệ!");
      return;
    }
    if (start < now) {
      toast.error("Thời gian bắt đầu không được nhỏ hơn hiện tại!");
      return;
    }
    if (end <= start) {
      toast.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu!");
      return;
    }

    // ✅ Kiểm tra conflict trước (nếu chưa force)
    if (!forceCreate) {
      try {
        const conflictList = await checkConflict({
          creator_id: userId,
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          task_mode: "dài hạn",
          task_day: null,
        });

        if (conflictList) {
          // Có conflict -> Hiển thị modal xác nhận
          setConflicts(conflictList);
          setShowConflictModal(true);
          setPendingAction(() => () => postTask(payload, true)); // Lưu action để thực hiện sau
          return;
        }
      } catch {
        return; // Dừng nếu lỗi khi check
      }
    }

    // ✅ Thực hiện tạo task
    try {
      const body = {
        task_name: payload.task_name,
        task_description: payload.task_description,
        task_type: "project",
        task_mode: "dài hạn",
        task_status: payload.task_status || "chưa làm",
        task_level: payload.task_level || "bình thường",
        task_day: null,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        creator_id: payload.creator_id,
      };

      await axios.post(CALENDAR_URL, body, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("✅ Tạo Task thành công!");
      setOpenTaskModal(false);

      // Refresh task list
      const res = await axios.get(CALENDAR_BY_CREATOR_URL);
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data || [];
      setTasks(list.map(normalizeItem));
    } catch (err) {
      console.error("POST task failed", err?.response || err);
      toast.error(err.response?.data?.message || "Tạo Task thất bại");
    }
  };

  // ====== POST WORK ======
  const saveWork = async (payload, forceCreate = false) => {
    if (!userId) {
      toast.error("Không tìm thấy ID người dùng.");
      return;
    }
    if (!payload.task_name?.trim()) {
      toast.error("Nhập tên công việc.");
      return;
    }
    if (!payload.selectedDays?.length) {
      toast.error("Chọn ít nhất một ngày lặp.");
      return;
    }

    const start = new Date(payload.start_time);
    const end = new Date(payload.end_time);
    const startISO = start.toISOString();
    const endISO = end.toISOString();

    // ✅ Kiểm tra conflict cho TẤT CẢ các ngày được chọn
    if (!forceCreate) {
      try {
        let allConflicts = [];

        for (const dayCode of payload.selectedDays) {
          const fullName = DAY_CODE_TO_FULL_NAME[dayCode];
          if (!fullName) continue;

          const conflictList = await checkConflict({
            creator_id: userId,
            start_time: startISO,
            end_time: endISO,
            task_mode: "hàng ngày",
            task_day: fullName,
          });

          if (conflictList) {
            allConflicts.push(...conflictList);
          }
        }

        if (allConflicts.length > 0) {
          // Có conflict -> Hiển thị modal xác nhận
          setConflicts(allConflicts);
          setShowConflictModal(true);
          setPendingAction(() => () => saveWork(payload, true));
          return;
        }
      } catch {
        return; // Dừng nếu lỗi
      }
    }

    // ✅ Thực hiện tạo work
    const base = {
      task_name: payload.task_name,
      task_description: payload.task_description,
      task_type: "work",
      task_mode: "hàng ngày",
      start_time: startISO,
      end_time: endISO,
      task_status: "chưa làm",
      task_level: "bình thường",
      creator_id: payload.creator_id,
    };

    const requests = payload.selectedDays.map((dayCode) => {
      const fullName = DAY_CODE_TO_FULL_NAME[dayCode];
      if (!fullName) {
        console.warn(`Invalid day code found: ${dayCode}`);
        return Promise.resolve();
      }
      return axios.post(CALENDAR_URL, { ...base, task_day: fullName });
    });

    try {
      await Promise.all(requests);
      toast.success("Tạo Work thành công!");
      setOpenWorkModal(false);

      // Refresh lại danh sách
      const res = await axios.get(CALENDAR_BY_CREATOR_URL);
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data || [];
      setTasks(list.map(normalizeItem));
    } catch (err) {
      console.error("POST work failed", err?.response || err);
      toast.error(err.response?.data?.message || "Không thể tạo Work!");
    }
  };

  // ====== Tính toán task kéo dài nhiều ngày ======
  const calculateTaskDuration = (startTime, endTime) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return daysDiff;
  };

  // ====== Render tasks trong từng ô ngày với tối ưu hiển thị ======
  const renderCellTasks = (dayObj) => {
    const items = getTasksForDate(dayObj.fullDate, tasks);
    if (!items.length) return null;

    const MAX_VISIBLE = 3; //  Giới hạn hiển thị tối đa 3 task
    const visibleItems = items.slice(0, MAX_VISIBLE);
    const remainingCount = items.length - MAX_VISIBLE;
    const dayKey = dayObj.fullDate.toISOString();
    const isExpanded = expandedDay === dayKey;

    // Hàm hiển thị Toast chi tiết
    const renderDetailToast = (t) => {
      const daysDuration = calculateTaskDuration(t.start_time, t.end_time);
      const isMultiDay = daysDuration > 1;

      const color =
        t.task_status === "đã huỷ"
          ? "orange"
          : levelColor[t.task_level] || "gray";

      // Dùng JSX để tạo nội dung tùy chỉnh cho Toast
      const toastContent = (
        <div style={{ padding: "5px", lineHeight: "1.6" }}>
          <p
            style={{
              margin: 0,
              fontWeight: "bold",
              fontSize: "14px",
              color: "#333",
            }}
          >
            {t.task_name} {isMultiDay && ` (${daysDuration} ngày)`}
          </p>
          <div style={{ marginTop: "5px", fontSize: "12px" }}>
            <p style={{ margin: 0, color: "#3b97d3" }}>
              Trạng thái:
              <span style={{ fontWeight: "600", marginLeft: "5px" }}>
                {t.task_status}
              </span>
            </p>
            <p
              style={{
                margin: 0,
                color: color === "red" ? "#e74c3c" : "#8e44ad",
              }}
            >
              Mức độ:
              <span style={{ fontWeight: "600", marginLeft: "5px" }}>
                {t.task_level}
              </span>
            </p>
          </div>
        </div>
      );

      toast.info(toastContent);
    };

    return (
      <div className="calendar-events">
        {visibleItems.map((t) => {
          const color =
            t.task_status === "đã huỷ"
              ? "orange"
              : levelColor[t.task_level] || "gray";

          //  Tự động tính số ngày từ start_time đến end_time
          const daysDuration = calculateTaskDuration(t.start_time, t.end_time);
          const isMultiDay = daysDuration > 1;

          return (
            <div
              key={t._id || `${t.task_name}_${t.start_time}`}
              //  Màu sắc theo design: color được mapping tới class CSS (vd: calendar-event-red)
              className={`calendar-event calendar-event-${color}`}
              //  Tooltip chi tiết khi hover
              title={`${t.task_name}${isMultiDay ? ` (${daysDuration} ngày)` : ""
                }\nTrạng thái: ${t.task_status}\nMức độ: ${t.task_level}`}
              onClick={(e) => {
                e.stopPropagation();
                renderDetailToast(t);
              }}
            >
              <span className="event-emoji">
                {t.task_type === "work" ? "💼" : "📦"}
              </span>
              <span className="event-name">
                {t.task_name}
                {/*  Hiển thị (Xd) sau tên task nếu kéo dài nhiều ngày */}
                {isMultiDay && ` (${daysDuration}d)`}
              </span>
            </div>
          );
        })}
        {/* ✨ Nút "+X more" hiển thị số lượng task còn lại */}
        {remainingCount > 0 && (
          <>
            <button
              className="calendar-show-more"
              onClick={(e) => {
                e.stopPropagation();
                // ✨ Click vào "+X more" sẽ hiển thị danh sách task ẩn (popup)
                setExpandedDay(isExpanded ? null : dayKey);
              }}
            >
              +{remainingCount} more
            </button>

            {isExpanded && (
              <>
                {/* Overlay và Popup hiển thị danh sách task ẩn */}
                <div
                  className="calendar-popup-overlay"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedDay(null);
                  }}
                />
                <div
                  className="calendar-tasks-popup"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="calendar-tasks-popup-header">
                    <span>
                      {dayObj.fullDate.toLocaleDateString("vi-VN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <button
                      className="calendar-tasks-popup-close"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedDay(null);
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div className="calendar-tasks-popup-list">
                    {/* Render tất cả tasks (bao gồm cả tasks đã ẩn) */}
                    {items.map((t) => {
                      const color =
                        t.task_status === "đã huỷ"
                          ? "orange"
                          : levelColor[t.task_level] || "gray";

                      const daysDuration = calculateTaskDuration(
                        t.start_time,
                        t.end_time
                      );
                      const isMultiDay = daysDuration > 1;

                      return (
                        <div
                          key={t._id || `${t.task_name}_${t.start_time}`}
                          className={`calendar-event calendar-event-${color}`}
                          title={`${t.task_name}${isMultiDay ? ` (${daysDuration} ngày)` : ""
                            }\nTrạng thái: ${t.task_status}\nMức độ: ${t.task_level
                            }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            renderDetailToast(t);
                          }}
                        >
                          <span className="event-emoji">
                            {t.task_type === "work" ? "💼" : "📦"}
                          </span>
                          <span className="event-name">
                            {t.task_name}
                            {isMultiDay && ` (${daysDuration}d)`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  // ====== Render ======
  if (!userId) {
    return (
      <div className="calendar-wrapper">
        <div className="calendar-loading">Đang tải thông tin người dùng...</div>
      </div>
    );
  }

  return (
    <div className="calendar-wrapper">
      <div className="calendar-container">
        {/* TOP TITLE & ACTIONS */}
        <div className="calendar-top">
          <div className="calendar-title">
            <div className="calendar-emoji">📅</div>
            <h1>Lịch của bạn</h1>
          </div>
          <div className="calendar-top-actions">
            <button
              className="big-action big-action-work"
              onClick={() => {
                setWorkDraft(emptyWorkDraft(new Date()));
                setOpenWorkModal(true);
              }}
            >
              ➕ Thêm Work
            </button>
            <button
              className="big-action big-action-list"
              onClick={() => navigate("/dashboard/tasks")}
            >
              Danh sách task
            </button>
            <button
              className="big-action big-action-task"
              onClick={() => {
                setTaskDraft(emptyTaskDraft(new Date()));
                setOpenTaskModal(true);
              }}
            >
              ➕ Thêm Task
            </button>
          </div>
        </div>

        {/* HEADER & NAVIGATION */}
        <div className="calendar-header">
          <div className="calendar-header-left">
            <button
              className="calendar-btn-nav"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </button>
            <button
              className="calendar-btn-nav"
              onClick={() => setCurrentDate(changeMonth(currentDate, -1))}
            >
              Back
            </button>
            <button
              className="calendar-btn-nav"
              onClick={() => setCurrentDate(changeMonth(currentDate, 1))}
            >
              Next
            </button>
          </div>
          <div className="calendar-header-center">
            <div className="current-range">
              {currentDate.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="calendar-header-right">
            {["Month", "Week", "Day", "Agenda"].map((f) => (
              <button
                key={f}
                className={`calendar-filter-btn ${activeFilter === f.toLowerCase() ? "active" : ""
                  }`}
                onClick={() => setActiveFilter(f.toLowerCase())}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* LƯỚI LỊCH - Bắt đầu điều chỉnh hiển thị */}
        <div className={`calendar-content calendar--${activeFilter}`}>
          {activeFilter === "month" ? (
            <>
              {/* HIỂN THỊ MONTH VIEW MẶC ĐỊNH (giữ nguyên cấu trúc) */}
              <div className="calendar-weekdays">
                {WEEKDAY_ENUM.map((w) => (
                  <div key={w} className="calendar-weekday">
                    {w}
                  </div>
                ))}
              </div>
              <div className="calendar-days">
                {days.map((day, idx) => (
                  <div
                    key={idx}
                    className={`calendar-day ${!day.isCurrentMonth ? "calendar-day-other-month" : ""
                      } ${day.isToday ? "calendar-day-today" : ""}`}
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="calendar-day-number">
                      {String(day.date).padStart(2, "0")}
                    </div>
                    {renderCellTasks(day)}
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* HIỂN THỊ CÁC VIEW KHÁC */
            renderActiveView()
          )}
        </div>

        {/* Loading Indicator */}
        {loading && <div className="calendar-loading">Đang tải dữ liệu...</div>}
      </div>

      {/* Modals */}
      {openTaskModal && (
        <TaskModal
          value={taskDraft}
          onChange={setTaskDraft}
          onClose={() => setOpenTaskModal(false)}
          onSave={() => postTask(taskDraft)}
          statusOptions={STATUS_OPTIONS}
          levelOptions={LEVEL_OPTIONS}
        />
      )}
      {openWorkModal && (
        <WorkModal
          value={workDraft}
          onChange={setWorkDraft}
          onClose={() => setOpenWorkModal(false)}
          onSave={() => saveWork(workDraft)}
        />
      )}
      {showConflictModal && (
        <ConflictModal
          conflicts={conflicts}
          onCancel={() => {
            setShowConflictModal(false);
            setConflicts([]);
            setPendingAction(null);
          }}
          onContinue={() => {
            setShowConflictModal(false);
            if (pendingAction) {
              pendingAction(); // Thực hiện action đã lưu
            }
            setConflicts([]);
            setPendingAction(null);
          }}
        />
      )}
    </div>
  );
}
