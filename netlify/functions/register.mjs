import {
  json, supabase, cleanName, nameKey, normalizeElo, parseJSON,
  serializePlayer, hashPassword, createSession
} from "../lib/supabase.mjs";

async function findByNameKey(key) {
  const q = new URLSearchParams({
    name_key: `eq.${key}`,
    select: "id,name,elo,password_hash,password_salt,created_at,updated_at",
    limit: "1",
  });
  const rows = await supabase(`players?${q.toString()}`);
  return rows?.[0] || null;
}

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);

  const body = await parseJSON(req);
  const name = cleanName(body.name);
  const password = String(body.password || "");

  if (name.length < 2) {
    return json({ error: "Le nom doit contenir au moins 2 caractères." }, 400);
  }
  if (password.length < 8 || password.length > 128) {
    return json({ error: "Le mot de passe doit contenir entre 8 et 128 caractères." }, 400);
  }

  const key = nameKey(name);
  const initialElo = normalizeElo(body.initial_elo, 1200);

  try {
    let existing = await findByNameKey(key);
    const secured = await hashPassword(password);

    if (existing?.password_hash) {
      return json({ error: "Ce nom de joueur existe déjà." }, 409);
    }

    let row;
    if (existing) {
      // Migration douce d'un ancien profil v48-v52 sans mot de passe.
      const q = new URLSearchParams({
        id: `eq.${existing.id}`,
        select: "id,name,elo,created_at,updated_at",
      });
      const rows = await supabase(`players?${q.toString()}`, {
        method: "PATCH",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          name,
          password_hash: secured.hash,
          password_salt: secured.salt,
          updated_at: new Date().toISOString(),
        }),
      });
      row = rows?.[0];
    } else {
      const rows = await supabase("players", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          name,
          name_key: key,
          elo: initialElo,
          password_hash: secured.hash,
          password_salt: secured.salt,
        }),
      });
      row = rows?.[0];
    }

    if (!row) return json({ error: "Impossible de créer le profil." }, 500);

    const session = await createSession(row.id);
    return json({
      player: serializePlayer(row),
      token: session.token,
      expires_at: session.expires_at,
    }, 201);
  } catch (error) {
    console.error("register:", error);
    if (error.status === 409) return json({ error: "Ce nom de joueur existe déjà." }, 409);
    return json({ error: "Erreur lors de la création du profil." }, 500);
  }
}
export const config = { path: "/api/register" };
