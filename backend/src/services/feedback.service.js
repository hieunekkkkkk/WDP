const mongoose = require('mongoose');
const Feedback = require('../entity/module/feedback.model'); // Adjust path to your feedback model

class FeedbackService {
    async createFeedback(feedbackData) {
        if (feedbackData.business_id) {
            feedbackData.business_id = new mongoose.Types.ObjectId(feedbackData.business_id);
        }
        if (feedbackData.product_id) {
            feedbackData.product_id = new mongoose.Types.ObjectId(feedbackData.product_id);
        }
        try {
            const feedback = new Feedback(feedbackData);
            return await feedback.save();
        } catch (error) {
            throw new Error(`Error creating feedback: ${error.message}`);
        }
    }

    async getAllFeedbacks() {
        try {
            return await Feedback.find()
                .populate('business_id', 'business_name')
                .populate('product_id', 'product_name');
        } catch (error) {
            throw new Error(`Error fetching feedbacks: ${error.message}`);
        }
    }

    async getFeedbackById(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findById(id)
                .populate('business_id', 'business_name')
                .populate('product_id', 'product_name');
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error fetching feedback: ${error.message}`);
        }
    }


    async findFeedbackByBusinessId(businessId) {
        try {
            const feedbacks = await Feedback
                .find({ business_id: businessId, feedback_type: 'business' })
                .sort({ feedback_date: -1 });
            return feedbacks;
        } catch (error) {
            throw new Error('Error retrieving feedback by business ID: ' + error.message);
        }
    }


    async findFeedbackByProductId(productId) {
        try {
            const feedbacks = await Feedback
                .find({ product_id: productId, feedback_type: 'product' })
                .sort({ feedback_date: -1 });
            return feedbacks;
        } catch (error) {
            throw new Error('Error retrieving feedback by product ID: ' + error.message);
        }
    }

    async updateFeedback(id, updateData) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error updating feedback: ${error.message}`);
        }
    }

    async deleteFeedback(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findByIdAndDelete(id);
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error deleting feedback: ${error.message}`);
        }
    }

    async incrementLike(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findByIdAndUpdate(
                id,
                { $inc: { feedback_like: 1 } },
                { new: true }
            );
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error incrementing like: ${error.message}`);
        }
    }

    async incrementDislike(id) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findByIdAndUpdate(
                id,
                { $inc: { feedback_dislike: 1 } },
                { new: true }
            );
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error incrementing dislike: ${error.message}`);
        }
    }

    async updateFeedbackResponse(id, response) {
        try {
            if (!mongoose.Types.ObjectId.isValid(id)) {
                throw new Error('Invalid feedback ID');
            }
            const feedback = await Feedback.findByIdAndUpdate(
                id,
                { feedback_response: response },
                { new: true, runValidators: true }
            );
            if (!feedback) {
                throw new Error('Feedback not found');
            }
            return feedback;
        } catch (error) {
            throw new Error(`Error updating feedback response: ${error.message}`);
        }
    }
}


module.exports = new FeedbackService();