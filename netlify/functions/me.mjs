import { json, authenticatedPlayer, serializePlayer } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);
  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Session invalide ou expirée." }, 401);
    return json({ player: serializePlayer(player) });
  } catch (error) {
    console.error("me:", error);
    return json({ error: "Impossible de vérifier la session." }, 500);
  }
}
export const config = { path: "/api/me" };
