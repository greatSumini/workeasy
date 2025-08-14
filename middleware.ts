import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED = [
  /^\/dashboard(\/.*)?$/,
  /^\/admin(\/.*)?$/,
  /^\/settings(\/.*)?$/,
];
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
    // 세션이 있으면 루트로 보내고, 루트에서 역할 기반 라우팅 처리
    return NextResponse.redirect(new URL("/", url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|static|.*\\.).*)"],
};
