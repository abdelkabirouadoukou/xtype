import { db } from "@/lib/storage/db";

interface SignResponse {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

async function getAuthToken(): Promise<string | null> {
  const clerk = (window as unknown as {
    Clerk?: { session?: { getToken: () => Promise<string | null> } | null };
  }).Clerk;
  return (await clerk?.session?.getToken()) ?? null;
}

export async function uploadImage(
  projectId: string,
  file: File,
): Promise<string | null> {
  const token = await getAuthToken();
  if (!token) return null;
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ folder: `xtype/${projectId}` }),
  });
  if (!signRes.ok) return null;
  const sign = (await signRes.json()) as SignResponse;

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", sign.apiKey);
  form.append("timestamp", String(sign.timestamp));
  form.append("signature", sign.signature);
  form.append("folder", sign.folder);
  const upRes = await fetch(
    `https://api.cloudinary.com/v1_1/${sign.cloudName}/auto/upload`,
    { method: "POST", body: form },
  );
  if (!upRes.ok) return null;
  const up = (await upRes.json()) as { secure_url: string };

  await db.assets.add({
    id: crypto.randomUUID().slice(0, 12),
    projectId,
    name: file.name,
    url: up.secure_url,
    createdAt: Date.now(),
  });
  return up.secure_url;
}

export function insertAtCursor(view: unknown, text: string) {
  const v = view as {
    dispatch: (spec: { changes: { from: number; to: number; insert: string } }) => void;
    state: { selection: { main: { from: number; to: number } } };
    focus: () => void;
  };
  const { from, to } = v.state.selection.main;
  v.dispatch({ changes: { from, to, insert: text } });
  v.focus();
}
