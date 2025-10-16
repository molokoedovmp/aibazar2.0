import nodemailer from "nodemailer";

type SendMailArgs = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
};

function resolveDefaultHostPort(email?: string) {
  const domain = (email?.split("@")[1] || "").toLowerCase();
  if (domain.includes("gmail.com") || domain.includes("googlemail.com")) {
    return { host: "smtp.gmail.com", port: 465, secure: true };
  }
  if (domain.includes("yandex.")) {
    return { host: "smtp.yandex.ru", port: 465, secure: true };
  }
  if (domain.includes("mail.ru")) {
    return { host: "smtp.mail.ru", port: 465, secure: true };
  }
  // Generic fallback
  return { host: `smtp.${domain || "localhost"}`, port: 465, secure: true };
}

function getTransport() {
  const user = process.env.SMTP_USER || process.env.NEXT_PUBLIC_NODEMAILER_USER;
  const pass = process.env.SMTP_PASSWORD || process.env.NEXT_PUBLIC_NODEMAILER_PASSWORD;
  const guessed = resolveDefaultHostPort(user);
  const host = process.env.SMTP_HOST || guessed.host;
  const port = Number(process.env.SMTP_PORT || guessed.port);
  const secure = port === 465; // 465 true, 587 false

  if (!user || !pass) {
    throw new Error("SMTP credentials are not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

export async function sendMail({ to, subject, text, html }: SendMailArgs) {
  const transporter = getTransport();
  const from = process.env.MAIL_FROM || process.env.NEXT_PUBLIC_NODEMAILER_USER!;
  try {
    await transporter.sendMail({ from, to, subject, text, html: html ?? text });
    return true;
  } catch (e) {
    console.error("sendMail error", e);
    return false;
  }
}

export type OrderEmailPayload = {
  orderId: string;
  serviceName: string;
  amountRub: number;
  paidAt: Date | null;
  paymentId?: string | null;
  confirmationUrl?: string | null;
  userEmail?: string | null;
  userName?: string | null;
  contact?: { name?: string | null; email?: string | null; telegram?: string | null } | null;
  comment?: string | null;
};

function fmtRub(n: number) {
  try {
    return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(n);
  } catch {
    return `${n.toFixed(2)} ₽`;
  }
}

function buildAdminHtml(p: OrderEmailPayload) {
  const paidAtLabel = p.paidAt ? p.paidAt.toLocaleString("ru-RU") : "—";
  const contactName = p.contact?.name || p.userName || "—";
  const contactEmail = p.contact?.email || p.userEmail || "—";
  const contactTelegram = p.contact?.telegram || "—";
  return `
  <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial">
    <h2>✅ Получена оплата</h2>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #eee">🧾 Заказ</td><td style="padding:8px;border:1px solid #eee">${p.orderId}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">🛠 Сервис</td><td style="padding:8px;border:1px solid #eee">${p.serviceName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">💰 Сумма</td><td style="padding:8px;border:1px solid #eee">${fmtRub(p.amountRub)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">📅 Дата</td><td style="padding:8px;border:1px solid #eee">${paidAtLabel}</td></tr>
      ${p.paymentId ? `<tr><td style="padding:8px;border:1px solid #eee">🧩 ID платежа</td><td style="padding:8px;border:1px solid #eee">${p.paymentId}</td></tr>` : ""}
      ${p.confirmationUrl ? `<tr><td style="padding:8px;border:1px solid #eee">🔗 YooKassa</td><td style="padding:8px;border:1px solid #eee"><a href="${p.confirmationUrl}">${p.confirmationUrl}</a></td></tr>` : ""}
    </table>
    <h3 style="margin-top:16px">👤 Контакты пользователя</h3>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #eee">Имя</td><td style="padding:8px;border:1px solid #eee">${contactName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">Email</td><td style="padding:8px;border:1px solid #eee">${contactEmail}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">Telegram/телефон</td><td style="padding:8px;border:1px solid #eee">${contactTelegram}</td></tr>
    </table>
    ${p.comment ? `<p style="margin-top:12px"><strong>Комментарий:</strong> ${p.comment}</p>` : ""}
  </div>`;
}

function buildUserHtml(p: OrderEmailPayload) {
  const paidAtLabel = p.paidAt ? p.paidAt.toLocaleString("ru-RU") : "—";
  return `
  <div style="font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial">
    <h2>🎉 Спасибо! Оплата прошла успешно</h2>
    <p>Мы оформляем доступ к сервису. Обычно это занимает 15–60 минут (иногда до 24 часов).</p>
    <h3>📦 Детали заказа</h3>
    <table style="border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;border:1px solid #eee">🛠 Сервис</td><td style="padding:8px;border:1px solid #eee">${p.serviceName}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">💰 Сумма</td><td style="padding:8px;border:1px solid #eee">${fmtRub(p.amountRub)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">🧾 Номер заказа</td><td style="padding:8px;border:1px solid #eee">${p.orderId}</td></tr>
      <tr><td style="padding:8px;border:1px solid #eee">📅 Дата</td><td style="padding:8px;border:1px solid #eee">${paidAtLabel}</td></tr>
      ${p.paymentId ? `<tr><td style="padding:8px;border:1px solid #eee">🧩 ID платежа</td><td style="padding:8px;border:1px solid #eee">${p.paymentId}</td></tr>` : ""}
    </table>
    <h3 style="margin-top:16px">✍️ Что дальше?</h3>
    <ul>
      <li>Если в форме вы не указали логин и пароль от сервиса (учётной записи, куда оформить подписку) — ответьте на это письмо и укажите их.</li>
      <li>Если не хотите отправлять данные по почте — напишите менеджеру в Telegram: <a href="https://t.me/aibazaru">@aibazaru</a>.</li>
    </ul>
    <p>Команда AIBazar — на связи 09:00–22:00 (МСК).</p>
  </div>`;
}

export async function sendOrderPaidEmails(payload: OrderEmailPayload) {
  const adminTo = process.env.SALES_NOTIFICATIONS_TO || process.env.NEXT_PUBLIC_NODEMAILER_USER;
  if (!adminTo) return false;

  const {
    orderId,
    serviceName,
    amountRub,
    paidAt,
    paymentId,
    confirmationUrl,
    userEmail,
    userName,
    contact,
    comment,
  } = payload;

  const paidAtLabel = paidAt ? paidAt.toLocaleString("ru-RU") : "—";
  const contactName = contact?.name || userName || "—";
  const contactEmail = contact?.email || userEmail || "—";
  const contactTelegram = contact?.telegram || "—";

  // Admin email
  const adminSubject = `[Оплата] ${serviceName} — заказ ${orderId}`;
  const adminText = [
    `Получена оплата по заказу ${orderId}.`,
    `Сервис: ${serviceName}`,
    `Сумма: ${amountRub.toLocaleString("ru-RU")} ₽`,
    `Дата оплаты: ${paidAtLabel}`,
    paymentId ? `ID платежа: ${paymentId}` : null,
    confirmationUrl ? `Ссылка ЮKassa: ${confirmationUrl}` : null,
    ``,
    `Контакты пользователя:`,
    `Имя: ${contactName}`,
    `Email: ${contactEmail}`,
    `Telegram/телефон: ${contactTelegram}`,
    comment ? `Комментарий: ${comment}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  await sendMail({ to: adminTo, subject: adminSubject, text: adminText, html: buildAdminHtml(payload) });

  // Customer email
  const toUser = contact?.email || userEmail;
  if (toUser) {
    const userSubject = `Вы оплатили: ${serviceName}`;
    const userLines = [
      `Спасибо! Оплата прошла успешно.`,
      ``,
      `Детали заказа:`,
      `Сервис: ${serviceName}`,
      `Сумма: ${amountRub.toLocaleString("ru-RU")} ₽`,
      `Номер заказа: ${orderId}`,
      `Дата: ${paidAtLabel}`,
      paymentId ? `ID платежа: ${paymentId}` : null,
      ``,
      `Если в форме вы не указали логин и пароль от сервиса, на который оформлена подписка, пожалуйста ответьте на это письмо и укажите их.`,
      `Если не хотите передавать данные по почте — свяжитесь с менеджером в Telegram @aibazaru.`,
    ].filter(Boolean);
    await sendMail({ to: toUser, subject: userSubject, text: userLines.join("\n"), html: buildUserHtml(payload) });
  }

  return true;
}

export async function sendVerificationEmail(to: string, link: string, name?: string | null) {
  const subject = "Подтверждение email — AI Bazar";
  const text = [
    `Здравствуйте${name ? ", " + name : ""}!`,
    "",
    "Вы зарегистрировались в AI Bazar. Подтвердите ваш email по ссылке:",
    link,
    "",
    "Если вы не регистрировались, просто игнорируйте это письмо.",
  ].join("\n");

  const html = `
  <div style=\"font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto\">
    <h2>👋 Здравствуйте${name ? ", " + name : ""}!</h2>
    <p>Вы зарегистрировались в <strong>AI Bazar</strong>. Подтвердите адрес почты, чтобы завершить регистрацию.</p>
    <p style=\"margin:24px 0;text-align:center\">
      <a href=\"${link}\" style=\"display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px\">Подтвердить email</a>
    </p>
    <p style=\"font-size:12px;color:#555\">Если кнопка не работает, скопируйте ссылку в адресную строку:</p>
    <p style=\"word-break:break-all;font-size:12px;color:#555\"><a href=\"${link}\">${link}</a></p>
  </div>`;

  await sendMail({ to, subject, text, html });
}

export async function sendResetPasswordEmail(to: string, link: string, name?: string | null) {
  const subject = "Сброс пароля — AI Bazar";
  const text = [
    `Здравствуйте${name ? ", " + name : ""}!`,
    "",
    "Поступил запрос на сброс пароля. Перейдите по ссылке, чтобы установить новый пароль:",
    link,
    "",
    "Если вы не запрашивали сброс — просто игнорируйте это письмо.",
  ].join("\n");
  const html = `
  <div style=\"font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,Arial;max-width:560px;margin:0 auto\">
    <h2>🔐 Сброс пароля</h2>
    <p>Чтобы установить новый пароль, нажмите на кнопку ниже.</p>
    <p style=\"margin:24px 0;text-align:center\">
      <a href=\"${link}\" style=\"display:inline-block;background:#111;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px\">Установить новый пароль</a>
    </p>
    <p style=\"font-size:12px;color:#555\">Если кнопка не работает, скопируйте ссылку в адресную строку:</p>
    <p style=\"word-break:break-all;font-size:12px;color:#555\"><a href=\"${link}\">${link}</a></p>
  </div>`;
  await sendMail({ to, subject, text, html });
}
