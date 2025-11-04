const express = require('express');
const router = express.Router();

const businessRoutes = require('./business.routes');
const productRoutes = require('./product.routes');
const paymentRoutes = require('./payment.routes');
const stackRoutes = require('./stack.routes');
const categoryRoutes = require('./category.routes');
const feedbackRoutes = require('./feedback.routes');
const userRoutes = require('./user.routes');
const aiRoutes = require('./ai.routes');
const authRoutes = require('./auth');
const businessViewRoutes = require('./businessView.routes');
const businessRevenueRoutes = require('./businessRevenue.routes');
const AiBotRoutes = require('./aibot.routes');
const conversationRoutes = require('./conversation.routes');
const BotKnowledgeRoutes = require('./botknowledge');
const calendarRoutes = require('./calendar.route');

// const redisRoutes = require('./redisRouter');
const syncClerkUsersController = require('../controllers/jobs/sync.controller');
router.post('/sync-clerk-users', syncClerkUsersController.handleSyncClerkUsers);

// Tập trung các routes
router.use('/business', businessRoutes);
router.use('/conversation', conversationRoutes);
router.use('/', businessViewRoutes);
router.use('/revenue', businessRevenueRoutes);
router.use('/product', productRoutes);
router.use('/payment', paymentRoutes);
router.use('/stack', stackRoutes);
router.use('/category', categoryRoutes);
router.use('/feedback', feedbackRoutes);
router.use('/user', userRoutes);
router.use('/ai', aiRoutes);
router.use('/auth', authRoutes);

router.use('/aibot', AiBotRoutes);
router.use('/botknowledge', BotKnowledgeRoutes);
router.use('/calendar', calendarRoutes);



// router.use('/redis', redisRoutes);

module.exports = router;

