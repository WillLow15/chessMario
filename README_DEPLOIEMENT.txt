MARIO CHESS - NETLIFY + SUPABASE v53
=====================================

NOUVEAU : COMPTES JOUEURS
--------------------------
Au démarrage :
- un nouveau joueur crée un profil avec NOM + MOT DE PASSE ;
- un joueur existant sélectionne son profil dans une liste puis saisit son mot de passe.

SÉCURITÉ
--------
Les mots de passe ne sont JAMAIS enregistrés en clair.
Le backend Netlify les hache avec scrypt + un salt aléatoire.

Après connexion, une session aléatoire de 30 jours est créée.
Seul le hash du token de session est enregistré dans Supabase.

La route /api/elo identifie maintenant le joueur via sa session :
un joueur connecté ne peut plus changer l'ELO d'un autre profil en envoyant
simplement un autre nom dans la requête.

MISE À JOUR DE LA BDD
---------------------
IMPORTANT : retourne dans Supabase > SQL Editor et exécute À NOUVEAU
le fichier SUPABASE_SETUP.sql de cette v53.

Il ajoute :
- password_hash
- password_salt
- table sessions
- permissions service_role nécessaires

Les anciens profils v51/v52 sans mot de passe peuvent être "réclamés" une fois :
si tu crées un profil avec exactement leur ancien nom, un mot de passe leur
sera ajouté en conservant leur ELO existant.

NETLIFY
-------
Conserve :
SUPABASE_URL
SUPABASE_SECRET_KEY

Aucune nouvelle variable d'environnement n'est nécessaire.

TESTS APRÈS DÉPLOIEMENT
-----------------------
/api/health
  -> {"ok":true,"database":"supabase-postgres"}

/api/profiles
  -> {"profiles":[]}
     puis la liste des profils ayant un mot de passe.

IMPORTANT
---------
Le système protège l'accès au profil et empêche la modification de l'ELO
d'un autre joueur via son pseudo. Cependant, le calcul ELO est encore initié
par le client du jeu. Pour un classement anti-triche strict, il faudra ensuite
faire valider les résultats des parties côté serveur.


V54 - NOMS DANS LES ÉQUIPES
----------------------------
- Le pseudo connecté apparaît dans l'équipe correspondant à sa couleur.
- Contre l'IA, un nom rigolo aléatoire est généré et suivi de ' - IA'.
- En multijoueur à distance, les deux pseudos sont échangés entre navigateurs.


V55 - INDICATION DES CAPTURES
-----------------------------
- Une pièce adverse capturable est entourée en rouge uniquement après sélection de la pièce preneuse.
- Aucun adversaire n'est marqué si aucune pièce n'est sélectionnée.
- Les déplacements sans capture conservent le point vert.
- En passant : le pion réellement capturé est marqué en rouge et la case d'arrivée en rouge discret.


V60 - MODE INVITÉ
-----------------
L'écran de connexion propose maintenant "JOUER EN INVITÉ".

En invité :
- aucune création de profil Supabase ;
- aucun mot de passe ;
- aucun ELO sauvegardé ;
- aucune session en base ;
- l'ELO est affiché NON CLASSÉ ;
- une partie distante avec au moins un invité est non classée pour les deux joueurs ;
- le mode invité disparaît au rechargement de la page.


V61 - BARRES DE VIE COMPACTES
-----------------------------
- Réduction du padding vertical.
- VS central plus petit.
- Labels et score plus rapprochés des barres.
- Hauteur des barres réduite tout en restant lisibles.
- Optimisation spécifique mobile/iPhone.


V62 - BARRES DE VIE ULTRA FINES
--------------------------------
- Réduction supplémentaire de la hauteur globale.
- Barres plus fines.
- VS et score central plus petits.
- Padding vertical encore réduit.


V63 - BARRES DE VIE PLUS FINES
--------------------------------
- Jauges desktop : 9 px.
- Jauges mobile : 8 px.
- Jauges petits iPhone : 7 px.


V64 - BARRES DE VIE : ESPACEMENT + FINESSE
-------------------------------------------
- Jauges légèrement plus fines.
- Petit margin-top ajouté.
- Petit margin-bottom ajouté.


V65 - BARRES DE VIE FORCÉES
----------------------------
- Largeur forcée à ~78-82% sur desktop.
- Épaisseur forcée à 6 px.
- Bordure réduite à 1 px.
- Alignement blanc à gauche / noir à droite.
- Overrides avec sélecteurs plus spécifiques + !important.


V67 - CSS EXTERNALISÉ
---------------------
- Tout le CSS du bloc <style> a été déplacé vers public/style.css.
- index.html charge maintenant style.css via <link rel="stylesheet">.
- Aucun attribut style inline n'est utilisé.
- Barres de vie : height 10 px, margin-top/bottom 7 px.


V68 - CONNEXION PAR PSEUDO TEXTE
---------------------------------
- Menu déroulant des profils supprimé.
- Champ texte PSEUDO à la connexion.
- Vérification du pseudo contre Supabase au blur et avant connexion.
- Correspondance exacte : orthographe, accents et casse.
- Le serveur refait la vérification avant le mot de passe.
- Endpoint public /api/profiles supprimé.
- Nouvel endpoint /api/profile-check.


V69 - MENU STICKY + PROFIL / STATS
-----------------------------------
- Menu sticky en bas : Jouer / Profil.
- Cadences : 1 min, 5 min, 10 min, 15 | 10.
- 15 | 10 = 15 minutes + incrément Fischer de 10 secondes par coup.
- La cadence est synchronisée par l'hôte en partie à distance.
- Profil : ELO, date de création, stats et historique des 50 dernières parties.
- Suppression de compte protégée par le mot de passe.
- Nouvelle table Supabase public.games.
- IMPORTANT : exécuter à nouveau SUPABASE_SETUP.sql dans Supabase.
- L'historique démarre à partir de la v69.


V70 - 30 MIN + PARTIES DIFFÉRÉES 3 JOURS
------------------------------------------
- Nouvelle cadence 30 min (30+0).
- Nouveau mode 3 jours par coup, persistant dans Supabase.
- Création/rejoindre par code 6 caractères.
- Les parties différées peuvent être fermées puis reprises plus tard depuis Jouer > 3 jours.
- Le délai de 3 jours est réinitialisé après chaque coup.
- Expiration serveur : si le délai est dépassé, le joueur au trait perd au temps.
- Les parties différées sont non classées mais apparaissent dans l’historique du profil.
- IMPORTANT : exécuter à nouveau SUPABASE_SETUP.sql une fois après le déploiement v70.


V71 - PARTIES EN COURS DANS LA COLONNE GAUCHE
------------------------------------------------
- Nouvelle section « Parties en cours » en haut du panneau gauche.
- Aperçu miniature de chaque partie différée directement depuis son FEN.
- Affichage des deux pseudos et de leurs classements ELO.
- Indication claire du joueur dont c’est le tour et du délai restant.
- Clic sur une partie active : ouverture directe de la partie.
- Partie en attente : accès au code à partager.
- Mise à jour automatique après connexion, création, rejoint, coup joué, retour sur l’onglet et toutes les 60 secondes.
- Aucune migration Supabase supplémentaire n’est nécessaire pour la v71.


V72 - ABANDON / NULLE PAR ACCORD
---------------------------------
- Boutons Nulle et Abandonner sous l'échiquier.
- Une nulle proposée doit être acceptée par l'autre joueur humain.
- Nulle acceptée : ELO inchangé (0 point).
- Abandon classé : -10 ELO exact pour le joueur qui abandonne, adversaire +0.
- Parties différées : proposition de nulle persistante en BDD et pénalité d'abandon appliquée côté serveur.
- La section Parties en cours est maintenant sous la section Joueur/Équipe Blancs.
- IMPORTANT : exécuter SUPABASE_SETUP.sql une fois pour ajouter draw_offer_player_id.
