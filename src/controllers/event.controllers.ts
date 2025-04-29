import { Request, Response } from "express";
import prisma from "../lib/prisma";
import { IUserReqParam } from "../custom";

export async function createEvent(req: Request, res: Response) {
  try {
    const user = req.user as IUserReqParam;
    const event = await prisma.event.create({
      data: {
        ...req.body,
        user_id: user.id,
        organizer: `${user.first_name} ${user.last_name}`,
      },
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
}

export async function getEvents(req: Request, res: Response) {
  try {
    const events = await prisma.event.findMany({
      include: { users: true, reviews: true }
    });
    res.status(200).json(events);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
}