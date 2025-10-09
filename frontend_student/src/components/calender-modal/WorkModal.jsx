import React from "react";
import DatePicker from "react-datepicker";

// Chips VN -> EN cho BE
const DAY_LABELS = [
  { vi: "CN", en: "SUN" },
  { vi: "T2", en: "MON" },
  { vi: "T3", en: "TUE" },
  { vi: "T4", en: "WED" },
  { vi: "T5", en: "THU" },
  { vi: "T6", en: "FRI" },
  { vi: "T7", en: "SAT" },
];

export default function WorkModal({ value, onChange, onClose, onSave, locale }) {
  const toggleDay = (enCode) => {
    const set = new Set(value.selectedDays);
    if (set.has(enCode)) set.delete(enCode);
    else set.add(enCode);
    onChange({ ...value, selectedDays: Array.from(set) });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Thêm công việc cố định</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tên công việc</label>
            <input
              className="form-input"
              value={value.task_name}
              onChange={(e) => onChange({ ...value, task_name: e.target.value })}
              placeholder="Nhập tên công việc..."
            />
          </div>

          <div className="form-group">
            <label>Mô tả (tuỳ chọn)</label>
            <textarea
              className="form-textarea"
              rows="3"
              value={value.task_description}
              onChange={(e) =>
                onChange({ ...value, task_description: e.target.value })
              }
              placeholder="Nhập mô tả công việc..."
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label>Từ</label>
              <DatePicker
                selected={value.start_time}
                onChange={(d) => onChange({ ...value, start_time: d })}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Giờ"
                dateFormat="HH:mm"
                className="form-input"
                locale={locale}
              />
            </div>
            <div className="form-group">
              <label>Đến</label>
              <DatePicker
                selected={value.end_time}
                onChange={(d) => onChange({ ...value, end_time: d })}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={5}
                timeCaption="Giờ"
                dateFormat="HH:mm"
                className="form-input"
                locale={locale}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Lặp lại vào các ngày</label>
            <div className="weekday-chips">
              {DAY_LABELS.map((d) => (
                <button
                  key={d.en}
                  type="button"
                  className={`chip ${value.selectedDays.includes(d.en) ? "active" : ""}`}
                  onClick={() => toggleDay(d.en)}
                >
                  {d.vi}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Hủy bỏ</button>
          <button className="btn btn-primary" onClick={onSave}>Lưu</button>
        </div>
      </div>
    </div>
  );
}
