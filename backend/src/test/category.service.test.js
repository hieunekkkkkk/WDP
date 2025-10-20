// __tests__/category.service.test.js
const CategoryService = require("../services/category.service");
const Category = require("../entity/module/category.model");

// Mock toàn bộ model Category để không gọi DB thật
jest.mock("../entity/module/category.model");

describe("CategoryService", () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    // === getAllCategories ===
    describe("getAllCategories()", () => {
        it("✅ Nên trả về danh sách categories có phân trang", async () => {
            const mockCategories = [
                { _id: "1", category_name: "Food" },
                { _id: "2", category_name: "Drink" },
            ];

            // Mock các hàm Mongoose
            Category.find.mockReturnValue({
                skip: jest.fn().mockReturnThis(),
                limit: jest.fn().mockResolvedValue(mockCategories),
            });
            Category.countDocuments.mockResolvedValue(20);

            const result = await CategoryService.getAllCategories(2, 5);

            expect(Category.find).toHaveBeenCalledTimes(1);
            expect(Category.countDocuments).toHaveBeenCalledTimes(1);
            expect(result.categories.length).toBe(2);
            expect(result.totalPages).toBe(4);
            expect(result.currentPage).toBe(2);
            expect(result.totalItems).toBe(20);
        });

        it("❌ Nên báo lỗi khi query thất bại", async () => {
            Category.find.mockImplementation(() => {
                throw new Error("DB connection failed");
            });

            await expect(CategoryService.getAllCategories())
                .rejects
                .toThrow("Error fetching categories: DB connection failed");
        });
    });

    // === getCategoryById ===
    describe("getCategoryById()", () => {
        it("✅ Nên trả về category khi tồn tại", async () => {
            const mockCategory = { _id: "1", category_name: "Sport" };
            Category.findById.mockResolvedValue(mockCategory);

            const result = await CategoryService.getCategoryById("1");

            expect(Category.findById).toHaveBeenCalledWith("1");
            expect(result).toEqual(mockCategory);
        });

        it("❌ Nên báo lỗi khi category không tồn tại", async () => {
            Category.findById.mockResolvedValue(null);

            await expect(CategoryService.getCategoryById("notfound"))
                .rejects
                .toThrow("Category not found");
        });

        it("❌ Nên báo lỗi nếu truy vấn DB thất bại", async () => {
            Category.findById.mockImplementation(() => {
                throw new Error("DB crashed");
            });

            await expect(CategoryService.getCategoryById("id"))
                .rejects
                .toThrow("Error fetching category: DB crashed");
        });
    });
});
