import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma";
import { IUserReqParam } from "../custom";

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as IUserReqParam;
    
    // Konversi tanggal dari string ke Date object
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
        image_url: req.body.image_url || null, // Handle optional field
        user_id: user.id, // Pastikan ini ada dan valid
        organizer: `${user.first_name} ${user.last_name}`,
      }
    });

    res.status(201).json(event);
  } catch (err) {
    next(err);
  }
}

export async function getEvents(req: Request, res: Response, next: NextFunction) {
  try {
    const events = await prisma.event.findMany({
      include: { 
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }, 
        reviews: true 
      }
    });
    res.status(200).json(events);
  } catch (err) {
    next(err);
  }
}