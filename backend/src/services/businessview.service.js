const BusinessView = require('../entity/module/business_view.model');
const mongoose = require('mongoose');

class BusinessViewService {
    async addView(businessId) {
        try {
            const start = new Date(); start.setHours(0, 0, 0, 0);
            const end = new Date(); end.setHours(23, 59, 59, 999);

            let view = await BusinessView.findOne({
                business_id: businessId,
                view_date: { $gte: start.getTime(), $lte: end.getTime() }
            });

            if (view) view.view_count++;
            else view = new BusinessView({ business_id: businessId });

            await view.save();
        } catch (e) {
            console.error('Error adding business view:', e);
        }
    }

    async getViewsInRange(businessId, startDate, endDate) {
        try {
            const start = new Date(startDate); start.setHours(0, 0, 0, 0);
            const end = new Date(endDate); end.setHours(23, 59, 59, 999);

            const views = await BusinessView.aggregate([
                {
                    $match: {
                        business_id: new mongoose.Types.ObjectId(businessId),
                        view_date: { $gte: start.getTime(), $lte: end.getTime() }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: { $toDate: "$view_date" } // convert timestamp → Date
                            }
                        },
                        totalViews: { $sum: "$view_count" }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            return views.map(v => ({
                date: v._id,
                views: v.totalViews
            }));
        } catch (e) {
            console.error('Error getting views in range:', e);
            return [];
        }
    }

}

module.exports = new BusinessViewService();
