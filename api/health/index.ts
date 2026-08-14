import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await sql`SELECT 1`;
    return res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    return res.status(500).json({ status: 'error', error: 'Database connection failed' });
  }
}
