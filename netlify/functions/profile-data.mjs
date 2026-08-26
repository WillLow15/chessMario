import {
  json, supabase, authenticatedPlayer, serializePlayer
} from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Session invalide ou expirée." }, 401);

    const historyQuery = new URLSearchParams({
      player_id: `eq.${player.id}`,
      select: "id,mode,opponent_name,opponent_elo,player_color,result,reason,time_control,rated,elo_before,elo_after,elo_delta,created_at",
      order: "created_at.desc",
      limit: "50",
    });

    const statsQuery = new URLSearchParams({
      player_id: `eq.${player.id}`,
      select: "result",
      order: "created_at.desc",
      limit: "5000",
    });

    const [games, rows] = await Promise.all([
      supabase(`games?${historyQuery.toString()}`),
      supabase(`games?${statsQuery.toString()}`),
    ]);

    const stats = { games: 0, wins: 0, draws: 0, losses: 0, win_rate: 0 };

    for (const row of rows || []) {
      stats.games += 1;
      if (row.result === "win") stats.wins += 1;
      else if (row.result === "loss") stats.losses += 1;
      else if (row.result === "draw") stats.draws += 1;
    }

    stats.win_rate = stats.games ? Math.round((stats.wins / stats.games) * 100) : 0;

    return json({
      player: serializePlayer(player),
      stats,
      games: games || [],
    });
  } catch (error) {
    console.error("profile-data:", error);
    return json({ error: "Impossible de charger le profil." }, 500);
  }
}

export const config = { path: "/api/profile-data" };
