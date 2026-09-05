import { NextResponse } from "next/server";

// A first-party channel link keeps the footer row visible when extensions
// cosmetically hide direct links to external social platforms.
export function GET() {
  return NextResponse.redirect("https://dzen.ru/aibazar", 307);
}
