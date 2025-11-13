// calendar.service.test.js
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const CalendarService = require("../services/calendar.service");
const Calendar = require("../entity/module/calendar.model");

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
});

afterEach(async () => {
    await Calendar.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe("CalendarService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe("createTask()", () => {
        it(" Nên báo lỗi khi task dài hạn có task_day", async () => {
            const data = {
                creator_id: new mongoose.Types.ObjectId(),
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
                creator_id: new mongoose.Types.ObjectId(),
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
                creator_id: new mongoose.Types.ObjectId(),
                task_name: "Học Node.js",
                start_time: new Date(),
                end_time: new Date(Date.now() + 3600000),
                task_type: "học tập",
                task_mode: "hàng ngày",
                task_day: "Thứ 2",
            };

            const result = await CalendarService.createTask(data);
            expect(result.task_name).toBe("Học Node.js");
            expect(result._id).toBeDefined();
        });
    });

    describe("updateTask()", () => {
        it(" Nên báo lỗi khi không tìm thấy task", async () => {
            const fakeId = new mongoose.Types.ObjectId();
            await expect(CalendarService.updateTask(fakeId, {}))
                .rejects
                .toThrow("Task not found");
        });

        it(" Nên cập nhật task thành công khi hợp lệ", async () => {
            const task = await Calendar.create({
                creator_id: new mongoose.Types.ObjectId(),
                task_name: "Old task",
                start_time: new Date(),
                end_time: new Date(Date.now() + 3600000),
                task_type: "công việc",
                task_mode: "dài hạn"
            });

            const data = { task_name: "Updated task" };
            const result = await CalendarService.updateTask(task._id, data);

            expect(result.task_name).toBe("Updated task");
        });
    });

    describe("deleteTask()", () => {
        it(" Nên gọi findByIdAndDelete đúng tham số", async () => {
            const task = await Calendar.create({
                creator_id: new mongoose.Types.ObjectId(),
                task_name: "Delete me",
                start_time: new Date(),
                end_time: new Date(Date.now() + 3600000),
                task_type: "công việc",
                task_mode: "dài hạn"
            });

            await CalendarService.deleteTask(task._id);

            const found = await Calendar.findById(task._id);
            expect(found).toBeNull();
        });
    });
});
