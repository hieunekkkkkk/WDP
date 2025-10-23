const BusinessRevenueService = require('../services/businessRevenue.service');

class BusinessRevenueController {
    // POST /business/:id/revenue
    async createRevenue(req, res) {
        try {
            const { id } = req.params;
            const revenue = await BusinessRevenueService.createRevenue(id, req.body);
            res.status(201).json(revenue);
        } catch (err) {
            console.error('Error in createRevenue:', err);
            if (err.name === 'ValidationError') {
                return res.status(400).json({ error: 'Validation error', details: err.message });
            }
            if (err.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid business ID format' });
            }
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }

    // GET /business/:id/revenues
    async getRevenues(req, res) {
        try {
            const { id } = req.params;
            const revenues = await BusinessRevenueService.getRevenues(id);
            res.status(200).json(revenues);
        } catch (err) {
            console.error('Error in getRevenues:', err);
            if (err.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid business ID format' });
            }
            res.status(500).json({ error: 'Internal server error', details: err.message });
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
            console.error('Error in getRevenuesInRange:', err);
            if (err.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid business ID format' });
            }
            res.status(500).json({ error: 'Internal server error', details: err.message });
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
            if (err.name === 'CastError') {
                return res.status(400).json({ error: 'Invalid business ID format' });
            }
            res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    }
}

module.exports = new BusinessRevenueController();
