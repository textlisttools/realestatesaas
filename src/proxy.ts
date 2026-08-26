import { clerkMiddleware } from "@clerk/nextjs/server";

// Establishes the Clerk auth context for every request. Route protection
// itself lives in each protected page/action via `auth.protect()`, per
// Clerk's guidance: middleware-based path matching can diverge from how
// Next.js actually routes requests and leave a resource unprotected.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
