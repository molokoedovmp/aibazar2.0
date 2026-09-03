import { NextRequest, NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin";
import { getAdminDocuments, type AdminDocumentStatus } from "@/lib/admin-documents";

const statuses = new Set<AdminDocumentStatus>(["all", "published", "drafts", "archived"]);

export async function GET(request: NextRequest) {
  if (!(await getAdminSession())) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const requestedStatus = request.nextUrl.searchParams.get("status") || "all";
  const status = statuses.has(requestedStatus as AdminDocumentStatus)
    ? requestedStatus as AdminDocumentStatus
    : "all";
  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const query = request.nextUrl.searchParams.get("q") || "";

  return NextResponse.json(await getAdminDocuments({ query, page, status }));
}
