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
    // --- 1. THIẾT LẬP PHẠM VI THỜI GIAN ---
    const now = new Date();
    const monthStartDate = new Date(year, month - 1, 1);
    const monthEndDate = new Date(year, month, 0, 23, 59, 59);

    // --- 2. TRUY VẤN DỮ LIỆU THÔ ---
    const tasksInMonth = await Calendar.find({
      creator_id: creatorId,
      $or: [
        { start_time: { $gte: monthStartDate, $lte: monthEndDate } },
        { end_time: { $gte: monthStartDate, $lte: monthEndDate } },
      ],
    });
    const allUserTasks = await Calendar.find({ creator_id: creatorId });

    // --- 3. TÍNH TOÁN CÁC CHỈ SỐ ---

    // A. KPIs (Các chỉ số hiệu suất chính của tháng)
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

    // B. OVERVIEW (Dữ liệu thô cho Overview Tab)
    const allActiveTasks = allUserTasks
      .filter((t) => ["chưa làm", "đang làm"].includes(t.task_status))
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    const upcomingStartTasks = allActiveTasks
      .filter((t) => new Date(t.start_time) > now)
      .slice(0, 5);
    const upcomingDeadlines = allActiveTasks
      .filter((t) => new Date(t.end_time) > now)
      .sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
      .slice(0, 5);
    const importantTasksProgress = allActiveTasks
      .filter((t) => t.task_level === "quan trọng")
      .slice(0, 5);
    const overview = {
      upcomingStartTasks,
      upcomingDeadlines,
      importantTasksProgress,
    };

    // C. SUMMARY (Dữ liệu tổng hợp cho Report Tab)
    const calculateSummary = (tasks) => {
      const total = tasks.length;
      const completed = tasks.filter(
        (t) => t.task_status === "đã hoàn thành"
      ).length;
      const successRate =
        total > 0 ? parseFloat(((completed / total) * 100).toFixed(0)) : 0;
      return { total, completed, successRate };
    };
    const todayStartDate = new Date();
    todayStartDate.setHours(0, 0, 0, 0);
    const dayOfWeek = todayStartDate.getDay();
    const weekStartDate = new Date(todayStartDate);
    weekStartDate.setDate(
      todayStartDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    );
    const tasksToday = allUserTasks.filter(
      (t) => new Date(t.end_time) >= todayStartDate
    );
    const tasksThisWeek = allUserTasks.filter(
      (t) => new Date(t.end_time) >= weekStartDate
    );
    const summary = {
      today: calculateSummary(tasksToday),
      thisWeek: calculateSummary(tasksThisWeek),
      thisMonth: {
        total: totalTasks,
        completed: completedTasks,
        successRate: completionRate,
      },
    };

    // D. CHARTS (Dữ liệu cho các biểu đồ trong Report Tab)
    const daysInMonth = new Date(year, month, 0).getDate();
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    const taskProgressTrends = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const currentDate = new Date(year, month - 1, day, 23, 59, 59);
      const tasksUpToDate = tasksInMonth.filter(
        (t) => new Date(t.end_time) <= currentDate
      );
      const total = tasksUpToDate.length;
      const completed = tasksUpToDate.filter(
        (t) => t.task_status === "đã hoàn thành"
      ).length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      return {
        date: `${day}/${month}`,
        Total: total,
        Completed: completed,
        Progress: progress,
      };
    });

    const weeklyWorkloadDistribution = Object.fromEntries(
      dayMap.map((day) => [day, { total: 0, completed: 0, incomplete: 0 }])
    );
    tasksInMonth.forEach((task) => {
      const dayName = dayMap[new Date(task.end_time).getDay()];
      weeklyWorkloadDistribution[dayName].total++;
      if (task.task_status === "đã hoàn thành") {
        weeklyWorkloadDistribution[dayName].completed++;
      }
    });
    dayMap.forEach((day) => {
      const dayData = weeklyWorkloadDistribution[day];
      dayData.incomplete = dayData.total - dayData.completed;
    });

    const last7DaysPerformance = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const tasksOnDay = allUserTasks.filter(
        (t) => new Date(t.end_time) >= startOfDay && new Date(t.end_time) <= day
      );
      const performance = calculateSummary(tasksOnDay);
      return { day: dayMap[day.getDay()], percentage: performance.successRate };
    }).reverse();

    const charts = {
      taskProgressTrends,
      weeklyWorkloadDistribution,
      last7DaysPerformance,
    };

    // E. PROGRESS (Dữ liệu cho Progress Tab)
    const progress = tasksInMonth.filter(
      (t) => t.task_status !== "đã hoàn thành"
    );

    // --- 4. TRẢ VỀ CẤU TRÚC DỮ LIỆU CUỐI CÙNG ---
    return { kpi, overview, summary, report: { charts }, progress };
  }
}

module.exports = new CalendarService();
