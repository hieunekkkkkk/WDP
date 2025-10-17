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
    if (!data.creator_id) {
      throw new Error("creater_id is required");
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
  async getByCreatorId(creatorId) {
    return await Calendar.find({ creator_id: creatorId });
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
  async getAnalyticsData(creatorId, year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    const now = new Date();
    // Lấy tất cả task của người dùng có liên quan đến tháng này
    const tasksInMonth = await Calendar.find({
      creator_id: creatorId,
      start_time: { $lte: endDate },
      end_time: { $gte: startDate },
    });
    // --- 1. TÍNH TOÁN KPI ---
    const totalTasks = tasksInMonth.length;
    const completedTasks = tasksInMonth.filter(
      (t) => t.task_status === "đã hoàn thành"
    ).length;
    const overdueTasks = tasksInMonth.filter(
      (t) => new Date(t.end_time) < now && t.task_status !== "đã hoàn thành"
    ).length;
    const incompleteTasks = totalTasks - completedTasks;
    const completionRate =
      totalTasks > 0
        ? parseFloat(((completedTasks / totalTasks) * 100).toFixed(1))
        : 0;

    const kpi = {
      totalTasks,
      completedTasks,
      incompleteTasks,
      overdueTasks,
      completionRate,
    };
    // --- 2. TÍNH TOÁN OVERVIEW ---
    const allActiveTasks = await Calendar.find({
      creator_id: creatorId,
      task_status: { $in: ["chưa làm", "đang làm"] },
    }).sort({ start_time: 1 });

    const upcomingStartTasks = allActiveTasks
      .filter((t) => new Date(t.start_time) > now)
      .slice(0, 5); // Lấy 5 task sắp bắt đầu

    const upcomingDeadlines = allActiveTasks
      .filter((t) => new Date(t.end_time) > now)
      .sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
      .slice(0, 5); // Lấy 5 task sắp hết hạn

    const importantTasksProgress = allActiveTasks
      .filter((t) => t.task_level === "quan trọng")
      .slice(0, 5);

    const overview = {
      upcomingStartTasks,
      upcomingDeadlines,
      importantTasksProgress,
    };

    const report = {};
    const progress = tasksInMonth.filter(
      (t) => t.task_status !== "đã hoàn thành"
    ); // Các task còn lại trong tháng
    return { kpi, overview, report, progress };
  }
}

module.exports = new CalendarService();
