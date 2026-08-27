export const marioTheme = Object.freeze({
  id: 'mario',
  label: 'Mario Bros',
  pieces: {
  "w": {
    "k": {
      "src": "/assets/mario/king-boo.webp",
      "name": "Roi Boo"
    },
    "q": {
      "src": "/assets/mario/peach.webp",
      "name": "Princesse Peach"
    },
    "r": {
      "src": "/assets/mario/wario.webp",
      "name": "Wario"
    },
    "b": {
      "src": "/assets/mario/koopa-troopa.webp",
      "name": "Koopa Troopa"
    },
    "n": {
      "src": "/assets/mario/yoshi.webp",
      "name": "Yoshi"
    },
    "p": {
      "src": "/assets/mario/toad.webp",
      "name": "Toad"
    }
  },
  "b": {
    "k": {
      "src": "/assets/mario/donkey-kong.webp",
      "name": "Donkey Kong"
    },
    "q": {
      "src": "/assets/mario/daisy.webp",
      "name": "Daisy"
    },
    "r": {
      "src": "/assets/mario/wario.webp",
      "name": "Wario"
    },
    "b": {
      "src": "/assets/mario/koopa-troopa.webp",
      "name": "Koopa Troopa"
    },
    "n": {
      "src": "/assets/mario/yoshi.webp",
      "name": "Yoshi"
    },
    "p": {
      "src": "/assets/mario/goomba.webp",
      "name": "Goomba"
    }
  }
},
  effects: {
    shellGreen: "/assets/mario/shell-green.webp",
    shellRed: "/assets/mario/shell-red.webp",
    resultCharacter: "/assets/mario/lakitu-result.webp"
  }
});

export const themes = Object.freeze({ mario: marioTheme });
export function getTheme(id = 'mario') { return themes[id] || marioTheme; }
