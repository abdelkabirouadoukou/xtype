import { Liveblocks } from "@liveblocks/node";
import { env } from "../lib/env";
import { getAuthUserId, unauthorized } from "../lib/server/auth";

export async function POST(req: Request) {
  const userId = await getAuthUserId(req);
  if (!userId) return unauthorized();
  if (!env.LIVEBLOCKS_API_KEY) {
    return Response.json({ error: "collab-disabled" }, { status: 503 });
  }
  const body = (await req.json().catch(() => null)) as { room?: string } | null;
  if (!body?.room?.startsWith("project-")) {
    return Response.json({ error: "bad-room" }, { status: 400 });
  }
  const liveblocks = new Liveblocks({ secret: env.LIVEBLOCKS_API_KEY });
  const session = liveblocks.prepareSession(body.room, { userInfo: { userId } });
  session.allow(`${body.room}:*`, session.FULL_ACCESS);
  const { body: token, status } = await session.authorize();
  return Response.json(token, { status });
}
