import { initEdgeStore } from "@edgestore/server";
import {
  createEdgeStoreNextHandler,
} from "@edgestore/server/adapters/next/app";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/app/api/auth/auth-options";
import { prisma } from "@/lib/db";

type EdgeStoreContext = {
  userId: string | null;
  role: string | null;
};

async function createContext(): Promise<EdgeStoreContext> {
  const session = await getServerSession(authOptions);

  const user = session?.user?.id
    ? await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } })
    : null;

  return { userId: session?.user?.id ?? null, role: user?.role ?? null };
}

const es = initEdgeStore.context<EdgeStoreContext>().create();

function isOwner(
  context: EdgeStoreContext,
  metadata: { userId?: string | null },
) {
  return Boolean(context.userId && metadata.userId === context.userId);
}

export const edgeStoreRouter = es.router({
  profileImages: es
    .imageBucket({
      maxSize: 5 * 1024 * 1024,
      accept: ["image/jpeg", "image/png", "image/webp"],
    })
    .metadata(({ ctx }) => ({ userId: ctx.userId }))
    .beforeUpload(({ ctx }) => Boolean(ctx.userId))
    .beforeDelete(({ ctx, fileInfo }) => isOwner(ctx, fileInfo.metadata)),

  documentImages: es
    .imageBucket({
      maxSize: 10 * 1024 * 1024,
      accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    })
    .metadata(({ ctx }) => ({ userId: ctx.userId }))
    .beforeUpload(({ ctx }) => Boolean(ctx.userId))
    .beforeDelete(({ ctx, fileInfo }) => isOwner(ctx, fileInfo.metadata)),

  toolImages: es
    .imageBucket({
      maxSize: 10 * 1024 * 1024,
      accept: ["image/jpeg", "image/png", "image/webp", "image/gif"],
    })
    .metadata(({ ctx }) => ({ userId: ctx.userId }))
    .beforeUpload(({ ctx }) => ctx.role === "ADMIN")
    .beforeDelete(({ ctx }) => ctx.role === "ADMIN"),
});

let edgeStoreHandler: ReturnType<typeof createEdgeStoreNextHandler> | undefined;

export function handleEdgeStoreRequest(req: NextRequest) {
  edgeStoreHandler ??= createEdgeStoreNextHandler({
    router: edgeStoreRouter,
    createContext,
  });

  return edgeStoreHandler(req);
}

export type EdgeStoreRouter = typeof edgeStoreRouter;
