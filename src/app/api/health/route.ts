import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Never prerendered — this must hit the real database when it is called.
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();

  try {
    const userCount = await prisma.user.count();
    return NextResponse.json({
      ok: true,
      database: "connected",
      userCount,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    // Surface the reason without leaking the connection string (rule #4).
    const message = error instanceof Error ? error.message : "Unknown error";
    const safeMessage = message.replace(/postgres(?:ql)?:\/\/\S+/gi, "[redacted]");

    return NextResponse.json(
      {
        ok: false,
        database: "unreachable",
        error: safeMessage,
        latencyMs: Date.now() - startedAt,
      },
      { status: 503 },
    );
  }
}
