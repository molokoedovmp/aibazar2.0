import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";

export async function getAdminSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, role: true },
  });

  if (!user || user.role !== "ADMIN") return null;
  return { session, user };
}

export async function requireAdminPage() {
  const admin = await getAdminSession();
  if (!admin) redirect("/account");
  return admin;
}
