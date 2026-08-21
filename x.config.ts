import { defineConfig } from "@thexjs/core";

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
  "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
  "img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://*.clerk.accounts.dev",
  "connect-src 'self' https://api.clerk.com https://*.clerk.com https://*.clerk.accounts.dev wss://*.liveblocks.io https://*.liveblocks.io",
  "worker-src 'self' blob:",
  "frame-src https://accounts.google.com https://*.clerk.accounts.dev",
  "object-src 'none'",
  "base-uri 'self'",
].join("; ");

export default defineConfig({
  pagesDir: "src/pages",
  apiDir: "src/api",
  layoutsDir: "src/layouts",
  port: 3000,
  security: {
    headers: {
      contentSecurityPolicy: csp,
    },
  },
});
