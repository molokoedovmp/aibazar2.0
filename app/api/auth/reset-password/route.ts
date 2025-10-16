import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = (body?.token || "").toString();
  const password = (body?.password || "").toString();

  if (!token || password.length < 8) {
    return NextResponse.json({ error: "Некорректные данные" }, { status: 400 });
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record || record.expires <= new Date() || !record.identifier.startsWith("reset:")) {
    return NextResponse.json({ error: "Ссылка недействительна или устарела" }, { status: 400 });
  }

  const email = record.identifier.replace(/^reset:/, "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  await prisma.verificationToken.delete({ where: { token } });

  return NextResponse.json({ ok: true });
}

