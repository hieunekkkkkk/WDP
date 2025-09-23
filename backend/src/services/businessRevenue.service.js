const mongoose = require('mongoose');
const BusinessRevenue = require('../entity/module/business_revenue.model');
const xlsx = require('xlsx');

class BusinessRevenueService {
    // Tạo mới revenue
    async createRevenue(businessId, data) {
        try {
            const revenue = new BusinessRevenue({
                business_id: businessId,
                revenue_name: data.revenue_name,
                revenue_description: data.revenue_description,
                revenue_date: data.revenue_date || new Date(),
                revenue_amount: data.revenue_amount
            });
            await revenue.save();
            return revenue;
        } catch (err) {
            console.error('Error creating revenue:', err);
            throw err;
        }
    }

    // Lấy danh sách revenue theo business
    async getRevenues(businessId) {
        try {
            return await BusinessRevenue.find({ business_id: businessId }).sort({ revenue_date: -1 });
        } catch (err) {
            console.error('Error getting revenues:', err);
            throw err;
        }
    }

    // Lấy revenue trong khoảng ngày (dashboard)
    async getRevenuesInRange(businessId, startDate, endDate) {
        try {
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);

            const revenues = await BusinessRevenue.aggregate([
                {
                    $match: {
                        business_id: new mongoose.Types.ObjectId(businessId),
                        revenue_date: { $gte: start, $lte: end }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$revenue_date" }
                        },
                        totalRevenue: { $sum: "$revenue_amount" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return revenues.map(r => ({
                date: r._id,
                revenue: r.totalRevenue
            }));
        } catch (err) {
            console.error('Error getting revenues in range:', err);
            throw err;
        }
    }
    async importRevenuesFromExcel(businessId, buffer) {
        try {
            // đọc trực tiếp từ buffer
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const data = xlsx.utils.sheet_to_json(sheet);

            const revenues = data.map(row => ({
                business_id: businessId,
                revenue_name: row.revenue_name || row.name || 'Unnamed',
                revenue_description: row.revenue_description || row.description || '',
                revenue_date: row.revenue_date ? new Date(row.revenue_date) : new Date(),
                revenue_amount: Number(row.revenue_amount || row.amount || 0)
            }));

            await BusinessRevenue.insertMany(revenues);
            return revenues.length;
        } catch (err) {
            console.error('Error importing revenues:', err);
            throw err;
        }
    }
}

module.exports = new BusinessRevenueService();
