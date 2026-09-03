import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import type { AuthOptions, SessionStrategy } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import YandexProvider from "next-auth/providers/yandex";
import { verifyPassword } from "@/lib/password";

const prisma = new PrismaClient();
const useSecureCookies = (process.env.NEXTAUTH_URL || "").startsWith("https://");
const secureCookiePrefix = useSecureCookies ? "__Secure-" : "";

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  useSecureCookies,
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
          return {
            id: user.id,
            name: user.name || null,
            email: user.email || null,
            image: user.image || null,
            role: user.role,
          };
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
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
      }
      if (token.id && !token.role) {
        const persistedUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (persistedUser) token.role = persistedUser.role;
      }
      if (trigger === "update" && session) {
        if (typeof session.name === "string") token.name = session.name;
        if (typeof session.image === "string" || session.image === null) {
          token.picture = session.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.name = token.name ?? session.user.name;
        session.user.image = token.picture ?? session.user.image;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  cookies: {
    state: {
      name: `${secureCookiePrefix}next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
    pkceCodeVerifier: {
      name: `${secureCookiePrefix}next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
      },
    },
  },
};
