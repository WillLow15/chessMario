import { db, json, serializePlayer } from "../lib/db.mjs";

export default async function handler(req) {
  if (req.method !== "GET") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  try {
    const rows = await db.sql`
      SELECT id, name, elo, created_at, updated_at
      FROM players
      ORDER BY elo DESC, updated_at ASC
      LIMIT 100
    `;

    return json({
      players: rows.map(serializePlayer),
    });
  } catch (error) {
    console.error("leaderboard:", error);
    return json({ error: "Erreur de base de données." }, 500);
  }
}

export const config = {
  path: "/api/leaderboard",
};
