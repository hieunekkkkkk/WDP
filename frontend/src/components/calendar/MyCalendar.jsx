import React, { useState } from "react";
import Calendar from "react-calendar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./style/MyCalendar.css";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";

export default function MyCalendar() {
  const [activeMonth, setActiveMonth] = useState(new Date(2025, 0, 1));

  // Handle date change from DatePicker
  const handleDateChange = (date) => {
    setActiveMonth(date);
  };

  // Format date for display
  const formatDate = (date) => {
    return format(date, "MMMM yyyy", { locale: vi });
  };

  // Danh sách sự kiện
  const events = {
    "2025-01-01": [{ label: "Quotes", color: "blue" }],
    "2025-01-03": [{ label: "Giveaway", color: "orange" }],
    "2025-01-04": [{ label: "Quotes", color: "blue" }],
    "2025-01-05": [{ label: "Quotes", color: "blue" }],
    "2025-01-08": [{ label: "Giveaway", color: "orange" }],
    "2025-01-10": [{ label: "Quotes", color: "blue" }],
    "2025-01-12": [{ label: "Giveaway", color: "orange" }],
    "2025-01-14": [{ label: "Quotes", color: "blue" }],
    "2025-01-16": [{ label: "Giveaway", color: "orange" }],
    "2025-01-19": [
      { label: "Quotes", color: "blue" },
      { label: "Giveaway", color: "orange" },
      { label: "Reel", color: "red" },
    ],
    "2025-01-21": [{ label: "Reel", color: "red" }],
    "2025-01-22": [{ label: "Quotes", color: "blue" }],
    "2025-01-24": [{ label: "Giveaway", color: "orange" }],
    "2025-01-25": [{ label: "Reel", color: "red" }],
    "2025-01-26": [{ label: "Quotes", color: "blue" }],
    "2025-01-28": [{ label: "Giveaway", color: "orange" }],
    "2025-01-29": [{ label: "Quotes", color: "blue" }],
  };

  // Render sự kiện cho từng ngày
  const tileContent = ({ date, view }) => {
    if (view === "month") {
      const dateStr = date.toISOString().split("T")[0];
      const dayEvents = events[dateStr] || [];
      return (
        <>
          <span className="calendar-date">{date.getDate()}</span>
          {dayEvents.length > 0 && (
            <div className="calendar-events">
              {dayEvents.map((event, idx) => (
                <span key={idx} className={`event-label ${event.color}`}>
                  {event.label}
                </span>
              ))}
            </div>
          )}
        </>
      );
    }
    return null;
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        {/* Date Picker dropdown giống Google */}
        <DatePicker
          selected={activeMonth}
          onChange={handleDateChange}
          dateFormat="MMMM yyyy"
          showMonthYearPicker
          showFullMonthYearPicker
          showTwoColumnMonthYearPicker
          className="date-picker-input"
          locale={vi}
          formatWeekDay={(day) => day.slice(0, 3)}
        />

        <div className="calendar-actions">
          <button className="calendar-btn">Thêm ghi chú</button>
          <button className="calendar-btn">Thêm nhiệm vụ</button>
        </div>
      </div>

      {/* Calendar chính */}
      <Calendar
        onChange={handleDateChange}
        value={activeMonth}
        tileContent={tileContent}
        showNeighboringMonth={false}
        minDetail="month"
        maxDetail="month"
        prev2Label={null}
        next2Label={null}
        navigationLabel={null}
        activeStartDate={activeMonth}
        onActiveStartDateChange={({ activeStartDate }) =>
          setActiveMonth(activeStartDate)
        }
      />
    </div>
  );
}
