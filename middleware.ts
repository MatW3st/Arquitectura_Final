import { NextResponse, NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const userAgent = request.headers.get("user-agent") || "";
  const ip = getClientIp(request);

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");

  const blockedAgents = ["BurpSuite", "curl", "sqlmap", "python-requests"];
  if (blockedAgents.some((agent) => userAgent.includes(agent))) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
  }

  // Comentar el rate limiting temporalmente para desarrollo
  /*
  if (checkRateLimit(ip)) {
    return NextResponse.json({ error: "Demasiadas solicitudes" }, { status: 429 });
  }
  */

  if (!token && request.nextUrl.pathname.startsWith("/interfaz")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  response.headers.set(
    "Content-Security-Policy",
    `
      default-src 'self';
      script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net;
      style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net;
      img-src 'self' data:;
      font-src 'self';
      connect-src 'self' https://gatito027.vercel.app https://prueba-moleculer.vercel.app;
      frame-src 'self';
      frame-ancestors 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
    `.replace(/\s{2,}/g, " ").trim()
  );
  response.headers.set("X-Nonce", nonce);

  return response;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
}

const requestCounts: Record<string, number> = {};
function checkRateLimit(ip: string): boolean {
  if (!ip) return false;
  requestCounts[ip] = (requestCounts[ip] || 0) + 1;
  setTimeout(() => delete requestCounts[ip], 60000);
  return requestCounts[ip] > 20;
}

export const config = {
  matcher: ["/:path*"],
};