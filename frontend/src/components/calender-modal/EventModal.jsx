import React from "react";
import DatePicker from "react-datepicker";
import { vi } from "date-fns/locale";

export default function EventModal({ newEvent, setNewEvent, onClose, onSave }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h3>Tạo sự kiện mới</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group">
            <label>Tiêu đề sự kiện</label>
            <input
              type="text"
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              placeholder="Nhập tiêu đề..."
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label>Loại sự kiện</label>
            <select
              value={newEvent.event_type}
              onChange={(e) =>
                setNewEvent({ ...newEvent, event_type: e.target.value })
              }
              className="form-select"
            >
              <option value="Quotes">Quotes</option>
              <option value="Giveaway">Giveaway</option>
              <option value="Reel">Reel</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>Ngày sự kiện</label>
            <DatePicker
              selected={newEvent.event_date}
              onChange={(date) =>
                setNewEvent({ ...newEvent, event_date: date })
              }
              dateFormat="dd/MM/yyyy"
              locale={vi}
              className="form-input"
              minDate={new Date()}
            />
          </div>

          <div className="form-group">
            <label>Mô tả</label>
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              placeholder="Mô tả chi tiết..."
              className="form-textarea"
              rows="3"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy
          </button>
          <button
            className="btn btn-primary"
            onClick={onSave}
            disabled={!newEvent.title}
          >
            Tạo sự kiện
          </button>
        </div>
      </div>
    </div>
  );
}
