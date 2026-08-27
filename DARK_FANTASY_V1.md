# Dark Fantasy — thème V1

Cette version conserve le moteur et les fonctionnalités du jeu React existant. Les changements de cette V1 sont limités à la couche thème.

## Identité

- Titre : **Échecs des Ténèbres**
- Palette : charbon, os, bronze ancien, rouge sang
- Échiquier : pierre claire / pierre noire fissurée
- Interface : panneaux sombres, bordures bronze, boutons sang / acier
- Fond : composition Dark Fantasy assombrie et volontairement floutée pour ne pas gêner la lecture du plateau

## Pièces

Les 12 sprites sont de nouveaux SVG légers et indépendants du thème Mario.

Blancs : Roi des Cendres, Reine Spectrale, Bastion d’Ivoire, Oracle Pâle, Chevalier Éthéré, Acolyte des Cendres.

Noirs : Roi Sans Nom, Reine du Voile, Tour de l’Abîme, Prélat Noir, Cavalier Maudit, Serviteur des Ténèbres.

## Effets

La mécanique de capture reste inchangée : projectile d'abord, impact, disparition de la cible, déplacement de l'attaquant. Seul le visuel du projectile est remplacé par une âme spectrale.

## Séparation des thèmes

- `src/themes/mario.js` : thème Mario conservé
- `src/themes/darkFantasy.js` : nouveau thème
- `src/themes/index.js` : registre des thèmes

Le thème par défaut de ce ZIP est `dark-fantasy`.

Pour vérifier le thème Mario sans modifier le code :

`/?theme=mario`

Pour revenir explicitement au thème Dark Fantasy :

`/?theme=dark-fantasy`

Le moteur de jeu, Supabase, PeerJS, l’IA, les chronos et les règles ne changent pas selon le thème.
