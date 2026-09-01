"use client";

import { SessionProvider as NextAuthProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { EdgeStoreProvider } from "@/lib/edgestore";

export default function SessionProvider({ children }: { children: ReactNode }) {
  return (
    <NextAuthProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <EdgeStoreProvider>{children}</EdgeStoreProvider>
      </ThemeProvider>
    </NextAuthProvider>
  );
}
