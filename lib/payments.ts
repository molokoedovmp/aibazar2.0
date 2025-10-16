import { Buffer } from "buffer";

type StatusMap = "pending" | "completed" | "failed";

const shopId = process.env.YOOKASSA_SHOP_ID;
const secretKey = process.env.YOOKASSA_SECRET_KEY;

export async function fetchYookassaPayment(paymentId: string) {
  if (!shopId || !secretKey) return null;
  try {
    const res = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch {
    return null;
  }
}

export function mapYookassaStatus(status?: string | null): { appStatus: StatusMap; paid: boolean } {
  const normalized = (status || "").toLowerCase();
  switch (normalized) {
    case "succeeded":
      return { appStatus: "completed", paid: true };
    case "canceled":
      return { appStatus: "failed", paid: false };
    default:
      return { appStatus: "pending", paid: false };
  }
}
