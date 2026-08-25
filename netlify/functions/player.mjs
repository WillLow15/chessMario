import { db, json, cleanName, serializePlayer } from "../lib/db.mjs";

export default async function handler(req) {
  if (req.method !== "GET") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  const url = new URL(req.url);
  const name = cleanName(url.searchParams.get("name"));

  if (!name) {
    return json({ error: "Nom manquant." }, 400);
  }

  try {
    const rows = await db.sql`
      SELECT id, name, elo, created_at, updated_at
      FROM players
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (!rows[0]) {
      return json({ error: "Joueur introuvable." }, 404);
    }

    return json(serializePlayer(rows[0]));
  } catch (error) {
    console.error("player:", error);
    return json({ error: "Erreur de base de données." }, 500);
  }
}

export const config = {
  path: "/api/player",
};
