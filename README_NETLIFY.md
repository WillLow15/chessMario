# Mario Chess — Netlify + Database

Cette version remplace SQLite par Netlify Database (Postgres) et utilise
des Netlify Functions pour les routes `/api/*`.

## Structure

- `public/index.html` : jeu
- `netlify/functions/` : API serveur
- `netlify/database/migrations/0001_create_players.sql` : table `players`
- `package.json` : dépendance `@netlify/database`
- `netlify.toml` : configuration Netlify

## Déploiement recommandé

Tu n'as pas besoin d'exécuter `npm install` sur ton ordinateur si tu déploies depuis Git.

1. Mets ce dossier complet dans le dépôt relié à Netlify.
2. Active **Netlify Database** depuis l'interface Netlify.
3. Déclenche un nouveau déploiement.
4. Netlify utilise Node 22.13 et installe automatiquement `@netlify/database@2.0.0`.
5. La migration SQL est appliquée pendant le déploiement.

Pour un test local, utilise Node 22.13+ puis `npm install` et `netlify dev`.

## Tester après le déploiement

Ouvre :
- `/api/health`
- `/api/leaderboard`

`/api/health` doit renvoyer un JSON avec `"ok": true`.

## Développement local

Utilise `netlify dev` et non l'ancien `server.py`.

## Données enregistrées

Table `players` :
- `id`
- `name`
- `elo`
- `created_at`
- `updated_at`

Le nom est unique sans distinction majuscules/minuscules.

## Important

Le système actuel identifie un joueur par son pseudo, sans mot de passe ni
compte authentifié. Il fonctionne pour stocker le nom et l'ELO, mais un
système public compétitif devrait ensuite ajouter une authentification afin
d'empêcher l'usurpation d'un pseudo ou la modification frauduleuse d'un ELO.
