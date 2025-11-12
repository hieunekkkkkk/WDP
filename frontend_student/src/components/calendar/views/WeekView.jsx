import React from "react";
import { levelColor } from "../../../utils/calendar-utils";
import "../style/WeekView.css";

const calculatePosition = (event) => {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  const top = startMinute;
  const height = Math.max(30, endMinute - startMinute);
  return { top: `${top}px`, height: `${height}px` };
};

// Component con cho một cột ngày
const DayColumn = ({ tasks, date }) => {
  const calculateTaskDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="week-day-column">
      {tasks
        .filter(
          (task) =>
            new Date(task.start_time).toDateString() === date.toDateString() ||
            (new Date(task.start_time) <= date &&
              new Date(task.end_time) >= date)
        )
        .map((task) => {
          const color =
            task.task_status === "đã huỷ"
              ? "orange"
              : levelColor[task.task_level] || "gray";
          const daysDuration = calculateTaskDuration(
            task.start_time,
            task.end_time
          );
          const isMultiDay = daysDuration > 1;

          return (
            <div
              key={task._id}
              className={`week-event-slot week-event-${color}`}
              style={calculatePosition(task)}
            >
              <div className="week-event-slot-title">{task.task_name}</div>
              <div className="week-event-slot-time">
                {new Date(task.start_time).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isMultiDay && (
                  <span className="week-event-badge">({daysDuration}d)</span>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
};

export default function WeekView({ tasks, currentDate }) {
  const getWeekDays = (date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Bắt đầu từ thứ Hai
    start.setDate(diff);
    return Array.from(
      { length: 7 },
      (_, i) =>
        new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    );
  };

  const weekDays = getWeekDays(currentDate);
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const today = new Date();

  return (
    <div className="week-view-container">
      <div className="week-day-headers">
        {weekDays.map((day, idx) => {
          const isToday = day.toDateString() === today.toDateString();
          return (
            <div
              key={idx}
              className={`week-day-header ${isToday ? "today" : ""}`}
            >
              <div>{day.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
              <div style={{ fontSize: "1.2rem", marginTop: "4px" }}>
                {day.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="week-grid-wrapper">
        <div className="week-time-labels">
          {hours.map((hour) => (
            <div key={hour} className="week-time-label">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="week-events-wrapper">
          <div className="week-events-grid">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="week-hour-line"
                  style={{ top: `${hour * 60}px` }}
                />
                <div
                  className="week-hour-line half-hour"
                  style={{ top: `${hour * 60 + 30}px` }}
                />
              </React.Fragment>
            ))}
            {weekDays.map((day, idx) => (
              <DayColumn key={idx} tasks={tasks} date={day} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
