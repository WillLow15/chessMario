import { getDatabase } from "@netlify/database";

export const db = getDatabase();

export function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export function cleanName(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 20);
}

export function normalizeElo(value, fallback = 1200) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(100, Math.min(4000, parsed));
}

export async function parseJSON(req) {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export function serializePlayer(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name,
    elo: Number(row.elo),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
