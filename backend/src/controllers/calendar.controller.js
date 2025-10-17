const CalendarService = require("../services/calendar.service");

class CalendarController {
  async getAll(req, res) {
    try {
      const tasks = await CalendarService.getAllTasks();
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const task = await CalendarService.getTaskById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.status(200).json(task);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByCreatorId(req, res) {
    try {
      const { creatorId } = req.params;
      const tasks = await CalendarService.getByCreatorId(creatorId);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async create(req, res) {
    try {
      const newTask = await CalendarService.createTask(req.body);
      res.status(201).json(newTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async update(req, res) {
    try {
      const updatedTask = await CalendarService.updateTask(
        req.params.id,
        req.body
      );
      res.status(200).json(updatedTask);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }

  async delete(req, res) {
    try {
      const deleted = await CalendarService.deleteTask(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Task not found" });
      res.status(200).json({ message: "Deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByMode(req, res) {
    try {
      const { mode } = req.params;
      const tasks = await CalendarService.getByMode(mode);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async getByType(req, res) {
    try {
      const { type } = req.params;
      const tasks = await CalendarService.getByType(type);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async filterByDay(req, res) {
    try {
      const { day } = req.params;
      const tasks = await CalendarService.filterByDay(day);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async filterByStatus(req, res) {
    try {
      const { status } = req.params;
      const tasks = await CalendarService.filterByStatus(status);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async filterByLevel(req, res) {
    try {
      const { level } = req.params;
      const tasks = await CalendarService.filterByLevel(level);
      res.status(200).json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
  async getAnalytics(req, res) {
    try {
      const userId =
        (req.auth && req.auth.userId) ||
        req.query.userId ||
        req.headers["x-user-id"] ||
        req.body?.userId;

      if (!userId) {
        return res.status(400).json({
          message:
            "userId is required (send as query/header/body or mount auth middleware)",
        });
      }

      const { year, month } = req.query;
      if (!year || !month) {
        return res
          .status(400)
          .json({ message: "Year and month are required query parameters." });
      }

      const yearNum = parseInt(year, 10);
      const monthNum = parseInt(month, 10);

      if (Number.isNaN(yearNum) || Number.isNaN(monthNum)) {
        return res
          .status(400)
          .json({ message: "Year and month must be numbers." });
      }

      const data = await CalendarService.getAnalyticsData(
        userId,
        yearNum,
        monthNum
      );

      res.status(200).json({
        data: data || { kpi: {}, overview: {}, report: {}, progress: [] },
      });
    } catch (error) {
      console.error("[CalendarController.getAnalytics] ", error);
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new CalendarController();
