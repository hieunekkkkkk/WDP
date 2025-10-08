const express = require("express");
const router = express.Router();
const CalendarController = require("../controllers/calendar.controller");

router.get("/", CalendarController.getAll);
router.get("/:id", CalendarController.getById);
router.post("/", CalendarController.create);
router.put("/:id", CalendarController.update);
router.delete("/:id", CalendarController.delete);

router.get("/mode/:mode", CalendarController.getByMode);
router.get("/type/:type", CalendarController.getByType);
router.get("/day/:day", CalendarController.filterByDay);
router.get("/status/:status", CalendarController.filterByStatus);
router.get("/level/:level", CalendarController.filterByLevel);

module.exports = router;
