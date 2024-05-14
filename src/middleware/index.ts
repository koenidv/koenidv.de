// /// <reference path="../../.astro/types.d.ts" />
// import type { defineMiddleware } from "astro:middleware";

// fixme astro:middleware can't be found
// export const onRequest = defineMiddleware((context, next) => {
export function onRequest(context, next) {
  if (context.url.pathname.endsWith(".br")) {
    context.headers.set("Content-Encoding", "br");
  }
  return next();
};