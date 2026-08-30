import { initEdgeStore } from "@edgestore/server";
import {
  createEdgeStoreNextHandler,
} from "@edgestore/server/adapters/next/app";
import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/app/api/auth/auth-options";

type EdgeStoreContext = {
  userId: string | null;
};

async function createContext(): Promise<EdgeStoreContext> {
  const session = await getServerSession(authOptions);

  return {
    userId: session?.user?.id ?? null,
  };
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
