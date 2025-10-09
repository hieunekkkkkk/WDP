const AiBotController = require('../controllers/aiBot.controller');
const express = require('express');
const router = express.Router();

router.post('/', AiBotController.createBot.bind(AiBotController));
router.get('/owner/:ownerId', AiBotController.getBotsByOwner.bind(AiBotController));
router.get('/:id', AiBotController.getBotById.bind(AiBotController));
router.put('/:id', AiBotController.updateBot.bind(AiBotController));
router.delete('/:id', AiBotController.deleteBot.bind(AiBotController));


// localhost:3000/api/aibot/:botId/:message
router.get('/:botId/:message', AiBotController.testHandleMessage.bind(AiBotController));

module.exports = router;