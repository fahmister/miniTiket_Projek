"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const event_controllers_1 = require("../controllers/event.controllers");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validator_middleware_1 = __importDefault(require("../middlewares/validator.middleware"));
const event_schema_1 = require("../schemas/event.schema");
const router = (0, express_1.Router)();
router.post("/", auth_middleware_1.VerifyToken, auth_middleware_1.EOGuard, (0, validator_middleware_1.default)(event_schema_1.eventSchema), event_controllers_1.createEvent);
router.get("/", event_controllers_1.getEvents);
router.get("/:id", event_controllers_1.getEventDetails);
router.get('/ping', (req, res) => {
    res.send('PONG!');
});
exports.default = router;
