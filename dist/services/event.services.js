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
exports.getEventAttendeesService = getEventAttendeesService;
exports.getEventStatisticsService = getEventStatisticsService;
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
// Line Victor Adi Winata
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
function getEventAttendeesService(eventId, userId) {
    return __awaiter(this, void 0, void 0, function* () {
        // Verify event ownership
        const event = yield prisma_1.default.event.findFirst({
            where: { id: eventId, user_id: userId }
        });
        if (!event)
            throw new Error("Event not found or unauthorized");
        // Fetch transactions (attendees)
        return yield prisma_1.default.transaction.findMany({
            where: {
                event_id: eventId,
                status: 'done' // Only completed transactions
            },
            include: {
                user: {
                    select: { first_name: true, last_name: true }
                }
            }
        });
    });
}
function getEventStatisticsService(userId, groupBy) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        // Validate groupBy parameter
        if (!['year', 'month', 'day'].includes(groupBy)) {
            throw new Error('Invalid grouping parameter');
        }
        // Get date format based on grouping
        const dateFormat = {
            year: 'YYYY',
            month: 'YYYY-MM',
            day: 'YYYY-MM-DD'
        }[groupBy];
        // Get events statistics
        const events = yield prisma_1.default.$queryRaw `
    SELECT
      TO_CHAR("created_at"::DATE, ${dateFormat}) AS period,
      COUNT(*)::INT AS event_count
    FROM "Event"
    WHERE "user_id" = ${userId}
    GROUP BY period
    ORDER BY period
  `;
        // Get transaction statistics
        const transactions = yield prisma_1.default.$queryRaw `
    SELECT
      TO_CHAR(t."created_at"::DATE, ${dateFormat}) AS period,
      COALESCE(SUM(t."quantity"), 0)::INT AS tickets_sold,
      COALESCE(SUM(t."total_amount"), 0)::FLOAT AS total_revenue
    FROM "Transaction" t
    INNER JOIN "Event" e ON t."event_id" = e."id"
    WHERE e."user_id" = ${userId} AND t."status" = 'done'
    GROUP BY period
    ORDER BY period
  `;
        // Combine results
        const combinedData = [];
        const eventMap = new Map(events.map((e) => [e.period, e]));
        const transactionMap = new Map(transactions.map((t) => [t.period, t]));
        const allPeriods = new Set([
            ...events.map((e) => e.period),
            ...transactions.map((t) => t.period)
        ]);
        for (const period of Array.from(allPeriods).sort()) {
            combinedData.push({
                period,
                event_count: ((_a = eventMap.get(period)) === null || _a === void 0 ? void 0 : _a.event_count) || 0,
                tickets_sold: ((_b = transactionMap.get(period)) === null || _b === void 0 ? void 0 : _b.tickets_sold) || 0,
                total_revenue: ((_c = transactionMap.get(period)) === null || _c === void 0 ? void 0 : _c.total_revenue) || 0
            });
        }
        return combinedData;
    });
}
