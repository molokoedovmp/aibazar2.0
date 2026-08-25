import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Minimal .env loader so DATABASE_URL is available when running the script directly.
function loadEnv() {
  const localEnvPath = path.resolve(__dirname, "..", ".env.local");
  const envPath = path.resolve(__dirname, "..", ".env");
  const prodEnvPath = path.resolve(__dirname, "..", ".env.production");
  const candidates = [localEnvPath, envPath, prodEnvPath];

  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const isLocalEnv = candidate === localEnvPath;
    const lines = fs.readFileSync(candidate, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const rawValue = trimmed.slice(eqIndex + 1).trim();
      if (!key || (!isLocalEnv && process.env[key])) continue;
      const value = rawValue.replace(/^["'](.+)["']$/, "$1");
      process.env[key] = value;
    }
  }
}

loadEnv();

const prisma = new PrismaClient();
const exportDir = path.resolve(__dirname, "..", "data", "db-export");

function readJson<T>(fileName: string): T[] {
  const filePath = path.join(exportDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as T[];
}

async function clearAll() {
  // Delete in dependency order (children first)
  await prisma.userSettings.deleteMany();
  await prisma.creditPurchase.deleteMany();
  await prisma.creditUsageHistory.deleteMany();
  await prisma.userCredit.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.userToolPrice.deleteMany();
  await prisma.aiToolOrder.deleteMany();
  await prisma.feedbackMessage.deleteMany();
  await prisma.review.deleteMany();
  await prisma.aiTool.deleteMany();
  await prisma.category.deleteMany();
  await prisma.document.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.service.deleteMany();
  await prisma.aiGadget.deleteMany();
  await prisma.user.deleteMany();
}

async function importAll() {
  const users = readJson<any>("User.json");
  if (users.length) await prisma.user.createMany({ data: users, skipDuplicates: true });

  const documents = readJson<any>("Document.json");
  if (documents.length) await prisma.document.createMany({ data: documents, skipDuplicates: true });

  const categories = readJson<any>("Category.json");
  if (categories.length) await prisma.category.createMany({ data: categories, skipDuplicates: true });

  const aiTools = readJson<any>("AiTool.json");
  if (aiTools.length) await prisma.aiTool.createMany({ data: aiTools, skipDuplicates: true });

  const accounts = readJson<any>("Account.json");
  if (accounts.length) await prisma.account.createMany({ data: accounts, skipDuplicates: true });

  const sessions = readJson<any>("Session.json");
  if (sessions.length) await prisma.session.createMany({ data: sessions, skipDuplicates: true });

  const verificationTokens = readJson<any>("VerificationToken.json");
  if (verificationTokens.length) await prisma.verificationToken.createMany({ data: verificationTokens, skipDuplicates: true });

  const aiToolOrders = readJson<any>("AiToolOrder.json");
  if (aiToolOrders.length) await prisma.aiToolOrder.createMany({ data: aiToolOrders, skipDuplicates: true });

  const favorites = readJson<any>("Favorite.json");
  if (favorites.length) await prisma.favorite.createMany({ data: favorites, skipDuplicates: true });

  const userToolPrices = readJson<any>("UserToolPrice.json");
  if (userToolPrices.length) await prisma.userToolPrice.createMany({ data: userToolPrices, skipDuplicates: true });

  const services = readJson<any>("Service.json");
  if (services.length) await prisma.service.createMany({ data: services, skipDuplicates: true });

  const aiGadgets = readJson<any>("AiGadget.json");
  if (aiGadgets.length) await prisma.aiGadget.createMany({ data: aiGadgets, skipDuplicates: true });

  const userCredits = readJson<any>("UserCredit.json");
  if (userCredits.length) await prisma.userCredit.createMany({ data: userCredits, skipDuplicates: true });

  const creditUsage = readJson<any>("CreditUsageHistory.json");
  if (creditUsage.length) await prisma.creditUsageHistory.createMany({ data: creditUsage, skipDuplicates: true });

  const creditPurchases = readJson<any>("CreditPurchase.json");
  if (creditPurchases.length) await prisma.creditPurchase.createMany({ data: creditPurchases, skipDuplicates: true });

  const feedbackMessages = readJson<any>("FeedbackMessage.json");
  if (feedbackMessages.length) await prisma.feedbackMessage.createMany({ data: feedbackMessages, skipDuplicates: true });

  const reviews = readJson<any>("Review.json");
  if (reviews.length) await prisma.review.createMany({ data: reviews, skipDuplicates: true });

  const userSettings = readJson<any>("UserSettings.json");
  if (userSettings.length) await prisma.userSettings.createMany({ data: userSettings, skipDuplicates: true });
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is not configured");
  const target = new URL(databaseUrl);
  console.log(
    `Database target: ${target.hostname}:${target.port || "5432"}${target.pathname}`,
  );

  console.log("Clearing existing data...");
  await clearAll();

  console.log("Importing JSON dumps from", exportDir);
  await importAll();

  console.log("Import completed.");
}

main()
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
