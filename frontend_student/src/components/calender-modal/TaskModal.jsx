import React from "react";
import DatePicker from "react-datepicker";

export default function TaskModal({
  value,
  onChange,
  onClose,
  onSave,
  statusOptions,
  levelOptions,
  locale,
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Thêm công việc mới</h3>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tên công việc:</label>
            <input
              type="text"
              className="form-input"
              value={value.task_name}
              onChange={(e) =>
                onChange({ ...value, task_name: e.target.value })
              }
              placeholder="Nhập tên công việc..."
            />
          </div>

          <div className="form-group">
            <label>Chi tiết:</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={value.task_description}
              onChange={(e) =>
                onChange({ ...value, task_description: e.target.value })
              }
              placeholder="Nhập chi tiết công việc..."
            />
          </div>

          <div className="form-group">
            <label>Mức độ quan trọng:</label>
            <select
              className="form-select"
              value={value.task_level}
              onChange={(e) =>
                onChange({ ...value, task_level: e.target.value })
              }
            >
              {levelOptions.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Trạng thái:</label>
            <select
              className="form-select"
              value={value.task_status}
              onChange={(e) =>
                onChange({ ...value, task_status: e.target.value })
              }
            >
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Thời gian bắt đầu:</label>
            <DatePicker
              selected={value.start_time}
              onChange={(d) => onChange({ ...value, start_time: d })}
              showTimeSelect
              timeIntervals={5}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={locale}
              className="form-input"
              minDate={new Date()}
              minTime={new Date()}
              maxTime={new Date(new Date().setHours(23, 55, 0, 0))}
            />
          </div>

          <div className="form-group">
            <label>Thời gian kết thúc:</label>
            <DatePicker
              selected={value.end_time}
              onChange={(d) => onChange({ ...value, end_time: d })}
              showTimeSelect
              timeIntervals={5}
              dateFormat="dd/MM/yyyy HH:mm"
              locale={locale}
              className="form-input"
              minDate={value.start_time || new Date()}
              minTime={value.start_time ? value.start_time : new Date()}
              maxTime={new Date(new Date().setHours(23, 55, 0, 0))}
            />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button className="btn btn-primary" onClick={onSave}>
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}
