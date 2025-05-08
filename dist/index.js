"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const config_1 = require("./config");
const auth_router_1 = __importDefault(require("./routers/auth.router"));
const path_1 = __importDefault(require("path"));
const event_router_1 = __importDefault(require("./routers/event.router"));
const voucher_router_1 = __importDefault(require("./routers/voucher.router"));
const requestlogger_middleware_1 = require("./middlewares/requestlogger.middleware");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const port = config_1.PORT || 8080;
const app = (0, express_1.default)();
// Add these middleware before your routes
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: config_1.FE_URL,
    credentials: true
}));
app.use(express_1.default.json());
app.use(requestlogger_middleware_1.requestLogger); // Log all requests
app.get("/api", (req, res, next) => {
    console.log("entry point for API");
    next();
}, (req, res, next) => {
    res.status(200).send("This is API");
});
app.use("/events", event_router_1.default);
app.use("/auth", auth_router_1.default);
app.use("/avt", express_1.default.static(path_1.default.join(__dirname, "./public/avatar")));
app.use("/api", voucher_router_1.default); // Gunakan base path yang konsisten
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
exports.default = app;
