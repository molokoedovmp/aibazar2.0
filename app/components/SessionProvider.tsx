"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import { ReactNode } from "react";
import { EdgeStoreProvider } from "@/lib/edgestore";

export default function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthProvider>
      <EdgeStoreProvider>{children}</EdgeStoreProvider>
    </NextAuthProvider>
  );
}
