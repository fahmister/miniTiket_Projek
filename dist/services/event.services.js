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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchEvents = searchEvents;
exports.getOrganizerEventsService = getOrganizerEventsService;
exports.updateEventService = updateEventService;
exports.deleteEventService = deleteEventService;
const prisma_1 = __importDefault(require("../lib/prisma"));
function searchEvents(searchTerm) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield prisma_1.default.event.findMany({
            where: {
                OR: [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { description: { contains: searchTerm, mode: "insensitive" } }
                ]
            }
        });
    });
}
// services used in EO dashboard
function getOrganizerEventsService(userId, category, location) {
    return __awaiter(this, void 0, void 0, function* () {
        return prisma_1.default.event.findMany({
            where: Object.assign(Object.assign({ user_id: userId }, (category && { category })), (location && { location })),
            include: {
                vouchers: true,
            }
        });
    });
}
function updateEventService(eventId, userId, updateData) {
    return __awaiter(this, void 0, void 0, function* () {
        // Remove non-updatable fields and relations
        const { id, created_at, user_id, organizer, vouchers } = updateData, cleanData = __rest(updateData, ["id", "created_at", "user_id", "organizer", "vouchers"]);
        // Verify event ownership first
        const existingEvent = yield prisma_1.default.event.findFirst({
            where: { id: eventId, user_id: userId }
        });
        if (!existingEvent)
            throw new Error("Event not found or unauthorized");
        const updatedData = Object.assign(Object.assign({}, updateData), { start_date: new Date(updateData.start_date), end_date: new Date(updateData.end_date) });
        return yield prisma_1.default.event.update({
            where: { id: eventId },
            data: Object.assign(Object.assign({}, cleanData), { start_date: new Date(cleanData.start_date), end_date: new Date(cleanData.end_date) })
        });
    });
}
function deleteEventService(eventId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify ownership
        const existingEvent = yield prisma_1.default.event.findFirst({
            where: { id: eventId, user_id: userId }
        });
        if (!existingEvent)
            throw new Error("Event not found or unauthorized");
        return yield prisma_1.default.event.delete({
            where: { id: eventId }
        });
    });
}
