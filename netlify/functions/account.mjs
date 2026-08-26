import {
  json, supabase, parseJSON, authenticatedPlayer, verifyPassword
} from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "DELETE") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Session invalide ou expirée." }, 401);

    const body = await parseJSON(req);
    const password = String(body.password || "");
    if (!password) return json({ error: "Mot de passe requis." }, 400);

    const q = new URLSearchParams({
      id: `eq.${player.id}`,
      select: "id,password_hash,password_salt",
      limit: "1",
    });

    const rows = await supabase(`players?${q.toString()}`);
    const fullPlayer = rows?.[0];

    if (!fullPlayer?.password_hash || !fullPlayer?.password_salt) {
      return json({ error: "Compte introuvable." }, 404);
    }

    const valid = await verifyPassword(
      password,
      fullPlayer.password_salt,
      fullPlayer.password_hash
    );

    if (!valid) {
      return json({ error: "Mot de passe incorrect.", code: "BAD_PASSWORD" }, 401);
    }

    const del = new URLSearchParams({ id: `eq.${player.id}` });
    await supabase(`players?${del.toString()}`, {
      method: "DELETE",
      headers: { Prefer: "return=minimal" },
    });

    return json({ ok: true });
  } catch (error) {
    console.error("account:", error);
    return json({ error: "Impossible de supprimer le compte." }, 500);
  }
}

export const config = { path: "/api/account" };
