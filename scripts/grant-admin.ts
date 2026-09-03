#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Администратор";

  if (!email) throw new Error("ADMIN_EMAIL is required");

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!existing && !password) {
    throw new Error("User does not exist. Set ADMIN_PASSWORD to create a new administrator.");
  }

  const passwordHash = password ? await hashPassword(password) : undefined;
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      ...(passwordHash ? { passwordHash, emailVerified: new Date() } : {}),
    },
    create: {
      email,
      name,
      role: "ADMIN",
      passwordHash,
      emailVerified: new Date(),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log(`Administrator ready: ${user.email} (${user.role})`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
