import { Router } from "express";
import { createEvent, getEvents } from "../controllers/event.controllers";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";
import ReqValidator from "../middlewares/validator.middleware";
import { eventSchema } from "../schemas/event.schema";

const router = Router();
router.post("/", VerifyToken, EOGuard, ReqValidator(eventSchema), createEvent );
router.get("/:id", getEvents);

router.get('/ping', (req, res) => {
    res.send('PONG!');
  });

export default router;