import { Router } from "express";
import { createEvent, 
        getEvents, 
        getEventDetails,
        getOrganizerEventsController,
        updateEventController, 
        deleteEventController
       } from "../controllers/event.controllers";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { eventSchema } from "../schemas/event.schema";


const router = Router();
router.post("/", VerifyToken, EOGuard, ReqValidator(eventSchema), createEvent );
router.get("/", getEvents);
router.get("/:id", getEventDetails);

router.get('/ping', (req, res) => {
    res.send('PONG!');
  });

// Router for EO Dashboard
// Add organizer-specific routes
router.get("/", VerifyToken, EOGuard, getOrganizerEventsController);

router.put("/:id", VerifyToken, EOGuard, ReqValidator(eventSchema), updateEventController);

router.delete("/:id", VerifyToken, EOGuard, deleteEventController);

export default router;