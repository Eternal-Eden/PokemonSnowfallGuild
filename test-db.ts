import { getPrismaClient } from './api/utils/database.js';

async function testDatabase() {
  try {
    const prisma = getPrismaClient();
    await prisma.$connect();
    console.log('Database connected successfully');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testDatabase();