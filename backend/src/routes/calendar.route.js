const express = require("express");
const router = express.Router();
const CalendarController = require("../controllers/calendar.controller");

router.get("/", CalendarController.getAll);

router.get("/mode/:mode", CalendarController.getByMode);
router.get("/type/:type", CalendarController.getByType);
router.get("/creator/:creatorId", CalendarController.getByCreatorId);
router.get("/day/:day", CalendarController.filterByDay);
router.get("/status/:status", CalendarController.filterByStatus);
router.get("/level/:level", CalendarController.filterByLevel);
router.get("/analytics", CalendarController.getAnalytics);
router.get("/:id", CalendarController.getById);
router.put("/:id", CalendarController.update);
router.delete("/:id", CalendarController.delete);
router.post("/", CalendarController.create);
router.post("/check", CalendarController.checkConflict);

module.exports = router;
