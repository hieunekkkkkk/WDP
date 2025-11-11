import React, { useMemo } from "react";
import { levelColor } from "../../../utils/calendar-utils";
import "../style/CalendarViews.css";

export default function AgendaView({ tasks, currentDate }) {
  const calculateTaskDuration = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diff = endDate - startDate;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) => new Date(a.start_time) - new Date(b.start_time)
    );
  }, [tasks]);

  const groupedTasks = useMemo(() => {
    return sortedTasks.reduce((acc, task) => {
      const dateKey = new Date(task.start_time).toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(task);
      return acc;
    }, {});
  }, [sortedTasks]);

  return (
    <>
      {Object.keys(groupedTasks).length === 0 ? (
        <div className="agenda-empty">Không có sự kiện nào.</div>
      ) : (
        Object.keys(groupedTasks).map((dateKey) => (
          <div key={dateKey} className="agenda-day-group">
            <div className="agenda-day-header">{dateKey}</div>
            <div className="agenda-events-list">
              {groupedTasks[dateKey].map((task) => {
                const color =
                  task.task_status === "đã huỷ"
                    ? "orange"
                    : levelColor[task.task_level] || "gray"; // Use imported levelColor
                const daysDuration = calculateTaskDuration(
                  task.start_time,
                  task.end_time
                );
                const isMultiDay = daysDuration > 1;

                return (
                  <div key={task._id} className="agenda-event-row">
                    <div className="agenda-event-time">
                      {new Date(task.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      -{" "}
                      {new Date(task.end_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    <div
                      className={`agenda-event-details agenda-event-${color}`}
                    >
                      {task.task_name}
                      {isMultiDay && (
                        <span className="event-badge">({daysDuration}d)</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </>
  );
}
