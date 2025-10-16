import React, { useMemo } from "react";

export default function AgendaView({ tasks, currentDate }) {
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
              {groupedTasks[dateKey].map((task) => (
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
                  <div className="agenda-event-details">{task.task_name}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  );
}
