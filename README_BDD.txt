MARIO CHESS - BDD SQLITE

LANCEMENT
----------
Windows : double-clique sur LANCER_WINDOWS.bat
Mac/Linux : lance LANCER_MAC_LINUX.command

Puis ouvre :
http://localhost:8000

BASE DE DONNÉES
----------------
Le fichier mario_chess.db est créé automatiquement au premier lancement.

Table "players" :
  - id
  - name
  - elo
  - created_at
  - updated_at

Le nom est unique sans distinction majuscules/minuscules.
Au premier profil, l'ancien ELO local est repris s'il existe, sinon 1200.
Les changements d'ELO sont ensuite synchronisés dans SQLite.

VOIR LES JOUEURS
-----------------
Après avoir lancé le serveur au moins une fois :
  python VOIR_JOUEURS.py

API
---
GET  /api/health
GET  /api/player?name=Pseudo
GET  /api/leaderboard
POST /api/profile
POST /api/elo

IMPORTANT
---------
Cette base est locale à la machine qui exécute server.py.
Pour une base commune à tous les joueurs sur Internet, il faudra héberger
ce backend ou migrer la même API vers un serveur public.
