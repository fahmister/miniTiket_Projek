"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
// Update the import path below if your app instance is located elsewhere
const server_1 = require("../../server"); // Update this path to the actual file exporting your app instance
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const prisma = new client_1.PrismaClient();
describe('Transaction Controller', () => {
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$connect();
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma.$disconnect();
    }));
    it('should create transaction with payment proof', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockFile = path_1.default.resolve(__dirname, '../../__mocks__/test-payment.jpg');
        const response = yield (0, supertest_1.default)(server_1.app)
            .post('/api/transactions/event-123')
            .attach('paymentProof', mockFile)
            .field('quantity', 2);
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('payment_proof');
    }));
});
