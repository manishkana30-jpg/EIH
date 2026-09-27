import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TELEMETRY_DIR = path.join(process.cwd(), 'data', 'telemetry');
const TELEMETRY_FILE = path.join(TELEMETRY_DIR, 'events.jsonl');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events = body.events;
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: true, count: 0 });
    }

    if (!fs.existsSync(TELEMETRY_DIR)) {
      fs.mkdirSync(TELEMETRY_DIR, { recursive: true });
    }

    const lines = events.map((ev) => JSON.stringify(ev)).join('\n') + '\n';
    fs.appendFileSync(TELEMETRY_FILE, lines, 'utf8');

    return NextResponse.json({ success: true, count: events.length });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
