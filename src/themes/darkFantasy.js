export const darkFantasyTheme = Object.freeze({
  id: 'dark-fantasy',
  label: 'Dark Fantasy · Ashen Crown',
  documentTitle: 'Échecs des Ténèbres · Ashen Crown',
  shareTitle: 'Échecs des Ténèbres · Ashen Crown',
  aiNames: [
    'Oracle des Cendres',
    'Le Veilleur Noir',
    'Scribe de l’Abîme',
    'Chevalier du Néant',
    'Prélat des Ombres',
    'La Voix du Tombeau',
    'Corbeau d’Obsidienne',
    'Lame du Crépuscule',
    'Gardien des Ruines',
    'Murmure Écarlate',
    'Héraut Sans Visage',
    'Archiviste Maudit'
  ],
  ui: {
    loaderTitle: 'ÉCHECS DES TÉNÈBRES',
    loaderIcon: '/assets/dark-fantasy/dark-emblem.svg',
    titleParts: [
      { text: 'Échecs', className: 'dark-title-main' },
      { text: 'des', className: 'dark-title-mid' },
      { text: 'Ténèbres', className: 'dark-title-main' }
    ],
    whiteAvatar: '/assets/dark-fantasy/pieces/white-king.svg',
    blackAvatar: '/assets/dark-fantasy/pieces/black-king.svg',
    whiteAvatarAlt: 'Roi des Cendres',
    blackAvatarAlt: 'Roi Sans Nom',
    whiteTeamTitle: 'Ordre d’Ivoire',
    blackTeamTitle: 'Légion Noire',
    whiteTeamSubtitle: 'Cour des Cendres',
    blackTeamSubtitle: 'Cour du Voile',
    lifeTitle: 'Souffle des armées',
    whiteCampLabel: 'Ivoire',
    blackCampLabel: 'Ombre',
    ongoingTitle: 'Duels en cours',
    capturedTitle: 'Âmes capturées',
    suggestedTitle: 'Présages pour l’Ivoire',
    moveHistoryTitle: 'Chronique des coups',
    newGameLabel: 'Nouveau duel',
    flipBoardLabel: 'Retourner le champ'
  },
  pieces: {
    w: {
      k: { src: '/assets/dark-fantasy/pieces/white-king.svg', name: 'Roi des Cendres' },
      q: { src: '/assets/dark-fantasy/pieces/white-queen.svg', name: 'Reine Spectrale' },
      r: { src: '/assets/dark-fantasy/pieces/white-rook.svg', name: 'Bastion d’Ivoire' },
      b: { src: '/assets/dark-fantasy/pieces/white-bishop.svg', name: 'Oracle Pâle' },
      n: { src: '/assets/dark-fantasy/pieces/white-knight.svg', name: 'Chevalier Éthéré' },
      p: { src: '/assets/dark-fantasy/pieces/white-pawn.svg', name: 'Acolyte des Cendres' }
    },
    b: {
      k: { src: '/assets/dark-fantasy/pieces/black-king.svg', name: 'Roi Sans Nom' },
      q: { src: '/assets/dark-fantasy/pieces/black-queen.svg', name: 'Reine du Voile' },
      r: { src: '/assets/dark-fantasy/pieces/black-rook.svg', name: 'Tour de l’Abîme' },
      b: { src: '/assets/dark-fantasy/pieces/black-bishop.svg', name: 'Prélat Noir' },
      n: { src: '/assets/dark-fantasy/pieces/black-knight.svg', name: 'Cavalier Maudit' },
      p: { src: '/assets/dark-fantasy/pieces/black-pawn.svg', name: 'Serviteur des Ténèbres' }
    }
  },
  effects: {
    shellGreen: '/assets/dark-fantasy/soul-white.svg',
    shellRed: '/assets/dark-fantasy/soul-black.svg',
    resultCharacter: '/assets/dark-fantasy/death-herald.svg',
    projectileAlt: 'Âme spectrale'
  }
});
