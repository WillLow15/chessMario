import {
  json, supabase, cleanName, nameKey, parseJSON, serializePlayer,
  verifyPassword, createSession
} from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const body = await parseJSON(req);
  const name = cleanName(body.name);
  const password = String(body.password || "");

  if (!name || !password) {
    return json({ error: "Nom et mot de passe requis." }, 400);
  }

  try {
    const q = new URLSearchParams({
      name_key: `eq.${nameKey(name)}`,
      select: "id,name,elo,password_hash,password_salt,created_at,updated_at",
      limit: "1",
    });
    const rows = await supabase(`players?${q.toString()}`);
    const row = rows?.[0];

    // Même erreur qu'un mauvais mot de passe pour limiter les indices.
    if (!row || !row.password_hash) {
      return json({ error: "Identifiants incorrects." }, 401);
    }

    const valid = await verifyPassword(password, row.password_salt, row.password_hash);
    if (!valid) return json({ error: "Identifiants incorrects." }, 401);

    const session = await createSession(row.id);
    return json({
      player: serializePlayer(row),
      token: session.token,
      expires_at: session.expires_at,
    });
  } catch (error) {
    console.error("login:", error);
    return json({ error: "Erreur de connexion." }, 500);
  }
}
export const config = { path: "/api/login" };
