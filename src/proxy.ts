import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isProtectedRoute(pathname: string) {
  return pathname === "/submit" || pathname.startsWith("/submit/");
}

function skipsIntl(pathname: string) {
  return (
    pathname.startsWith("/api") ||
    pathname.startsWith("/trpc") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/_vercel") ||
    pathname.startsWith("/whatsapp") ||
    pathname.startsWith("/wpp") ||
    pathname.startsWith("/luma") ||
    pathname.startsWith("/event") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/recursos") ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/submit") ||
    pathname.startsWith("/p/") ||
    /\.[^/]+$/.test(pathname)
  );
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname)) {
    await auth.protect();
  }

  if (skipsIntl(pathname)) {
    return NextResponse.next();
  }

  return intlMiddleware(request);
});

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/api/(.*)"],
};
