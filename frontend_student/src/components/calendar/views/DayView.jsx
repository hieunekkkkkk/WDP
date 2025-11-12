import React from "react";
import { levelColor } from "../../../utils/calendar-utils";
import "../style/DayView.css";

const calculatePosition = (event) => {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();
  const top = startMinute;
  const height = Math.max(30, endMinute - startMinute);
  return { top: `${top}px`, height: `${height}px` };
};

export default function DayView({ tasks, currentDate }) {
  const calculateTaskDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const dayTasks = tasks.filter(
    (task) =>
      new Date(task.start_time).toDateString() === currentDate.toDateString() ||
      (new Date(task.start_time) <= currentDate &&
        new Date(task.end_time) >= currentDate)
  );

  const today = new Date();
  const isToday = currentDate.toDateString() === today.toDateString();

  return (
    <div className="day-view-container">
      <div className={`day-view-header ${isToday ? "today" : ""}`}>
        {currentDate.toLocaleDateString("vi-VN", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>

      <div className="day-grid-wrapper">
        <div className="day-time-labels">
          {hours.map((hour) => (
            <div key={hour} className="day-time-label">
              {hour.toString().padStart(2, "0")}:00
            </div>
          ))}
        </div>

        <div className="day-events-wrapper">
          <div className="day-events-grid">
            {hours.map((hour) => (
              <React.Fragment key={hour}>
                <div
                  className="day-hour-line"
                  style={{ top: `${hour * 60}px` }}
                />
                <div
                  className="day-hour-line half-hour"
                  style={{ top: `${hour * 60 + 30}px` }}
                />
              </React.Fragment>
            ))}

            {dayTasks.length === 0 ? (
              <div className="day-empty-state">
                <div className="day-empty-state-icon">📅</div>
                <div className="day-empty-state-text">
                  Không có công việc nào trong ngày này
                </div>
              </div>
            ) : (
              dayTasks.map((task) => {
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
                    className={`day-event-slot day-event-${color}`}
                    style={calculatePosition(task)}
                  >
                    <div className="day-event-slot-title">{task.task_name}</div>
                    <div className="day-event-slot-time">
                      {new Date(task.start_time).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(task.end_time).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {isMultiDay && (
                        <span className="day-event-badge">({daysDuration}d)</span>
                      )}
                    </div>
                    {task.task_description && (
                      <div className="day-event-slot-description">
                        {task.task_description}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
