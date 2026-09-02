// app/api/chat/route.ts
import { NextResponse } from "next/server";
import { generateTherapeuticResponse } from "@/lib/services/therapist-engine";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const ipRequestMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestMap.get(ip) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  ipRequestMap.set(ip, validTimestamps);
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  validTimestamps.push(now);
  return true;
}

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { message, history } = body;
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Message exceeds maximum length of 2000 characters" },
        { status: 400 }
      );
    }

    const response = await generateTherapeuticResponse(message, history);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat route error:", error);
    return NextResponse.json(
      { error: "Internal processing error", fallback: "Take a deep breath. I am still here with you." },
      { status: 500 }
    );
  }
}

