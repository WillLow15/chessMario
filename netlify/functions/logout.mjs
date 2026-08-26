import { json, destroySession } from "../lib/supabase.mjs";

export default async function handler(req) {
  if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
  try { await destroySession(req); } catch (error) { console.error("logout:", error); }
  return json({ ok: true });
}
export const config = { path: "/api/logout" };
