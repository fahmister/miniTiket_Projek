"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controllers_1 = require("../controllers/event.controllers");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validator_middleware_event_1 = require("../middlewares/validator.middleware.event");
const event_schema_1 = require("../schemas/event.schema");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, (0, validator_middleware_event_1.ReqValidatorEvent)(event_schema_1.eventSchema), event_controllers_1.createEvent);
// Get All Events (Public)
router.get("/", event_controllers_1.getEvents);
// Get Event Details (Public)
router.get("/:id", event_controllers_1.getEventDetails);
router.get('/ping', (req, res) => {
    res.send('PONG!');
});
// Line Victor Adi Winata
// Router for EO Dashboard
// Add organizer-specific routes
router.get("/organizer/events", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, event_controllers_1.getOrganizerEventsController);
router.put("/:id", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, (0, validator_middleware_event_1.ReqValidatorEvent)(event_schema_1.eventSchema), event_controllers_1.updateEventController);
router.delete("/:id", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, event_controllers_1.deleteEventController);
router.get("/organizer/attendees/:eventId", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, event_controllers_1.getEventAttendeesController);
router.get("/organizer/statistics", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, event_controllers_1.getEventStatisticsController);
exports.default = router;
