import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { env } from "../env";

let client: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set — database features are disabled");
  }
  if (!client) {
    client = drizzle(neon(env.DATABASE_URL), { schema });
  }
  return client;
}
