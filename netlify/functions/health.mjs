import { db, json } from "../lib/db.mjs";

export default async function handler(req) {
  if (req.method !== "GET") {
    return json({ error: "Méthode non autorisée." }, 405);
  }

  try {
    await db.sql`SELECT 1 AS ok`;
    return json({ ok: true, database: "netlify-postgres" });
  } catch (error) {
    console.error("health:", error);
    return json({ ok: false, error: "Database indisponible." }, 500);
  }
}

export const config = {
  path: "/api/health",
};
