import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

const DOCUMENT_ID = "cmiz0xyc9000dnv0irpwh545i";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const document = await prisma.document.findUnique({
    where: { id: DOCUMENT_ID },
    select: { id: true, title: true },
  });

  if (!document) {
    return NextResponse.json({ deleted: false, reason: "already absent" });
  }

  await prisma.$transaction([
    prisma.review.deleteMany({ where: { documentId: DOCUMENT_ID } }),
    prisma.document.delete({ where: { id: DOCUMENT_ID } }),
  ]);

  return NextResponse.json({ deleted: true, document });
}
