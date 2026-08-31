import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

/**
 * Gates the instructor dashboard. Runs before the page renders, so the
 * dashboard bundle is never served to an unauthenticated visitor.
 */
export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (await isValidSession(cookie)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/umkc/govtacctclass/dashboard/login";
  url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/umkc/govtacctclass/dashboard"],
};
