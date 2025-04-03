import { PrismaClient } from '@prisma/client'

// PrismaClient initialization with connection pooling
const prismaClientSingleton = () => {
  return new PrismaClient({
    // Log only in non-production environments and only for errors
    log: process.env.NODE_ENV === 'development' ? ['error'] : [],
    // Add connection pooling for better performance
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// https://www.prisma.io/docs/orm/more/help-and-troubleshooting/help-articles/nextjs-prisma-client-dev-practices
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db