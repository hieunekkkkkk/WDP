const feedbackService = require('../services/feedback.service');

class FeedbackController {
    async createFeedback(req, res) {
        try {
            const feedback = await feedbackService.createFeedback(req.body);
            res.status(201).json({ message: 'Feedback created successfully', data: feedback });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getFeedbackByBusinessId(req, res) {
        try {
            const { businessId } = req.params;
            const feedback = await feedbackService.findFeedbackByBusinessId(businessId);

            if (!feedback || feedback.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No feedback found for this business'
                });
            }

            res.status(200).json({
                success: true,
                data: feedback
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getFeedbackByProductId(req, res) {
        try {
            const { productId } = req.params;
            const feedback = await feedbackService.findFeedbackByProductId(productId);

            if (!feedback || feedback.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No feedback found for this product'
                });
            }

            res.status(200).json({
                success: true,
                data: feedback
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllFeedbacks(req, res) {
        try {
            const feedbacks = await feedbackService.getAllFeedbacks();
            res.status(200).json({ message: 'Feedbacks retrieved successfully', data: feedbacks });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getFeedbackById(req, res) {
        try {
            const feedback = await feedbackService.getFeedbackById(req.params.id);
            res.status(200).json({ message: 'Feedback retrieved successfully', data: feedback });
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }



    async updateFeedback(req, res) {
        try {
            const feedback = await feedbackService.updateFeedback(req.params.id, req.body);
            res.status(200).json({ message: 'Feedback updated successfully', data: feedback });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteFeedback(req, res) {
        try {
            const feedback = await feedbackService.deleteFeedback(req.params.id);
            res.status(200).json({ message: 'Feedback deleted successfully', data: feedback });
        } catch (error) {
            res.status(404).json({ message: error.message });
        }
    }

    async incrementLike(req, res) {
        try {
            const feedback = await feedbackService.incrementLike(req.params.id);
            res.status(200).json({ message: 'Like incremented successfully', data: feedback });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async incrementDislike(req, res) {
        try {
            const feedback = await feedbackService.incrementDislike(req.params.id);
            res.status(200).json({ message: 'Dislike incremented successfully', data: feedback });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateFeedbackResponse(req, res) {
        try {
            const { response } = req.body;
            if (!response) {
                return res.status(400).json({ message: 'Response is required' });
            }
            const feedback = await feedbackService.updateFeedbackResponse(req.params.id, response);
            res.status(200).json({ message: 'Feedback response updated successfully', data: feedback });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }
}

// Export a single instance of the controller
module.exports = new FeedbackController();