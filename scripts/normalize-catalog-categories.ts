#!/usr/bin/env tsx

import { promises as fs } from "node:fs";
import path from "node:path";
import {
  CATEGORY_DEFINITIONS,
  categoryDefinitionFor,
  categoryDescription,
  categoryIconDataUrl,
  categoryIdFor,
} from "./catalog-category-taxonomy";

const EXPORT_DIR = path.resolve(process.cwd(), "data", "db-export");
const CATEGORIES_PATH = path.join(EXPORT_DIR, "Category.json");
const TOOLS_PATH = path.join(EXPORT_DIR, "AiTool.json");

type Category = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

type Tool = {
  id: string;
  categoryId: string;
  [key: string]: unknown;
};

async function main() {
  const categories = JSON.parse(await fs.readFile(CATEGORIES_PATH, "utf8")) as Category[];
  const tools = JSON.parse(await fs.readFile(TOOLS_PATH, "utf8")) as Tool[];
  const now = new Date().toISOString();
  const redirectById = new Map<string, string>();
  const categoriesByDefinition = new Map<string, Category[]>();

  for (const category of categories) {
    const definition = categoryDefinitionFor(category.name);
    if (!definition) throw new Error(`No Russian category mapping for: ${category.name}`);
    const targetId = categoryIdFor(definition);
    redirectById.set(category.id, targetId);
    const grouped = categoriesByDefinition.get(definition.source) ?? [];
    grouped.push(category);
    categoriesByDefinition.set(definition.source, grouped);
  }

  let reassignedTools = 0;
  const normalizedTools = tools.map((tool) => {
    const targetId = redirectById.get(tool.categoryId);
    if (!targetId) throw new Error(`Tool ${tool.id} references unknown category ${tool.categoryId}`);
    if (targetId !== tool.categoryId) reassignedTools += 1;
    return { ...tool, categoryId: targetId };
  });

  const normalizedCategories = CATEGORY_DEFINITIONS.map((definition) => {
    const grouped = categoriesByDefinition.get(definition.source) ?? [];
    const createdAt = grouped
      .map((category) => category.createdAt)
      .filter((value): value is string => Boolean(value))
      .sort()[0];

    return {
      id: categoryIdFor(definition),
      icon: categoryIconDataUrl(definition),
      name: definition.name,
      description: categoryDescription(definition),
      createdAt: createdAt ?? now,
      updatedAt: now,
    };
  });

  const suffix = now.replace(/[:.]/g, "-");
  await fs.copyFile(CATEGORIES_PATH, `${CATEGORIES_PATH}.${suffix}.normalize.bak`);
  await fs.copyFile(TOOLS_PATH, `${TOOLS_PATH}.${suffix}.normalize.bak`);
  await fs.writeFile(CATEGORIES_PATH, `${JSON.stringify(normalizedCategories, null, 2)}\n`, "utf8");
  await fs.writeFile(TOOLS_PATH, `${JSON.stringify(normalizedTools, null, 2)}\n`, "utf8");

  console.log(
    JSON.stringify(
      {
        categoriesBefore: categories.length,
        categoriesAfter: normalizedCategories.length,
        categoriesMerged: categories.length - normalizedCategories.length,
        tools: normalizedTools.length,
        reassignedTools,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
