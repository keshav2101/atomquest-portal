import { execSync } from 'child_process';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const output = execSync('npx prisma@5.13.0 db push --schema=prisma/schema.prisma --accept-data-loss', { encoding: 'utf-8' });
    res.status(200).json({ success: true, output });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message, stdout: error.stdout?.toString(), stderr: error.stderr?.toString() });
  }
}
