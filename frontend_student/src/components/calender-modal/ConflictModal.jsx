import React from "react";
import "./ConflictModal.css";

export default function ConflictModal({ conflicts, onCancel, onContinue }) {
    return (
        <div className="modal-overlay" onClick={onCancel}>
            <div className="conflict-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>⚠️ Phát hiện trùng lịch</h3>
                    <button className="modal-close" onClick={onCancel}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <p className="conflict-warning">
                        Lịch của bạn bị trùng với {conflicts.length} công việc sau:
                    </p>

                    <div className="conflict-list">
                        {conflicts.map((task, idx) => (
                            <div key={idx} className="conflict-item">
                                <div className="conflict-item-header">
                                    <strong>{task.task_name}</strong>
                                    <span className={`conflict-badge conflict-badge-${task.task_mode === "hàng ngày" ? "recurring" : "longterm"}`}>
                                        {task.task_mode}
                                    </span>
                                </div>
                                <div className="conflict-item-time">
                                    🕒 {new Date(task.start_time).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        day: "2-digit",
                                        month: "2-digit",
                                    })} - {new Date(task.end_time).toLocaleString("vi-VN", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
                                </div>
                                {task.task_description && (
                                    <div className="conflict-item-desc">{task.task_description}</div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p className="conflict-question">
                        Bạn có muốn tiếp tục tạo công việc này không?
                    </p>
                </div>

                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        Hủy bỏ
                    </button>
                    <button className="btn btn-warning" onClick={onContinue}>
                        Tiếp tục tạo
                    </button>
                </div>
            </div>
        </div>
    );
}
