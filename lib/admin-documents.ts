import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const ADMIN_DOCUMENTS_PAGE_SIZE = 30;

export type AdminDocumentStatus = "all" | "published" | "drafts" | "archived";

export async function getAdminDocuments({
  query = "",
  page = 1,
  status = "all",
}: {
  query?: string;
  page?: number;
  status?: AdminDocumentStatus;
}) {
  const normalizedQuery = query.trim();
  const safePage = Math.max(1, page);
  const statusWhere: Prisma.DocumentWhereInput = status === "published"
    ? { isPublished: true, isArchived: false }
    : status === "drafts"
      ? { isPublished: false, isArchived: false }
      : status === "archived"
        ? { isArchived: true }
        : {};

  let matchingUserIds: string[] = [];
  if (normalizedQuery) {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: normalizedQuery, mode: "insensitive" } },
          { email: { contains: normalizedQuery, mode: "insensitive" } },
        ],
      },
      select: { id: true },
    });
    matchingUserIds = users.map((user) => user.id);
  }

  const where: Prisma.DocumentWhereInput = {
    ...statusWhere,
    ...(normalizedQuery
      ? {
          OR: [
            { id: { contains: normalizedQuery, mode: "insensitive" } },
            { title: { contains: normalizedQuery, mode: "insensitive" } },
            { previewText: { contains: normalizedQuery, mode: "insensitive" } },
            ...(matchingUserIds.length ? [{ userId: { in: matchingUserIds } }] : []),
          ],
        }
      : {}),
  };

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      skip: (safePage - 1) * ADMIN_DOCUMENTS_PAGE_SIZE,
      take: ADMIN_DOCUMENTS_PAGE_SIZE,
      select: {
        id: true,
        title: true,
        userId: true,
        previewText: true,
        isPublished: true,
        isArchived: true,
        isFavorite: true,
        parentDocument: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.document.count({ where }),
  ]);

  const documentIds = documents.map((document) => document.id);
  const ownerIds = [...new Set(documents.map((document) => document.userId))];
  const [owners, childCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true, email: true, image: true },
    }),
    documentIds.length
      ? prisma.document.groupBy({
          by: ["parentDocument"],
          where: { parentDocument: { in: documentIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const ownersById = new Map(owners.map((owner) => [owner.id, owner]));
  const childrenById = new Map(childCounts.map((item) => [item.parentDocument, item._count._all]));
  const items = documents.map((document) => ({
    ...document,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    owner: ownersById.get(document.userId) || null,
    childrenCount: childrenById.get(document.id) || 0,
  }));

  return {
    items,
    total,
    page: safePage,
    pages: Math.max(1, Math.ceil(total / ADMIN_DOCUMENTS_PAGE_SIZE)),
  };
}
