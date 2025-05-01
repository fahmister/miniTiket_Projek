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