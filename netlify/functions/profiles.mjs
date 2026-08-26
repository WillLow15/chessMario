import { json, supabase } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);

  try {
    const rows = await supabase(
      "players?select=name&password_hash=not.is.null&order=name.asc&limit=500"
    );
    return json({
      profiles: (rows || []).map(row => ({ name: row.name })),
    });
  } catch (error) {
    console.error("profiles:", error);
    return json({ error: "Impossible de charger les profils." }, 500);
  }
}
export const config = { path: "/api/profiles" };
