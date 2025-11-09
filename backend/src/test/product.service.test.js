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
it("⚠️ Nên báo lỗi nếu business_id không hợp lệ", async () => {
  const mockData = { business_id: "invalid_id", product_name: "Tea" };

  // Mock Product.save() để throw error như MongoDB/Mongoose thật
  Product.mockImplementation(() => ({
    save: jest.fn().mockRejectedValue(
      new Error("input must be a 24 character hex string, 12 byte Uint8Array, or an integer")
    ),
  }));

  // Dùng regex để test message chứa "ObjectId" hoặc "hex string"
  await expect(ProductService.createProduct(mockData))
    .rejects
    .toThrow(/ObjectId|hex string/);
});

    it("✅ Nên tạo product nếu business_id rỗng (null)", async () => {
      const mockData = { business_id: null, product_name: "Tea" };
      const mockSaved = { _id: "2", ...mockData };
      Product.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(mockSaved),
      }));
      const result = await ProductService.createProduct(mockData);
      expect(result).toEqual(mockSaved);
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

    it("✅ Nên trả về mảng rỗng nếu không có products", async () => {
      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([]),
      });
      Product.countDocuments.mockResolvedValue(0);
      const result = await ProductService.getAllProducts();
      expect(result.products).toEqual([]);
      expect(result.totalItems).toBe(0);
    });

    it("⚠️ Nên trả về phân trang chính xác khi limit > totalItems", async () => {
      Product.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockResolvedValue([{ _id: "1" }]),
      });
      Product.countDocuments.mockResolvedValue(1);
      const result = await ProductService.getAllProducts(2, 5);
      expect(result.totalPages).toBe(1);
      expect(result.currentPage).toBe(2);
      expect(result.products).toHaveLength(1);
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

    it("⚠️ Nên báo lỗi khi id không hợp lệ", async () => {
      Product.findById.mockImplementation(() => {
        throw new Error("Cast to ObjectId failed");
      });
      await expect(ProductService.getProductById("invalid_id"))
        .rejects
        .toThrow("Cast to ObjectId failed");
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

    it("⚠️ Nên báo lỗi khi update thất bại do DB", async () => {
      Product.findByIdAndUpdate.mockImplementation(() => {
        throw new Error("DB Error");
      });

      await expect(ProductService.updateProduct("1", {}))
        .rejects
        .toThrow("Error updating product: DB Error");
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

    it("⚠️ Nên báo lỗi khi DB lỗi", async () => {
      Product.findByIdAndDelete.mockImplementation(() => {
        throw new Error("DB Error");
      });

      await expect(ProductService.deleteProduct("1"))
        .rejects
        .toThrow("Error deleting product: DB Error");
    });

    it("⚠️ Nên báo lỗi khi id không hợp lệ", async () => {
      Product.findByIdAndDelete.mockImplementation(() => {
        throw new Error("Cast to ObjectId failed");
      });

      await expect(ProductService.deleteProduct("invalid_id"))
        .rejects
        .toThrow("Cast to ObjectId failed");
    });
  });
});
