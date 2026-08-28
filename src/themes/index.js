import { marioTheme } from './mario.js';
import { darkFantasyTheme } from './darkFantasy.js';

const THEME_STORAGE_KEY='chessThemeV1';

export const themes=Object.freeze({
  mario:marioTheme,
  'dark-fantasy':darkFantasyTheme
});

export const themeChoices=Object.freeze([
  Object.freeze({
    id:'mario',
    label:'Royaume Mario',
    description:'Coloré · arcade · personnages Mario',
    preview:'/assets/mario/king-boo.webp'
  }),
  Object.freeze({
    id:'dark-fantasy',
    label:'Royaume des Ténèbres',
    description:'Gothique · cendres · dark fantasy',
    preview:'/assets/dark-fantasy/dark-emblem.svg'
  })
]);

export function getTheme(id='dark-fantasy'){
  return themes[id]||darkFantasyTheme;
}

export function getThemeUrlOverride(){
  try{
    const fromUrl=new URLSearchParams(window.location.search).get('theme');
    return fromUrl&&themes[fromUrl]?fromUrl:null;
  }catch{}
  return null;
}

export function resolveThemeId(){
  try{
    const fromUrl=getThemeUrlOverride();
    if(fromUrl)return fromUrl;

    const stored=localStorage.getItem(THEME_STORAGE_KEY);
    if(stored&&themes[stored])return stored;
  }catch{}

  return 'dark-fantasy';
}

export function saveTheme(id){
  if(!themes[id])return false;
  try{localStorage.setItem(THEME_STORAGE_KEY,id);}catch{}
  return true;
}

export let activeTheme=getTheme(resolveThemeId());

export function setActiveTheme(id,{persist=true,clearUrlOverride=false}={}){
  if(!themes[id])return activeTheme;

  activeTheme=themes[id];

  if(persist)saveTheme(id);

  if(clearUrlOverride){
    try{
      const url=new URL(window.location.href);
      if(url.searchParams.has('theme')){
        url.searchParams.delete('theme');
        window.history.replaceState(window.history.state,'',url);
      }
    }catch{}
  }

  return activeTheme;
}
