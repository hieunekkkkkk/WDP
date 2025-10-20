import React from "react";
import{ levelColor } from "../../../utils/calendar-utils";
// Dùng lại hàm helper từ WeekView
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

  return (
    <div className="time-grid-container">
      <div className="time-labels">
        {hours.map((hour) => (
          <div
            key={hour}
            className="time-label"
            style={{ top: `${hour * 60}px` }}
          >
            {new Date(0, 0, 0, hour).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ))}
      </div>

      <div className="event-grid-container">
        {hours.map((hour) => (
          <div
            key={hour}
            className="hour-line"
            style={{ top: `${hour * 60}px` }}
          ></div>
        ))}
        {dayTasks.map((task) => {
          const color =
            task.task_status === "đã huỷ"
              ? "orange"
              : levelColor[task.task_level] || "gray";
          const daysDuration = calculateTaskDuration(task.start_time, task.end_time);
          const isMultiDay = daysDuration > 1;

          return (
            <div
              key={task._id}
              className={`event-slot calendar-event-${color}`}
              style={calculatePosition(task)}
            >
              <div className="event-slot-title">{task.task_name}</div>
              <div className="event-slot-time">
                {new Date(task.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                -
                {new Date(task.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {isMultiDay && <span className="event-badge">({daysDuration}d)</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}