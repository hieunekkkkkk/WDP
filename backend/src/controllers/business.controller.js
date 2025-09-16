const BusinessService = require('../services/business.service')

class BusinessController {
  async createBusiness(req, res) {
    try {
      const business = await BusinessService.createBusiness(req.body);
      res.status(201).json(business);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllBusinesses(req, res) {
    try {
      const { page = 1, limit = 10, sort = 'Newest' } = req.query;
      const result = await BusinessService.getAllBusinesses(
        parseInt(page),
        parseInt(limit),
        sort
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAllBusinessesWithRating(req, res) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await BusinessService.getAllBusinessesWithRating(
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getBusinessById(req, res) {
    try {
      const business = await BusinessService.getBusinessById(req.params.id);
      res.status(200).json(business);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async getBusinessByCategory(req, res) {
    try {
      const { categoryId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const result = await BusinessService.getBusinessByCategory(
        categoryId,
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async updateBusiness(req, res) {
    try {
      const business = await BusinessService.updateBusiness(req.params.id, req.body);
      res.status(200).json(business);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async deleteBusiness(req, res) {
    try {
      const result = await BusinessService.deleteBusiness(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async searchBusinesses(req, res) {
    try {
      const { query, page = 1, limit = 10 } = req.query;
      const result = await BusinessService.searchBusinesses(
        query,
        parseInt(page),
        parseInt(limit)
      );
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async findNearestBusinesses(req, res) {
    try {
      const { latitude, longitude, maxDistance, categoryId } = req.query;
      if (!latitude || !longitude) {
        throw new Error('Latitude and longitude are required');
      }
      const businesses = await BusinessService.findNearestBusinesses(
        parseFloat(latitude),
        parseFloat(longitude),
        parseFloat(maxDistance),
        categoryId
      );
      res.status(200).json(businesses);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async filterBusinesses(req, res) {
    try {
      const {
        longitude,
        latitude,
        maxDistance,
        status,
        priceSort,
        ratingFilter
      } = req.body;

      const {
        page,
        limit
      } = req.query;

      // Validation
      const hasLocationParams = longitude || latitude || maxDistance;
      const hasAllLocationParams = longitude && latitude && maxDistance;

      if (hasLocationParams && !hasAllLocationParams) {
        return res.status(400).json({
          success: false,
          message: 'Longitude, latitude, and maxDistance must all be provided together'
        });
      }

      if (hasAllLocationParams) {
        if (isNaN(parseFloat(longitude)) || isNaN(parseFloat(latitude))) {
          return res.status(400).json({
            success: false,
            message: 'Longitude and latitude must be valid numbers'
          });
        }
        if (isNaN(parseInt(maxDistance)) || parseInt(maxDistance) <= 0) {
          return res.status(400).json({
            success: false,
            message: 'maxDistance must be a positive number'
          });
        }
      }

      if (status && !['true', 'false'].includes(status.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Status must be true or false'
        });
      }

      // Chuẩn hóa tham số
      const filters = {
        userLocation: longitude && latitude ? [parseFloat(longitude), parseFloat(latitude)] : null,
        maxDistance: maxDistance ? parseInt(maxDistance) : 10000,
        status: status !== undefined ? status.toLowerCase() : undefined,
        priceSort: priceSort ? priceSort.toLowerCase() : null,
        ratingFilter: ratingFilter ? ratingFilter.toLowerCase() : null,
        page: page ? parseInt(page) : 1,
        limit: limit ? parseInt(limit) : 10
      };

      // Gọi service
      const result = await BusinessService.filterBusinesses(filters);

      if (result.success) {
        return res.status(200).json({
          success: true,
          data: result.data,
          pagination: result.pagination,
          message: result.message
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`
      });
    }
  }
}

module.exports = new BusinessController();
