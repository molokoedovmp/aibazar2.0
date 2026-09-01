#!/usr/bin/env tsx

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const token = process.env.GITHUB_TOKEN?.trim();
const BATCH_SIZE = 40;

type ResourceKind = "mcp" | "skill" | "repo";

type RepositoryTarget = {
  key: string;
  kind: ResourceKind;
  id: string;
  owner: string;
  repository: string;
};

type GraphQlResponse = {
  data?: Record<string, { stargazerCount?: number } | null>;
  errors?: Array<{ message?: string }>;
};

function parseGitHubRepository(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
    const [owner, rawRepository] = url.pathname.split("/").filter(Boolean);
    const repository = rawRepository?.replace(/\.git$/i, "");
    return owner && repository ? { owner, repository } : null;
  } catch {
    return null;
  }
}

function uniqueTargets(targets: RepositoryTarget[]) {
  const seen = new Set<string>();
  return targets.filter((target) => {
    const identity = `${target.kind}:${target.id}`;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

async function loadTargets() {
  const [mcp, skills, repositories] = await Promise.all([
    prisma.mcpResource.findMany({
      where: { isActive: true, githubUrl: { not: null } },
      select: { id: true, githubUrl: true },
    }),
    prisma.skillResource.findMany({
      where: { isActive: true },
      select: { id: true, repoUrl: true, sourceUrl: true },
    }),
    prisma.repositoryResource.findMany({
      where: { isActive: true },
      select: { id: true, url: true },
    }),
  ]);

  const targets: RepositoryTarget[] = [];
  for (const item of mcp) {
    const parsed = parseGitHubRepository(item.githubUrl);
    if (parsed) targets.push({ key: "", kind: "mcp", id: item.id, ...parsed });
  }
  for (const item of skills) {
    const parsed = parseGitHubRepository(item.repoUrl || item.sourceUrl);
    if (parsed) targets.push({ key: "", kind: "skill", id: item.id, ...parsed });
  }
  for (const item of repositories) {
    const parsed = parseGitHubRepository(item.url);
    if (parsed) targets.push({ key: "", kind: "repo", id: item.id, ...parsed });
  }

  return uniqueTargets(targets);
}

async function fetchStars(batch: RepositoryTarget[]) {
  const keyedBatch = batch.map((target, index) => ({ ...target, key: `repo${index}` }));
  const fields = keyedBatch.map((target) => {
    return `${target.key}: repository(owner: ${JSON.stringify(target.owner)}, name: ${JSON.stringify(target.repository)}) { stargazerCount }`;
  });
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "aiBazar GitHub stars sync",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ query: `query RepositoryStars { ${fields.join("\n")} }` }),
    signal: AbortSignal.timeout(45_000),
  });

  if (!response.ok) {
    throw new Error(`GitHub GraphQL returned ${response.status} ${response.statusText}`);
  }

  const payload = (await response.json()) as GraphQlResponse;
  if (!payload.data && payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).filter(Boolean).join("; "));
  }

  return keyedBatch.flatMap((target) => {
    const stars = payload.data?.[target.key]?.stargazerCount;
    return typeof stars === "number" ? [{ target, stars }] : [];
  });
}

async function saveStars(results: Array<{ target: RepositoryTarget; stars: number }>) {
  await prisma.$transaction(
    results.map(({ target, stars }) => {
      if (target.kind === "mcp") {
        return prisma.mcpResource.update({ where: { id: target.id }, data: { stars } });
      }
      if (target.kind === "skill") {
        return prisma.skillResource.update({ where: { id: target.id }, data: { stars } });
      }
      return prisma.repositoryResource.update({ where: { id: target.id }, data: { stars } });
    }),
  );
}

async function main() {
  if (!token) {
    console.log("GITHUB_TOKEN is not configured; skipping live GitHub stars synchronization.");
    return;
  }

  const targets = await loadTargets();
  let updated = 0;

  for (let offset = 0; offset < targets.length; offset += BATCH_SIZE) {
    const results = await fetchStars(targets.slice(offset, offset + BATCH_SIZE));
    await saveStars(results);
    updated += results.length;
    console.log(`GitHub stars synchronized: ${updated}/${targets.length}`);
  }

  console.log(`GitHub stars synchronization complete: ${updated} resources updated.`);
}

main()
  .catch((error) => {
    console.error("GitHub stars synchronization failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
