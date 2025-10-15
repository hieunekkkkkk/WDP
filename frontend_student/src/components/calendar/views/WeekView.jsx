import React from "react";

// Hàm helper để tính toán vị trí và kích thước của sự kiện
const calculatePosition = (event) => {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

  // Tính phút bắt đầu từ 0 (12:00 AM)
  const startMinute = start.getHours() * 60 + start.getMinutes();
  const endMinute = end.getHours() * 60 + end.getMinutes();

  // Mỗi phút tương ứng với 1px chiều cao
  const top = startMinute;
  const height = Math.max(30, endMinute - startMinute); 

  return { top: `${top}px`, height: `${height}px` };
};

// Component con cho một cột ngày
const DayColumn = ({ tasks, date }) => {
  const dayTasks = tasks.filter(
    (task) => new Date(task.start_time).toDateString() === date.toDateString()
  );

  return (
    <div className="day-column">
      {dayTasks.map((task) => (
        <div
          key={task._id}
          className="event-slot"
          style={calculatePosition(task)}
        >
          <div className="event-slot-title">{task.task_name}</div>
          <div className="event-slot-time">
            {new Date(task.start_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
      ))}
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

      <div className="event-grid-wrapper">
        <div className="week-day-headers">
          {weekDays.map((day, idx) => (
            <div key={idx} className="week-day-header">
              {day.toLocaleDateString([], { weekday: "short" })} {day.getDate()}
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
          {weekDays.map((day, idx) => (
            <DayColumn key={idx} tasks={tasks} date={day} />
          ))}
        </div>
      </div>
    </div>
  );
}
