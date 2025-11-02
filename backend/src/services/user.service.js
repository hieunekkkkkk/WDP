// services/UserService.js
const { getClerkClient } = require('../middleware/clerkClient');

class UserService {
  async getAllUsers(page = 1, limit = 50) {
    const clerk = await getClerkClient();

    try {
      const offset = (page - 1) * limit;
      const { data: allUsers } = await clerk.users.getUserList({ limit: 100 });
      const totalItems = allUsers.length;

      const { data: userList } = await clerk.users.getUserList({ limit, offset });

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

  async getUserById(userId) {
    const clerk = await getClerkClient();

    try {
      const user = await clerk.users.getUser(userId);
      if (!user) return null;

      return {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.publicMetadata?.role || '',
        imageUrl: user.imageUrl,
        locked: user.publicMetadata?.locked || false,
      };
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    const clerk = await getClerkClient();

    try {
      const updatedUser = await clerk.users.updateUser(userId, updateData);
      return {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        role: updatedUser.publicMetadata?.role || '',
        imageUrl: updatedUser.imageUrl,
      };
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async lockUser(userId) {
    const clerk = await getClerkClient();
    try {
      const user = await clerk.users.updateUser(userId, {
        publicMetadata: { locked: true },
      });
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
      return { success: true, userId: user.id, locked: false };
    } catch (error) {
      throw new Error(`Error unlocking user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
