const BusinessViewService = require('../services/businessview.service');

class BusinessViewController {
    // POST /business/:id/view
    async addView(req, res) {
        try {
            const { id } = req.params;
            await BusinessViewService.addView(id);
            res.status(200).json({ message: 'View added successfully' });
        } catch (error) {
            console.error('Error in addView controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /business/:id/views?start=YYYY-MM-DD&end=YYYY-MM-DD
    async getViewsInRange(req, res) {
        try {
            const { id } = req.params;
            const { start, end } = req.query;

            if (!start || !end) {
                return res.status(400).json({ error: 'start and end date are required' });
            }

            const views = await BusinessViewService.getViewsInRange(id, start, end);
            res.status(200).json(views);
        } catch (error) {
            console.error('Error in getViewsInRange controller:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new BusinessViewController();
