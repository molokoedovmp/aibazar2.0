#!/usr/bin/env tsx

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

import { syncCuratedPrompts } from "./sync-curated-prompts";
import { syncExternalPrompts } from "./sync-external-prompts";

const rootDir = path.resolve(__dirname, "..");

function loadEnv() {
  for (const fileName of [".env.local", ".env", ".env.production"]) {
    const filePath = path.join(rootDir, fileName);
    if (!fs.existsSync(filePath)) continue;

    for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = value;
    }
  }
}

loadEnv();
const prisma = new PrismaClient();

async function removeLegacyCollectivePrompts() {
  const legacyPrompts = await prisma.promptResource.findMany({
    where: { source: "collective-ai-tools" },
    select: { id: true },
  });
  const legacyPromptIds = legacyPrompts.map((prompt) => prompt.id);

  if (legacyPromptIds.length === 0) {
    console.log("Legacy collective-ai-tools prompts removed: 0.");
    return;
  }

  await prisma.$transaction([
    prisma.libraryFavorite.deleteMany({
      where: { itemType: "prompts", itemId: { in: legacyPromptIds } },
    }),
    prisma.promptResource.deleteMany({
      where: { source: "collective-ai-tools" },
    }),
  ]);

  console.log(`Legacy collective-ai-tools prompts removed: ${legacyPromptIds.length}.`);
}

async function main() {
  await removeLegacyCollectivePrompts();
  await syncCuratedPrompts(prisma);
  await syncExternalPrompts(prisma);
}

main()
  .catch((error) => {
    console.error("Prompt synchronization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
