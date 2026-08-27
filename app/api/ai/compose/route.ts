import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ComposeRequest = {
  prompt?: string;
  messages?: ChatMessage[];
  documentTitle?: string;
  selection?: string;
  documentMarkdown?: string;
  temperature?: number;
};

const FREE_START_CREDITS = 5;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!isRecord(value)) return false;
  return (
    (value.role === "system" || value.role === "user" || value.role === "assistant") &&
    typeof value.content === "string"
  );
}

function getApiError(data: unknown) {
  if (!isRecord(data) || !isRecord(data.error)) return null;
  return typeof data.error.message === "string" ? data.error.message : null;
}

function getResponseText(data: unknown) {
  if (!isRecord(data) || !Array.isArray(data.choices)) return "";
  const choice = data.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return "";
  return typeof choice.message.content === "string" ? choice.message.content : "";
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions).catch(() => null);
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "DEEPSEEK_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let body: ComposeRequest;
  try {
    body = (await request.json()) as ComposeRequest;
  } catch {
    return NextResponse.json({ error: "Некорректное тело запроса" }, { status: 400 });
  }

  const systemMessage: ChatMessage = {
    role: "system",
    content:
      "Ты помощник для редактора заметок и документов. По умолчанию отвечай на русском языке. Используй Markdown: заголовки, списки и блоки кода. Не добавляй HTML и изображения. Возвращай только текст, который можно сразу вставить в документ.",
  };

  const userMessage: ChatMessage = {
    role: "user",
    content: [
      body.documentTitle ? `Документ: ${body.documentTitle}` : undefined,
      body.documentMarkdown
        ? `Текущие материалы документа (Markdown):\n${body.documentMarkdown}`
        : undefined,
      body.selection ? `Выделенный фрагмент (контекст):\n${body.selection}` : undefined,
      body.prompt ? `Задача: ${body.prompt}` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };

  let credit = await prisma.userCredit.findFirst({ where: { userId } });
  if (!credit) {
    credit = await prisma.userCredit.create({
      data: {
        userId,
        totalCredits: FREE_START_CREDITS,
        usedCredits: 0,
        plan: "free",
      },
    });
  }

  if (Math.max(0, credit.totalCredits - credit.usedCredits) <= 0) {
    return NextResponse.json({ error: "Нет доступных кредитов" }, { status: 402 });
  }

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com").replace(/\/$/, "");
  const payload = {
    model: process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
    temperature: typeof body.temperature === "number" ? body.temperature : 0.7,
    thinking: { type: "disabled" },
    stream: false,
    messages: [
      systemMessage,
      ...(Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : []),
      userMessage,
    ],
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      return NextResponse.json(
        { error: getApiError(data) || "DeepSeek request failed" },
        { status: response.status },
      );
    }

    const text = getResponseText(data);
    if (!text) {
      return NextResponse.json({ error: "DeepSeek вернул пустой ответ" }, { status: 502 });
    }

    const existingCredit = await prisma.userCredit.findFirst({ where: { userId } });
    if (existingCredit) {
      await prisma.$transaction([
        prisma.userCredit.update({
          where: { id: existingCredit.id },
          data: { usedCredits: { increment: 1 } },
        }),
        prisma.creditUsageHistory.create({
          data: { userId, service: "ai-compose-deepseek", amount: 1 },
        }),
      ]);
    }

    return NextResponse.json({ text });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to call DeepSeek" },
      { status: 500 },
    );
  }
}
