import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const normalizedCode = code.trim().toUpperCase();
  const destination = request.nextUrl.clone();
  destination.pathname = "/auth";
  destination.searchParams.set("ref", /^[A-Z0-9][A-Z0-9_-]{2,47}$/.test(normalizedCode) ? normalizedCode : "");
  return NextResponse.redirect(destination, 307);
}
