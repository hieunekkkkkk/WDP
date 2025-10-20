import React from "react";

/**
 * TaskCard — theo mockup + calendar.model
 * Props:
 *  - task: {
 *      _id, task_name, task_description,
 *      start_time, end_time,
 *      task_status, task_level
 *    }
 *  - statusConfig?: { [status]: { label } }
 *  - priorityConfig?: { [level]: { label, bg, fg } }
 *  - onView?: (task) => void
 *  - onEdit?: (task) => void
 *  - onChangeStatus?: (id: string, newStatus: string) => void
 */

const STATUS_ENUM = ["chưa làm", "đang làm", "đã hoàn thành", "đã huỷ"];
const LEVEL_ENUM = ["quan trọng", "bình thường", "rảnh rỗi"];

const levelStyleFallback = (level) => {
  const lv = String(level || "").toLowerCase();
  if (lv.includes("quan trọng")) return { bg: "#ffe2e2", fg: "#b42318" }; // đỏ nhạt
  if (lv.includes("rảnh rỗi")) return { bg: "#e7f9f0", fg: "#0d7a5f" }; // xanh ngọc
  return { bg: "#fff7cc", fg: "#a16207" }; // bình thường (vàng)
};

const ribbonClassFromStatus = (status) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("đang làm")) return "doing";
  if (s.includes("đã hoàn thành")) return "done";
  if (s.includes("đã huỷ")) return "cancel";
  return "todo"; // "chưa làm"
};

const formatDate = (dt) => {
  if (!dt) return "Chưa đặt";
  const d = new Date(dt);
  if (isNaN(d)) return "Chưa đặt";
  return d.toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

export default function TaskCard({
  task,
  statusConfig = {},
  priorityConfig = {},
  onView,
  onEdit,
  onChangeStatus,
}) {
  // ==== Lấy dữ liệu theo MODEL (kèm fallback tên cũ) ====
  const title = task?.task_name ?? task?.title ?? "Không tiêu đề";
  const description = task?.task_description ?? task?.description ?? "";

  const start =
    task?.start_time ??
    task?.start ??
    task?.startDate ??
    task?.timeStart ??
    null;

  const end =
    task?.end_time ?? task?.end ?? task?.endDate ?? task?.timeEnd ?? null;

  const status = task?.task_status ?? task?.status ?? STATUS_ENUM[0];

  const level =
    task?.task_level ?? task?.level ?? task?.priority ?? LEVEL_ENUM[1];

  const statusLabel = statusConfig?.[status]?.label ?? status;
  const levelCfg = priorityConfig?.[level] ?? levelStyleFallback(level);
  const levelLabel = levelCfg?.label ?? level;
  const ribbonClass = ribbonClassFromStatus(status);

  return (
    <div className="task-card">
      {/* Ribbon trạng thái (góc phải, vát cạnh) */}
      <div className={`task-status-ribbon ${ribbonClass}`}>{statusLabel}</div>

      {/* Nội dung chính */}
      <div className="task-card-content-grid">
        {/* LEFT: tiêu đề + mô tả */}
        <div className="task-card-left">
          <h3 className="task-card-header">{title}</h3>
          {description ? (
            <p className="task-card-description">{description}</p>
          ) : null}
        </div>

        {/* Divider */}
        <div className="task-card-vline" />

        {/* RIGHT: thời gian */}
        <div className="task-card-right">
          <div className="task-date-block">
            <span className="task-date-label">Bắt đầu:</span>
            <span className="task-date-value">{formatDate(start)}</span>
          </div>
          <div className="task-date-block">
            <span className="task-date-label">Kết thúc:</span>
            <span className="task-date-value">{formatDate(end)}</span>
          </div>
        </div>
      </div>

      {/* Footer: priority trái — actions phải */}
      <div className="task-card-hline" />
      <div className="task-card-footer">
        {/* LEFT: Priority chip */}
        <div>
          <span
            className="task-card-priority-tag"
            style={{ background: levelCfg.bg, color: levelCfg.fg }}
          >
            {levelLabel}
          </span>
        </div>

        {/* RIGHT: Actions + trạng thái */}
        <div className="task-card-actions">
          <button
            type="button"
            className="btn-view"
            onClick={() => onView?.(task)}
            aria-label="Xem chi tiết"
            title="Xem chi tiết"
          >
            👁️ Xem chi tiết
          </button>

          <button
            type="button"
            className="btn-edit"
            onClick={() => onEdit?.(task)}
            aria-label="Sửa"
            title="Sửa"
          >
            🛠️ Sửa
          </button>

          <div className={`status-pill status-pill--${ribbonClass}`}>
            <select
              className="status-pill__select"
              value={status}
              onChange={(e) => onChangeStatus?.(task?._id, e.target.value)}
              aria-label="Đổi trạng thái"
              title="Đổi trạng thái"
            >
              {STATUS_ENUM.map((s) => (
                <option key={s} value={s}>
                  {statusConfig?.[s]?.label || s}
                </option>
              ))}
            </select>
            <span className="status-pill__caret" aria-hidden>
              ▾
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
