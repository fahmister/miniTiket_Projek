import { PrismaClient } from "@prisma/client";
// Connect to the database using Prisma Client

const prisma = new PrismaClient();

//// Add this temporary debug code to check existing users
// (async () => {
// 	const allUsers = await prisma.users.findMany();
// 	console.log('Current users in database:', allUsers);
// })();

export default prisma;