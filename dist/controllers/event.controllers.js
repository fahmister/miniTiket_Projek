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
exports.createEvent = createEvent;
exports.getEvents = getEvents;
exports.getEventDetails = getEventDetails;
exports.getOrganizerEventsController = getOrganizerEventsController;
exports.updateEventController = updateEventController;
exports.deleteEventController = deleteEventController;
const prisma_1 = __importDefault(require("../lib/prisma"));
const event_services_1 = require("../services/event.services");
const event_schema_1 = require("../schemas/event.schema");
function createEvent(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            // Validasi ID user
            if (!(user === null || user === void 0 ? void 0 : user.id))
                throw new Error("User ID tidak valid");
            const startDate = new Date(req.body.start_date); // Handles "YYYY-MM-DD" 
            const endDate = new Date(req.body.end_date); // Converts to UTC
            const event = yield prisma_1.default.event.create({
                data: {
                    name: req.body.name,
                    location: req.body.location,
                    start_date: startDate,
                    end_date: endDate,
                    seats: req.body.seats,
                    price: req.body.price,
                    description: req.body.description,
                    category: req.body.category,
                    image_url: req.body.image_url || null,
                    user_id: user.id, // Gunakan user_id langsung
                    organizer: `${user.first_name} ${user.last_name}`,
                }
            });
            res.status(200).send({
                message: "Add New Event Successfully",
                data: event
            });
        }
        catch (err) {
            next(err);
        }
    });
}
function getEvents(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { category, location, search } = req.query;
            const events = yield prisma_1.default.event.findMany({
                where: {
                    AND: [
                        { category: (category === null || category === void 0 ? void 0 : category.toString()) || undefined },
                        { location: (location === null || location === void 0 ? void 0 : location.toString()) || undefined },
                        {
                            OR: [
                                { name: { contains: (search === null || search === void 0 ? void 0 : search.toString()) || "" } },
                                { description: { contains: (search === null || search === void 0 ? void 0 : search.toString()) || "" } }
                            ]
                        }
                    ]
                },
                include: {
                    vouchers: true,
                    user: {
                        select: { first_name: true, last_name: true }
                    }
                }
            });
            res.status(200).json(events);
        }
        catch (err) {
            next(err);
        }
    });
}
function getEventDetails(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const eventId = req.params.id;
            const event = yield prisma_1.default.event.findUnique({
                where: { id: eventId },
                include: {
                    vouchers: true,
                    reviews: {
                        include: {
                            user: {
                                select: { first_name: true, profile_picture: true }
                            }
                        }
                    }
                }
            });
            if (!event)
                throw new Error("Event not found");
            res.status(200).json(event);
        }
        catch (err) {
            next(err);
        }
    });
}
// Event.controller for EO dashboard feature
function getOrganizerEventsController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        try {
            const user = req.user;
            if (!(user === null || user === void 0 ? void 0 : user.id))
                throw new Error("Unauthorized");
            const events = yield (0, event_services_1.getOrganizerEventsService)(user.id, (_a = req.query.category) === null || _a === void 0 ? void 0 : _a.toString(), (_b = req.query.location) === null || _b === void 0 ? void 0 : _b.toString());
            if (events.length === 0) {
                res.status(404).json({ message: "No events found" });
                return;
            }
            res.status(200).json(events);
        }
        catch (err) {
            console.error("Error fetching organizer events:", err);
            next(err);
        }
    });
}
function updateEventController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            const validatedData = event_schema_1.eventUpdateSchema.parse(req.body);
            const event = yield (0, event_services_1.updateEventService)(req.params.id, user.id, validatedData);
            res.status(200).json({
                message: "Event updated successfully",
                data: event
            });
        }
        catch (err) {
            next(err);
        }
    });
}
function deleteEventController(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = req.user;
            yield (0, event_services_1.deleteEventService)(req.params.id, user.id);
            res.status(200).json({
                message: "Event deleted successfully"
            });
        }
        catch (err) {
            next(err);
        }
    });
}
