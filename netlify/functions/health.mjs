import { json, supabase } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "GET") return json({ error: "Méthode non autorisée." }, 405);
  try {
    await supabase("players?select=id&limit=1");
    return json({ ok: true, database: "supabase-postgres" });
  } catch (error) {
    console.error("health:", error);
    return json({ ok: false, error: error.message }, 500);
  }
}
export const config = { path: "/api/health" };
