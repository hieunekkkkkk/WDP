import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import "react-datepicker/dist/react-datepicker.css";
import "./style/MyCalendar.css";

import TaskModal from "../../components/calender-modal/TaskModal.jsx";
import WorkModal from "../../components/calender-modal/WorkModal.jsx";
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
  "rảnh rỗi": "gray",
};

// Map EN → VI cho BE (T2..T7/CN)
const DAY_EN_TO_VI = {
  SUN: "CN",
  MON: "T2",
  TUE: "T3",
  WED: "T4",
  THU: "T5",
  FRI: "T6",
  SAT: "T7",
};

// Chuẩn hóa dữ liệu từ BE
const normalizeItem = (raw) => ({
  ...raw,
  start_time: raw.start_time ? new Date(raw.start_time) : new Date(),
  end_time: raw.end_time ? new Date(raw.end_time) : new Date(),
  task_status: raw.task_status ?? "chưa làm",
  task_level: raw.task_level ?? "bình thường",
  task_day: raw.task_day ? normalizeDayForEnum(String(raw.task_day)) : null,
});

export default function MyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("month");

  // modal states
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [taskDraft, setTaskDraft] = useState({});
  const [openWorkModal, setOpenWorkModal] = useState(false);
  const [workDraft, setWorkDraft] = useState({ selectedDays: [] });

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);

  // ===== Fetch toàn bộ / theo filter =====
  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      try {
        const res = await axios.get(CALENDAR_URL, {
          headers: { "Content-Type": "application/json" },
        });
        const all = Array.isArray(res?.data)
          ? res.data.map(normalizeItem)
          : [];

        let filtered = all;
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
          filtered = all.filter(
            (t) =>
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
          filtered = all.filter((t) => {
            const s = new Date(t.start_time);
            return s >= mon && s <= sun;
          });
        } else if (activeFilter === "agenda") {
          const now = new Date();
          const future = new Date(now);
          future.setDate(now.getDate() + 7);
          filtered = all.filter(
            (t) =>
              new Date(t.start_time) >= now && new Date(t.start_time) <= future
          );
        }

        setTasks(filtered);
      } catch (err) {
        console.error("GET /api/calendar failed", err);
        toast.error("Không tải được dữ liệu lịch.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, [activeFilter, currentDate]);

  // ===== Draft helpers =====
  const emptyTaskDraft = (date = new Date()) => ({
    task_name: "",
    task_description: "",
    task_level: "bình thường",
    task_status: "chưa làm",
    start_time: date,
    end_time: new Date(date.getTime() + 60 * 60 * 1000),
  });
  const emptyWorkDraft = (date = new Date()) => ({
    task_name: "",
    task_description: "",
    selectedDays: [],
    start_time: new Date(date.setHours(9, 0, 0, 0)),
    end_time: new Date(date.setHours(17, 0, 0, 0)),
  });

  // ===== Click vào ô ngày -> mở modal tạo Task =====
  const handleDayClick = (day) => {
    if (!day.isCurrentMonth) return;
    const start = new Date(day.fullDate);
    start.setHours(9, 0, 0, 0);
    setTaskDraft(emptyTaskDraft(start));
    setOpenTaskModal(true);
  };

  // ====== POST TASK ======
  const postTask = async (payload) => {
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
      };

      await axios.post(CALENDAR_URL, body, {
        headers: { "Content-Type": "application/json" },
      });
      toast.success("Tạo Task thành công!");
      setOpenTaskModal(false);
      setTasks((p) => [...p, normalizeItem(body)]);
    } catch (err) {
      console.error("POST task failed", err?.response || err);
      toast.error("Tạo Task thất bại");
    }
  };

  // ====== POST WORK ======
  const saveWork = async (payload) => {
    if (!payload.task_name?.trim()) return toast.error("Nhập tên công việc.");
    if (!payload.selectedDays?.length)
      return toast.error("Chọn ít nhất một ngày lặp.");

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
    };

    const requests = payload.selectedDays.map(async (dayEN) => {
      const viVal = DAY_EN_TO_VI[dayEN] || dayEN;
      try {
        await axios.post(CALENDAR_URL, { ...base, task_day: viVal });
      } catch (e1) {
        if (e1?.response?.status === 400) {
          await axios.post(CALENDAR_URL, { ...base, task_day: dayEN });
        } else throw e1;
      }
    });

    try {
      await Promise.all(requests);
      toast.success("Tạo Work thành công!");
      setOpenWorkModal(false);
      await axios
        .get(CALENDAR_URL)
        .then((res) =>
          setTasks(
            Array.isArray(res?.data)
              ? res.data.map(normalizeItem)
              : []
          )
        );
    } catch (err) {
      console.error("POST work failed", err?.response || err);
      toast.error("Không thể tạo Work!");
    }
  };

  // ====== Render tasks trong cell ======
  const renderCellTasks = (dayObj) => {
    const items = getTasksForDate(dayObj.fullDate, tasks);
    if (!items.length) return null;
    return (
      <div className="calendar-events">
        {items.map((t) => {
          const color =
            t.task_status === "đã huỷ"
              ? "orange"
              : levelColor[t.task_level] || "gray";
          return (
            <div
              key={t._id || `${t.task_name}_${t.start_time}`}
              className={`calendar-event calendar-event-${color}`}
              title={t.task_name}
            >
              <span className="event-emoji">📦</span>
              <span className="event-name">{t.task_name}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="calendar-wrapper">
      <div className="calendar-container">
        {/* TOP TITLE */}
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

        {/* FILTER NAV */}
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
                className={`calendar-filter-btn ${
                  activeFilter === f.toLowerCase() ? "active" : ""
                }`}
                onClick={() => setActiveFilter(f.toLowerCase())}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <div className="calendar-content">
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
                className={`calendar-day ${
                  !day.isCurrentMonth ? "calendar-day-other-month" : ""
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
        </div>
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
    </div>
  );
}
