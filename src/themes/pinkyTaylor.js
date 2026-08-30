export const pinkyTaylorTheme = Object.freeze({
  id: 'pinky-taylor',
  label: 'Pinky Taylor · Ruby Riot',
  documentTitle: 'Chess Worlds · Pinky Taylor',
  shareTitle: 'Chess Worlds · Pinky Taylor',
  aiNames: [
    'Ruby Riot',
    'Blue Heart Bot',
    'Motel Kitty',
    'Punk Pawn',
    'Ivory Trouble',
    'Pink Beast',
    'Doodle Queen',
    'Noisy Bunny',
    'Lucky X',
    'Paper Monster',
    'Neon Scribble',
    'Wild Heart'
  ],
  ui: {
    loaderTitle: 'RUBY RIOT CHESS',
    loaderIcon: '/assets/pinky-taylor/pieces/ruby-king.webp',
    titleParts: [
      { text: 'Ruby', className: 'pinky-title-ruby' },
      { text: 'Riot', className: 'pinky-title-ink' },
      { text: 'Chess', className: 'pinky-title-blue' }
    ],
    whiteAvatar: '/assets/pinky-taylor/pieces/ivory-king.webp',
    blackAvatar: '/assets/pinky-taylor/pieces/ruby-king.webp',
    whiteAvatarAlt: 'Roi Ivoire',
    blackAvatarAlt: 'Roi Rubis',
    whiteTeamTitle: 'Ivory Hearts',
    blackTeamTitle: 'Ruby Riot',
    whiteTeamSubtitle: 'Atelier ivoire',
    blackTeamSubtitle: 'Club rubis',
    lifeTitle: 'Battement des camps',
    whiteCampLabel: 'Ivoire',
    blackCampLabel: 'Rubis',
    ongoingTitle: 'Parties en cours',
    capturedTitle: 'Pièces collectionnées',
    suggestedTitle: 'Idées pour Ivoire',
    moveHistoryTitle: 'Carnet des coups',
    newGameLabel: 'Nouveau match',
    flipBoardLabel: 'Retourner le damier'
  },
  pieces: {
    w: {
      k: { src: '/assets/pinky-taylor/pieces/ivory-king.webp', name: 'Roi Ivoire' },
      q: { src: '/assets/pinky-taylor/pieces/ivory-queen.webp', name: 'Reine Fleur' },
      r: { src: '/assets/pinky-taylor/pieces/ivory-rook.webp', name: 'Tour Ivoire' },
      b: { src: '/assets/pinky-taylor/pieces/ivory-bishop.webp', name: 'Fou Cœur' },
      n: { src: '/assets/pinky-taylor/pieces/ivory-knight.webp', name: 'Lapin Cavalier' },
      p: { src: '/assets/pinky-taylor/pieces/ivory-pawn.webp', name: 'Petit Cœur Ivoire' }
    },
    b: {
      k: { src: '/assets/pinky-taylor/pieces/ruby-king.webp', name: 'Roi Rubis' },
      q: { src: '/assets/pinky-taylor/pieces/ruby-queen.webp', name: 'Reine Fleur Rubis' },
      r: { src: '/assets/pinky-taylor/pieces/ruby-rook.webp', name: 'Tour Rubis' },
      b: { src: '/assets/pinky-taylor/pieces/ruby-bishop.webp', name: 'Fou Cœur Rubis' },
      n: { src: '/assets/pinky-taylor/pieces/ruby-knight.webp', name: 'Lapin Rubis' },
      p: { src: '/assets/pinky-taylor/pieces/ruby-pawn.webp', name: 'Petit Cœur Rubis' }
    }
  },
  effects: {
    shellGreen: '/assets/pinky-taylor/heart-ivory.svg',
    shellRed: '/assets/pinky-taylor/heart-ruby.svg',
    resultCharacter: '/assets/pinky-taylor/pieces/ruby-queen.webp',
    projectileAlt: 'Cœur gribouillé'
  }
});
