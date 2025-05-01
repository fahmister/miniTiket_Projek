import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { IUserReqParam, IEventReqParam } from "../custom";

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as IUserReqParam;
    
    // Validasi ID user
    if (!user?.id) throw new Error("User ID tidak valid");

    const startDate = new Date(req.body.start_date);
    const endDate = new Date(req.body.end_date);

    const event = await prisma.event.create({
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
  } catch (err) {
      next(err);
  }
}

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const { category, location, search } = req.query;

    const events = await prisma.event.findMany({
      where: {
        AND: [
          { category: category?.toString() || undefined },
          { location: location?.toString() || undefined },
          {
            OR: [
              { name: { contains: search?.toString() || "" } },
              { description: { contains: search?.toString() || "" } }
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
  } catch (err) {
    next(err);
  }
}

export async function getEventDetails(req: Request, res: Response, next: NextFunction) {
  try {
    const eventId = req.params.id;

    const event = await prisma.event.findUnique({
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

    if (!event) throw new Error("Event not found");
    
    res.status(200).json(event);
  } catch (err) {
    next(err);
  }
}