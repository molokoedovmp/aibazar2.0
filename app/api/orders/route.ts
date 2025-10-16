import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomUUID } from "crypto";
import { Buffer } from "buffer";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { calcRubPrice, getUsdFx } from "@/lib/pricing";
import { mapYookassaStatus } from "@/lib/payments";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { toolId, priceRub, contact, comment } = body ?? {};

  if (typeof toolId !== "string" || !toolId.trim()) {
    return NextResponse.json({ error: "toolId is required" }, { status: 400 });
  }

  const tool = await prisma.aiTool.findUnique({ where: { id: toolId } });
  if (!tool) {
    return NextResponse.json({ error: "Tool not found" }, { status: 404 });
  }

  let resolvedPrice: number | null = null;
  if (typeof priceRub === "number" && Number.isFinite(priceRub) && priceRub >= 0) {
    resolvedPrice = priceRub;
  } else if (typeof tool.startPrice === "number") {
    const fx = await getUsdFx();
    resolvedPrice = calcRubPrice(tool.startPrice, { fx });
  } else if (typeof tool.price === "number") {
    resolvedPrice = tool.price;
  }

  if (resolvedPrice === null) {
    return NextResponse.json({ error: "Unable to determine price" }, { status: 400 });
  }

  const contactInfo = {
    name: typeof contact?.name === "string" ? contact.name : null,
    email: typeof contact?.email === "string" ? contact.email : null,
    telegram: typeof contact?.telegram === "string" ? contact.telegram : null,
  };

  const details = typeof comment === "string" ? comment : "";

  const order = await prisma.aiToolOrder.create({
    data: {
      userId: session.user.id,
      serviceId: tool.id,
      amount: resolvedPrice,
      status: "pending",
      details,
      contactInfo: JSON.stringify(contactInfo),
      serviceName: tool.name,
      serviceCover: tool.coverImage,
    },
    select: {
      id: true,
      status: true,
      amount: true,
    },
  });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) {
    return NextResponse.json({ error: "Payment gateway is not configured" }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // Формируем чек (receipt) для ЮKassa
  const vatCode = Number(process.env.YOOKASSA_RECEIPT_VAT_CODE ?? "1"); // 1=20%, 2=10%, 3=0%, 4=без НДС, 5=20/120, 6=10/110
  const taxSystemCode = process.env.YOOKASSA_TAX_SYSTEM_CODE ? Number(process.env.YOOKASSA_TAX_SYSTEM_CODE) : undefined; // 1..6

  const emailForReceipt: string | undefined =
    (typeof contactInfo.email === "string" && /.+@.+\..+/.test(contactInfo.email) ? contactInfo.email : undefined) ||
    (typeof session.user.email === "string" && /.+@.+\..+/.test(session.user.email) ? session.user.email : undefined);

  const phoneForReceipt = (() => {
    const src = typeof contactInfo.telegram === "string" ? contactInfo.telegram : "";
    const digits = src.replace(/\D/g, "");
    // ЮKassa ожидает телефон в формате 10-15 цифр, без плюса. Добавляем только если похоже на номер.
    if (digits.length >= 10 && digits.length <= 15) return digits;
    return undefined;
  })();

  const itemDescription = `Оплата доступа: ${tool.name}`.slice(0, 128);
  const lineAmount = (resolvedPrice / 1).toFixed(2);

  const paymentPayload: any = {
    amount: {
      value: (resolvedPrice / 1).toFixed(2),
      currency: "RUB",
    },
    capture: true,
    description: `Оплата ${tool.name}`,
    confirmation: {
      type: "redirect",
      return_url: `${baseUrl}/account/purchases?from=payment&orderId=${order.id}`,
    },
    metadata: {
      orderId: order.id,
      toolId: tool.id,
      userId: session.user.id,
    },
    receipt: {
      // Добавляем tax_system_code, если указан в .env
      ...(typeof taxSystemCode === "number" ? { tax_system_code: taxSystemCode } : {}),
      customer: {
        ...(emailForReceipt ? { email: emailForReceipt } : {}),
        ...(phoneForReceipt ? { phone: phoneForReceipt } : {}),
        ...(contactInfo.name ? { full_name: String(contactInfo.name).slice(0, 255) } : {}),
      },
      items: [
        {
          description: itemDescription,
          quantity: "1.0",
          amount: { value: lineAmount, currency: "RUB" },
          vat_code: vatCode,
          payment_mode: "full_prepayment",
          payment_subject: "service",
        },
      ],
    },
  };

  const idempotenceKey = randomUUID();

  const paymentResponse = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
      "Idempotence-Key": idempotenceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(paymentPayload),
  });

  const paymentData = await paymentResponse.json().catch(() => null);
  if (!paymentResponse.ok) {
    return NextResponse.json({ error: paymentData?.description || "Не удалось создать оплату" }, { status: 502 });
  }

  const confirmationUrl: string | undefined = paymentData?.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    return NextResponse.json({ error: "Ссылка для оплаты не получена" }, { status: 500 });
  }

  const mapped = mapYookassaStatus(paymentData?.status);

  await prisma.aiToolOrder.update({
    where: { id: order.id },
    data: {
      status: mapped.appStatus,
      paidAt: mapped.paid ? new Date(paymentData?.paid_at ?? Date.now()) : null,
      paymentId: paymentData?.id ?? null,
      confirmationUrl,
    },
  });

  return NextResponse.json({ ok: true, orderId: order.id, confirmationUrl });
}
