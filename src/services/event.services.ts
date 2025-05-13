import prisma from "../lib/prisma";
export async function searchEvents(searchTerm: string) {
    return await prisma.event.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { description: { contains: searchTerm, mode: "insensitive" } }
        ]
      }
    });
  }



// services used in EO dashboard
export async function getOrganizerEventsService(userId: number, category?: string, location?: string) {
  if (!userId) throw new Error("User ID is required");

  return prisma.event.findMany({
  where: {
      user_id: userId,
      category,
      location,
    }, include: {
      vouchers: true,
      Transaction: true
    }
  });
}

export async function updateEventService(
  eventId: string, 
  userId: number, 
  updateData: any
) {
  // Verify event ownership first
  const existingEvent = await prisma.event.findFirst({
    where: { id: eventId, user_id: userId }
  });

  if (!existingEvent) throw new Error("Event not found or unauthorized");

  return await prisma.event.update({
    where: { id: eventId },
    data: updateData
  });
}

export async function deleteEventService(eventId: string, userId: number) {
  // Verify ownership
  const existingEvent = await prisma.event.findFirst({
    where: { id: eventId, user_id: userId }
  });

  if (!existingEvent) throw new Error("Event not found or unauthorized");

  return await prisma.event.delete({
    where: { id: eventId }
  });
}