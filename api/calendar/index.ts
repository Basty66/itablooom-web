import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ ok: true, cryptoVersion: crypto.constants?.OPENSSL_VERSION_CODE || 'unknown' });
}
