# Notes de migration React

## Gains immédiats

1. L'ancien `index.html` contenait plusieurs Mo d'images en base64. Elles sont désormais dans `public/assets/mario/` et peuvent être mises en cache.
2. Le CSS ne contient plus d'images base64 ; Vite le minifiera au build.
3. PeerJS est chargé avec `import()` seulement lorsque le mode en ligne est utilisé.
4. L'IA calcule dans un Web Worker afin de ne plus bloquer le thread UI.
5. Le shell de l'application est découpé en composants React.
6. Le thème Mario est centralisé dans `src/themes/mario.js` pour préparer d'autres univers.

## Étape suivante recommandée

Une fois cette branche validée fonctionnellement, déplacer progressivement l'état impératif du contrôleur vers des hooks spécialisés (`useGame`, `useClock`, `useRemoteGame`, `useProfile`) ou un store. Cette migration incrémentale évite une réécriture risquée de toutes les règles réseau et animations en même temps.
