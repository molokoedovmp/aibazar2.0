import type { ReactNode } from "react";

export default function AccountLayout({ children }: { children: ReactNode }) {
  return <div className="route-plain-theme account-shadcn-theme min-h-screen">{children}</div>;
}
