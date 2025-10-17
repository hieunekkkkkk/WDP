// services/UserService.js
const { createClerkClient } = require('@clerk/backend');

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

class UserService {
  constructor() {
    this.clerk = clerkClient;
  }

  // Lấy danh sách người dùng có phân trang
  async getAllUsers(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      // Clerk chưa có method getCount() chính thức -> ta phải fetch trước rồi tính
      const { data: allUsers } = await this.clerk.users.getUserList({ limit: 100, offset: 0 });
      const totalItems = allUsers.length;

      const { data: userList } = await this.clerk.users.getUserList({ limit, offset });

      const users = userList.map((user) => ({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.publicMetadata?.role || '',
        imageUrl: user.imageUrl,
        locked: user.publicMetadata?.locked || false,
        publicMetadata: user.publicMetadata || {},
        privateMetadata: user.privateMetadata || {},
      }));

      return {
        users,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        totalItems,
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  // Lấy người dùng theo ID
  async getUserById(userId) {
    try {
      const user = await this.clerk.users.getUser(userId);
      if (!user) return null;

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.publicMetadata?.role || '',
        imageUrl: user.imageUrl,
        locked: user.publicMetadata?.locked || false,
        publicMetadata: user.publicMetadata || {},
        privateMetadata: user.privateMetadata || {},
      };
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  }

  // Cập nhật thông tin người dùng
  async updateUser(userId, updateData) {
    try {
      const updatedUser = await this.clerk.users.updateUser(userId, updateData);
      if (!updatedUser) return null;

      return {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        role: updatedUser.publicMetadata?.role || '',
        imageUrl: updatedUser.imageUrl,
        locked: updatedUser.publicMetadata?.locked || false,
        publicMetadata: updatedUser.publicMetadata || {},
        privateMetadata: updatedUser.privateMetadata || {},
      };
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  // "Khóa" người dùng bằng cách set metadata locked = true
  async lockUser(userId) {
    try {
      const user = await this.clerk.users.updateUser(userId, {
        publicMetadata: { locked: true },
      });

      return {
        success: true,
        userId: user.id,
        locked: user.publicMetadata.locked,
      };
    } catch (error) {
      throw new Error(`Error locking user: ${error.message}`);
    }
  }

  // "Mở khóa" người dùng bằng cách set metadata locked = false
  async unlockUser(userId) {
    try {
      const user = await this.clerk.users.updateUser(userId, {
        publicMetadata: { locked: false },
      });

      return {
        success: true,
        userId: user.id,
        locked: user.publicMetadata.locked,
      };
    } catch (error) {
      throw new Error(`Error unlocking user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
