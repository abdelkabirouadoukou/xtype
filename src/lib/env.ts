import { createEnv, str, url } from "@thexjs/env";

export const env = createEnv({
  server: {
    DATABASE_URL: url().optional(),
    CLERK_SECRET_KEY: str().optional(),
    CLOUDINARY_CLOUD_NAME: str().optional(),
    CLOUDINARY_API_KEY: str().optional(),
    CLOUDINARY_API_SECRET: str().optional(),
    GROQ_API_KEY: str().optional(),
    LIVEBLOCKS_API_KEY: str().optional(),
  },
  client: {
    THEXJS_PUBLIC_CLERK_PUBLISHABLE_KEY: str().optional(),
    THEXJS_PUBLIC_LIVEBLOCKS_KEY: str().optional(),
  },
  runtimeEnv: process.env,
});

export const hasDb = () => Boolean(env.DATABASE_URL);
export const hasClerk = () =>
  Boolean(env.CLERK_SECRET_KEY && env.THEXJS_PUBLIC_CLERK_PUBLISHABLE_KEY);
