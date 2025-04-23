import { Router } from "express";
import { RegisterController, LoginController, UsersController } from "../controllers/auth.controller";
import { VerifyToken, EOGuard } from "../middlewares/auth.middleware";

const router = Router();

router.post("/register", RegisterController);
router.post("/login", LoginController);
router.get("/", VerifyToken, EOGuard, UsersController);


export default router;