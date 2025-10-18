import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { Buffer } from "buffer";

const FREE_START_CREDITS = 5;

export async function GET() {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let credit = await prisma.userCredit.findFirst({ where: { userId } });
  if (!credit) {
    credit = await prisma.userCredit.create({
      data: { userId, totalCredits: FREE_START_CREDITS, usedCredits: 0, plan: "free" },
    });
  }
  const remaining = Math.max(0, credit.totalCredits - credit.usedCredits);
  return NextResponse.json({
    plan: credit.plan,
    total: credit.totalCredits,
    used: credit.usedCredits,
    remaining,
  });
}

// POST /api/credits { packId: string }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions as any).catch(() => null);
  const userId = (session as any)?.user?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const packId = body?.packId as string | undefined;
  // Простые пакеты. Цены в RUB
  const packs: Record<string, { credits: number; priceRub: number; title: string }> = {
    starter: { credits: 50, priceRub: 299, title: "Starter 50" },
    pro: { credits: 200, priceRub: 899, title: "Pro 200" },
    team: { credits: 500, priceRub: 1990, title: "Team 500" },
  };
  let pack = packId ? packs[packId] : undefined;
  if (!pack && packId !== 'unit') return NextResponse.json({ error: "Unknown packId" }, { status: 400 });
  if (packId === 'unit') {
    // Фиксированный план: 1 кредит = 1 ₽, покупка ровно 1 кредита
    pack = { credits: 1, priceRub: 1, title: 'Unit 1' } as any;
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY || (process.env.YOOKASSA_KEY as string | undefined);
  if (!shopId || !secretKey) {
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 500 });
  }

  // Создаём запись о покупке (pending)
  const purchase = await prisma.creditPurchase.create({
    data: {
      userId,
      amount: pack.credits,
      price: pack.priceRub,
      status: "pending",
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const payload: any = {
    amount: { value: pack.priceRub.toFixed(2), currency: "RUB" },
    capture: true,
    description: `Покупка кредитов: ${pack.title}`,
    confirmation: {
      type: "redirect",
      return_url: `${baseUrl}/account/purchases?from=credits&purchaseId=${purchase.id}`,
    },
    metadata: {
      kind: "credits",
      purchaseId: purchase.id,
      userId,
      credits: pack.credits,
    },
    receipt: {
      items: [
        { description: `Кредиты (${pack.title})`, quantity: "1.0", amount: { value: pack.priceRub.toFixed(2), currency: "RUB" }, vat_code: Number(process.env.YOOKASSA_RECEIPT_VAT_CODE ?? "1"), payment_mode: "full_prepayment", payment_subject: "service" },
      ],
    },
  };

  const res = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
      "Idempotence-Key": purchase.id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    return NextResponse.json({ error: data?.description || "Не удалось создать оплату" }, { status: 502 });
  }
  const url: string | undefined = data?.confirmation?.confirmation_url;
  const paymentId: string | undefined = data?.id;
  if (paymentId) {
    await prisma.creditPurchase.update({ where: { id: purchase.id }, data: { paymentId } });
  }
  return NextResponse.json({ ok: true, confirmationUrl: url });
}
