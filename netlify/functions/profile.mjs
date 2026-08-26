import { json, supabase, cleanName, nameKey, normalizeElo, parseJSON, serializePlayer } from "../lib/supabase.mjs";

async function findPlayer(key) {
  const q = new URLSearchParams({
    name_key: `eq.${key}`,
    select: "id,name,elo,created_at,updated_at",
    limit: "1",
  });
  const rows = await supabase(`players?${q.toString()}`);
  return rows?.[0] || null;
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const body = await parseJSON(req);
  const name = cleanName(body.name);
  if (name.length < 2) return json({ error: "Le nom doit contenir au moins 2 caractères." }, 400);

  const key = nameKey(name);
  const initialElo = normalizeElo(body.initial_elo, 1200);

  try {
    let row = await findPlayer(key);
    let created = false;

    if (!row) {
      try {
        const rows = await supabase("players", {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ name, name_key: key, elo: initialElo }),
        });
        row = rows?.[0] || null;
        created = true;
      } catch (error) {
        if (error.status !== 409) throw error;
        row = await findPlayer(key);
      }
    }

    if (!row) return json({ error: "Profil introuvable." }, 500);
    return json({ ...serializePlayer(row), created });
  } catch (error) {
    console.error("profile:", error);
    return json({ error: "Erreur BDD Supabase : " + error.message }, 500);
  }
}
export const config = { path: "/api/profile" };
