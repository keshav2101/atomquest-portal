import { NextResponse } from 'next/server';
import { execSync } from 'child_process';

export async function GET() {
  try {
    const output = execSync('npx prisma@5.13.0 db push --schema=../../../prisma/schema.prisma --accept-data-loss', { encoding: 'utf-8' });
    return NextResponse.json({ success: true, output });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stdout: error.stdout?.toString(), stderr: error.stderr?.toString() }, { status: 500 });
  }
}
