import { json, supabase, serializePlayer } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const rows = await supabase(
      "players?select=id,name,elo,created_at,updated_at&order=elo.desc,updated_at.asc&limit=100"
    );
    return json({ players: (rows || []).map(serializePlayer) });
  } catch (error) {
    return json({ error: "Erreur BDD Supabase : " + error.message }, 500);
  }
}
export const config = { path: "/api/leaderboard" };
