import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { sendResetPasswordEmail } from "@/lib/mailer";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const emailRaw = (body?.email || "").toString().trim().toLowerCase();
  if (!/.+@.+\..+/.test(emailRaw)) {
    return NextResponse.json({ error: "Укажите корректный email" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: emailRaw } });
  // Не раскрываем, существует ли пользователь. Делаем вид, что всё ок.
  if (!user) return NextResponse.json({ ok: true });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 час
  // используем VerificationToken с префиксом reset:
  await prisma.verificationToken.create({
    data: { identifier: `reset:${emailRaw}`, token, expires },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const link = `${baseUrl}/auth/reset?token=${encodeURIComponent(token)}`;
  await sendResetPasswordEmail(emailRaw, link, user.name || undefined);

  return NextResponse.json({ ok: true });
}

