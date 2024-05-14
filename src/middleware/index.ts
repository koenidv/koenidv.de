/// <reference path="../../.astro/types.d.ts" />
import { defineMiddleware } from "astro:middleware";

// `context` and `next` are automatically typed
export const onRequest = defineMiddleware((context, next) => {
  if (context.url.pathname.endsWith(".br")) {
    context.headers.set("Content-Encoding", "br");
  }
  return next();
});