// import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// // 1. Define only the routes that should be accessible without logging in
// const isPublicRoute = createRouteMatcher([
//   '/',               // Root page
//   '/sign-in(.*)'      // Sign-in page (and sub-routes)
// ]);

// export default clerkMiddleware(async (auth, request) => {
//   // 2. Protect any route that is NOT in the public list
//   if (!isPublicRoute(request)) {
//     await auth.protect();
//   }
// });

// export const config = {
//   matcher: [
//     // Standard Clerk matcher to ensure middleware runs on all relevant requests
//     '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
//     '/(api|trpc)(.*)',
//   ],
// };


import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};