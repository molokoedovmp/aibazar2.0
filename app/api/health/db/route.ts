import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const now = await prisma.$queryRaw<Array<{ now: Date }>>`SELECT NOW()`;
    return NextResponse.json({ ok: true, now: now?.[0]?.now ?? null });
  } catch (error) {
    console.error("DB healthcheck failed", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


