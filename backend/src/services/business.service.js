const Business = require('../entity/module/business.model');
const mongoose = require('mongoose');


class BusinessService {
    // Create a new business
    async createBusiness(businessData) {
        try {
            const { business_category_id, business_stack_id } = businessData;
            const categoryId = business_category_id ? new mongoose.Types.ObjectId(business_category_id) : null;
            const stackId = business_stack_id ? new mongoose.Types.ObjectId(business_stack_id) : null;

            const business = new Business({
                ...businessData,
                business_category_id: categoryId,
                business_stack_id: stackId
            });

            return await business.save();
        } catch (error) {
            throw new Error(`Error creating business: ${error.message}`);
        }
    }

    // Get all businesses with pagination
    async getAllBusinesses(page = 1, limit = 10, sort = 'Newest') {
        try {
            const skip = (page - 1) * limit;

            let sortOption = {};
            if (sort === 'Newest') sortOption = { _id: -1 };
            else if (sort === 'Oldest') sortOption = { _id: 1 };

            const businesses = await Business.find()
                .sort(sortOption)
                .skip(skip)
                .limit(limit)
                .populate('business_category_id')
                .populate('business_stack_id');

            const total = await Business.countDocuments();

            return {
                businesses,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching businesses: ${error.message}`);
        }
    }

    async getAllBusinessesWithRating(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const businesses = await Business.find()
                .skip(skip)
                .limit(limit)
                .populate('business_category_id')
                .populate('business_stack_id')
                .select('-__v') // Loại bỏ version key
                .sort({ business_rating: -1 }); // Sắp xếp theo rating cao nhất
            const total = await Business.countDocuments();
            return {
                businesses,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching businesses with rating: ${error.message}`);
        }
    }

    // Get business by ID
    async getBusinessById(id) {
        try {
            const business = await Business.findById(id)
                .populate('business_category_id')
                .populate('business_stack_id');
            if (!business) {
                throw new Error('Business not found');
            }
            return business;
        } catch (error) {
            throw new Error(`Error fetching business: ${error.message}`);
        }
    }

    async getBusinessByCategory(categoryId, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const businesses = await Business.find({
                business_category_id: categoryId
            })
                .skip(skip)
                .limit(limit)
                .populate('business_category_id')
                .populate('business_stack_id');
            const total = await Business.countDocuments({
                business_category_id: categoryId
            });
            return {
                businesses,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error fetching businesses by category: ${error.message}`);
        }
    }

    // Update business
    async updateBusiness(id, updateData) {
        try {
            if (updateData.business_category_id) {
                updateData.business_category_id = new mongoose.Types.ObjectId(updateData.business_category_id);
            }
            if (updateData.business_stack_id) {
                updateData.business_stack_id = new mongoose.Types.ObjectId(updateData.business_stack_id);
            }
            const business = await Business.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            );
            if (!business) {
                throw new Error('Business not found');
            }
            return business;
        } catch (error) {
            throw new Error(`Error updating business: ${error.message}`);
        }
    }

    // Delete business
    async deleteBusiness(id) {
        try {
            const business = await Business.findByIdAndDelete(id);
            if (!business) {
                throw new Error('Business not found');
            }
            return { message: 'Business deleted successfully' };
        } catch (error) {
            throw new Error(`Error deleting business: ${error.message}`);
        }
    }

    // Search businesses by name (fuzzy search)
    async searchBusinesses(query, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            const businesses = await Business.find({
                business_name: { $regex: query, $options: 'i' }
            })
                .skip(skip)
                .limit(limit)
                .populate('business_category_id')
                .populate('business_stack_id');
            const total = await Business.countDocuments({
                business_name: { $regex: query, $options: 'i' }
            });
            return {
                businesses,
                totalPages: Math.ceil(total / limit),
                currentPage: page,
                totalItems: total
            };
        } catch (error) {
            throw new Error(`Error searching businesses: ${error.message}`);
        }
    }

    // Find 3 nearest businesses to given coordinates
    async findNearestBusinesses(latitude, longitude, maxDistance, categoryId) {
        try {
            // Kiểm tra và tạo index nếu cần (tùy chọn - vì đã có trong schema)
            // await Business.collection.createIndex({ business_location: '2dsphere' });

            const query = {
                business_location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                },
                business_active: 'active'
            };

            if (categoryId) {
                query.business_category_id = categoryId;
            }

            const businesses = await Business.find(query)
                .populate('business_category_id')
                .populate('business_stack_id')
                .select('-__v')
                .limit(3)
                .sort({ business_rating: -1 });

            return businesses;
        } catch (error) {
            throw new Error(`Error finding nearest businesses: ${error.message}`);
        }
    }

    async filterBusinesses({
        userLocation,
        maxDistance,
        status,
        priceSort = null,
        ratingFilter = null,
        page = 1,
        limit = 10
    }) {
        try {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;

            // Khởi tạo query cơ bản cho find()
            let query = {};

            // Xử lý status
            if (status !== undefined) {
                query.business_status = status === 'true' || status === true;
            }

            // Lọc theo vị trí bằng find()
            let businesses = [];
            if (userLocation && userLocation.length === 2) {
                businesses = await Business.find({
                    ...query,
                    business_location: {
                        $near: {
                            $geometry: {
                                type: 'Point',
                                coordinates: userLocation
                            },
                            $maxDistance: maxDistance
                        }
                    }
                })
                    .lean()
                    .exec();
            } else {
                businesses = await Business.find(query).lean().exec();
            }

            // Tạo pipeline để join và lọc thêm
            let pipeline = [
                {
                    $match: {
                        _id: { $in: businesses.map(b => b._id) }
                    }
                },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'business_id',
                        as: 'products'
                    }
                }
            ];

            // Lọc theo giá sản phẩm
            if (priceSort) {
                pipeline.push({
                    $addFields: {
                        minPrice: {
                            $min: {
                                $map: {
                                    input: '$products',
                                    as: 'product',
                                    in: { $toDouble: '$$product.product_price' }
                                }
                            }
                        },
                        maxPrice: {
                            $max: {
                                $map: {
                                    input: '$products',
                                    as: 'product',
                                    in: { $toDouble: '$$product.product_price' }
                                }
                            }
                        }
                    }
                });

                if (priceSort === 'cheapest') {
                    pipeline.push({ $sort: { minPrice: 1 } });
                } else if (priceSort === 'most_expensive') {
                    pipeline.push({ $sort: { maxPrice: -1 } });
                }
            }

            // Lọc theo rating
            if (ratingFilter) {
                if (ratingFilter === 'highest') {
                    pipeline.push({ $sort: { business_rating: -1 } });
                } else if (ratingFilter === 'lowest') {
                    pipeline.push({ $sort: { business_rating: 1 } });
                } else if (['5', '4'].includes(ratingFilter)) {
                    pipeline.push({
                        $match: { business_rating: parseInt(ratingFilter) }
                    });
                }
            }

            // Áp dụng phân trang
            pipeline.push(
                { $skip: skip },
                { $limit: limitNum }
            );

            // Đếm tổng số bản ghi
            const countPipeline = [
                {
                    $match: {
                        _id: { $in: businesses.map(b => b._id) }
                    }
                },
                { $count: 'total' }
            ];
            const [countResult] = await Business.aggregate(countPipeline);
            const totalRecords = countResult ? countResult.total : 0;

            // Thực hiện query chính
            const result = await Business.aggregate(pipeline);

            return {
                success: true,
                data: result,
                pagination: {
                    currentPage: pageNum,
                    limit: limitNum,
                    totalRecords,
                    totalPages: Math.ceil(totalRecords / limitNum)
                },
                message: 'Businesses filtered successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error filtering businesses: ${error.message}`
            };
        }
    }
}

module.exports = new BusinessService();