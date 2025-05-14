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
export async function getOrganizerEventsService(
  userId: number, 
  category?: string, 
  location?: string
) {
  return prisma.event.findMany({
  where: {
      user_id: userId, // Changed from incorrect ID filtering
      ...(category && { category }),
      ...(location && { location })
    }, 
    include: {
      vouchers: true,
    }
  });
}

export async function updateEventService(
  eventId: string, 
  userId: number, 
  updateData: any
) {
  // Remove non-updatable fields and relations
  const { id, created_at, user_id, organizer, vouchers, ...cleanData } = updateData;
  
  // Verify event ownership first
  const existingEvent = await prisma.event.findFirst({
    where: { id: eventId, user_id: userId }
  });

  if (!existingEvent) throw new Error("Event not found or unauthorized");

  const updatedData = {
    ...updateData,
    start_date: new Date(updateData.start_date), // Ensure DateTime
    end_date: new Date(updateData.end_date)
  };

  return await prisma.event.update({
    where: { id: eventId },
    data: {
      ...cleanData,
      start_date: new Date(cleanData.start_date),
      end_date: new Date(cleanData.end_date)
    }
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