import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    if (path.startsWith("/admin") && token?.role !== "ADMIN") return NextResponse.redirect(new URL("/workspace", req.url));
    if (token?.status === "SUSPENDED" && path !== "/suspended") return NextResponse.redirect(new URL("/suspended", req.url));
    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } }
);
export const config = { matcher: ["/workspace/:path*", "/admin/:path*", "/suspended"] };
