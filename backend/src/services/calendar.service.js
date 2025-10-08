const Calendar = require("../entity/module/calendar.model");

class CalendarService {
    async getAllTasks() {
        return await Calendar.find();
    }

    async getTaskById(id) {
        return await Calendar.findById(id);
    }

    async createTask(data) {
        if (data.task_mode === "dài hạn" && data.task_day) {
            throw new Error("Task dài hạn không được có task_day");
        }

        if (data.task_mode === "hàng ngày" && !data.task_day) {
            throw new Error("Task hàng ngày phải có task_day");
        }

        const task = new Calendar(data);
        return await task.save();
    }

    async updateTask(id, data) {
        const task = await Calendar.findById(id);
        if (!task) throw new Error("Task not found");

        if (data.task_mode === "dài hạn" && data.task_day) {
            throw new Error("Task dài hạn không được có task_day");
        }

        if (data.task_mode === "hàng ngày" && !data.task_day) {
            throw new Error("Task hàng ngày phải có task_day");
        }

        Object.assign(task, data);
        return await task.save();
    }

    async deleteTask(id) {
        return await Calendar.findByIdAndDelete(id);
    }

    async getByMode(mode) {
        return await Calendar.find({ task_mode: mode });
    }

    async getByType(type) {
        return await Calendar.find({ task_type: type });
    }

    async filterByDay(day) {
        return await Calendar.find({ task_mode: "hàng ngày", task_day: day });
    }

    async filterByStatus(status) {
        return await Calendar.find({ task_status: status });
    }

    async filterByLevel(level) {
        return await Calendar.find({ task_level: level });
    }
}

module.exports = new CalendarService();
