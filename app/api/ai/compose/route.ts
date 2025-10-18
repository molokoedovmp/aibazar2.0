import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const FREE_START_CREDITS = 5;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  let body: any = null;
  try {
    body = await req.json();
  } catch {}

  const userPrompt: string | undefined = body?.prompt;
  const messages: ChatMessage[] = Array.isArray(body?.messages)
    ? body.messages
    : [];
  const documentTitle: string | undefined = body?.documentTitle;
  const selection: string | undefined = body?.selection;
  const documentMarkdown: string | undefined = body?.documentMarkdown;

  const sys: ChatMessage = {
    role: "system",
    content:
      "You are a writing assistant for a notes/documents editor. Write in Russian by default. Use Markdown syntax to structure content: # headings, lists (-, 1.), and fenced code blocks (```lang). Avoid images and HTML; produce pure Markdown only. The result will be parsed to rich blocks and inserted at the cursor.",
  };

  const user: ChatMessage = {
    role: "user",
    content: [
      documentTitle ? `Документ: ${documentTitle}` : undefined,
      documentMarkdown ? `Текущие материалы документа (Markdown):\n${documentMarkdown}` : undefined,
      selection ? `Выделенный фрагмент (контекст):\n${selection}` : undefined,
      userPrompt ? `Задача: ${userPrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  } as ChatMessage;

  const payload = {
    model: body?.model || "gpt-4o-mini",
    temperature: typeof body?.temperature === "number" ? body.temperature : 0.7,
    messages: [sys, ...messages.filter(Boolean), user],
  };

  // Ensure credits and check balance (без upsert, так как userId не уникальный)
  let credit = await prisma.userCredit.findFirst({ where: { userId } });
  if (!credit) {
    credit = await prisma.userCredit.create({ data: { userId, totalCredits: FREE_START_CREDITS, usedCredits: 0, plan: "free" } });
  }
  const remaining = Math.max(0, credit.totalCredits - credit.usedCredits);
  if (remaining <= 0) {
    return NextResponse.json({ error: "Нет доступных кредитов" }, { status: 402 });
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "OpenAI request failed" },
        { status: res.status }
      );
    }
    const text: string =
      data?.choices?.[0]?.message?.content?.toString?.() ?? "";
    // Deduct a credit on success
    const existing = await prisma.userCredit.findFirst({ where: { userId } });
    if (existing) {
      await prisma.$transaction([
        prisma.userCredit.update({ where: { id: existing.id }, data: { usedCredits: { increment: 1 } } }),
        prisma.creditUsageHistory.create({ data: { userId, service: "ai-compose", amount: 1 } }),
      ]);
    }
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to call OpenAI" },
      { status: 500 }
    );
  }
}
