import { json, supabase, cleanName, nameKey } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  let body = {};
  try { body = await req.json(); } catch {}

  const name = cleanName(body.name);

  if (!name || name.length < 2) {
    return json({
      error: "Pseudo invalide.",
      code: "INVALID_PROFILE_NAME"
    }, 400);
  }

  try {
    const q = new URLSearchParams({
      name_key: `eq.${nameKey(name)}`,
      password_hash: "not.is.null",
      select: "name",
      limit: "1",
    });

    const rows = await supabase(`players?${q.toString()}`);
    const row = rows?.[0];

    // Vérification volontairement exacte : orthographe, accents et casse.
    if (!row || cleanName(row.name) !== name) {
      return json({
        exists: false,
        error: "Pseudo introuvable ou mal orthographié.",
        code: "PROFILE_NOT_FOUND"
      }, 404);
    }

    return json({ exists: true });
  } catch (error) {
    console.error("profile-check:", error);
    return json({ error: "Impossible de vérifier le pseudo." }, 500);
  }
}

export const config = { path: "/api/profile-check" };
