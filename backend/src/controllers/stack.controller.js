const StackService = require('../services/stack.service');

class StackController {

  async getAllStacks(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await StackService.getAllStacks(
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getStackById(req, res) {
    try {
      const stack = await StackService.getStackById(req.params.id);
      res.status(200).json(stack);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }


}

module.exports = new StackController();