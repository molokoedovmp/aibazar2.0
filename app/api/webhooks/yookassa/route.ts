import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchYookassaPayment, mapYookassaStatus } from "@/lib/payments";

// YooKassa webhook endpoint
// Configure in YooKassa: POST https://<your-domain>/api/webhooks/yookassa
// We verify payload by fetching payment details from YooKassa API.

export async function POST(req: Request) {
  try {
    const json = await req.json().catch(() => null);
    const paymentId: string | undefined = json?.object?.id || json?.payment?.id || json?.id;
    if (!paymentId) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const payment = await fetchYookassaPayment(paymentId);
    if (!payment) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const { appStatus, paid } = mapYookassaStatus(payment.status);
    const paidYn = paid || Boolean((payment as any)?.paid);
    const credits: number = Number(payment?.metadata?.credits ?? 0) || 0;
    const purchaseId: string | undefined = payment?.metadata?.purchaseId;
    const userId: string | undefined = payment?.metadata?.userId;
    const amountRub: number = Number(payment?.amount?.value ?? 0) || 0;

    // Find purchase record by metadata.purchaseId or by paymentId
    let purchase = null as any;
    if (purchaseId) {
      purchase = await prisma.creditPurchase.findUnique({ where: { id: purchaseId } });
    }
    if (!purchase) {
      purchase = await prisma.creditPurchase.findFirst({ where: { paymentId } });
    }
    if (!purchase) {
      // Create one if webhook arrived earlier than our client got confirmation
      if (userId) {
        purchase = await prisma.creditPurchase.create({
          data: {
            userId,
            amount: credits,
            price: amountRub,
            status: appStatus,
            paymentId,
          },
        });
      } else {
        return NextResponse.json({ ok: true }, { status: 200 });
      }
    }

    // Idempotent update
    if (appStatus === "completed" || paidYn) {
      const existing = await prisma.userCredit.findFirst({ where: { userId: purchase.userId } });
      if (existing) {
        await prisma.$transaction([
          prisma.creditPurchase.update({
            where: { id: purchase.id },
            data: { status: "completed", price: amountRub, paymentId },
          }),
          prisma.userCredit.update({ where: { id: existing.id }, data: { totalCredits: { increment: credits }, plan: "basic" } }),
        ]);
      } else {
        await prisma.$transaction([
          prisma.creditPurchase.update({
            where: { id: purchase.id },
            data: { status: "completed", price: amountRub, paymentId },
          }),
          prisma.userCredit.create({ data: { userId: purchase.userId, totalCredits: credits, usedCredits: 0, plan: "basic" } }),
        ]);
      }
    } else if (appStatus === "failed") {
      await prisma.creditPurchase.update({ where: { id: purchase.id }, data: { status: "failed" } });
    } else if (appStatus === "pending") {
      await prisma.creditPurchase.update({ where: { id: purchase.id }, data: { status: "pending", paymentId } });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
