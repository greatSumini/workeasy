import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = [/^\/dashboard(\/.*)?$/];
const AUTH_PAGES = [/^\/login$/, /^\/signup$/];

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hasSession = Boolean(req.cookies.get("sb-access-token"));
  const isProtected = PROTECTED.some((r) => r.test(url.pathname));
  const isAuthPage = AUTH_PAGES.some((r) => r.test(url.pathname));

  if (!hasSession && isProtected) {
    const next = new URL("/login", url);
    next.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(next);
  }

  if (hasSession && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\.).*)"],
};
