import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function isProtectedRoute(pathname: string) {
  const [, locale, segment] = pathname.split("/");
  return routing.locales.some(
    (supportedLocale) => supportedLocale === locale && segment === "submit",
  );
}

function legacyLocalizedRedirect(request: Request) {
  const url = new URL(request.url);
  const { pathname } = url;

  const legacyPaths = [
    "/projects",
    "/submit",
    "/requests",
    "/recursos",
    "/insights",
  ];

  if (legacyPaths.includes(pathname)) {
    url.pathname = `/${routing.defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  if (pathname === "/p" || pathname.startsWith("/p/")) {
    url.pathname = `/${routing.defaultLocale}${pathname}`;
    return NextResponse.redirect(url, 308);
  }

  return null;
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
    pathname.startsWith("/discord") ||
    pathname.startsWith("/event") ||
    /\.[^/]+$/.test(pathname)
  );
}

export default clerkMiddleware(async (auth, request) => {
  const { pathname } = request.nextUrl;

  const legacyRedirect = legacyLocalizedRedirect(request);

  if (legacyRedirect) {
    return legacyRedirect;
  }

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
