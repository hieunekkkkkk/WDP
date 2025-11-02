// services/UserService.js
const { getClerkClient } = require('../middleware/clerkClient');
const User = require('../entity/module/user.model');

class UserService {
  // --- Dùng Mongoose thay cho Clerk ---
  async getAllUsers(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      // Lấy tổng số user trong MongoDB
      const totalItems = await User.countDocuments();

      // Lấy danh sách user theo phân trang
      const users = await User.find()
        .skip(offset)
        .limit(limit)
        .sort({ createdAt: -1 }) // sort để user mới lên đầu
        .lean();

      return {
        users,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        totalItems,
      };
    } catch (error) {
      throw new Error(`Error fetching users from MongoDB: ${error.message}`);
    }
  }

  // --- Dùng Mongoose thay cho Clerk ---
  async getUserById(userId) {
    try {
      // userId ở đây có thể là _id của Mongo hoặc clerkId tuỳ bạn dùng
      const user = await User.findOne({ clerkId: userId }).lean();

      if (!user) return null;

      return user;
    } catch (error) {
      throw new Error(`Error fetching user by ID from MongoDB: ${error.message}`);
    }
  }

  // --- Giữ nguyên logic Clerk để khoá/mở khoá ---
  async lockUser(userId) {
    const clerk = await getClerkClient();
    try {
      const user = await clerk.users.updateUser(userId, {
        publicMetadata: { locked: true },
      });

      // Cập nhật đồng bộ trong Mongo luôn
      await User.findOneAndUpdate(
        { clerkId: user.id },
        { locked: true, publicMetadata: { ...user.publicMetadata } }
      );

      return { success: true, userId: user.id, locked: true };
    } catch (error) {
      throw new Error(`Error locking user: ${error.message}`);
    }
  }

  async unlockUser(userId) {
    const clerk = await getClerkClient();
    try {
      const user = await clerk.users.updateUser(userId, {
        publicMetadata: { locked: false },
      });

      // Cập nhật đồng bộ trong Mongo luôn
      await User.findOneAndUpdate(
        { clerkId: user.id },
        { locked: false, publicMetadata: { ...user.publicMetadata } }
      );

      return { success: true, userId: user.id, locked: false };
    } catch (error) {
      throw new Error(`Error unlocking user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
