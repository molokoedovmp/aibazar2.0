import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";

function isEmail(v: unknown): v is string {
  return typeof v === "string" && /.+@.+\..+/.test(v);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const telegram = typeof body.telegram === "string" ? body.telegram.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const source = typeof body.source === "string" ? body.source.trim() : "unknown";

    if (!name && !email && !telegram && !message) {
      return NextResponse.json({ ok: false, error: "Заполните хотя бы одно поле" }, { status: 400 });
    }

    // сохранить в БД как feedback
    await prisma.feedbackMessage.create({
      data: {
        name: name || "—",
        email: email || "—",
        message: [message, telegram ? `Telegram/phone: ${telegram}` : null].filter(Boolean).join("\n"),
        service: source || "unknown",
      },
    });

    const to = process.env.SALES_NOTIFICATIONS_TO || process.env.NEXT_PUBLIC_NODEMAILER_USER;
    if (!to) {
      return NextResponse.json({ ok: false, error: "Notification email is not configured" }, { status: 500 });
    }

    const subject = `Новая заявка с сайта — ${source}`;
    const lines = [
      `Источник: ${source}`,
      `Имя: ${name || "—"}`,
      `Email: ${email || "—"}`,
      `Telegram/телефон: ${telegram || "—"}`,
      "",
      "Сообщение:",
      message || "—",
    ];
    const text = lines.join("\n");
    const html = `
      <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial">
        <h2>📨 Новая заявка с сайта</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #eee">Источник</td><td style="padding:8px;border:1px solid #eee">${source}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee">Имя</td><td style="padding:8px;border:1px solid #eee">${name || "—"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee">Email</td><td style="padding:8px;border:1px solid #eee">${email || "—"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #eee">Telegram/телефон</td><td style="padding:8px;border:1px solid #eee">${telegram || "—"}</td></tr>
        </table>
        ${message ? `<p style="margin-top:12px"><strong>Сообщение:</strong><br/>${message.replace(/\n/g, "<br/>")}</p>` : ""}
      </div>`;

    await sendMail({ to, subject, text, html });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("lead error", e);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

