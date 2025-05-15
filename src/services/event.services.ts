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



// Line Victor Adi Winata
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

export async function getEventAttendeesService(eventId: string, userId: number) {
  // Verify event ownership
  const event = await prisma.event.findFirst({
    where: { id: eventId, user_id: userId }
  });
  if (!event) throw new Error("Event not found or unauthorized");

  // Fetch transactions (attendees)
  return await prisma.transaction.findMany({
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
}

export async function getEventStatisticsService(
  userId: number,
  groupBy: 'year' | 'month' | 'day'
) {
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
  const events = await prisma.$queryRaw<{ period: string; event_count: number }[]>`
    SELECT
      TO_CHAR("created_at"::DATE, ${dateFormat}) AS period,
      COUNT(*)::INT AS event_count
    FROM "Event"
    WHERE "user_id" = ${userId}
    GROUP BY period
    ORDER BY period
  `;

  // Get transaction statistics
  const transactions = await prisma.$queryRaw<{ period: string; tickets_sold: number; total_revenue: number }[]>`
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
  
  const eventMap = new Map(events.map((e: any) => [e.period, e]));
  const transactionMap = new Map(transactions.map((t: any) => [t.period, t]));

  const allPeriods = new Set([
    ...events.map((e: any) => e.period),
    ...transactions.map((t: any) => t.period)
  ]);

  for (const period of Array.from(allPeriods).sort()) {
    combinedData.push({
      period,
      event_count: eventMap.get(period)?.event_count || 0,
      tickets_sold: transactionMap.get(period)?.tickets_sold || 0,
      total_revenue: transactionMap.get(period)?.total_revenue || 0
    });
  }

  return combinedData;
}