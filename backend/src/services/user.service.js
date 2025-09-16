const { Clerk } = require('@clerk/clerk-sdk-node');
const { createClerkClient } = require('@clerk/backend');

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

class UserService {
  constructor() {
    this.clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });
  }

  async getAllUsers(page = 1, limit = 50) {
    try {
      const offset = (page - 1) * limit;

      const totalItems = await this.clerk.users.getCount()

      const userList = await this.clerk.users.getUserList({ limit, offset });
      const users = userList.map(user => ({
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.publicMetadata?.role || '',
        imageUrl: user.imageUrl,
        publicMetadata: user.publicMetadata || {},
        privateMetadata: user.privateMetadata || {}
      }));


      return {
        users,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        totalItems
      };
    } catch (error) {
      throw new Error(`Error fetching users: ${error.message}`);
    }
  }

  async getUserById(userId) {
    try {
      const user = await this.clerk.users.getUser(userId);
      if (!user) return null;
      const users = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        role: user.publicMetadata?.role || '',
        imageUrl: user.imageUrl,
        publicMetadata: user.publicMetadata || {},
        privateMetadata: user.privateMetadata || {}
      };
      return {
        users
      };
    } catch (error) {
      throw new Error(`Error fetching user by ID: ${error.message}`);
    }
  }

  async updateUser(userId, updateData) {
    try {
      const updatedUser = await this.clerk.users.updateUser(userId, updateData);
      if (!updatedUser) return null;
      const users = {
        id: updatedUser.id,
        email: updatedUser.emailAddresses[0]?.emailAddress,
        fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        role: updatedUser.publicMetadata?.role || '',
        imageUrl: updatedUser.imageUrl,
        publicMetadata: updatedUser.publicMetadata || {},
        privateMetadata: updatedUser.privateMetadata || {}
      };
      return {
        users
      };
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  async lockUser(userId) {
    try {
      const user = await clerkClient.users.lockUser(userId);
       const currentMetadata = user.publicMetadata || {};
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...currentMetadata,
          locked: true
        }
      });
      return {
        success: true,
        userId: user.id,
      };
    } catch (error) {
      throw new Error(`Error locking user: ${error.message}`);
    }
  }

  async unlockUser(userId) {
    try {
      const user = await clerkClient.users.unlockUser(userId);
       const currentMetadata = user.publicMetadata || {};
      await clerkClient.users.updateUser(userId, {
        publicMetadata: {
          ...currentMetadata,
          locked: false
        }
      });
      return {
        success: true,
        userId: user.id,
      };
    } catch (error) {
      throw new Error(`Error unlocking user: ${error.message}`);
    }
  }
}

module.exports = new UserService();
