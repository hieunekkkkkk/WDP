const FeedbackService = require("../services/feedback.service");
const Feedback = require("../entity/module/feedback.model");
const mongoose = require("mongoose");

jest.mock("../entity/module/feedback.model");

describe("FeedbackService", () => {
  afterEach(() => jest.clearAllMocks());

  // === CREATE ===
  describe("createFeedback()", () => {
    it("✅ Nên tạo feedback thành công", async () => {
      const mockData = {
        business_id: "507f1f77bcf86cd799439011",
        product_id: "507f191e810c19729de860ea",
        feedback_comment: "Great product!",
      };

      const savedFeedback = { _id: "1", ...mockData };

      Feedback.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(savedFeedback),
      }));

      const result = await FeedbackService.createFeedback(mockData);

      expect(result).toEqual(savedFeedback);
      expect(Feedback).toHaveBeenCalledWith({
        ...mockData,
        business_id: new mongoose.Types.ObjectId(mockData.business_id),
        product_id: new mongoose.Types.ObjectId(mockData.product_id),
      });
    });

    it("❌ Nên báo lỗi nếu save thất bại", async () => {
      Feedback.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB Error")),
      }));

      await expect(FeedbackService.createFeedback({}))
        .rejects
        .toThrow("Error creating feedback: DB Error");
    });
  });

  // === GET ALL ===
  describe("getAllFeedbacks()", () => {
    it("✅ Nên trả về tất cả feedbacks", async () => {
      const mockFeedbacks = [{ _id: "1" }, { _id: "2" }];

      // Mock chain .populate().populate()
      const mockPopulate = jest.fn().mockReturnThis();
      const mockChain = {
        populate: mockPopulate,
        then: (resolve) => resolve(mockFeedbacks),
      };
      Feedback.find.mockReturnValue(mockChain);

      const result = await FeedbackService.getAllFeedbacks();

      expect(result).toEqual(mockFeedbacks);
      expect(Feedback.find).toHaveBeenCalled();
    });

    it("❌ Nên báo lỗi khi query thất bại", async () => {
      Feedback.find.mockImplementation(() => {
        throw new Error("Failed to fetch");
      });

      await expect(FeedbackService.getAllFeedbacks())
        .rejects
        .toThrow("Error fetching feedbacks: Failed to fetch");
    });
  });

  // === GET BY ID ===
  describe("getFeedbackById()", () => {
    it("✅ Nên trả về feedback khi tồn tại", async () => {
      const mockFeedback = { _id: "1", feedback_comment: "Nice" };

      const mockPopulate = jest.fn().mockReturnThis();
      const mockChain = {
        populate: mockPopulate,
        then: (resolve) => resolve(mockFeedback),
      };
      Feedback.findById.mockReturnValue(mockChain);

      const result = await FeedbackService.getFeedbackById("507f1f77bcf86cd799439011");

      expect(result).toEqual(mockFeedback);
    });

    it("❌ Nên báo lỗi khi ID không hợp lệ", async () => {
      await expect(FeedbackService.getFeedbackById("invalid_id"))
        .rejects
        .toThrow("Error fetching feedback: Invalid feedback ID");
    });

    it("❌ Nên báo lỗi khi không tìm thấy feedback", async () => {
      const mockPopulate = jest.fn().mockReturnThis();
      const mockChain = {
        populate: mockPopulate,
        then: (resolve) => resolve(null),
      };
      Feedback.findById.mockReturnValue(mockChain);

      const validId = new mongoose.Types.ObjectId().toString();

      await expect(FeedbackService.getFeedbackById(validId))
        .rejects
        .toThrow("Feedback not found");
    });
  });

  // === UPDATE ===
  describe("updateFeedback()", () => {
    it("✅ Nên cập nhật feedback thành công", async () => {
      const updated = { _id: "1", feedback_comment: "Updated!" };
      Feedback.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await FeedbackService.updateFeedback(
        "507f1f77bcf86cd799439011",
        { feedback_comment: "Updated!" }
      );

      expect(result).toEqual(updated);
      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { feedback_comment: "Updated!" },
        { new: true, runValidators: true }
      );
    });

    it("❌ Nên báo lỗi khi ID không hợp lệ", async () => {
      await expect(FeedbackService.updateFeedback("invalid_id", {}))
        .rejects
        .toThrow("Invalid feedback ID");
    });

    it("❌ Nên báo lỗi khi không tìm thấy feedback", async () => {
      Feedback.findByIdAndUpdate.mockResolvedValue(null);

      const validId = new mongoose.Types.ObjectId().toString();

      await expect(FeedbackService.updateFeedback(validId, {}))
        .rejects
        .toThrow("Feedback not found");
    });
  });

  // === DELETE ===
  describe("deleteFeedback()", () => {
    it("✅ Nên xóa feedback thành công", async () => {
      const mockFeedback = { _id: "1" };
      Feedback.findByIdAndDelete.mockResolvedValue(mockFeedback);

      const result = await FeedbackService.deleteFeedback("507f1f77bcf86cd799439011");
      expect(result).toEqual(mockFeedback);
    });

    it("❌ Nên báo lỗi khi không tìm thấy feedback", async () => {
      Feedback.findByIdAndDelete.mockResolvedValue(null);

      const validId = new mongoose.Types.ObjectId().toString();
      await expect(FeedbackService.deleteFeedback(validId))
        .rejects
        .toThrow("Feedback not found");
    });
  });

  // === INCREMENT LIKE ===
  describe("incrementLike()", () => {
    it("✅ Nên tăng feedback_like", async () => {
      const updated = { _id: "1", feedback_like: 5 };
      Feedback.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await FeedbackService.incrementLike("507f1f77bcf86cd799439011");

      expect(result).toEqual(updated);
      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { $inc: { feedback_like: 1 } },
        { new: true }
      );
    });
  });

  // === INCREMENT DISLIKE ===
  describe("incrementDislike()", () => {
    it("✅ Nên tăng feedback_dislike", async () => {
      const updated = { _id: "1", feedback_dislike: 2 };
      Feedback.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await FeedbackService.incrementDislike("507f1f77bcf86cd799439011");

      expect(result).toEqual(updated);
      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { $inc: { feedback_dislike: 1 } },
        { new: true }
      );
    });
  });

  // === UPDATE RESPONSE ===
  describe("updateFeedbackResponse()", () => {
    it("✅ Nên cập nhật phản hồi thành công", async () => {
      const updated = { _id: "1", feedback_response: "Thanks!" };
      Feedback.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await FeedbackService.updateFeedbackResponse(
        "507f1f77bcf86cd799439011",
        "Thanks!"
      );

      expect(result).toEqual(updated);
      expect(Feedback.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        { feedback_response: "Thanks!" },
        { new: true, runValidators: true }
      );
    });
  });
});
