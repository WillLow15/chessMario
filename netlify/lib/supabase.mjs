import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scryptCallback);

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

export function nameKey(name) {
  return cleanName(name).toLocaleLowerCase("fr");
}

export function normalizeElo(value, fallback = 1200) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(100, Math.min(4000, n));
}

export async function parseJSON(req) {
  try { return await req.json(); } catch { return {}; }
}

function config() {
  const url = String(process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url || !key) {
    throw new Error("SUPABASE_URL / SUPABASE_SECRET_KEY manquant dans Netlify");
  }
  return { url, key };
}

export async function supabase(path, options = {}) {
  const { url, key } = config();
  const headers = {
    apikey: key,
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch { data = text; }
  }

  if (!response.ok) {
    const message =
      data?.message || data?.hint || data?.details ||
      `Supabase HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    err.data = data;
    throw err;
  }
  return data;
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

export async function hashPassword(password, saltHex = "") {
  const salt = saltHex || randomBytes(16).toString("hex");
  const derived = await scryptAsync(String(password), Buffer.from(salt, "hex"), 64);
  return {
    salt,
    hash: Buffer.from(derived).toString("base64"),
  };
}

export async function verifyPassword(password, saltHex, expectedBase64) {
  if (!saltHex || !expectedBase64) return false;
  const derived = await scryptAsync(String(password), Buffer.from(saltHex, "hex"), 64);
  const actual = Buffer.from(derived);
  const expected = Buffer.from(expectedBase64, "base64");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function hashSessionToken(token) {
  return createHash("sha256").update(String(token)).digest("hex");
}

export async function createSession(playerId) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase("sessions", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      player_id: Number(playerId),
      token_hash: tokenHash,
      expires_at: expiresAt,
    }),
  });

  return { token, expires_at: expiresAt };
}

export function bearerToken(req) {
  const header = String(req.headers.get("authorization") || "");
  if (!header.toLowerCase().startsWith("bearer ")) return "";
  return header.slice(7).trim();
}

export async function authenticatedPlayer(req) {
  const token = bearerToken(req);
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const now = new Date().toISOString();
  const q = new URLSearchParams({
    token_hash: `eq.${tokenHash}`,
    expires_at: `gt.${now}`,
    select: "player_id,expires_at",
    limit: "1",
  });

  const sessions = await supabase(`sessions?${q.toString()}`);
  const session = sessions?.[0];
  if (!session) return null;

  const qp = new URLSearchParams({
    id: `eq.${session.player_id}`,
    select: "id,name,elo,created_at,updated_at",
    limit: "1",
  });
  const players = await supabase(`players?${qp.toString()}`);
  return players?.[0] || null;
}

export async function destroySession(req) {
  const token = bearerToken(req);
  if (!token) return;
  const tokenHash = hashSessionToken(token);
  const q = new URLSearchParams({ token_hash: `eq.${tokenHash}` });
  await supabase(`sessions?${q.toString()}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
}
