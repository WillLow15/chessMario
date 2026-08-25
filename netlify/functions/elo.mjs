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
    return json({ error: "Nom invalide." }, 400);
  }

  if (!Number.isFinite(Number(body.elo))) {
    return json({ error: "ELO invalide." }, 400);
  }

  const elo = normalizeElo(body.elo);

  try {
    const rows = await db.sql`
      UPDATE players
      SET elo = ${elo}, updated_at = NOW()
      WHERE LOWER(name) = LOWER(${name})
      RETURNING id, name, elo, created_at, updated_at
    `;

    if (!rows[0]) {
      return json({ error: "Joueur introuvable." }, 404);
    }

    return json(serializePlayer(rows[0]));
  } catch (error) {
    console.error("elo:", error);
    return json({ error: "Erreur de base de données." }, 500);
  }
}

export const config = {
  path: "/api/elo",
};
