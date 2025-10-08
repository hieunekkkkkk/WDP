const mongoose = require("mongoose");

const CalendarSchema = new mongoose.Schema({
    task_name: {
        type: String,
        required: true,
    },
    task_description: {
        type: String,
        default: "",
    },

    // Dùng cho cả hai loại task
    start_time: {
        type: Date, // có thể là full datetime (task dài hạn) hoặc chỉ time (task lặp lại)
        required: true,
    },
    end_time: {
        type: Date,
        required: true,
    },

    // Loại công việc (học tập, việc làm, thể thao, ...)
    task_type: {
        type: String,
        required: true,
    },

    // Phân loại dạng task
    task_mode: {
        type: String,
        enum: ["dài hạn", "hàng ngày"],
        required: true,
    },

    task_status: {
        type: String,
        enum: ["chưa làm", "đang làm", "đã hoàn thành", "đã huỷ"],
        default: "chưa làm",
    },

    task_level: {
        type: String,
        enum: ["quan trọng", "bình thường", "rảnh rỗi"],
        default: "bình thường",
    },

    // Chỉ áp dụng nếu là hàng ngày
    task_day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: function () {
            return this.task_mode === "hàng ngày";
        },
    },
});

module.exports = mongoose.model("Calendar", CalendarSchema);
