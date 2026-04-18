'use server';

export async function create(formData: FormData) {
  const { neon } = await import('@neondatabase/serverless');

  const sql = neon(process.env.DATABASE_URL!);

  const comment = formData.get('comment') as string;

  await sql`INSERT INTO comments (comment) VALUES (${comment})`;
}