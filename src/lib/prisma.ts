import { PrismaClient } from "@prisma/client";
// Connect to the database using Prisma Client

const prisma = new PrismaClient();

export default prisma;