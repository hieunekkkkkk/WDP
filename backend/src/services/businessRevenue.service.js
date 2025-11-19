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
      // Đọc với cellDates: true để Excel date được convert thành JS Date
      const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      console.log('Sample row from Excel:', data[0]); // Debug

      const revenues = data.map(row => {
        let revenueDate = new Date();

        // Tìm key revenue_date (có thể có space ở cuối hoặc không)
        const dateKey = Object.keys(row).find(key => key.trim() === 'revenue_date');
        const dateValue = dateKey ? row[dateKey] : null;

        // Xử lý revenue_date - format dd/mm/yyyy từ Excel
        if (dateValue) {
          if (dateValue instanceof Date && !isNaN(dateValue)) {
            // Đã là Date object hợp lệ từ cellDates: true
            revenueDate = dateValue;
          } else if (typeof dateValue === 'string') {
            // Parse string format dd/mm/yyyy hoặc dd-mm-yyyy
            const parts = dateValue.trim().split(/[\/\-]/);
            if (parts.length === 3) {
              // Format dd/mm/yyyy
              const day = parseInt(parts[0]);
              const month = parseInt(parts[1]) - 1; // JS month is 0-indexed
              const year = parseInt(parts[2]);
              revenueDate = new Date(year, month, day);
            } else {
              // Thử parse trực tiếp
              const parsed = new Date(dateValue);
              if (!isNaN(parsed.getTime())) {
                revenueDate = parsed;
              }
            }
          }
        }

        console.log(`Parsed date for ${row.revenue_name}: ${dateValue} ->`, revenueDate); // Debug

        return {
          business_id: businessId,
          revenue_name: row.revenue_name || row.name || 'Unnamed',
          revenue_description: row.revenue_description || row.description || '',
          revenue_date: revenueDate,
          revenue_amount: Number(row.revenue_amount || row.amount || 0)
        };
      });

      await BusinessRevenue.insertMany(revenues);
      return revenues.length;
    } catch (err) {
      console.error('Error importing revenues:', err);
      throw err;
    }
  }

  async deleteRevenueById(id) {
    try {
      const deletedRevenue = await BusinessRevenue.findByIdAndDelete(id);
      return deletedRevenue;
    } catch (error) {
      throw new Error('Không thể xóa doanh thu: ' + error.message);
    }
  }

  // Lấy 1 revenue theo ID
  async getRevenueById(id) {
    try {
      const revenue = await BusinessRevenue.findById(id);
      if (!revenue) {
        throw new Error('Revenue not found');
      }
      return revenue;
    } catch (err) {
      console.error('Error getting revenue by ID:', err);
      throw err;
    }
  }

  // Cập nhật revenue
  async updateRevenue(id, data) {
    try {
      const updatedRevenue = await BusinessRevenue.findByIdAndUpdate(
        id,
        { $set: data },
        { new: true, runValidators: true }
      );
      if (!updatedRevenue) {
        throw new Error('Revenue not found for update');
      }
      return updatedRevenue;
    } catch (err) {
      console.error('Error updating revenue:', err);
      throw err;
    }
  }

}


module.exports = new BusinessRevenueService();
