require('dotenv').config();
const { neon } = require('@neondatabase/serverless');

async function createTable() {
  const sql = neon(process.env.DATABASE_URL);

  await sql`CREATE TABLE IF NOT EXISTS comments (id SERIAL PRIMARY KEY, comment TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW())`;
  console.log('Comments table created or already exists');
}

createTable().catch(console.error);