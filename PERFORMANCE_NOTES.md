# Performance

- Ancien HTML + CSS source : 7.77 Mio.
- Nouveau contrôleur + CSS + JSX source (hors assets) : 315 Kio.
- Assets du thème séparés et cacheables : 1.70 Mio.
- Images du thème converties en WebP lossless pour réduire le transfert sans perte visuelle.
- PeerJS : chunk lazy-load, téléchargé seulement pour le mode en ligne.
- IA : Web Worker, calcul hors du thread principal.
- Vite : minification et cache-friendly production build.
