MARIO CHESS - NETLIFY + SUPABASE
=================================

Cette version N'UTILISE PLUS Netlify Database.
Elle fonctionne avec Netlify Functions + Supabase Postgres.

1. Crée un projet sur Supabase.
2. Dans Supabase > SQL Editor, exécute SUPABASE_SETUP.sql.
3. Dans Supabase > Settings > API Keys, récupère :
   - Project URL
   - une Secret key (sb_secret_...)
4. Dans Netlify > Project configuration > Environment variables, ajoute :
   SUPABASE_URL = https://xxxxx.supabase.co
   SUPABASE_SECRET_KEY = sb_secret_xxxxx
5. Push ce dossier complet sur Git puis redéploie Netlify.
6. Teste :
   https://TON-SITE.netlify.app/api/health

Résultat attendu :
{"ok":true,"database":"supabase-postgres"}

IMPORTANT :
La Secret key reste uniquement dans les variables Netlify.
Ne la mets jamais dans public/index.html.
