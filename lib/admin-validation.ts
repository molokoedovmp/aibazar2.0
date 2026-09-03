import { z } from "zod";
import type { Prisma } from "@prisma/client";

const optionalUrl = z.union([z.string().url("Укажите корректную ссылку"), z.literal("")]).optional();
const optionalNumber = z.union([z.number(), z.null()]).optional();

export const aiToolInputSchema = z.object({
  name: z.string().trim().min(2, "Название должно содержать минимум 2 символа").max(120),
  description: z.string().trim().min(10, "Добавьте описание инструмента").max(5000),
  coverImage: optionalUrl,
  url: optionalUrl,
  type: z.string().trim().min(1).max(40),
  isActive: z.boolean().default(true),
  rating: optionalNumber.refine((value) => value === undefined || value === null || (value >= 0 && value <= 10), {
    message: "Рейтинг должен быть от 0 до 10",
  }),
  price: optionalNumber.refine((value) => value === undefined || value === null || value >= 0, {
    message: "Цена не может быть отрицательной",
  }),
  startPrice: optionalNumber.refine((value) => value === undefined || value === null || value >= 0, {
    message: "Стартовая цена не может быть отрицательной",
  }),
  categoryId: z.string().trim().min(1, "Выберите категорию"),
  linkedDocumentId: z.union([z.string().trim().min(1), z.literal(""), z.null()]).optional(),
});

export const aiToolPatchSchema = aiToolInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  "Нет данных для обновления",
);

export function normalizeAiToolInput(input: z.infer<typeof aiToolInputSchema>): Prisma.AiToolUncheckedCreateInput {
  return {
    ...input,
    coverImage: input.coverImage || null,
    url: input.url || null,
    linkedDocumentId: input.linkedDocumentId || null,
  };
}

export function normalizeAiToolPatch(input: z.infer<typeof aiToolPatchSchema>): Prisma.AiToolUncheckedUpdateInput {
  const normalized: Prisma.AiToolUncheckedUpdateInput = { ...input };
  if ("coverImage" in input) normalized.coverImage = input.coverImage || null;
  if ("url" in input) normalized.url = input.url || null;
  if ("linkedDocumentId" in input) normalized.linkedDocumentId = input.linkedDocumentId || null;
  return normalized;
}
