# Dark Fantasy V2 — Ashen Crown

Cette version améliore uniquement la couche visuelle Dark Fantasy.

## Changements visuels
- Nouveau fond original vectoriel : citadelle, montagnes, brume, lune et silhouette draconique.
- Suppression du fond V1 dérivé de la maquette d'interface.
- Factions renommées : **Ordre d’Ivoire** et **Légion Noire**.
- Libellés thématiques : Âmes capturées, Chronique des coups, Présages, Duels en cours.
- Panneaux avec ornements de coin bronze et hiérarchie plus sobre.
- Échiquier pierre / obsidienne avec textures plus lisibles.
- Meilleur contraste des pièces blanches et noires.
- Chronos et barres de vie retravaillés avec accents braise.
- Modales et barre sticky harmonisées.
- Décorations allégées sur mobile pour conserver la lisibilité et les performances.

## Mécanique
Aucune règle, IA, chrono, réseau, PeerJS, Supabase ou logique de partie n'est modifiée par cette V2.

## Push versionné
Le projet contient maintenant une commande pratique :

```bash
npm run push:patch
```

Elle incrémente automatiquement `1.1.0 -> 1.1.1`, met à jour le lockfile s'il existe, stage les fichiers, commit avec `v1.1.1`, puis pousse la branche courante.
