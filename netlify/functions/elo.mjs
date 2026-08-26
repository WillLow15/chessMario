import { json, supabase, cleanName, nameKey, normalizeElo, parseJSON, serializePlayer } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const body = await parseJSON(req);
  const name = cleanName(body.name);
  if (name.length < 2) return json({ error: "Nom invalide." }, 400);
  if (!Number.isFinite(Number(body.elo))) return json({ error: "ELO invalide." }, 400);

  const elo = normalizeElo(body.elo);
  const q = new URLSearchParams({
    name_key: `eq.${nameKey(name)}`,
    select: "id,name,elo,created_at,updated_at",
  });

  try {
    const rows = await supabase(`players?${q.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ elo, updated_at: new Date().toISOString() }),
    });
    if (!rows?.[0]) return json({ error: "Joueur introuvable." }, 404);
    return json(serializePlayer(rows[0]));
  } catch (error) {
    return json({ error: "Erreur BDD Supabase : " + error.message }, 500);
  }
}
export const config = { path: "/api/elo" };
