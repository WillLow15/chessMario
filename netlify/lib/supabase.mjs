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
