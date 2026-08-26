import {
  json, supabase, parseJSON, authenticatedPlayer
} from "../lib/supabase.mjs";

const MODES = new Set(["local", "ai", "remote"]);
const RESULTS = new Set(["win", "loss", "draw"]);
const COLORS = new Set(["w", "b"]);

function boundedInt(value, fallback = null) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(-4000, Math.min(4000, n));
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Session invalide ou expirée." }, 401);

    const body = await parseJSON(req);
    const mode = String(body.mode || "");
    const result = String(body.result || "");
    const playerColor = String(body.player_color || "");

    if (!MODES.has(mode) || !RESULTS.has(result) || !COLORS.has(playerColor)) {
      return json({ error: "Données de partie invalides." }, 400);
    }

    const opponentName = String(body.opponent_name || "Adversaire")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim().slice(0, 40) || "Adversaire";

    const timeControl = String(body.time_control || "10 min")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .trim().slice(0, 20) || "10 min";

    const reason = String(body.reason || "")
      .replace(/[^a-z_-]/gi, "")
      .slice(0, 20);

    await supabase("games", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        player_id: Number(player.id),
        mode,
        opponent_name: opponentName,
        opponent_elo: boundedInt(body.opponent_elo, null),
        player_color: playerColor,
        result,
        reason,
        time_control: timeControl,
        rated: Boolean(body.rated),
        elo_before: boundedInt(body.elo_before, Number(player.elo)),
        elo_after: boundedInt(body.elo_after, Number(player.elo)),
        elo_delta: boundedInt(body.elo_delta, 0) ?? 0,
      }),
    });

    return json({ ok: true });
  } catch (error) {
    console.error("games:", error);
    return json({ error: "Impossible d’enregistrer la partie." }, 500);
  }
}

export const config = { path: "/api/games" };
