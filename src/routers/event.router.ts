import { Router } from "express";
import { createEvent, 
        getEvents, 
        getEventDetails,
        getOrganizerEventsController,
        updateEventController, 
        deleteEventController,
        getEventAttendeesController,
        getEventStatisticsController
       } from "../controllers/event.controllers";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import { ReqValidatorEvent } from "../middlewares/validator.middleware.event";
import { eventSchema } from "../schemas/event.schema";

const router = Router();

router.post("/", VerifyToken, EOGuard, ReqValidatorEvent(eventSchema), createEvent );

// Get All Events (Public)
router.get("/", getEvents);

// Get Event Details (Public)
router.get("/:id", getEventDetails);

router.get('/ping', (req, res) => {
    res.send('PONG!');
  });

// Router for EO Dashboard
// Add organizer-specific routes
router.get("/organizer/events", VerifyToken, EOGuard, getOrganizerEventsController);

router.put("/:id", VerifyToken, EOGuard, ReqValidatorEvent(eventSchema), updateEventController);

router.delete("/:id", VerifyToken, EOGuard, deleteEventController);

router.get("/organizer/attendees/:eventId", VerifyToken, EOGuard, getEventAttendeesController);

router.get("/organizer/statistics", VerifyToken, EOGuard, getEventStatisticsController);

export default router;