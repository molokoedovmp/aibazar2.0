import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { AuthOptions, SessionStrategy } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import YandexProvider from "next-auth/providers/yandex";
import { verifyPassword } from "@/lib/password";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Доверяем X-Forwarded-* от reverse-proxy (NGINX) при расчете host/https.
  trustHost: true,
  // Форсируем secure-cookies, т.к. внешний трафик всегда HTTPS.
  useSecureCookies: true,
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID!,
      clientSecret: process.env.YANDEX_CLIENT_SECRET!,
    }),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const email = (credentials?.email || "").toString().trim().toLowerCase();
          const password = (credentials?.password || "").toString();
          if (!email || !password) return null;
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user?.passwordHash) return null;
          // Требуем подтверждения email перед входом
          if (!user.emailVerified) {
            return null;
          }
          const ok = await verifyPassword(password, user.passwordHash);
          if (!ok) return null;
          return { id: user.id, name: user.name || null, email: user.email || null, image: user.image || null } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt" as SessionStrategy,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    state: {
      name: "__Secure-next-auth.state",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    pkceCodeVerifier: {
      name: "__Secure-next-auth.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
};
