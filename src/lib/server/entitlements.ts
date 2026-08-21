import { createClerkClient } from "@clerk/backend";
import { env, hasClerk } from "../env";

export type Plan = "free" | "pro";

export const PLAN_LIMITS: Record<Plan, { maxProjects: number }> = {
  free: { maxProjects: 3 },
  pro: { maxProjects: Number.POSITIVE_INFINITY },
};

export async function getPlan(userId: string): Promise<Plan> {
  if (!hasClerk()) return "pro";
  try {
    const client = createClerkClient({ secretKey: env.CLERK_SECRET_KEY! });
    const user = await client.users.getUser(userId);
    const meta = (user.publicMetadata ?? {}) as { plan?: string };
    return meta.plan === "pro" ? "pro" : "free";
  } catch {
    return "free";
  }
}

export function withinProjectLimit(plan: Plan, count: number): boolean {
  return count < PLAN_LIMITS[plan].maxProjects;
}
