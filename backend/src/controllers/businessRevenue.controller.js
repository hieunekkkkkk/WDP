const BusinessRevenueService = require('../services/businessRevenue.service');

class BusinessRevenueController {
    // POST /business/:id/revenue
    async createRevenue(req, res) {
        try {
            const { id } = req.params;
            const revenue = await BusinessRevenueService.createRevenue(id, req.body);
            res.status(201).json(revenue);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /business/:id/revenues
    async getRevenues(req, res) {
        try {
            const { id } = req.params;
            const revenues = await BusinessRevenueService.getRevenues(id);
            res.status(200).json(revenues);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // GET /business/:id/revenues/range?start=YYYY-MM-DD&end=YYYY-MM-DD
    async getRevenuesInRange(req, res) {
        try {
            const { id } = req.params;
            const { start, end } = req.query;

            if (!start || !end) {
                return res.status(400).json({ error: 'start and end date are required' });
            }

            const revenues = await BusinessRevenueService.getRevenuesInRange(id, start, end);
            res.status(200).json(revenues);
        } catch (err) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // POST /business/:id/revenues/import
    async importRevenues(req, res) {
        try {
            const { id } = req.params;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            // truyền buffer thay vì file.path
            const count = await BusinessRevenueService.importRevenuesFromExcel(id, file.buffer);
            res.status(200).json({ message: `Imported ${count} revenues successfully` });
        } catch (err) {
            console.error('Error importing revenues:', err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new BusinessRevenueController();
