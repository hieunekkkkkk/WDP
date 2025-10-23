// __tests__/product.service.test.js
const ProductService = require("../services/product.service");
const Product = require("../entity/module/product.model");
const mongoose = require("mongoose");

// Mock toàn bộ model Product
jest.mock("../entity/module/product.model");

describe("ProductService", () => {
  afterEach(() => jest.clearAllMocks());

  // === createProduct ===
  describe("createProduct()", () => {
    it("✅ Nên tạo mới product thành công", async () => {
      const mockData = {
        business_id: "507f1f77bcf86cd799439011",
        product_name: "Coffee",
      };
      const mockSaved = { _id: "1", ...mockData };

      Product.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSaved),
      }));

      const result = await ProductService.createProduct(mockData);

      expect(result).toEqual(mockSaved);
      expect(Product).toHaveBeenCalledWith({
        ...mockData,
        business_id: new mongoose.Types.ObjectId(mockData.business_id),
      });
    });

    it("❌ Nên báo lỗi nếu save thất bại", async () => {
      Product.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB Error")),
      }));

      await expect(ProductService.createProduct({}))
        .rejects
        .toThrow("Error creating product: DB Error");
    });
  });

  // === getAllProducts ===
  describe("getAllProducts()", () => {
    it("✅ Nên trả về danh sách products có phân trang", async () => {
      const mockProducts = [{ _id: "1" }, { _id: "2" }];

      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      Product.countDocuments.mockResolvedValue(20);

      const result = await ProductService.getAllProducts(2, 5);

      expect(result.products).toHaveLength(2);
      expect(result.totalPages).toBe(4);
      expect(result.currentPage).toBe(2);
      expect(result.totalItems).toBe(20);
    });

    it("❌ Nên báo lỗi nếu query thất bại", async () => {
      Product.find.mockImplementation(() => {
        throw new Error("Connection lost");
      });

      await expect(ProductService.getAllProducts())
        .rejects
        .toThrow("Error fetching products: Connection lost");
    });
  });

  // === getProductById ===
  describe("getProductById()", () => {
    it("✅ Nên trả về product khi tồn tại", async () => {
      const mockProduct = { _id: "123", product_name: "Tea" };
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProduct),
      });

      const result = await ProductService.getProductById("123");

      expect(result).toEqual(mockProduct);
    });

    it("❌ Nên báo lỗi khi product không tồn tại", async () => {
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(ProductService.getProductById("notfound"))
        .rejects
        .toThrow("Product not found");
    });
  });

  // === updateProduct ===
  describe("updateProduct()", () => {
    it("✅ Nên cập nhật product thành công", async () => {
      const updated = { _id: "1", product_name: "Updated" };
      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updated),
      });

      const result = await ProductService.updateProduct("1", { product_name: "Updated" });

      expect(result).toEqual(updated);
      expect(Product.findByIdAndUpdate).toHaveBeenCalledWith(
        "1",
        { $set: { product_name: "Updated" } },
        { new: true, runValidators: true }
      );
    });

    it("❌ Nên báo lỗi khi không tìm thấy product", async () => {
      Product.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(ProductService.updateProduct("1", {}))
        .rejects
        .toThrow("Product not found");
    });
  });

  // === deleteProduct ===
  describe("deleteProduct()", () => {
    it("✅ Nên xóa product thành công", async () => {
      Product.findByIdAndDelete.mockResolvedValue({ _id: "1" });

      const result = await ProductService.deleteProduct("1");

      expect(result).toEqual({ message: "Product deleted successfully" });
    });

    it("❌ Nên báo lỗi khi product không tồn tại", async () => {
      Product.findByIdAndDelete.mockResolvedValue(null);

      await expect(ProductService.deleteProduct("1"))
        .rejects
        .toThrow("Product not found");
    });
  });
});
