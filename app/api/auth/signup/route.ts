import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/mailer";
import { randomBytes } from "crypto";

function isValidEmail(email: string) {
  return /.+@.+\..+/.test(email);
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = (body.name || "").toString().trim();
  const email = (body.email || "").toString().trim().toLowerCase();
  const password = (body.password || "").toString();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Заполните имя, email и пароль" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Некорректный email" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Минимальная длина пароля — 8 символов" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists?.passwordHash) {
    return NextResponse.json({ error: "Пользователь с таким email уже зарегистрирован" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);

  // Если пользователь уже есть из соц. входа — просто добавим пароль
  if (exists) {
    await prisma.user.update({ where: { id: exists.id }, data: { name: exists.name || name, passwordHash } });
    // Если почта не подтверждена — отправим письмо
    if (!exists.emailVerified) {
      const token = randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.verificationToken.create({ data: { identifier: email, token, expires } });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
      const link = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
      await sendVerificationEmail(email, link, name);
    }
    return NextResponse.json({ ok: true, created: false, verificationSent: !exists.emailVerified });
  }

  await prisma.user.create({
    data: { name, email, passwordHash },
  });

  // Создаем токен подтверждения и отправляем письмо
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await prisma.verificationToken.create({ data: { identifier: email, token, expires } });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  const link = `${baseUrl}/auth/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  await sendVerificationEmail(email, link, name);

  return NextResponse.json({ ok: true, created: true, verificationSent: true });
}
