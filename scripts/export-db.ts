import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

// Minimal .env loader so DATABASE_URL is available when running the script directly.
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (!fs.existsSync(envPath)) return;

  const lines = fs.readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    const rawValue = trimmed.slice(eqIndex + 1).trim();
    if (!key || process.env[key]) continue;

    const value = rawValue.replace(/^["'](.+)["']$/, "$1");
    process.env[key] = value;
  }
}

loadEnv();

const prisma = new PrismaClient();

async function listTables() {
  const rows = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations')
  `;
  return rows.map((row) => row.tablename);
}

async function exportTable(table: string, outDir: string) {
  const rows = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "${table}"`);
  const filePath = path.join(outDir, `${table}.json`);
  fs.writeFileSync(filePath, JSON.stringify(rows, null, 2), "utf8");
  console.log(`Exported ${rows.length} rows from ${table} -> ${filePath}`);
}

async function main() {
  const outDir = path.resolve(__dirname, "..", "data", "db-export");
  fs.mkdirSync(outDir, { recursive: true });

  const tables = await listTables();
  if (tables.length === 0) {
    console.log("No tables found to export.");
    return;
  }

  for (const table of tables) {
    await exportTable(table, outDir);
  }
}

main()
  .catch((err) => {
    console.error("Export failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
