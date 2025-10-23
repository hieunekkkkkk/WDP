// calendar.service.test.js
const CalendarService = require("../services/calendar.service");
const Calendar = require("../entity/module/calendar.model");

// Dùng jest mock để tránh gọi DB thật
jest.mock("../entity/module/calendar.model");

describe("CalendarService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createTask()", () => {
        it(" Nên báo lỗi khi task dài hạn có task_day", async () => {
            const data = {
                task_name: "Học lập trình",
                start_time: new Date(),
                end_time: new Date(),
                task_type: "học tập",
                task_mode: "dài hạn",
                task_day: "Monday",
            };

            await expect(CalendarService.createTask(data))
                .rejects
                .toThrow("Task dài hạn không được có task_day");
        });

        it(" Nên báo lỗi khi task hàng ngày không có task_day", async () => {
            const data = {
                task_name: "Tập thể dục",
                start_time: new Date(),
                end_time: new Date(),
                task_type: "thể thao",
                task_mode: "hàng ngày",
            };

            await expect(CalendarService.createTask(data))
                .rejects
                .toThrow("Task hàng ngày phải có task_day");
        });

        it(" Nên tạo task thành công khi dữ liệu hợp lệ", async () => {
            const data = {
                task_name: "Học Node.js",
                start_time: new Date(),
                end_time: new Date(),
                task_type: "học tập",
                task_mode: "hàng ngày",
                task_day: "Monday",
            };

            const mockTask = { ...data, save: jest.fn().mockResolvedValue(data) };
            Calendar.mockImplementation(() => mockTask);

            const result = await CalendarService.createTask(data);
            expect(result.task_name).toBe("Học Node.js");
            expect(mockTask.save).toHaveBeenCalledTimes(1);
        });
    });

    describe("updateTask()", () => {
        it(" Nên báo lỗi khi không tìm thấy task", async () => {
            Calendar.findById.mockResolvedValue(null);
            await expect(CalendarService.updateTask("abc123", {}))
                .rejects
                .toThrow("Task not found");
        });

        it(" Nên cập nhật task thành công khi hợp lệ", async () => {
            const existingTask = { save: jest.fn().mockResolvedValue(true) };
            Calendar.findById.mockResolvedValue(existingTask);

            const data = { task_name: "Updated task" };
            await CalendarService.updateTask("id", data);

            expect(existingTask.save).toHaveBeenCalled();
        });
    });

    describe("deleteTask()", () => {
        it(" Nên gọi findByIdAndDelete đúng tham số", async () => {
            Calendar.findByIdAndDelete.mockResolvedValue(true);
            await CalendarService.deleteTask("123");
            expect(Calendar.findByIdAndDelete).toHaveBeenCalledWith("123");
        });
    });
});
