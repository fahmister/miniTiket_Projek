"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const transaction_router_1 = __importDefault(require("./routers/transaction.router"));
const app = (0, express_1.default)();
exports.app = app;
app.use(express_1.default.json());
// Routes
app.use('/transactions', transaction_router_1.default);
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
