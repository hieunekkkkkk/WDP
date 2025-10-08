import React, { useState, useEffect } from "react";
import { IoChevronBack, IoChevronForward, IoAdd } from "react-icons/io5";
import DatePicker from "react-datepicker";
import { enUS, vi, fr, de, ja, zhCN } from "date-fns/locale";

import "react-datepicker/dist/react-datepicker.css";
import "./style/MyCalendar.css";

import EventModal from "../calender-modal/EventModal";
import {
  getDaysInMonth,
  getEventsByDate,
  changeMonth,
} from "../../utils/calendar-utils.js";

export default function MyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    event_type: "Quotes",
    event_date: new Date(),
    description: "",
  });

  // Fake API
  useEffect(() => {
    const mockEvents = {
      "2025-01-01": [{ label: "Quotes", color: "blue" }],
      "2025-01-03": [
        { label: "Quotes", color: "blue" },
        { label: "Giveaway", color: "orange" },
      ],
      "2025-01-05": [
        { label: "Quotes", color: "blue" },
        { label: "Giveaway", color: "orange" },
      ],
    };
    setEvents(mockEvents);
  }, [currentDate]);

  const dayNames = ["MON", "TUE", "WED", "THUR", "FRI", "SAT", "SUN"];

  const handleDayClick = (day) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.fullDate);
      setShowEventModal(true);
      setNewEvent({ ...newEvent, event_date: day.fullDate });
    }
  };

  const handleCreateEvent = () => {
    const dateKey = newEvent.event_date.toISOString().split("T")[0];
    const colorMap = {
      Quotes: "blue",
      Giveaway: "orange",
      Reel: "red",
      Other: "gray",
    };

    const eventToAdd = {
      label: newEvent.title,
      color: colorMap[newEvent.event_type],
      description: newEvent.description,
    };

    setEvents((prev) => ({
      ...prev,
      [dateKey]: [...(prev[dateKey] || []), eventToAdd],
    }));

    setNewEvent({
      title: "",
      event_type: "Quotes",
      event_date: new Date(),
      description: "",
    });
    setShowEventModal(false);
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="calendar-wrapper">
      <div className="calendar-container">
        {/* Header */}
        <div className="calendar-header">
          <div className="calendar-header-left">
            <button
              onClick={() => setCurrentDate(changeMonth(currentDate, -1))}
              className="calendar-nav-btn"
            >
              <IoChevronBack />
            </button>
            <DatePicker
              selected={currentDate}
              onChange={(date) => setCurrentDate(date)}
              dateFormat="MMM, yyyy"
              showMonthYearPicker
              locale={enUS}
              className="calendar-month-picker"
            />
            <button
              onClick={() => setCurrentDate(changeMonth(currentDate, 1))}
              className="calendar-nav-btn"
            >
              <IoChevronForward />
            </button>
          </div>

          <div className="calendar-actions">
            <button
              className="calendar-btn calendar-btn-secondary"
              onClick={() => setShowEventModal(true)}
            >
              <IoAdd /> Thêm ghi chú
            </button>
            <button
              className="calendar-btn calendar-btn-primary"
              onClick={() => setShowEventModal(true)}
            >
              <IoAdd /> Thêm nhiệm vụ
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-content">
          <div className="calendar-weekdays">
            {dayNames.map((day) => (
              <div key={day} className="calendar-weekday">
                {day}
              </div>
            ))}
          </div>

          <div className="calendar-days">
            {days.map((day, index) => {
              const dayEvents = day.isCurrentMonth
                ? getEventsByDate(day.fullDate, events)
                : [];
              return (
                <div
                  key={index}
                  className={`calendar-day ${!day.isCurrentMonth ? "calendar-day-other-month" : ""
                    } ${day.isToday ? "calendar-day-today" : ""}`}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="calendar-day-number">{day.date}</div>
                  {dayEvents.length > 0 && (
                    <div className="calendar-events">
                      {dayEvents.map((event, idx) => (
                        <div
                          key={idx}
                          className={`calendar-event calendar-event-${event.color}`}
                          title={event.description}
                        >
                          {event.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Event Modal */}
      {showEventModal && (
        <EventModal
          newEvent={newEvent}
          setNewEvent={setNewEvent}
          onClose={() => setShowEventModal(false)}
          onSave={handleCreateEvent}
        />
      )}
    </div>
  );
}
