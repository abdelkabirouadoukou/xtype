import type { MiddlewareContext, MiddlewareNext, MiddlewareFn } from "@thexjs/core";


async function crossOriginIsolation(_ctx: MiddlewareContext,
  next: MiddlewareNext,
): Promise<Response> {
  const res = await next();
  const headers = new Headers(res.headers);
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "credentialless");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

export const middleware: MiddlewareFn = crossOriginIsolation;
