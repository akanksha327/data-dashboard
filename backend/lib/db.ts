import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import ws from 'ws'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export function getDb() {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL

    // NOTE: This is a workaround for Neon serverless driver in Node.js
    // In production, use the WebSocket-based driver
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)

    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: ['query'],
    })
  }

  return globalForPrisma.prisma
}
