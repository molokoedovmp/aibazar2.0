import Link from "next/link";
import { prisma } from "@/lib/db";

interface Params {
  token?: string;
  email?: string;
}

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Params> }) {
  const { token, email } = await searchParams;
  let title = "Подтверждение email";
  let message = "Некорректная ссылка подтверждения.";
  let ok = false;

  if (token && email) {
    try {
      const stored = await prisma.verificationToken.findUnique({ where: { token } });
      if (stored && stored.identifier.toLowerCase() === email.toLowerCase() && stored.expires > new Date()) {
        await prisma.user.updateMany({ where: { email: stored.identifier }, data: { emailVerified: new Date() } });
        await prisma.verificationToken.delete({ where: { token } });
        ok = true;
        message = "Email успешно подтверждён. Теперь вы можете войти.";
      } else {
        message = "Ссылка недействительна или устарела.";
      }
    } catch {
      message = "Произошла ошибка. Попробуйте ещё раз.";
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm text-gray-600">{message}</p>
        <div className="mt-6">
          {ok ? (
            <Link href="/auth/login" className="inline-flex h-10 items-center justify-center rounded-md bg-black px-4 text-sm font-medium text-white hover:opacity-90">
              Войти
            </Link>
          ) : (
            <Link href="/auth/signup" className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium text-gray-900 hover:bg-gray-50">
              Создать аккаунт
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

