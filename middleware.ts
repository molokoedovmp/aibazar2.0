import { type NextRequest, NextResponse } from "next/server";

const CANONICAL_HOST = "ai-bazar.ru";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "host.docker.internal"]);

function requestHostname(request: NextRequest) {
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  const firstHost = rawHost?.split(",")[0]?.trim();
  if (!firstHost) return "";

  try {
    return new URL(`http://${firstHost}`).hostname.toLowerCase();
  } catch {
    return firstHost.replace(/:\d+$/, "").toLowerCase();
  }
}

export function middleware(request: NextRequest) {
  const hostname = requestHostname(request);
  if (!hostname || hostname === CANONICAL_HOST || LOCAL_HOSTS.has(hostname)) {
    return NextResponse.next();
  }

  return new NextResponse(null, { status: 404 });
}
