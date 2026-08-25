import {
  db,
  json,
  cleanName,
  normalizeElo,
  parseJSON,
  serializePlayer,
} from "../lib/db.mjs";

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  const body = await parseJSON(req);
  const name = cleanName(body.name);

  if (name.length < 2) {
    return json({ error: "Le nom doit contenir au moins 2 caractères." }, 400);
  }

  const initialElo = normalizeElo(body.initial_elo, 1200);

  try {
    // Unique index on lower(name) prevents duplicate profiles differing only by case.
    await db.sql`
      INSERT INTO players (name, elo)
      VALUES (${name}, ${initialElo})
      ON CONFLICT DO NOTHING
    `;

    const rows = await db.sql`
      SELECT id, name, elo, created_at, updated_at
      FROM players
      WHERE LOWER(name) = LOWER(${name})
      LIMIT 1
    `;

    if (!rows[0]) {
      return json({ error: "Impossible de créer ou charger le profil." }, 500);
    }

    const player = serializePlayer(rows[0]);
    player.created = player.name === name && player.elo === initialElo;
    return json(player);
  } catch (error) {
    console.error("profile:", error);
    return json({ error: "Erreur de base de données." }, 500);
  }
}

export const config = {
  path: "/api/profile",
};
