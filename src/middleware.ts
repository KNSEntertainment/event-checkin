import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/register/(.*)',
  '/checkin-individual/(.*)',
]);

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) {
    // Don't require auth for public routes
    return;
  }
});

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
