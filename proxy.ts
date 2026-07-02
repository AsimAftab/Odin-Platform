import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Only /dashboard requires a logged-in web session. Everything else is either
// public (landing, auth pages, Better Auth endpoints) or self-guards:
//   - /api/ingest authenticates the CLI via Bearer token
//   - /api/tokens|snapshots|machines call getSession() and return 401 themselves
// This uses an optimistic cookie check (no DB call) so it runs on the edge.
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    const sessionCookie = getSessionCookie(req);
    if (!sessionCookie) {
      const signIn = new URL("/sign-in", req.url);
      signIn.searchParams.set("redirect", pathname);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
