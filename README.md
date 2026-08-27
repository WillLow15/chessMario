# Mario Chess — React V2

Migration de la version v77 vers React + Vite.

## Architecture

- `src/components/` : structure React de l'interface.
- `src/game/controller.js` : contrôleur de jeu, réseau, compte et animations, extrait de l'ancien HTML.
- `src/themes/mario.js` : thème Mario centralisé. Les futurs thèmes Rock/Metal et Monstres pourront être ajoutés à côté.
- `src/workers/ai.worker.js` : calcul de l'IA hors du thread principal.
- Le frontend conserve l'API chess.js historique via un alias npm, tandis que les fonctions Netlify gardent chess.js 1.4.0.
- `src/styles/app.css` : CSS historique, désormais bundlé/minifié par Vite.
- `public/assets/mario/` : images sorties des data-URLs pour permettre le cache navigateur.
- `netlify/functions/` : backend Netlify/Supabase conservé.

## Lancer en local

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Netlify publie désormais `dist/` et exécute automatiquement `npm run build`.

## Déploiement recommandé

Pousser cette version sur la branche `refactor/react-v2`. Conserver `main` comme branche de production tant que la V2 React n'est pas validée.

## Supabase

Aucune migration SQL supplémentaire n'est introduite par la migration React. Utiliser le même environnement Supabase et les mêmes variables Netlify que la version actuelle.

## Compatibilité fonctionnelle

La logique v77 est volontairement conservée dans le contrôleur lors de cette première migration afin de ne pas régresser les modes local, IA, PeerJS, différé, ELO, profil et animations. L'UI est montée par React et les ressources sont désormais modulaires/cacheables. Cela fournit une base sûre pour migrer progressivement les états du contrôleur vers des hooks/stores React sans réécrire le gameplay en une seule fois.
