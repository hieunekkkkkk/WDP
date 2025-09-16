const userService = require('../services/user.service');

class UserController {
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 50 } = req.query;
      const result = await userService.getAllUsers(parseInt(page), parseInt(limit));
      res.status(200).json(result);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getUser(req, res) {
    try {
      const user = await userService.getUserById(req.params.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.status(200).json(user);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async updateUser(req, res) {
    try {
      const updated = await userService.updateUser(req.params.userId, req.body);
      res.status(200).json(updated);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async lockUser(req, res) {
    try {
      const result = await userService.lockUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User locked', ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async unlockUser(req, res) {
    try {
      const result = await userService.unlockUser(req.params.userId);
      res.status(200).json({ success: true, message: 'User unlocked', ...result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

}

module.exports = new UserController();
