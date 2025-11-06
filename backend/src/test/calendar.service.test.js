const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const CalendarService = require("../services/calendar.service");
const Calendar = require("../entity/module/calendar.model");

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Calendar.deleteMany();
});

describe("CalendarService", () => {
  const sampleTask = {
    creator_id: "user123",
    task_name: "Làm bài tập",
    task_description: "Toán cao cấp",
    start_time: new Date("2025-11-06T08:00:00Z"),
    end_time: new Date("2025-11-06T10:00:00Z"),
    task_type: "học tập",
    task_mode: "hàng ngày",
    task_day: "Monday",
  };

  // -------------------- CREATE --------------------
  describe("createTask", () => {
    it("should create a task successfully", async () => {
      const result = await CalendarService.createTask(sampleTask);
      expect(result).toHaveProperty("_id");
      expect(result.task_name).toBe("Làm bài tập");
    });

    it("should throw if daily task missing task_day", async () => {
      const invalidTask = { ...sampleTask, task_day: undefined };
      await expect(CalendarService.createTask(invalidTask)).rejects.toThrow("Task hàng ngày phải có task_day");
    });

    it("should throw if long-term task has task_day", async () => {
      const invalidTask = { ...sampleTask, task_mode: "dài hạn", task_day: "Monday" };
      await expect(CalendarService.createTask(invalidTask)).rejects.toThrow("Task dài hạn không được có task_day");
    });

    it("should throw if missing creator_id", async () => {
      const invalidTask = { ...sampleTask, creator_id: undefined };
      await expect(CalendarService.createTask(invalidTask)).rejects.toThrow("creater_id is required");
    });
  });

  // -------------------- READ ALL --------------------
  describe("getAllTasks", () => {
    it("should return empty array when no tasks exist", async () => {
      const result = await CalendarService.getAllTasks();
      expect(result).toEqual([]);
    });

    it("should return all created tasks", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.getAllTasks();
      expect(result.length).toBe(1);
      expect(result[0].task_name).toBe("Làm bài tập");
    });
  });

  // -------------------- GET BY ID --------------------
  describe("getTaskById", () => {
    it("should return task by ID", async () => {
      const task = await Calendar.create(sampleTask);
      const found = await CalendarService.getTaskById(task._id);
      expect(found.task_name).toBe("Làm bài tập");
    });

    it("should return null for non-existent ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await CalendarService.getTaskById(fakeId);
      expect(result).toBeNull();
    });
  });

  // -------------------- UPDATE --------------------
  describe("updateTask", () => {
    it("should update task successfully", async () => {
      const task = await Calendar.create(sampleTask);
      const updated = await CalendarService.updateTask(task._id, { task_name: "Làm bài báo cáo" });
      expect(updated.task_name).toBe("Làm bài báo cáo");
    });

    it("should throw if task not found", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(CalendarService.updateTask(fakeId, {})).rejects.toThrow("Task not found");
    });

    it("should throw if daily task missing task_day", async () => {
      const task = await Calendar.create(sampleTask);
      await expect(CalendarService.updateTask(task._id, { task_mode: "hàng ngày", task_day: undefined }))
        .rejects.toThrow("Task hàng ngày phải có task_day");
    });
  });

  // -------------------- DELETE --------------------
  describe("deleteTask", () => {
    it("should delete task successfully", async () => {
      const task = await Calendar.create(sampleTask);
      const deleted = await CalendarService.deleteTask(task._id);
      expect(deleted._id.toString()).toBe(task._id.toString());
    });

    it("should return null when deleting non-existent ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await CalendarService.deleteTask(fakeId);
      expect(result).toBeNull();
    });
  });

  // -------------------- FILTER BY CREATOR --------------------
  describe("getByCreatorId", () => {
    it("should return tasks by creator ID", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.getByCreatorId("user123");
      expect(result.length).toBe(1);
    });

    it("should return empty array when no match", async () => {
      const result = await CalendarService.getByCreatorId("unknown");
      expect(result).toEqual([]);
    });
  });

  // -------------------- FILTER BY MODE --------------------
  describe("getByMode", () => {
    it("should return tasks by mode", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.getByMode("hàng ngày");
      expect(result.length).toBe(1);
    });

    it("should return empty if mode not found", async () => {
      const result = await CalendarService.getByMode("không tồn tại");
      expect(result).toEqual([]);
    });
  });

  // -------------------- FILTER BY TYPE --------------------
  describe("getByType", () => {
    it("should return tasks by type", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.getByType("học tập");
      expect(result.length).toBe(1);
    });
  });

  // -------------------- FILTER BY STATUS --------------------
  describe("filterByStatus", () => {
    it("should return tasks by status", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.filterByStatus("chưa làm");
      expect(result.length).toBe(1);
    });
  });

  // -------------------- FILTER BY LEVEL --------------------
  describe("filterByLevel", () => {
    it("should return tasks by level", async () => {
      await Calendar.create(sampleTask);
      const result = await CalendarService.filterByLevel("bình thường");
      expect(result.length).toBe(1);
    });
  });

  // -------------------- CHECK OVERLAP --------------------
  describe("checkOverlap", () => {
    it("should detect overlapping tasks", async () => {
      await Calendar.create(sampleTask);
      const overlaps = await CalendarService.checkOverlap({
        creator_id: "user123",
        start_time: new Date("2025-11-06T09:00:00Z"),
        end_time: new Date("2025-11-06T11:00:00Z"),
      });
      expect(overlaps.length).toBe(1);
    });

    it("should throw if missing creator_id", async () => {
      await expect(CalendarService.checkOverlap({})).rejects.toThrow("creator_id is required");
    });
  });

  // -------------------- ANALYTICS --------------------
  describe("getAnalyticsData", () => {
    it("should return analytics structure", async () => {
      await Calendar.create({ ...sampleTask, task_status: "đã hoàn thành" });
      const result = await CalendarService.getAnalyticsData("user123", 2025, 11);
      expect(result).toHaveProperty("kpi");
      expect(result).toHaveProperty("overview");
      expect(result.kpi).toHaveProperty("totalTasks");
    });

    it("should handle empty data gracefully", async () => {
      const result = await CalendarService.getAnalyticsData("user999", 2025, 11);
      expect(result.kpi.totalTasks).toBe(0);
    });
  });
});
