import {
  json, supabase, normalizeElo, parseJSON, serializePlayer, authenticatedPlayer
} from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const body = await parseJSON(req);
  if (!Number.isFinite(Number(body.elo))) {
    return json({ error: "ELO invalide." }, 400);
  }

  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Session invalide ou expirée." }, 401);

    const elo = normalizeElo(body.elo);
    const q = new URLSearchParams({
      id: `eq.${player.id}`,
      select: "id,name,elo,created_at,updated_at",
    });

    const rows = await supabase(`players?${q.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({
        elo,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!rows?.[0]) return json({ error: "Joueur introuvable." }, 404);
    return json(serializePlayer(rows[0]));
  } catch (error) {
    console.error("elo:", error);
    return json({ error: "Erreur BDD Supabase." }, 500);
  }
}
export const config = { path: "/api/elo" };
