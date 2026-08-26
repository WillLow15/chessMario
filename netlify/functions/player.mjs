import { json, supabase, cleanName, nameKey, serializePlayer } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);
  const url = new URL(req.url);
  const name = cleanName(url.searchParams.get("name"));
  if (!name) return json({ error: "Nom manquant." }, 400);

  const q = new URLSearchParams({
    name_key: `eq.${nameKey(name)}`,
    select: "id,name,elo,created_at,updated_at",
    limit: "1",
  });

  try {
    const rows = await supabase(`players?${q.toString()}`);
    if (!rows?.[0]) return json({ error: "Joueur introuvable." }, 404);
    return json(serializePlayer(rows[0]));
  } catch (error) {
    return json({ error: "Erreur BDD Supabase : " + error.message }, 500);
  }
}
export const config = { path: "/api/player" };
