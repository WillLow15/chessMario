import { Chess } from 'chess.js-legacy';
import { activeTheme } from '../themes/index.js';

let PeerCtor=null;


let loaderValue=0;
function setLoaderProgress(value,label){
  loaderValue=Math.max(loaderValue,Math.min(100,Math.round(Number(value)||0)));
  const bar=document.getElementById('gameLoaderProgress');
  const pct=document.getElementById('gameLoaderPercent');
  const status=document.getElementById('gameLoaderStatus');
  if(bar)bar.style.width=loaderValue+'%';
  if(pct)pct.textContent=loaderValue+'%';
  if(status&&label)status.textContent=label;
}
function loaderError(message){
  const loader=document.getElementById('gameLoader');
  if(loader)loader.classList.add('error');
  setLoaderProgress(loaderValue,message||'Erreur de chargement');
}
function preloadOneImage(src){
  return new Promise(resolve=>{
    if(!src){resolve();return;}
    const img=new Image();
    let settled=false;
    const done=()=>{
      if(settled)return;
      settled=true;
      resolve();
    };
    img.onload=()=>{
      if(typeof img.decode==='function'){
        img.decode().catch(()=>{}).finally(done);
      }else done();
    };
    img.onerror=done;
    img.src=src;
    if(img.complete)img.onload();
  });
}
async function preloadGameImages(onProgress){
  const sources=[];
  try{
    Object.values(PIECE_SKINS).forEach(side=>{
      Object.values(side).forEach(piece=>{
        if(piece&&piece.src)sources.push(piece.src);
      });
    });
  }catch(e){}
  try{sources.push(SHELL_GREEN_SRC,SHELL_RED_SRC,MATE_CHARACTER_SRC)}catch(e){}
  const unique=[...new Set(sources.filter(Boolean))];
  if(!unique.length){if(onProgress)onProgress(1,1);return;}
  let done=0;
  await Promise.all(unique.map(src=>preloadOneImage(src).finally(()=>{
    done++;
    if(onProgress)onProgress(done,unique.length);
  })));
}
async function waitForRenderedImages(onProgress){
  const imgs=[...document.images];
  if(!imgs.length){if(onProgress)onProgress(1,1);return;}
  let done=0;
  await Promise.all(imgs.map(img=>new Promise(resolve=>{
    const finish=()=>{
      done++;
      if(onProgress)onProgress(done,imgs.length);
      resolve();
    };
    if(img.complete){
      if(typeof img.decode==='function')img.decode().catch(()=>{}).finally(finish);
      else finish();
    }else{
      img.addEventListener('load',finish,{once:true});
      img.addEventListener('error',finish,{once:true});
    }
  })));
}
function waitForWindowLoad(){
  if(document.readyState==='complete')return Promise.resolve();
  return new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));
}
async function finishLoader(){
  setLoaderProgress(100,'Prêt !');
  await new Promise(resolve=>setTimeout(resolve,260));
  const loader=document.getElementById('gameLoader');
  if(loader){
    loader.classList.add('is-done');
    loader.setAttribute('aria-hidden','true');
    setTimeout(()=>loader.remove(),480);
  }
}
setLoaderProgress(3,'Préparation du jeu…');

const $=(id)=>document.getElementById(id);
let PIECE_SKINS=activeTheme.pieces;
let SHELL_GREEN_SRC=activeTheme.effects.shellGreen;
let SHELL_RED_SRC=activeTheme.effects.shellRed;
let MATE_CHARACTER_SRC=activeTheme.effects.resultCharacter;
let PROJECTILE_ALT=activeTheme.effects.projectileAlt||'Projectile';
const PIECE_VALUE={p:1,n:3,b:3,r:5,q:9,k:0};
function pieceData(color,type){return PIECE_SKINS[color][type];}
function winnerColorFromLabel(winner){
  const label=String(winner||'').trim().toLowerCase();
  if(label.includes('blanc'))return 'w';
  if(label.includes('noir'))return 'b';
  return null;
}
function setWinnerKingImage(img,winner){
  if(!img)return;
  const color=winnerColorFromLabel(winner);
  const king=color?pieceData(color,'k'):null;
  img.src=(king&&king.src)||MATE_CHARACTER_SRC;
  img.alt=king?`${king.name} — vainqueur`:'Vainqueur';
  if(color)img.dataset.winnerColor=color;
  else delete img.dataset.winnerColor;
}
function setDrawResultImage(img){
  if(!img)return;
  img.src=MATE_CHARACTER_SRC;
  img.alt='Héraut du résultat';
  delete img.dataset.winnerColor;
}
function makePieceEl(color,type){
  const data=pieceData(color,type);
  const wrap=document.createElement("div");
  wrap.className='piece '+(color==='w'?'white':'black');
  wrap.title=data.name;
  const img=document.createElement('img');
  img.className='piece-img';
  img.src=data.src;
  img.alt=data.name;
  wrap.appendChild(img);
  return wrap;
}
let chess,selected=null,targets=[],flipped=false,lastMove=null,capturedByWhite=[],capturedByBlack=[];

let gameMode=null;
let aiLevel='easy';
let aiThinking=false;
let aiTimer=null;

let peer=null;
let peerConn=null;
let peerScriptPromise=null;
let remoteReady=false;
let remoteIsHost=false;
let remoteRoomCode='';
let remoteReconnectTimer=null;
let remoteHandshakeTimer=null;
let remoteConnectAttempts=0;
let remoteReconnectInProgress=false;
let remoteCreatingRoom=false;
let remoteConnectionGeneration=0;
let remoteLastConnectedAt=0;
const REMOTE_SESSION_STORAGE_KEY='marioChessRemoteSessionV2';
const REMOTE_SESSION_LEGACY_KEY='marioChessRemoteSessionV1';
const REMOTE_SESSION_TTL_MS=24*60*60*1000;

let correspondenceGameId=null;
let correspondenceVersion=0;
let correspondenceDeadline=null;
let correspondenceStatus='';
let correspondenceResult=null;
let correspondenceReason='';
let correspondenceDrawOfferBy=null;
let correspondencePollTimer=null;
let correspondenceLoading=false;
let ongoingGamesPollTimer=null;

let manualGameFinished=false;
let manualGameResult=null;
let manualGameReason='';
let remoteDrawOfferByMe=false;
let remoteDrawOfferIncoming=false;
let lastPromptedDrawOfferKey='';
let gameActionPrimaryHandler=null;
let gameActionSecondaryHandler=null;

const AUTH_TOKEN_STORAGE_KEY='marioChessSessionV1';
const LAST_PROFILE_STORAGE_KEY='marioChessLastProfileV1';

let playerName='';
let authToken='';
let databaseAvailable=false;
let profileLoaded=false;
let isGuest=false;
let remoteOpponentGuest=false;

function cleanPlayerName(value){
  return String(value||'')
    .replace(/[\u0000-\u001F\u007F]/g,'')
    .replace(/\s+/g,' ')
    .trim()
    .slice(0,20);
}
function loadAuthToken(){
  try{return String(localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)||'')}
  catch(e){return ''}
}
function saveAuthToken(token){
  authToken=String(token||'');
  try{
    if(authToken)localStorage.setItem(AUTH_TOKEN_STORAGE_KEY,authToken);
    else localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }catch(e){}
}
function loadLastProfile(){
  try{return cleanPlayerName(localStorage.getItem(LAST_PROFILE_STORAGE_KEY)||'')}
  catch(e){return ''}
}
function saveLastProfile(){
  try{
    if(playerName)localStorage.setItem(LAST_PROFILE_STORAGE_KEY,playerName);
  }catch(e){}
}
async function apiJSON(url,options={}){
  const headers={'Content-Type':'application/json',...(options.headers||{})};
  if(authToken)headers.Authorization='Bearer '+authToken;

  const response=await fetch(url,{
    ...options,
    headers,
    cache:'no-store'
  });
  let payload={};
  try{payload=await response.json()}catch(e){}
  if(!response.ok){
    const err=new Error(payload.error||('Erreur serveur '+response.status));
    err.status=response.status;
    err.code=payload.code||'';
    throw err;
  }
  return payload;
}
function applyAuthenticatedPlayer(player,token=''){
  isGuest=false;
  remoteOpponentGuest=false;
  if(token)saveAuthToken(token);
  playerName=cleanPlayerName(player&&player.name);
  if(Number.isFinite(Number(player&&player.elo)))playerElo=Number(player.elo);
  databaseAvailable=true;
  profileLoaded=true;
  saveLastProfile();
  try{localStorage.setItem(ELO_STORAGE_KEY,String(playerElo))}catch(e){}
  renderProfile();
  renderElo();
  renderTeamNames();
  loadOngoingCorrespondenceSidebar(true);
}
function renderProfile(){
  const nameEl=$('profileNameDisplay');
  const eloEl=$('profileEloDisplay');
  const badge=$('dbProfileBadge');

  if(nameEl)nameEl.textContent=isGuest?'Invité':(playerName||'Joueur');
  if(eloEl)eloEl.textContent=isGuest?'NON CLASSÉ':(playerElo+' ELO');

  if(badge)badge.classList.toggle('guest',isGuest);

  const changeBtn=$('changeProfileBtn');
  if(changeBtn)changeBtn.textContent=isGuest?'Se connecter':'Changer';
  const bottomProfile=$('bottomProfileLabel');
  if(bottomProfile)bottomProfile.textContent=isGuest?'Invité':(playerName||'Mon compte');
}
function setAuthStatus(message,kind=''){
  const status=$('profileStatus');
  if(!status)return;
  status.textContent=message||'';
  status.className='profile-status'+(kind?' '+kind:'');
}
function switchAuthMode(mode){
  const login=mode!=='register';
  $('authLoginPanel')?.classList.toggle('hidden',!login);
  $('authRegisterPanel')?.classList.toggle('hidden',login);
  $('authLoginTab')?.classList.toggle('active',login);
  $('authRegisterTab')?.classList.toggle('active',!login);

  setAuthStatus(login
    ? 'Entre exactement le pseudo enregistré dans la base, puis ton mot de passe.'
    : 'Le mot de passe sera haché avec scrypt côté serveur et jamais stocké en clair.'
  );

  setTimeout(()=>{
    if(login)$('loginProfileInput')?.focus();
    else $('registerNameInput')?.focus();
  },80);
}
function showProfileOverlay(message='',mode='login'){
  const overlay=$('profileOverlay');
  switchAuthMode(mode);
  if(message)setAuthStatus(message);
  if(overlay){
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
  if(mode==='login'){
    const input=$('loginProfileInput');
    if(input && !cleanPlayerName(input.value)){
      const last=loadLastProfile();
      if(last)input.value=last;
    }
    setProfileNameCheck('');
  }
}
function hideProfileOverlay(){
  const overlay=$('profileOverlay');
  if(overlay){
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }
}
let verifiedLoginProfileName='';

function setProfileNameCheck(message,kind=''){
  const el=$('profileNameCheck');
  if(!el)return;
  el.textContent=message||'';
  el.className='profile-name-check'+(kind?' '+kind:'');
}

async function checkLoginProfileName({silent=false}={}){
  const input=$('loginProfileInput');
  const name=cleanPlayerName(input?.value);

  verifiedLoginProfileName='';

  if(!name){
    if(!silent)setProfileNameCheck('Entre ton pseudo.','error');
    return false;
  }
  if(name.length<2){
    if(!silent)setProfileNameCheck('Le pseudo doit contenir au moins 2 caractères.','error');
    return false;
  }

  if(!silent)setProfileNameCheck('Vérification du pseudo…');

  try{
    const data=await apiJSON('/api/profile-check',{
      method:'POST',
      body:JSON.stringify({name})
    });

    if(data?.exists===true){
      verifiedLoginProfileName=name;
      setProfileNameCheck('Pseudo reconnu.','ok');
      return true;
    }

    setProfileNameCheck('Pseudo introuvable ou mal orthographié.','error');
    return false;
  }catch(err){
    if(err.status===404 || err.code==='PROFILE_NOT_FOUND'){
      setProfileNameCheck('Pseudo introuvable ou mal orthographié.','error');
      return false;
    }
    setProfileNameCheck(err.message||'Impossible de vérifier le pseudo.','error');
    return false;
  }
}

async function registerPlayerProfile(){
  const name=cleanPlayerName($('registerNameInput')?.value);
  const password=String($('registerPasswordInput')?.value||'');
  const confirm=String($('registerPasswordConfirmInput')?.value||'');
  const btn=$('registerProfileBtn');

  if(name.length<2){
    setAuthStatus('Le nom doit contenir au moins 2 caractères.','error');
    return;
  }
  if(password.length<8){
    setAuthStatus('Le mot de passe doit contenir au moins 8 caractères.','error');
    return;
  }
  if(password!==confirm){
    setAuthStatus('Les deux mots de passe ne correspondent pas.','error');
    return;
  }

  if(btn)btn.disabled=true;
  setAuthStatus('Création sécurisée du profil…');

  try{
    const data=await apiJSON('/api/register',{
      method:'POST',
      body:JSON.stringify({name,password,initial_elo:playerElo})
    });
    applyAuthenticatedPlayer(data.player,data.token);
    $('registerPasswordInput').value='';
    $('registerPasswordConfirmInput').value='';
    setAuthStatus('Profil créé et connecté.','ok');
    setTimeout(hideProfileOverlay,180);
  }catch(err){
    setAuthStatus(err.message||'Impossible de créer le profil.','error');
  }finally{
    if(btn)btn.disabled=false;
  }
}
async function loginPlayerProfile(){
  const name=cleanPlayerName($('loginProfileInput')?.value);
  const password=String($('loginPasswordInput')?.value||'');
  const btn=$('loginProfileBtn');

  if(!name){
    setAuthStatus('Entre ton pseudo.','error');
    setProfileNameCheck('Entre ton pseudo.','error');
    return;
  }
  if(!password){
    setAuthStatus('Entre le mot de passe.','error');
    return;
  }

  if(btn)btn.disabled=true;

  try{
    if(verifiedLoginProfileName!==name){
      setAuthStatus('Vérification du pseudo…');
      const pseudoOk=await checkLoginProfileName();
      if(!pseudoOk){
        setAuthStatus('Pseudo introuvable ou mal orthographié.','error');
        return;
      }
    }

    setAuthStatus('Connexion…');

    const data=await apiJSON('/api/login',{
      method:'POST',
      body:JSON.stringify({name,password})
    });

    applyAuthenticatedPlayer(data.player,data.token);
    $('loginPasswordInput').value='';
    setProfileNameCheck('');
    setAuthStatus('Connexion réussie.','ok');
    setTimeout(hideProfileOverlay,160);
  }catch(err){
    if(err.status===404 || err.code==='PROFILE_NOT_FOUND'){
      verifiedLoginProfileName='';
      setProfileNameCheck('Pseudo introuvable ou mal orthographié.','error');
      setAuthStatus('Pseudo introuvable ou mal orthographié.','error');
    }else if(err.status===401 || err.code==='BAD_PASSWORD'){
      setAuthStatus('Mot de passe incorrect.','error');
    }else{
      setAuthStatus(err.message||'Connexion impossible.','error');
    }
  }finally{
    if(btn)btn.disabled=false;
  }
}

function startGuestSession(){
  // Guest data exists only in memory for the current page session.
  saveAuthToken('');
  isGuest=true;
  remoteOpponentGuest=false;
  databaseAvailable=false;
  profileLoaded=true;
  playerName='Invité';
  playerElo=ELO_START;

  try{
    localStorage.removeItem(ELO_STORAGE_KEY);
    localStorage.removeItem(LAST_PROFILE_STORAGE_KEY);
  }catch(e){}

  renderProfile();
  renderElo();
  renderTeamNames();
  renderOngoingCorrespondenceSidebar([],{loggedOut:true});
  hideProfileOverlay();
  showEloToast('Mode invité · partie non classée');
}

async function logoutPlayerProfile(){
  const oldToken=authToken;

  if(!isGuest){
    try{
      if(oldToken)await apiJSON('/api/logout',{method:'POST'});
    }catch(e){}
  }

  saveAuthToken('');
  isGuest=false;
  remoteOpponentGuest=false;
  playerName='';
  playerElo=ELO_START;
  databaseAvailable=false;
  profileLoaded=false;
  renderProfile();
  renderTeamNames();
  renderOngoingCorrespondenceSidebar([],{loggedOut:true});
  showProfileOverlay('Sélectionne un autre profil ou crée-en un.','login');
}
async function syncPlayerEloToDatabase(){
  if(isGuest||!databaseAvailable||!authToken||!playerName)return;
  try{
    const data=await apiJSON('/api/elo',{
      method:'POST',
      body:JSON.stringify({elo:playerElo})
    });
    if(Number.isFinite(Number(data.elo)))playerElo=Number(data.elo);
    renderProfile();
    renderElo();
  }catch(err){
    console.warn('Synchronisation ELO BDD impossible:',err);
    if(err.status===401){
      saveAuthToken('');
      databaseAvailable=false;
      showProfileOverlay('Ta session a expiré. Reconnecte-toi.','login');
    }
  }
}
async function bootstrapPlayerProfile(){
  isGuest=false;
  remoteOpponentGuest=false;
  authToken=loadAuthToken();
  renderProfile();

  if(!authToken){
    showProfileOverlay('', 'login');
    return;
  }

  try{
    const data=await apiJSON('/api/me',{method:'GET'});
    applyAuthenticatedPlayer(data.player);
    hideProfileOverlay();
  }catch(err){
    saveAuthToken('');
    databaseAvailable=false;
    profileLoaded=false;
    showProfileOverlay('Ta session n’est plus valide. Reconnecte-toi.','login');
  }
}

const ELO_STORAGE_KEY='marioChessPlayerEloV1';
const ELO_START=1200;
const ELO_K=32;
const AI_ELO={easy:800,medium:1200,hard:1600};
const AI_LEVEL_LABEL={easy:'FACILE',medium:'NORMAL',hard:'DIFFICILE'};

function loadPlayerElo(){
  try{
    const value=parseInt(localStorage.getItem(ELO_STORAGE_KEY),10);
    if(Number.isFinite(value)&&value>=100&&value<=4000)return value;
  }catch(e){}
  return ELO_START;
}
function savePlayerElo(){
  if(isGuest){
    renderProfile();
    return;
  }

  try{localStorage.setItem(ELO_STORAGE_KEY,String(playerElo));}catch(e){}
  syncPlayerEloToDatabase();
  renderProfile();
}
function eloRankName(value){
  value=Number(value)||0;
  if(value<800)return 'BRONZE';
  if(value<1000)return 'ARGENT';
  if(value<1200)return 'OR';
  if(value<1400)return 'PLATINE';
  if(value<1600)return 'DIAMANT';
  if(value<1800)return 'MASTER';
  if(value<2000)return 'GRAND MASTER';
  return 'LÉGENDE';
}
let playerElo=loadPlayerElo();
let opponentElo=null;

let AI_FUNNY_NAMES=Array.isArray(activeTheme.aiNames)&&activeTheme.aiNames.length
  ? activeTheme.aiNames
  : ['Chess Engine'];
let aiDisplayName='';
let remoteOpponentName='';

function randomAIName(){
  return AI_FUNNY_NAMES[Math.floor(Math.random()*AI_FUNNY_NAMES.length)]+' - IA';
}

function ensureAIName(){
  if(!aiDisplayName)aiDisplayName=randomAIName();
  return aiDisplayName;
}


export function applyGameTheme(theme=activeTheme){
  if(!theme||!theme.pieces)return false;

  PIECE_SKINS=theme.pieces;
  SHELL_GREEN_SRC=theme.effects?.shellGreen||SHELL_GREEN_SRC;
  SHELL_RED_SRC=theme.effects?.shellRed||SHELL_RED_SRC;
  MATE_CHARACTER_SRC=theme.effects?.resultCharacter||MATE_CHARACTER_SRC;
  PROJECTILE_ALT=theme.effects?.projectileAlt||'Projectile';
  AI_FUNNY_NAMES=Array.isArray(theme.aiNames)&&theme.aiNames.length
    ? theme.aiNames
    : ['Chess Engine'];

  if(gameMode==='ai')aiDisplayName='';

  const mateImg=$('mateCharacter');
  if(mateImg){
    const winnerColor=mateImg.dataset.winnerColor;
    if(winnerColor&&PIECE_SKINS[winnerColor]?.k){
      const king=PIECE_SKINS[winnerColor].k;
      mateImg.src=king.src;
      mateImg.alt=`${king.name} — vainqueur`;
    }else{
      mateImg.src=MATE_CHARACTER_SRC;
      mateImg.alt='Résultat de la partie';
    }
  }

  if(chess){
    renderAll();
    void preloadGameImages();
  }

  return true;
}

function renderTeamNames(){
  const white=$('whiteTeamName');
  const black=$('blackTeamName');
  if(!white||!black)return;

  let whiteName='Blancs';
  let blackName='Noirs';

  if(gameMode==='ai'&&playerCamp){
    const aiName=ensureAIName();
    const me=isGuest?'Invité':(playerName||'Joueur');
    if(playerCamp==='w'){
      whiteName=me;
      blackName=aiName;
    }else{
      whiteName=aiName;
      blackName=me;
    }
  }else if(gameMode==='remote'&&playerCamp){
    const me=isGuest?'Invité':(playerName||'Joueur');
    const other=remoteOpponentName||'Adversaire';
    if(playerCamp==='w'){
      whiteName=me;
      blackName=other;
    }else{
      whiteName=other;
      blackName=me;
    }
  }else if(gameMode==='local'){
    whiteName='Blancs';
    blackName='Noirs';
  }

  white.textContent=whiteName;
  black.textContent=blackName;
}

let eloSettled=false;
let eloLastChange=null;
let gameHistoryRecorded=false;
let eloToastTimer=null;

function currentOpponentElo(){
  if(gameMode==='ai')return AI_ELO[aiLevel]||ELO_START;
  if(gameMode==='remote')return Number(opponentElo)||ELO_START;
  return null;
}
function renderElo(){
  const whiteEl=$('whiteTeamElo');
  const blackEl=$('blackTeamElo');

  function setTeamElo(el,text,kind){
    if(!el)return;
    el.textContent=text;
    el.classList.remove('player','opponent','unranked');
    if(kind)el.classList.add(kind);
  }

  const opponent=Number(currentOpponentElo());
  const opponentText=gameMode==='ai'
    ? ((AI_LEVEL_LABEL[aiLevel]||'NORMAL')+' · '+(opponent||ELO_START)+' ELO')
    : (opponent?opponent+' ELO':'…');

  if(isGuest||(gameMode==='remote'&&remoteOpponentGuest)){
    if(gameMode==='ai'){
      if(playerCamp==='b'){
        setTeamElo(whiteEl,opponentText,'opponent');
        setTeamElo(blackEl,'NON CLASSÉ','unranked');
      }else{
        setTeamElo(whiteEl,'NON CLASSÉ','unranked');
        setTeamElo(blackEl,opponentText,'opponent');
      }
      return;
    }
    setTeamElo(whiteEl,'NON CLASSÉ','unranked');
    setTeamElo(blackEl,'NON CLASSÉ','unranked');
    return;
  }

  if(gameMode!=='ai'&&gameMode!=='remote'){
    setTeamElo(whiteEl,'NON CLASSÉ','unranked');
    setTeamElo(blackEl,'NON CLASSÉ','unranked');
    return;
  }

  if(!playerCamp){
    setTeamElo(whiteEl,playerElo+' ELO','player');
    setTeamElo(blackEl,opponentText,'opponent');
    return;
  }

  const playerText=playerElo+' ELO';

  if(playerCamp==='w'){
    setTeamElo(whiteEl,playerText,'player');
    setTeamElo(blackEl,opponentText,'opponent');
  }else{
    setTeamElo(whiteEl,opponentText,'opponent');
    setTeamElo(blackEl,playerText,'player');
  }
}
function showEloToast(text){
  const toast=$('eloToast');
  const label=$('eloToastText');
  if(!toast||!label)return;
  label.textContent=text;
  toast.classList.add('show');
  if(eloToastTimer)clearTimeout(eloToastTimer);
  eloToastTimer=setTimeout(()=>toast.classList.remove('show'),3200);
}
function clearEloResult(){
  const box=$('eloResult');
  if(box){
    box.classList.add('hidden');
    box.classList.remove('negative','neutral');
  }
}
function showEloResult(change,oldRating,newRating){
  const box=$('eloResult');
  const delta=$('eloResultDelta');
  const detail=$('eloResultDetail');
  if(!box||!delta||!detail)return;
  box.classList.remove('hidden','negative','neutral');
  if(change<0)box.classList.add('negative');
  if(change===0)box.classList.add('neutral');
  delta.textContent=(change>0?'+':'')+change;
  detail.textContent=oldRating+' → '+newRating+' · '+eloRankName(newRating);
}
function settleElo(score,reason=''){
  if(eloSettled)return null;
  eloSettled=true;

  // Guest games are always unranked. Remote games are also unranked
  // for both sides if either participant is a guest.
  if(isGuest||(gameMode==='remote'&&remoteOpponentGuest)){
    eloLastChange=null;
    renderElo();
    clearEloResult();
    return null;
  }

  if(gameMode!=='ai'&&gameMode!=='remote'){
    eloLastChange=null;
    renderElo();
    return null;
  }

  const opponent=Number(currentOpponentElo())||ELO_START;
  const oldRating=playerElo;
  const expected=1/(1+Math.pow(10,(opponent-oldRating)/400));
  const raw=ELO_K*(score-expected);
  const change=Math.round(raw);
  playerElo=Math.max(100,Math.min(4000,oldRating+change));
  savePlayerElo();

  eloLastChange={change,oldRating,newRating:playerElo,opponent,score,reason};
  renderElo();
  showEloResult(change,oldRating,playerElo);

  const sign=change>0?'+':'';
  const resultText=score===1?'Victoire':score===0?'Défaite':'Nulle';
  showEloToast(resultText+' · ELO '+sign+change+' · '+playerElo);
  return eloLastChange;
}
function settleEloFromWinner(winnerName,reason=''){
  if(gameMode!=='ai'&&gameMode!=='remote')return null;
  const winnerColor=String(winnerName).toLowerCase().startsWith('blanc')?'w':'b';
  return settleElo(winnerColor===playerCamp?1:0,reason);
}





function isRankedActionGame(){
  return !isGuest&&(gameMode==='ai'||gameMode==='remote')&&!(gameMode==='remote'&&remoteOpponentGuest);
}
function settleFixedResignationPenalty(){
  if(eloSettled)return eloLastChange;
  eloSettled=true;
  if(!isRankedActionGame()){
    eloLastChange=null;
    clearEloResult();
    renderElo();
    return null;
  }
  const oldRating=playerElo;
  const newRating=Math.max(100,Math.min(4000,oldRating-10));
  const change=newRating-oldRating;
  playerElo=newRating;
  eloLastChange={change,oldRating,newRating,opponent:Number(currentOpponentElo())||ELO_START,score:0,reason:'resign'};
  savePlayerElo();
  renderElo();
  showEloResult(change,oldRating,newRating);
  showEloToast('Abandon · ELO '+change+' · '+newRating);
  return eloLastChange;
}
function settleAgreementNoChange(){
  if(eloSettled)return eloLastChange;
  eloSettled=true;
  if(!isRankedActionGame()){
    eloLastChange=null;
    clearEloResult();
    renderElo();
    return null;
  }
  const rating=playerElo;
  eloLastChange={change:0,oldRating:rating,newRating:rating,opponent:Number(currentOpponentElo())||ELO_START,score:.5,reason:'agreement'};
  renderElo();
  showEloResult(0,rating,rating);
  showEloToast('Nulle acceptée · ELO +0 · '+rating);
  return eloLastChange;
}
function resetGameActionState(){
  manualGameFinished=false;
  manualGameResult=null;
  manualGameReason='';
  remoteDrawOfferByMe=false;
  remoteDrawOfferIncoming=false;
  correspondenceDrawOfferBy=null;
  lastPromptedDrawOfferKey='';
  closeGameActionDialog();
  setGameActionStatus('');
  renderGameActions();
}
function setGameActionStatus(message='',kind=''){
  const el=$('gameActionStatus');
  if(!el)return;
  el.textContent=message||'';
  el.className='game-action-status'+(kind?' '+kind:'');
}
function openGameActionDialog({icon='?',title='Confirmer',text='',primary='Confirmer',secondary='Annuler',danger=false,onPrimary=null,onSecondary=null}={}){
  const overlay=$('gameActionOverlay');
  if(!overlay)return;
  $('gameActionDialogIcon').textContent=icon;
  $('gameActionDialogTitle').textContent=title;
  $('gameActionDialogText').textContent=text;
  const p=$('gameActionPrimaryBtn'),s=$('gameActionSecondaryBtn');
  p.textContent=primary;s.textContent=secondary;
  p.classList.toggle('danger',!!danger);
  gameActionPrimaryHandler=typeof onPrimary==='function'?onPrimary:null;
  gameActionSecondaryHandler=typeof onSecondary==='function'?onSecondary:null;
  overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');
}
function closeGameActionDialog(){
  const overlay=$('gameActionOverlay');
  if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}
  gameActionPrimaryHandler=null;gameActionSecondaryHandler=null;
}
function renderGameActions(){
  const box=$('gameActions'),draw=$('offerDrawBtn'),drawText=$('offerDrawBtnText'),resign=$('resignGameBtn');
  const nav=$('bottomAppNav'),play=$('bottomPlayBtn');
  if(!box||!draw||!drawText||!resign)return;

  const corrActive=gameMode==='correspondence'&&correspondenceStatus==='active';
  const normalActive=(gameMode==='local'||gameMode==='ai'||gameMode==='remote')&&!!playerCamp;
  const active=(corrActive||normalActive)&&!manualGameFinished&&chess&&!chess.game_over()&&!timeoutWinner;

  box.classList.toggle('hidden',!active);
  if(nav)nav.classList.toggle('game-active',active);
  if(play)play.classList.toggle('hidden',active);

  const aiActive=active&&gameMode==='ai';
  if(nav)nav.classList.toggle('ai-game-active',aiActive);
  draw.hidden=aiActive;
  draw.setAttribute('aria-hidden',aiActive?'true':'false');

  if(!active){
    setGameActionStatus('');
    return;
  }
  resign.disabled=false;
  if(gameMode==='ai'){
    draw.disabled=true;drawText.textContent='Nulle';draw.title='La nulle par accord nécessite deux joueurs humains.';
    return;
  }
  draw.title='';
  if(gameMode==='remote'){
    if(!remoteReady){draw.disabled=true;drawText.textContent='Nulle';return;}
    if(remoteDrawOfferByMe){draw.disabled=true;drawText.textContent='Nulle proposée';return;}
    if(remoteDrawOfferIncoming){draw.disabled=false;drawText.textContent='Répondre à la nulle';return;}
  }
  if(gameMode==='correspondence'){
    if(correspondenceDrawOfferBy==='me'){
      draw.disabled=true;drawText.textContent='Nulle proposée';
      setGameActionStatus('Proposition envoyée. En attente de l’adversaire.','wait');return;
    }
    if(correspondenceDrawOfferBy==='opponent'){
      draw.disabled=false;drawText.textContent='Répondre à la nulle';return;
    }
  }
  draw.disabled=false;drawText.textContent='Nulle';
}
function winnerNameFromColor(color){return color==='w'?'Blancs':'Noirs';}
function finishResignation(winnerColor,{penalizeMe=false,opponentResigned=false}={}){
  if(manualGameFinished)return;
  manualGameFinished=true;manualGameResult=winnerColor;manualGameReason='resign';
  remoteDrawOfferByMe=false;remoteDrawOfferIncoming=false;
  stopClock();selected=null;targets=[];
  if(penalizeMe){settleFixedResignationPenalty();recordGameHistory(0,'resign');}
  else if(opponentResigned){
    if(isRankedActionGame()){
      eloSettled=true;eloLastChange={change:0,oldRating:playerElo,newRating:playerElo,opponent:Number(currentOpponentElo())||ELO_START,score:1,reason:'opponent_resign'};
      showEloResult(0,playerElo,playerElo);showEloToast('Victoire par abandon · ELO +0 · '+playerElo);
    }
    recordGameHistory(1,'resign');
  }
  renderAll();showResignOverlay(winnerNameFromColor(winnerColor));
}
function finishAgreedDraw(){
  if(manualGameFinished)return;
  if(gameMode==='remote')clearRemoteSession();
  manualGameFinished=true;manualGameResult='draw';manualGameReason='agreement';
  remoteDrawOfferByMe=false;remoteDrawOfferIncoming=false;
  stopClock();selected=null;targets=[];
  if(gameMode!=='correspondence'){settleAgreementNoChange();recordGameHistory(.5,'agreement');}
  renderAll();showDrawOverlay(true);
}
function requestResignation(){
  if(manualGameFinished)return;
  const ranked=(gameMode==='correspondence'&&!isGuest)||isRankedActionGame();
  openGameActionDialog({icon:'⚑',title:'Abandonner la partie ?',text:'La partie sera terminée immédiatement.'+(ranked?' Ton classement perdra exactement 10 points.':''),primary:'ABANDONNER',secondary:'Continuer',danger:true,onPrimary:()=>{closeGameActionDialog();confirmResignation();},onSecondary:closeGameActionDialog});
}
async function confirmResignation(){
  if(manualGameFinished)return;
  if(gameMode==='correspondence'){
    if(!correspondenceGameId||correspondenceStatus!=='active')return;
    setGameActionStatus('Abandon en cours…','wait');
    try{
      const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'resign',id:correspondenceGameId,version:correspondenceVersion})});
      if(data.elo_change){
        const c=data.elo_change;playerElo=Number(c.new_elo)||playerElo;
        eloSettled=true;eloLastChange={change:Number(c.delta)||0,oldRating:Number(c.old_elo)||playerElo,newRating:Number(c.new_elo)||playerElo,opponent:Number(data.game?.opponent_elo)||ELO_START,score:0,reason:'resign'};
        renderElo();renderProfile();showEloResult(eloLastChange.change,eloLastChange.oldRating,eloLastChange.newRating);showEloToast('Abandon · ELO '+eloLastChange.change+' · '+eloLastChange.newRating);
      }
      applyCorrespondenceGame(data.game);loadOngoingCorrespondenceSidebar(true);
    }catch(err){if(err.status===409)await refreshCurrentCorrespondenceGame();else setGameActionStatus(err.message||'Abandon impossible.','error');}
    return;
  }
  const resigning=gameMode==='local'?chess.turn():(playerCamp||chess.turn());
  const winner=resigning==='w'?'b':'w';
  if(gameMode==='remote'&&peerConn&&peerConn.open)peerConn.send({type:'resign',winner});
  finishResignation(winner,{penalizeMe:gameMode==='ai'||gameMode==='remote'});
}
function requestDraw(){
  if(manualGameFinished)return;
  if(gameMode==='ai'){setGameActionStatus('La nulle par accord nécessite un autre joueur humain.','error');return;}
  if(gameMode==='local'){
    openGameActionDialog({icon:'½',title:'Proposition de nulle',text:'L’autre joueur doit accepter la nulle. S’il accepte, la partie se termine sans changement de classement.',primary:'ACCEPTER LA NULLE',secondary:'REFUSER',onPrimary:()=>{closeGameActionDialog();finishAgreedDraw();},onSecondary:()=>{closeGameActionDialog();setGameActionStatus('Proposition de nulle refusée.');}});return;
  }
  if(gameMode==='remote'){
    if(remoteDrawOfferIncoming){showIncomingDrawOffer('remote');return;}
    if(!remoteReady||!peerConn||!peerConn.open){setGameActionStatus('L’adversaire n’est pas connecté.','error');return;}
    peerConn.send({type:'draw_offer'});remoteDrawOfferByMe=true;setGameActionStatus('Proposition de nulle envoyée.','wait');renderGameActions();return;
  }
  if(gameMode==='correspondence'){
    if(correspondenceDrawOfferBy==='opponent'){showIncomingDrawOffer('correspondence');return;}
    offerCorrespondenceDraw();
  }
}
function showIncomingDrawOffer(source){
  const name=remoteOpponentName||'Ton adversaire';
  openGameActionDialog({icon:'½',title:'Proposition de nulle',text:name+' propose une partie nulle. Si tu acceptes, aucun point de classement ne change.',primary:'ACCEPTER',secondary:'REFUSER',onPrimary:()=>{closeGameActionDialog();source==='remote'?acceptRemoteDraw():acceptCorrespondenceDraw();},onSecondary:()=>{closeGameActionDialog();source==='remote'?declineRemoteDraw():declineCorrespondenceDraw();}});
}
function acceptRemoteDraw(){if(!remoteDrawOfferIncoming||!peerConn||!peerConn.open)return;peerConn.send({type:'draw_accept'});remoteDrawOfferIncoming=false;finishAgreedDraw();}
function declineRemoteDraw(){if(peerConn&&peerConn.open)peerConn.send({type:'draw_decline'});remoteDrawOfferIncoming=false;setGameActionStatus('Proposition de nulle refusée.');renderGameActions();}
async function offerCorrespondenceDraw(){
  if(!correspondenceGameId||correspondenceStatus!=='active')return;
  setGameActionStatus('Envoi de la proposition…','wait');
  try{const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'offer_draw',id:correspondenceGameId,version:correspondenceVersion})});applyCorrespondenceGame(data.game);loadOngoingCorrespondenceSidebar(true);}
  catch(err){if(err.status===409)await refreshCurrentCorrespondenceGame();else setGameActionStatus(err.message||'Proposition impossible.','error');}
}
async function acceptCorrespondenceDraw(){
  if(!correspondenceGameId||correspondenceDrawOfferBy!=='opponent')return;
  setGameActionStatus('Acceptation de la nulle…','wait');
  try{const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'accept_draw',id:correspondenceGameId,version:correspondenceVersion})});applyCorrespondenceGame(data.game);loadOngoingCorrespondenceSidebar(true);}
  catch(err){if(err.status===409)await refreshCurrentCorrespondenceGame();else setGameActionStatus(err.message||'Impossible d’accepter la nulle.','error');}
}
async function declineCorrespondenceDraw(){
  if(!correspondenceGameId||correspondenceDrawOfferBy!=='opponent')return;
  setGameActionStatus('Refus de la proposition…','wait');
  try{const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'decline_draw',id:correspondenceGameId,version:correspondenceVersion})});applyCorrespondenceGame(data.game);setGameActionStatus('Proposition de nulle refusée.');loadOngoingCorrespondenceSidebar(true);}
  catch(err){if(err.status===409)await refreshCurrentCorrespondenceGame();else setGameActionStatus(err.message||'Impossible de refuser la nulle.','error');}
}
function maybePromptCorrespondenceDraw(game){
  if(!game||game.status!=='active'||game.draw_offer_by!=='opponent')return;
  const key='c:'+game.id+':'+game.version;
  if(lastPromptedDrawOfferKey===key)return;
  lastPromptedDrawOfferKey=key;
  setTimeout(()=>{if(gameMode==='correspondence'&&correspondenceGameId===Number(game.id)&&correspondenceDrawOfferBy==='opponent')showIncomingDrawOffer('correspondence');},100);
}

function cleanCorrespondenceCode(value){
  return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
}
function setCorrespondenceStatus(message='',kind=''){
  const el=$('correspondenceStatus');
  if(!el)return;
  el.textContent=message||'';
  el.className='correspondence-status'+(kind?' '+kind:'');
}
function correspondencePieceFromFenChar(char){
  const lower=String(char||'').toLowerCase();
  if(!'pnbrqk'.includes(lower))return null;
  return {color:char===char.toUpperCase()?'w':'b',type:lower};
}
function correspondenceFenMap(fen){
  const map=new Map();
  const boardPart=String(fen||'').split(' ')[0];
  const ranks=boardPart.split('/');
  if(ranks.length!==8)return map;
  for(let r=0;r<8;r++){
    let file=0;
    for(const char of ranks[r]){
      if(/[1-8]/.test(char)){
        file+=Number(char);
        continue;
      }
      const piece=correspondencePieceFromFenChar(char);
      if(piece&&file<8){
        const square='abcdefgh'[file]+String(8-r);
        map.set(square,piece);
      }
      file++;
    }
  }
  return map;
}
function makeCorrespondenceMiniBoard(game){
  const board=document.createElement('span');
  board.className='ongoing-mini-board';
  board.setAttribute('aria-label','Aperçu de la position');
  const pieces=correspondenceFenMap(game.fen);
  const flippedPreview=game.player_color==='b';
  const files=flippedPreview?[...'hgfedcba']:[...'abcdefgh'];
  const ranks=flippedPreview?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1];
  for(const rank of ranks){
    for(const file of files){
      const sq=file+rank;
      const cell=document.createElement('span');
      const fileIndex='abcdefgh'.indexOf(file);
      cell.className='ongoing-mini-square '+(((fileIndex+Number(rank))%2===0)?'light':'dark');
      const piece=pieces.get(sq);
      if(piece){
        const img=document.createElement('img');
        const data=pieceData(piece.color,piece.type);
        img.src=data.src;
        img.alt='';
        img.draggable=false;
        cell.appendChild(img);
      }
      board.appendChild(cell);
    }
  }
  return board;
}
function correspondencePlayerLabel(name,elo,fallback){
  const safeName=String(name||fallback||'Joueur');
  const rating=Number(elo);
  return safeName+(Number.isFinite(rating)?' · '+rating+' ELO':'');
}
function renderOngoingCorrespondenceSidebar(games=[],options={}){
  const list=$('ongoingGamesList');
  const count=$('ongoingGamesCount');
  if(!list||!count)return;
  list.innerHTML='';

  if(options.loggedOut||isGuest||!authToken){
    count.textContent='0';
    const empty=document.createElement('button');
    empty.type='button';
    empty.className='ongoing-games-empty ongoing-login-link';
    empty.textContent=isGuest?'Connecte-toi pour retrouver tes parties différées.':'Connecte-toi pour voir tes parties différées.';
    empty.addEventListener('click',()=>showProfileOverlay('', 'login'));
    list.appendChild(empty);
    return;
  }

  const visible=Array.isArray(games)?games.slice(0,10):[];
  count.textContent=String(Array.isArray(games)?games.length:0);
  if(!visible.length){
    const empty=document.createElement('div');
    empty.className='ongoing-games-empty';
    empty.textContent='Aucune partie différée en cours.';
    list.appendChild(empty);
    return;
  }

  visible.forEach(game=>{
    const mine=game.status==='active'&&game.turn===game.player_color;
    const card=document.createElement('button');
    card.type='button';
    card.className='ongoing-game-card '+String(game.status||'')+(mine?' my-turn':'');

    card.appendChild(makeCorrespondenceMiniBoard(game));

    const info=document.createElement('span');
    info.className='ongoing-game-info';

    const players=document.createElement('span');
    players.className='ongoing-game-players';

    const white=document.createElement('span');
    white.className='ongoing-player-row'+(game.player_color==='w'?' me':'');
    white.innerHTML='<i class="ongoing-color-dot white"></i><b></b>';
    white.querySelector('b').textContent=correspondencePlayerLabel(game.white_name,game.white_elo,'Blancs');

    const black=document.createElement('span');
    black.className='ongoing-player-row'+(game.player_color==='b'?' me':'');
    black.innerHTML='<i class="ongoing-color-dot black"></i><b></b>';
    black.querySelector('b').textContent=correspondencePlayerLabel(game.black_name,game.black_elo,game.status==='waiting'?'En attente':'Noirs');

    players.append(white,black);

    const turn=document.createElement('span');
    turn.className='ongoing-turn '+(mine?'mine':'');
    if(game.status==='waiting'){
      turn.textContent='En attente d’un adversaire';
    }else{
      const turnName=game.turn==='w'?(game.white_name||'Blancs'):(game.black_name||'Noirs');
      turn.textContent=mine?'À toi de jouer':'À '+turnName+' de jouer';
    }

    const deadline=document.createElement('span');
    deadline.className='ongoing-deadline';
    deadline.textContent=game.status==='waiting'?'Code '+game.room_code:formatCorrespondenceRemaining(game.deadline_at);

    info.append(players,turn,deadline);
    card.appendChild(info);

    card.addEventListener('click',()=>{
      if(game.status==='waiting'){
        openCorrespondenceMenu();
        $('correspondenceCreatedCode').textContent=game.room_code;
        $('correspondenceCreatedBox').classList.remove('hidden');
        setCorrespondenceStatus('En attente que ton adversaire rejoigne la partie.','wait');
      }else{
        loadCorrespondenceGame(game.id);
      }
    });
    list.appendChild(card);
  });

  if(Array.isArray(games)&&games.length>visible.length){
    const more=document.createElement('button');
    more.type='button';
    more.className='ongoing-games-more';
    more.textContent='Voir les '+games.length+' parties';
    more.addEventListener('click',openCorrespondenceMenu);
    list.appendChild(more);
  }
}
async function loadOngoingCorrespondenceSidebar(silent=false){
  if(isGuest||!authToken){
    renderOngoingCorrespondenceSidebar([],{loggedOut:true});
    return;
  }
  try{
    const data=await apiJSON('/api/correspondence',{method:'GET'});
    renderOngoingCorrespondenceSidebar(data.games||[]);
  }catch(err){
    if(!silent){
      const list=$('ongoingGamesList');
      if(list){
        list.innerHTML='';
        const empty=document.createElement('div');
        empty.className='ongoing-games-empty error';
        empty.textContent='Impossible de charger les parties en cours.';
        list.appendChild(empty);
      }
    }
  }
}
function startOngoingGamesPolling(){
  if(ongoingGamesPollTimer)clearInterval(ongoingGamesPollTimer);
  ongoingGamesPollTimer=setInterval(()=>{
    if(authToken&&!isGuest&&!document.hidden)loadOngoingCorrespondenceSidebar(true);
  },60000);
}
function formatCorrespondenceRemaining(deadline){
  if(!deadline)return '—';
  const ms=Math.max(0,new Date(deadline).getTime()-Date.now());
  const totalMinutes=Math.ceil(ms/60000);
  const days=Math.floor(totalMinutes/1440);
  const hours=Math.floor((totalMinutes%1440)/60);
  const minutes=totalMinutes%60;
  if(days>0)return days+'j '+String(hours).padStart(2,'0')+'h';
  if(hours>0)return hours+'h '+String(minutes).padStart(2,'0');
  return Math.max(0,minutes)+' min';
}
function destroyCorrespondenceSession(){
  correspondenceGameId=null;
  correspondenceVersion=0;
  correspondenceDeadline=null;
  correspondenceStatus='';
  correspondenceResult=null;
  correspondenceReason='';
  correspondenceDrawOfferBy=null;
  lastPromptedDrawOfferKey='';
  if(correspondencePollTimer){clearInterval(correspondencePollTimer);correspondencePollTimer=null;}
}
function startCorrespondencePolling(){
  if(correspondencePollTimer)clearInterval(correspondencePollTimer);
  correspondencePollTimer=setInterval(()=>{
    if(gameMode==='correspondence'&&correspondenceGameId&&!document.hidden){
      refreshCurrentCorrespondenceGame(true);
    }
  },30000);
}
function openCorrespondenceMenu(){
  closePlayMenu();
  const overlay=$('correspondenceOverlay');
  if(!overlay)return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  const loggedIn=!isGuest&&!!authToken;
  $('correspondenceAuthNote')?.classList.toggle('hidden',loggedIn);
  $('correspondenceContent')?.classList.toggle('hidden',!loggedIn);
  if(loggedIn)loadCorrespondenceList();
}
function closeCorrespondenceMenu(){
  const overlay=$('correspondenceOverlay');
  if(!overlay)return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
}
function renderCorrespondenceList(games=[]){
  const list=$('correspondenceList');
  if(!list)return;
  list.innerHTML='';
  if(!Array.isArray(games)||!games.length){
    const empty=document.createElement('div');
    empty.className='correspondence-empty';
    empty.textContent='Aucune partie différée en cours.';
    list.appendChild(empty);
    return;
  }
  games.forEach(game=>{
    const item=document.createElement('button');
    item.type='button';
    item.className='correspondence-game-item '+String(game.status||'');
    const left=document.createElement('span');
    left.className='correspondence-game-main';
    const title=document.createElement('strong');
    title.textContent=game.status==='waiting'?'En attente · '+game.room_code:(game.opponent_name||'Adversaire');
    const meta=document.createElement('small');
    if(game.status==='waiting')meta.textContent='Partage le code pour démarrer';
    else{
      const mine=game.turn===game.player_color;
      meta.textContent=(mine?'À toi de jouer':'Tour adverse')+' · '+formatCorrespondenceRemaining(game.deadline_at);
    }
    left.append(title,meta);
    const badge=document.createElement('span');
    badge.className='correspondence-game-badge';
    badge.textContent=game.status==='waiting'?'CODE':'OUVRIR';
    item.append(left,badge);
    item.addEventListener('click',()=>{
      if(game.status==='waiting'){
        $('correspondenceCreatedCode').textContent=game.room_code;
        $('correspondenceCreatedBox').classList.remove('hidden');
        setCorrespondenceStatus('En attente que ton adversaire rejoigne la partie.','wait');
      }else loadCorrespondenceGame(game.id);
    });
    list.appendChild(item);
  });
}
async function loadCorrespondenceList(){
  if(isGuest||!authToken)return;
  setCorrespondenceStatus('Chargement…');
  try{
    const data=await apiJSON('/api/correspondence',{method:'GET'});
    renderCorrespondenceList(data.games||[]);
    renderOngoingCorrespondenceSidebar(data.games||[]);
    setCorrespondenceStatus('');
  }catch(err){
    setCorrespondenceStatus(err.message||'Impossible de charger les parties.','error');
  }
}
async function createCorrespondenceGame(){
  if(isGuest||!authToken){openCorrespondenceMenu();return;}
  const btn=$('correspondenceCreateBtn');
  if(btn)btn.disabled=true;
  setCorrespondenceStatus('Création de la partie…','wait');
  try{
    const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'create'})});
    $('correspondenceCreatedCode').textContent=data.game.room_code;
    $('correspondenceCreatedBox').classList.remove('hidden');
    setCorrespondenceStatus('Code créé. Partage-le à ton adversaire.','ok');
    await loadCorrespondenceList();
  }catch(err){
    setCorrespondenceStatus(err.message||'Création impossible.','error');
  }finally{if(btn)btn.disabled=false;}
}
async function joinCorrespondenceGame(){
  const input=$('correspondenceCodeInput');
  const code=cleanCorrespondenceCode(input?.value);
  if(input)input.value=code;
  if(code.length!==6){setCorrespondenceStatus('Entre un code de 6 caractères.','error');return;}
  const btn=$('correspondenceJoinBtn');
  if(btn)btn.disabled=true;
  setCorrespondenceStatus('Connexion à la partie…','wait');
  try{
    const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'join',code})});
    closeCorrespondenceMenu();
    applyCorrespondenceGame(data.game);
    loadOngoingCorrespondenceSidebar(true);
  }catch(err){
    setCorrespondenceStatus(err.message||'Impossible de rejoindre la partie.','error');
  }finally{if(btn)btn.disabled=false;}
}
function rebuildCorrespondencePosition(game){
  chess.reset();
  capturedByWhite=[];
  capturedByBlack=[];
  lastMove=null;
  const moves=Array.isArray(game.moves)?game.moves:[];
  for(const item of moves){
    const move=chess.move({from:item.from,to:item.to,promotion:item.promotion||'q'});
    if(!move)break;
    if(move.captured){
      if(move.color==='w')capturedByWhite.push(move.captured);
      else capturedByBlack.push(move.captured);
    }
    lastMove={from:move.from,to:move.to};
  }
  if(game.fen&&chess.fen()!==game.fen){
    try{chess.load(game.fen)}catch(e){}
  }
}
function showCorrespondenceCompletion(game){
  if(game.status!=='completed')return;
  const result=game.result;
  if(game.reason==='timeout'){
    timeoutWinner=result==='white'?'Blancs':'Noirs';
    showTimeWinner(timeoutWinner);
    return;
  }
  timeoutWinner=null;
  if(game.reason==='resign'){showResignOverlay(result==='white'?'Blancs':'Noirs');return;}
  if(result==='draw')showDrawOverlay(game.reason==='agreement');
  else showMateOverlay(result==='white'?'Blancs':'Noirs');
}
function applyCorrespondenceGame(game){
  if(!game)return;
  destroyRemote();
  gameMode='correspondence';
  correspondenceGameId=Number(game.id);
  correspondenceVersion=Number(game.version)||0;
  correspondenceDeadline=game.deadline_at||null;
  correspondenceStatus=game.status||'';
  correspondenceResult=game.result||null;
  correspondenceReason=game.reason||'';
  correspondenceDrawOfferBy=game.draw_offer_by||null;
  if(Number.isFinite(Number(game.player_elo)))playerElo=Number(game.player_elo);
  playerCamp=game.player_color||'w';
  flipped=playerCamp==='b';
  remoteOpponentName=game.opponent_name||'En attente';
  opponentElo=Number(game.opponent_elo)||ELO_START;
  remoteOpponentGuest=false;
  TIME_CONTROL_LABEL='3 jours';
  CLOCK_INCREMENT_MS=0;
  clockRunning=false;
  clockStarted=false;
  timeoutWinner=null;
  selected=null;
  targets=[];
  rebuildCorrespondencePosition(game);
  const clockLabel=$('clockModeLabel');
  const bottom=$('bottomTimeLabel');
  if(clockLabel)clockLabel.textContent='3 JOURS';
  if(bottom)bottom.textContent='3 jours';
  hideModeOverlay();
  hideCampOverlay();
  closeCorrespondenceMenu();
  manualGameFinished=game.status==='completed';
  manualGameResult=game.result==='draw'?'draw':game.result==='white'?'w':game.result==='black'?'b':null;
  manualGameReason=game.reason||'';
  renderElo();
  renderProfile();
  renderTeamNames();
  renderAll();
  if(!clockInterval)clockInterval=setInterval(clockTick,1000);
  startCorrespondencePolling();
  if(game.status==='active'){
    if(correspondenceDrawOfferBy==='me')setGameActionStatus('Proposition de nulle envoyée.','wait');
    else if(correspondenceDrawOfferBy==='opponent')setGameActionStatus((game.opponent_name||'L’adversaire')+' propose la nulle.','wait');
    else setGameActionStatus('');
    maybePromptCorrespondenceDraw(game);
  }
  if(game.status==='completed')showCorrespondenceCompletion(game);
}
async function loadCorrespondenceGame(id){
  if(!id||correspondenceLoading)return;
  correspondenceLoading=true;
  setCorrespondenceStatus('Ouverture de la partie…','wait');
  try{
    const data=await apiJSON('/api/correspondence?id='+encodeURIComponent(id),{method:'GET'});
    applyCorrespondenceGame(data.game);
  }catch(err){
    setCorrespondenceStatus(err.message||'Impossible d’ouvrir la partie.','error');
  }finally{correspondenceLoading=false;}
}
async function refreshCurrentCorrespondenceGame(silent=false){
  if(gameMode!=='correspondence'||!correspondenceGameId||correspondenceLoading)return;
  correspondenceLoading=true;
  try{
    const data=await apiJSON('/api/correspondence?id='+encodeURIComponent(correspondenceGameId),{method:'GET'});
    const game=data.game;
    if(Number(game.version)!==correspondenceVersion||game.status!==correspondenceStatus||game.deadline_at!==correspondenceDeadline){
      applyCorrespondenceGame(game);
    }else{
      correspondenceDeadline=game.deadline_at||null;
      renderClocks();
    }
  }catch(err){if(!silent)console.warn(err);}finally{correspondenceLoading=false;}
}
async function submitCorrespondenceMove(from,to){
  if(gameMode!=='correspondence'||!correspondenceGameId||correspondenceStatus!=='active')return;
  if(chess.turn()!==playerCamp)return;
  const preview=new Chess(chess.fen());
  const move=preview.move({from,to,promotion:'q'});
  if(!move)return;
  const fromEl=document.querySelector(`[data-sq="${from}"]`);
  const toEl=document.querySelector(`[data-sq="${to}"]`);
  const fromRect=fromEl?fromEl.getBoundingClientRect():null;
  const toRect=toEl?toEl.getBoundingClientRect():null;
  selected=null;targets=[];renderBoard();
  try{
    const data=await apiJSON('/api/correspondence',{method:'POST',body:JSON.stringify({action:'move',id:correspondenceGameId,from,to,version:correspondenceVersion})});
    applyCorrespondenceGame(data.game);
    loadOngoingCorrespondenceSidebar(true);
    if(move.captured){
      playShellCaptureRects(fromRect,toRect,move.color==='w'?'b':'w',move.captured,move.color,move.to);
      animateCaptureMoveAfterShell(fromRect,toRect,move.color,move.piece,move.to,620);
    }else{
      animateSmoothMove(fromRect,toRect,move.color,move.piece,move.to);
    }
  }catch(err){
    if(err.status===409)await refreshCurrentCorrespondenceGame();
    else alert(err.message||'Impossible d’enregistrer le coup.');
  }
}

function notifyThemePickerOpen(){
  try{window.dispatchEvent(new CustomEvent('chess:theme-picker-open'));}catch(e){}
}
function commitPendingThemeChoice(){
  try{window.dispatchEvent(new CustomEvent('chess:commit-pending-theme'));}catch(e){}
}
function openPlayMenu(){
  const overlay=$('playMenuOverlay');
  if(!overlay)return;
  notifyThemePickerOpen();
  renderTimeControlUI();
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
}
function closePlayMenu(){
  const overlay=$('playMenuOverlay');
  if(!overlay)return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
}
function selectTimeControl(key){
  destroyCorrespondenceSession();

  // Le thème choisi dans "Jouer" ne devient actif qu'ici,
  // juste avant de démarrer le nouveau flux de partie.
  commitPendingThemeChoice();

  configureTimeControl(key);
  closePlayMenu();
  resetGame();
}
function closeProfileDashboard(){
  const overlay=$('profileDashboardOverlay');
  if(!overlay)return;
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden','true');
  $('profileDeleteConfirm')?.classList.add('hidden');
  const pwd=$('profileDeletePassword');
  if(pwd)pwd.value='';
}
function setProfileDashboardStatus(message='',kind=''){
  const el=$('profileDashboardStatus');
  if(!el)return;
  el.textContent=message||'';
  el.className='profile-dashboard-status'+(kind?' '+kind:'');
}
function formatProfileDate(value){
  if(!value)return '—';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '—';
  return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(d);
}
function formatHistoryDate(value){
  if(!value)return '';
  const d=new Date(value);
  if(Number.isNaN(d.getTime()))return '';
  return new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(d);
}
function historyModeLabel(game){
  if(game.mode==='ai')return 'IA';
  if(game.mode==='remote')return 'En ligne';
  if(game.mode==='correspondence')return 'Différé';
  return 'Local';
}
function renderProfileHistory(games=[]){
  const list=$('profileHistoryList');
  if(!list)return;
  list.innerHTML='';
  if(!Array.isArray(games)||!games.length){
    const empty=document.createElement('div');
    empty.className='profile-history-empty';
    empty.textContent='Aucune partie enregistrée pour le moment.';
    list.appendChild(empty);
    return;
  }
  games.forEach(game=>{
    const item=document.createElement('div');
    item.className='profile-history-item '+String(game.result||'');
    const result=document.createElement('div');
    result.className='profile-history-result';
    result.textContent=game.result==='win'?'V':game.result==='loss'?'D':'N';
    const main=document.createElement('div');
    main.className='profile-history-main';
    const top=document.createElement('div');
    top.className='profile-history-top';
    const opponent=document.createElement('strong');
    opponent.textContent=game.opponent_name||'Adversaire';
    const mode=document.createElement('span');
    mode.textContent=historyModeLabel(game)+' · '+(game.time_control||'—');
    top.append(opponent,mode);
    const meta=document.createElement('div');
    meta.className='profile-history-meta';
    const resultText=game.result==='win'?'Victoire':game.result==='loss'?'Défaite':'Nulle';
    const rated=game.rated?'Classée':'Non classée';
    const eloDelta=Number(game.elo_delta)||0;
    const deltaText=game.rated?' · ELO '+(eloDelta>0?'+':'')+eloDelta:'';
    meta.textContent=resultText+' · '+rated+deltaText+' · '+formatHistoryDate(game.created_at);
    main.append(top,meta);
    item.append(result,main);
    list.appendChild(item);
  });
}
function renderProfileDashboardData(data){
  const player=data&&data.player||{};
  const stats=data&&data.stats||{};
  const games=Array.isArray(data&&data.games)?data.games:[];
  $('profileDashboardTitle').textContent=player.name||playerName||'Joueur';
  $('profileDashboardElo').textContent=Number.isFinite(Number(player.elo))?String(player.elo):'—';
  $('profileDashboardMemberSince').textContent=player.created_at?'Membre depuis '+formatProfileDate(player.created_at):'Compte joueur';
  $('profileStatGames').textContent=String(Number(stats.games)||0);
  $('profileStatWins').textContent=String(Number(stats.wins)||0);
  $('profileStatDraws').textContent=String(Number(stats.draws)||0);
  $('profileStatLosses').textContent=String(Number(stats.losses)||0);
  $('profileStatWinRate').textContent=(Number(stats.win_rate)||0)+' %';
  $('profileStatsGrid')?.classList.remove('hidden');
  $('profileDangerZone')?.classList.remove('hidden');
  $('profileGuestAction')?.classList.add('hidden');
  renderProfileHistory(games);
}
async function openProfileDashboard(){
  const overlay=$('profileDashboardOverlay');
  if(!overlay)return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  $('profileDeleteConfirm')?.classList.add('hidden');
  if(isGuest||!authToken){
    $('profileDashboardTitle').textContent='Invité';
    $('profileDashboardElo').textContent='—';
    $('profileDashboardMemberSince').textContent='Mode non classé';
    $('profileStatsGrid')?.classList.add('hidden');
    $('profileDangerZone')?.classList.add('hidden');
    $('profileGuestAction')?.classList.remove('hidden');
    renderProfileHistory([]);
    setProfileDashboardStatus('');
    return;
  }
  setProfileDashboardStatus('Chargement du profil…');
  try{
    const data=await apiJSON('/api/profile-data',{method:'GET'});
    renderProfileDashboardData(data);
    setProfileDashboardStatus('');
  }catch(err){
    setProfileDashboardStatus(err.status===401?'Ta session a expiré. Reconnecte-toi.':(err.message||'Impossible de charger le profil.'),'error');
  }
}
function revealDeleteAccount(){
  $('profileDeleteConfirm')?.classList.remove('hidden');
  setTimeout(()=>$('profileDeletePassword')?.focus(),80);
}
async function deleteCurrentAccount(){
  if(isGuest||!authToken)return;
  const password=String($('profileDeletePassword')?.value||'');
  const btn=$('profileDeleteConfirmBtn');
  if(!password){setProfileDashboardStatus('Entre ton mot de passe pour confirmer.','error');return;}
  if(btn)btn.disabled=true;
  setProfileDashboardStatus('Suppression du compte…');
  try{
    await apiJSON('/api/account',{method:'DELETE',body:JSON.stringify({password})});
    saveAuthToken('');
    try{
      localStorage.removeItem(LAST_PROFILE_STORAGE_KEY);
      localStorage.removeItem(ELO_STORAGE_KEY);
    }catch(e){}
    isGuest=false;
    remoteOpponentGuest=false;
    playerName='';
    playerElo=ELO_START;
    databaseAvailable=false;
    profileLoaded=false;
    closeProfileDashboard();
    if(chess)resetGame();
    renderProfile();
    renderElo();
    renderTeamNames();
    showProfileOverlay('Compte supprimé définitivement. Tu peux créer un nouveau profil.','register');
  }catch(err){
    if(err.status===401||err.code==='BAD_PASSWORD')setProfileDashboardStatus('Mot de passe incorrect.','error');
    else setProfileDashboardStatus(err.message||'Suppression impossible.','error');
  }finally{
    if(btn)btn.disabled=false;
  }
}
function currentHistoryOpponent(){
  if(gameMode==='ai')return ensureAIName();
  if(gameMode==='remote')return remoteOpponentName||'Adversaire';
  return 'Partie locale';
}
function currentGameIsRated(){
  return !isGuest&&(gameMode==='ai'||gameMode==='remote')&&!(gameMode==='remote'&&remoteOpponentGuest);
}
async function recordGameHistory(score,reason=''){
  if(gameHistoryRecorded||isGuest||!authToken||!playerCamp)return;
  gameHistoryRecorded=true;
  const result=score===1?'win':score===0?'loss':'draw';
  const rated=currentGameIsRated();
  const rating=eloLastChange;
  const payload={
    mode:gameMode||'local',
    opponent_name:currentHistoryOpponent(),
    opponent_elo:gameMode==='local'?null:(Number(currentOpponentElo())||null),
    player_color:playerCamp,
    result,
    reason:String(reason||'').slice(0,20),
    time_control:TIME_CONTROL_LABEL,
    rated,
    elo_before:rated&&rating?rating.oldRating:playerElo,
    elo_after:rated&&rating?rating.newRating:playerElo,
    elo_delta:rated&&rating?rating.change:0
  };
  try{
    await apiJSON('/api/games',{method:'POST',body:JSON.stringify(payload)});
  }catch(err){
    console.warn('Historique de partie non enregistré:',err);
  }
}

function showModeOverlay(panel='main'){
  const overlay=$('modeOverlay');
  if(!overlay)return;
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden','false');
  $('modeMainPanel').classList.toggle('hidden',panel!=='main');
  $('aiPanel').classList.toggle('hidden',panel!=='ai');
  $('remotePanel').classList.toggle('hidden',panel!=='remote');
}
function hideModeOverlay(){
  const overlay=$('modeOverlay');
  if(overlay){
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden','true');
  }
}
function setRemoteStatus(msg,kind=''){
  const el=$('remoteStatus');
  if(!el)return;
  el.textContent=msg;
  el.className='remote-status'+(kind?' '+kind:'');
}
function prepareModeChoice({showOverlay=true}={}){
  stopClock();
  hideCampOverlay();
  hideMateOverlay();
  clearEloResult();
  playerCamp=null;
  gameMode=null;
  opponentElo=null;
  remoteOpponentName='';
  remoteOpponentGuest=false;
  aiDisplayName='';
  eloSettled=false;
  eloLastChange=null;
  aiThinking=false;
  gameHistoryRecorded=false;
  resetGameActionState();
  if(aiTimer){clearTimeout(aiTimer);aiTimer=null;}
  clockState={w:INITIAL_CLOCK_MS,b:INITIAL_CLOCK_MS};
  timeoutWinner=null;
  clockLastTick=0;
  clockRunning=false;
  renderClocks();
  renderElo();

  if(showOverlay)showModeOverlay('main');
  else hideModeOverlay();
}
function startLocalMode(){
  gameMode='local';
  aiDisplayName='';
  remoteOpponentName='';
  remoteOpponentGuest=false;
  opponentElo=null;
  eloSettled=false;
  clearEloResult();
  renderElo();
  hideModeOverlay();
  prepareCampChoice();
}
function startAIMode(level){
  gameMode='ai';
  aiLevel=level;
  aiDisplayName=randomAIName();
  remoteOpponentName='';
  remoteOpponentGuest=false;
  opponentElo=AI_ELO[level]||ELO_START;
  eloSettled=false;
  clearEloResult();
  renderElo();
  hideModeOverlay();
  prepareCampChoice();
}
function cleanCode(v){
  return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
}
function makeRoomCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out='';
  for(let i=0;i<6;i++)out+=chars[Math.floor(Math.random()*chars.length)];
  return out;
}
function readRemoteSession(){
  const stores=[
    {store:localStorage,key:REMOTE_SESSION_STORAGE_KEY},
    {store:sessionStorage,key:REMOTE_SESSION_STORAGE_KEY},
    {store:localStorage,key:REMOTE_SESSION_LEGACY_KEY},
    {store:sessionStorage,key:REMOTE_SESSION_LEGACY_KEY}
  ];
  for(const item of stores){
    try{
      const raw=item.store.getItem(item.key);
      if(!raw)continue;
      const data=JSON.parse(raw);
      const code=cleanCode(data&&data.code);
      if(code.length!==6||!['host','guest'].includes(data&&data.role))continue;
      const updatedAt=Number(data.updatedAt)||0;
      if(updatedAt&&Date.now()-updatedAt>REMOTE_SESSION_TTL_MS){
        try{item.store.removeItem(item.key);}catch(e){}
        continue;
      }
      const normalized={...data,code};
      // Migration automatique de l'ancienne session vers un stockage persistant.
      if(item.key!==REMOTE_SESSION_STORAGE_KEY||item.store!==localStorage){
        try{localStorage.setItem(REMOTE_SESSION_STORAGE_KEY,JSON.stringify(normalized));}catch(e){}
      }
      return normalized;
    }catch(e){}
  }
  return null;
}
function clearRemoteSession(){
  for(const store of [localStorage,sessionStorage]){
    try{store.removeItem(REMOTE_SESSION_STORAGE_KEY);}catch(e){}
    try{store.removeItem(REMOTE_SESSION_LEGACY_KEY);}catch(e){}
  }
}
function saveRemoteSession(extra={}){
  if(gameMode!=='remote'||!remoteRoomCode)return;
  const existing=readRemoteSession()||{};
  const snapshot={
    ...existing,
    role:remoteIsHost?'host':'guest',
    code:remoteRoomCode,
    active:!!remoteReady,
    fen:chess?chess.fen():existing.fen,
    clocks:{w:Number(clockState&&clockState.w)||INITIAL_CLOCK_MS,b:Number(clockState&&clockState.b)||INITIAL_CLOCK_MS},
    clockStarted:!!clockStarted,
    timeControlKey:selectedTimeControlKey,
    timeControlLabel:TIME_CONTROL_LABEL,
    initialClockMs:INITIAL_CLOCK_MS,
    incrementMs:CLOCK_INCREMENT_MS,
    playerCamp:playerCamp||existing.playerCamp||null,
    flipped:!!flipped,
    opponentElo:Number(opponentElo)||null,
    opponentName:remoteOpponentName||'',
    opponentGuest:!!remoteOpponentGuest,
    capturedByWhite:Array.isArray(capturedByWhite)?capturedByWhite:[],
    capturedByBlack:Array.isArray(capturedByBlack)?capturedByBlack:[],
    updatedAt:Date.now(),
    ...extra
  };
  // localStorage est volontaire : Safari/iOS peut tuer puis recharger l'onglet
  // après un changement d'app. sessionStorage seul n'est pas assez robuste.
  try{localStorage.setItem(REMOTE_SESSION_STORAGE_KEY,JSON.stringify(snapshot));}catch(e){}
  try{sessionStorage.setItem(REMOTE_SESSION_STORAGE_KEY,JSON.stringify(snapshot));}catch(e){}
}
function restoreRemoteSnapshot(session){
  if(!session)return;
  gameMode='remote';
  remoteRoomCode=session.code;
  remoteIsHost=session.role==='host';
  if(session.timeControlKey&&TIME_CONTROLS[session.timeControlKey])configureTimeControl(session.timeControlKey);
  else applyRemoteTimeControl(session);
  try{if(session.fen&&chess)chess.load(session.fen);}catch(e){}
  playerCamp=session.playerCamp||(remoteIsHost?'w':'b');
  flipped=typeof session.flipped==='boolean'?session.flipped:playerCamp==='b';
  opponentElo=Number(session.opponentElo)||null;
  remoteOpponentName=cleanPlayerName(session.opponentName)||'';
  remoteOpponentGuest=!!session.opponentGuest;
  if(Array.isArray(session.capturedByWhite))capturedByWhite=session.capturedByWhite;
  if(Array.isArray(session.capturedByBlack))capturedByBlack=session.capturedByBlack;
  if(session.clocks){
    clockState={
      w:Number(session.clocks.w)||INITIAL_CLOCK_MS,
      b:Number(session.clocks.b)||INITIAL_CLOCK_MS
    };
  }
  clockStarted=!!session.clockStarted;
  clockRunning=clockStarted;
  clockLastTick=clockStarted?performance.now():0;
  if(clockStarted&&!clockInterval)clockInterval=setInterval(clockTick,200);
  renderAll();
}
function destroyRemote({clearSession=true}={}){
  // Invalide AVANT la fermeture tous les callbacks provenant de l'ancienne
  // salle. Sur mobile, close/error peut arriver après la création suivante.
  remoteConnectionGeneration++;

  const oldConn=peerConn;
  const oldPeer=peer;

  peerConn=null;
  peer=null;
  remoteReady=false;
  remoteIsHost=false;
  remoteRoomCode='';
  remoteDrawOfferByMe=false;
  remoteDrawOfferIncoming=false;
  remoteReconnectInProgress=false;
  remoteConnectAttempts=0;
  remoteLastConnectedAt=0;

  if(remoteReconnectTimer){
    clearTimeout(remoteReconnectTimer);
    remoteReconnectTimer=null;
  }
  if(remoteHandshakeTimer){
    clearTimeout(remoteHandshakeTimer);
    remoteHandshakeTimer=null;
  }

  try{if(oldConn)oldConn.close();}catch(e){}
  try{if(oldPeer&&!oldPeer.destroyed)oldPeer.destroy();}catch(e){}

  if(clearSession)clearRemoteSession();
}
async function loadPeerJS(){
  if(PeerCtor)return;
  if(peerScriptPromise)return peerScriptPromise;
  peerScriptPromise=import('peerjs').then(mod=>{
    PeerCtor=mod.default||mod.Peer;
    if(!PeerCtor)throw new Error('PeerJS indisponible');
  });
  return peerScriptPromise;
}
function resetBoardForRemote(){
  hideMateOverlay();
  hideCampOverlay();
  clearEloResult();
  opponentElo=null;
  eloSettled=false;
  eloLastChange=null;
  gameHistoryRecorded=false;
  resetGameActionState();
  chess.reset();
  selected=null;
  targets=[];
  lastMove=null;
  capturedByWhite=[];
  capturedByBlack=[];
  clockState={w:INITIAL_CLOCK_MS,b:INITIAL_CLOCK_MS};
  timeoutWinner=null;
  clockLastTick=0;
  clockRunning=false;
  clockStarted=false;
  renderElo();
  renderAll();
}
function scheduleRemoteReconnect(delay=900){
  if(gameMode!=='remote'||!remoteRoomCode||manualGameFinished)return;
  if(remoteReconnectTimer)return;
  remoteReconnectTimer=setTimeout(()=>{
    remoteReconnectTimer=null;
    if(document.hidden){scheduleRemoteReconnect(1400);return;}
    resumeRemoteConnection().catch(err=>{
      console.warn('Reconnexion distante:',err);
      scheduleRemoteReconnect(1800);
    });
  },delay);
}
function remoteHostPeerId(code){
  return 'mariochess-'+cleanCode(code).toLowerCase();
}
function peerIsUsable(p){
  return !!(p&&!p.destroyed);
}
function peerIsOpen(p){
  return !!(peerIsUsable(p)&&p.open&&!p.disconnected);
}
function peerIsConnecting(p){
  return !!(peerIsUsable(p)&&!p.open&&!p.disconnected);
}
function safelyCloseRemoteConnection(){
  const old=peerConn;
  peerConn=null;
  if(old){try{old.close();}catch(e){}}
}
function clearRemoteHandshakeTimer(){
  if(!remoteHandshakeTimer)return;
  clearTimeout(remoteHandshakeTimer);
  remoteHandshakeTimer=null;
}
function armRemoteHandshakeTimer(conn,generation,{waitingForInit=false}={}){
  clearRemoteHandshakeTimer();
  remoteHandshakeTimer=setTimeout(()=>{
    remoteHandshakeTimer=null;
    if(
      generation!==remoteConnectionGeneration ||
      peerConn!==conn ||
      gameMode!=='remote' ||
      remoteReady
    )return;

    // PeerJS peut conserver une DataConnection qui n'ouvrira jamais après
    // un "peer-unavailable". La fermer force la tentative suivante à créer
    // une négociation WebRTC neuve au lieu de rester bloquée sur ce fantôme.
    if(peerConn===conn)peerConn=null;
    try{conn.close();}catch(e){}
    saveRemoteSession({active:false});
    setRemoteStatus(
      waitingForInit
        ? 'La salle répond, synchronisation de la partie…'
        : 'Ton ami n’est pas encore prêt. Nouvelle tentative…',
      'wait'
    );
    scheduleRemoteReconnect(180);
  },waitingForInit?5000:9000);
}
function attachPeerErrors(p,generation,{newRoom=false}={}){
  const isCurrent=()=>generation===remoteConnectionGeneration&&p===peer&&gameMode==='remote';

  p.on('error',err=>{
    console.error('PeerJS',err);
    if(!isCurrent())return;

    if(err&&err.type==='peer-unavailable'){
      setRemoteStatus(remoteIsHost?'En attente de ton ami…':'Ton ami n’est pas encore reconnecté. Nouvelle tentative…','wait');
      scheduleRemoteReconnect(1200);
      return;
    }

    if(err&&err.type==='unavailable-id'&&remoteIsHost){
      if(newRoom){
        // Collision rarissime : on ne bloque pas l'utilisateur.
        // On génère simplement une autre salle lorsque ce Peer est toujours courant.
        setRemoteStatus('Ce code est déjà utilisé. Génération d’un nouveau code…','wait');
        setTimeout(()=>{
          if(isCurrent()&&!remoteCreatingRoom)createRemoteRoom();
        },120);
        return;
      }
      try{p.destroy();}catch(e){}
      if(peer===p)peer=null;
      setRemoteStatus('Récupération de la salle '+remoteRoomCode+'…','wait');
      scheduleRemoteReconnect(1800);
      return;
    }

    if(err&&['network','server-error','socket-error','socket-closed'].includes(err.type)){
      setRemoteStatus('Réseau interrompu. Reconnexion automatique…','wait');
      scheduleRemoteReconnect(900);
      return;
    }

    setRemoteStatus('Connexion interrompue. Reconnexion automatique…','wait');
    scheduleRemoteReconnect(1200);
  });

  p.on('disconnected',()=>{
    if(!isCurrent())return;
    if(document.hidden)return;
    try{if(!p.destroyed)p.reconnect();}
    catch(e){scheduleRemoteReconnect(650);}
  });

  p.on('close',()=>{
    // Un ancien Peer détruit pendant « Créer une partie » est ignoré.
    if(!isCurrent())return;
    peer=null;
    scheduleRemoteReconnect(700);
  });
}
function connectGuestToHost(p,code,generation=remoteConnectionGeneration){
  if(generation!==remoteConnectionGeneration||p!==peer||!peerIsUsable(p)||!p.open)return null;
  safelyCloseRemoteConnection();
  remoteReady=false;
  remoteConnectAttempts++;
  setRemoteStatus(
    'Connexion au code '+code+(remoteConnectAttempts>1?' · tentative '+remoteConnectAttempts:'')+'…',
    'wait'
  );
  const conn=p.connect(remoteHostPeerId(code),{
    reliable:true,
    serialization:'json',
    metadata:{game:'chess-mario',room:code,protocol:2}
  });
  setupRemoteConnection(conn,false,generation);
  armRemoteHandshakeTimer(conn,generation);
  return conn;
}
function waitForPeerOpen(p,generation,timeoutMs=90000){
  if(generation!==remoteConnectionGeneration||p!==peer){
    const err=new Error('Création de salle annulée.');
    err.type='cancelled';
    return Promise.reject(err);
  }
  if(peerIsOpen(p))return Promise.resolve(p);

  return new Promise((resolve,reject)=>{
    let settled=false;
    let timer=null;
    const cleanup=()=>{
      if(typeof p.off==='function'){
        p.off('open',onOpen);
        p.off('error',onError);
        p.off('close',onClose);
      }
      if(timer)clearTimeout(timer);
    };
    const finish=(fn,value)=>{
      if(settled)return;
      settled=true;
      cleanup();
      fn(value);
    };
    const onOpen=()=>{
      if(generation!==remoteConnectionGeneration||p!==peer){
        const err=new Error('Création de salle annulée.');
        err.type='cancelled';
        finish(reject,err);
        return;
      }
      finish(resolve,p);
    };
    const onError=err=>{
      if(generation!==remoteConnectionGeneration||p!==peer)return;
      if(err&&['unavailable-id','invalid-id','browser-incompatible','ssl-unavailable'].includes(err.type))finish(reject,err);
    };
    const onClose=()=>{
      if(generation!==remoteConnectionGeneration)return;
      const err=new Error('Connexion PeerJS fermée pendant la création.');
      err.type='peer-closed';
      finish(reject,err);
    };
    timer=setTimeout(()=>{
      const err=new Error('Connexion au serveur de jeu toujours en attente.');
      err.type='open-timeout';
      finish(reject,err);
    },timeoutMs);
    p.on('open',onOpen);
    p.on('error',onError);
    p.on('close',onClose);
  });
}

async function createHostPeerForCode(code,{force=false,newRoom=false,waitForOpen=false}={}){
  await loadPeerJS();
  const hostId=remoteHostPeerId(code);

  if(!force&&peerIsOpen(peer)&&peer.id===hostId){
    remoteIsHost=true;
    remoteRoomCode=code;
    remoteReconnectInProgress=false;
    $('accessCode').textContent=code;
    $('accessCodeBox').classList.remove('hidden');
    setRemoteStatus(peerConn&&peerConn.open?'Reconnecté à ton ami.':'Salle '+code+' restaurée. En attente de ton ami…','wait');
    saveRemoteSession({role:'host',code,active:!!(peerConn&&peerConn.open)});
    return peer;
  }

  if(!force&&peerIsUsable(peer)&&peer.id===hostId&&peer.disconnected){
    try{
      peer.reconnect();
      remoteIsHost=true;
      remoteRoomCode=code;
      $('accessCodeBox').classList.add('hidden');
      setRemoteStatus('Récupération de la salle '+code+'…','wait');
      saveRemoteSession({role:'host',code,active:false});
      return peer;
    }catch(e){}
  }

  // IMPORTANT mobile : si le websocket PeerJS est encore en train de
  // s'ouvrir, on le laisse vivre. Le détruire/recréer ici pouvait empêcher
  // indéfiniment l'événement "open" d'arriver.
  if(!force&&peerIsConnecting(peer)&&peer.id===hostId){
    remoteIsHost=true;
    remoteRoomCode=code;
    $('accessCode').textContent=code;
    $('accessCodeBox').classList.add('hidden');
    setRemoteStatus('Enregistrement de la salle sur le serveur…','wait');
    saveRemoteSession({role:'host',code,active:false});
    return peer;
  }

  const generation=++remoteConnectionGeneration;
  const old=peer;
  peer=null;
  if(old){try{old.destroy();}catch(e){}}

  const p=new PeerCtor(hostId);
  peer=p;
  attachPeerErrors(p,generation,{newRoom});

  p.on('open',()=>{
    if(generation!==remoteConnectionGeneration||gameMode!=='remote'||p!==peer)return;
    remoteReconnectInProgress=false;
    remoteIsHost=true;
    remoteRoomCode=code;
    $('accessCode').textContent=code;
    $('accessCodeBox').classList.remove('hidden');
    setRemoteStatus(peerConn&&peerConn.open?'Reconnecté à ton ami.':'Salle '+code+' prête. En attente de ton ami…','wait');
    saveRemoteSession({role:'host',code,active:!!(peerConn&&peerConn.open)});
  });

  p.on('connection',conn=>{
    if(generation!==remoteConnectionGeneration||p!==peer){try{conn.close();}catch(e){};return;}
    if(peerConn&&peerConn.open){try{peerConn.close();}catch(e){}}
    setupRemoteConnection(conn,true,generation);
  });

  if(waitForOpen)await waitForPeerOpen(p,generation);
  return p;
}
async function createGuestPeerForCode(code,{force=false}={}){
  await loadPeerJS();

  if(!force&&peerIsOpen(peer)){
    remoteIsHost=false;
    remoteRoomCode=code;
    if(!peerConn||!peerConn.open)connectGuestToHost(peer,code,remoteConnectionGeneration);
    return peer;
  }

  if(!force&&peerIsUsable(peer)&&peer.disconnected){
    try{
      peer.reconnect();
      remoteIsHost=false;
      remoteRoomCode=code;
      setRemoteStatus('Reconnexion à la salle '+code+'…','wait');
      return peer;
    }catch(e){}
  }

  if(!force&&peerIsConnecting(peer)){
    remoteIsHost=false;
    remoteRoomCode=code;
    setRemoteStatus('Connexion à la salle '+code+' en cours…','wait');
    return peer;
  }

  const generation=++remoteConnectionGeneration;
  const old=peer;
  peer=null;
  if(old){try{old.destroy();}catch(e){}}

  const p=new PeerCtor();
  peer=p;
  attachPeerErrors(p,generation);
  p.on('open',()=>{
    if(generation!==remoteConnectionGeneration||gameMode!=='remote'||p!==peer)return;
    connectGuestToHost(p,code,generation);
  });
  return p;
}
function probeRemoteConnection(){
  if(gameMode!=='remote'||!peerConn||!peerConn.open)return false;
  const conn=peerConn;
  const sentAt=Date.now();
  try{
    conn.send({type:'resume_probe',at:sentAt});
    setTimeout(()=>{
      if(gameMode!=='remote'||peerConn!==conn||!conn.open)return;
      // Sur iOS une DataConnection peut rester marquée "open" alors que le
      // transport WebRTC est déjà mort. Sans réponse après la reprise, on la
      // ferme volontairement afin de déclencher une vraie reconnexion.
      if(remoteLastConnectedAt<sentAt){
        try{conn.close();}catch(e){}
        if(peerConn===conn)peerConn=null;
        remoteReady=false;
        saveRemoteSession({active:false});
        setRemoteStatus('La connexion mobile a expiré. Récupération de la salle…','wait');
        scheduleRemoteReconnect(120);
      }
    },2200);
    return true;
  }catch(e){
    safelyCloseRemoteConnection();
    remoteReady=false;
    scheduleRemoteReconnect(120);
    return false;
  }
}
async function resumeRemoteConnection(){
  if(remoteReconnectInProgress||document.hidden)return;
  const session=readRemoteSession();
  if(!session)return;
  if(gameMode!=='remote'||!remoteRoomCode)restoreRemoteSnapshot(session);
  remoteReconnectInProgress=true;
  remoteRoomCode=session.code;
  remoteIsHost=session.role==='host';

  try{
    // Si la DataConnection est réellement ouverte, on la garde et on sonde
    // l'autre appareil. C'était précisément ce qui était cassé en v73.
    if(peerConn&&peerConn.open){
      remoteReady=true;
      remoteLastConnectedAt=Date.now();
      saveRemoteSession({active:true});
      probeRemoteConnection();
      setRemoteStatus('Partie reconnectée.','ok');
      return;
    }

    remoteReady=false;
    setRemoteStatus(remoteIsHost?'Restauration de ta salle '+session.code+'…':'Reconnexion à la salle '+session.code+'…','wait');

    if(remoteIsHost){
      await createHostPeerForCode(session.code);
    }else{
      await createGuestPeerForCode(session.code);
    }
  }finally{
    remoteReconnectInProgress=false;
  }
}
async function restoreRemoteSessionOnBoot(){
  const session=readRemoteSession();
  if(!session)return false;
  restoreRemoteSnapshot(session);
  remoteReady=false;
  $('accessCode').textContent=session.code;
  // Le code redevient partageable uniquement lorsque le PeerServer a
  // confirmé que la salle restaurée est de nouveau enregistrée.
  $('accessCodeBox').classList.add('hidden');
  showModeOverlay('remote');
  setRemoteStatus(session.role==='host'?'Restauration de ta salle '+session.code+'…':'Reconnexion à la salle '+session.code+'…','wait');
  await resumeRemoteConnection();
  return true;
}
function sendRemoteInit(conn){
  if(!conn||!conn.open)return;
  conn.send({
    type:'init',
    fen:chess.fen(),
    hostCamp:'w',
    guestCamp:'b',
    clocks:{w:clockState.w,b:clockState.b},
    clockStarted:clockStarted,
    timeControlKey:selectedTimeControlKey,
    timeControlLabel:TIME_CONTROL_LABEL,
    initialClockMs:INITIAL_CLOCK_MS,
    incrementMs:CLOCK_INCREMENT_MS,
    elo:playerElo,
    playerName:isGuest?'Invité':(playerName||'Joueur'),
    isGuest:isGuest,
    resume:true
  });
}
function setupRemoteConnection(conn,isHost,generation=remoteConnectionGeneration){
  if(generation!==remoteConnectionGeneration)return;
  if(peerConn&&peerConn!==conn){try{peerConn.close();}catch(e){}}
  peerConn=conn;
  remoteIsHost=isHost;
  setRemoteStatus(isHost?'Un ami se connecte…':'Connexion à la partie…','wait');

  conn.on('open',()=>{
    if(generation!==remoteConnectionGeneration||peerConn!==conn)return;
    remoteReconnectInProgress=false;
    remoteRoomCode=remoteRoomCode||cleanCode(readRemoteSession()?.code);
    remoteLastConnectedAt=Date.now();
    if(isHost){
      remoteReady=true;
      saveRemoteSession({active:true,role:'host'});
      clearRemoteHandshakeTimer();
      remoteConnectAttempts=0;
      playerCamp='w';
      flipped=false;
      sendRemoteInit(conn);
      hideModeOverlay();
      if(!clockStarted&&chess.history().length===0)resetClock();
      renderAll();
      saveRemoteSession({active:true});
    }else{
      // Redemande explicitement l'état initial. Cela couvre le cas où le
      // message envoyé par l'hôte pendant l'ouverture a été perdu/retardé.
      remoteReady=false;
      saveRemoteSession({active:false,role:'guest'});
      try{conn.send({type:'sync_request'});}catch(e){}
      armRemoteHandshakeTimer(conn,generation,{waitingForInit:true});
    }
  });

  conn.on('data',data=>{
    if(generation!==remoteConnectionGeneration||peerConn!==conn)return;
    if(!data||typeof data!=='object')return;
    remoteLastConnectedAt=Date.now();
    if(data.type==='resume_probe'){
      try{if(conn.open)conn.send({type:'resume_pong',at:Date.now()});}catch(e){}
      if(isHost)sendRemoteInit(conn);
      return;
    }
    if(data.type==='resume_pong'){
      remoteReady=true;
      saveRemoteSession({active:true});
      setRemoteStatus('Partie reconnectée.','ok');
      return;
    }
    if(data.type==='sync_request'){
      if(isHost)sendRemoteInit(conn);
      return;
    }
    if(data.type==='init'&&!isHost){
      clearRemoteHandshakeTimer();
      remoteConnectAttempts=0;
      chess.load(data.fen);
      playerCamp=data.guestCamp||'b';
      flipped=playerCamp==='b';
      opponentElo=Number(data.elo)||ELO_START;
      remoteOpponentName=cleanPlayerName(data.playerName)||'Adversaire';
      remoteOpponentGuest=!!data.isGuest;
      if(conn.open)conn.send({
        type:'elo',
        elo:playerElo,
        playerName:isGuest?'Invité':(playerName||'Joueur'),
        isGuest:isGuest
      });
      renderElo();
      renderTeamNames();
      applyRemoteTimeControl(data);
      clockState={
        w:Number(data.clocks&&data.clocks.w)||INITIAL_CLOCK_MS,
        b:Number(data.clocks&&data.clocks.b)||INITIAL_CLOCK_MS
      };
      timeoutWinner=null;
      clockStarted=!!data.clockStarted;
      clockRunning=clockStarted;
      clockLastTick=clockStarted?performance.now():0;
      if(clockStarted&&!clockInterval)clockInterval=setInterval(clockTick,200);
      remoteReady=true;
      remoteLastConnectedAt=Date.now();
      hideModeOverlay();
      renderAll();
      setRemoteStatus('Partie reconnectée.','ok');
      saveRemoteSession({active:true,role:'guest'});
      return;
    }
    if(data.type==='elo'){
      opponentElo=Number(data.elo)||ELO_START;
      if(data.playerName)remoteOpponentName=cleanPlayerName(data.playerName)||'Adversaire';
      remoteOpponentGuest=!!data.isGuest;
      renderElo();
      renderTeamNames();
      saveRemoteSession({active:true});
      return;
    }
    if(data.type==='move'){
      remoteDrawOfferByMe=false;
      remoteDrawOfferIncoming=false;
      setGameActionStatus('');
      if(data.clocks){
        clockState.w=Number(data.clocks.w);
        clockState.b=Number(data.clocks.b);
      }
      clockStarted=!!data.clockStarted;
      clockRunning=clockStarted;
      clockLastTick=clockStarted?performance.now():0;
      if(clockStarted&&!clockInterval)clockInterval=setInterval(clockTick,200);
      playMove(data.from,data.to,'remote');
      setTimeout(()=>saveRemoteSession({active:true}),620);
      return;
    }
    if(data.type==='draw_offer'){
      if(manualGameFinished)return;
      remoteDrawOfferIncoming=true;
      remoteDrawOfferByMe=false;
      setGameActionStatus((remoteOpponentName||'Ton adversaire')+' propose la nulle.','wait');
      renderGameActions();
      showIncomingDrawOffer('remote');
      return;
    }
    if(data.type==='draw_accept'){
      remoteDrawOfferByMe=false;
      finishAgreedDraw();
      return;
    }
    if(data.type==='draw_decline'){
      remoteDrawOfferByMe=false;
      setGameActionStatus('Proposition de nulle refusée.');
      renderGameActions();
      return;
    }
    if(data.type==='resign'){
      const winnerColor=data.winner==='b'?'b':'w';
      finishResignation(winnerColor,{opponentResigned:true});
      return;
    }
    if(data.type==='timeout'){
      clearRemoteSession();
      timeoutWinner=data.winner;
      clockRunning=false;
      renderAll();
      showTimeWinner(timeoutWinner);
      return;
    }
  });

  conn.on('error',err=>{
    if(generation!==remoteConnectionGeneration||peerConn!==conn)return;
    console.warn('DataConnection distante:',err);
    if(gameMode==='remote'&&remoteRoomCode){
      clearRemoteHandshakeTimer();
      remoteReady=false;
      saveRemoteSession({active:false});
      setRemoteStatus('Connexion interrompue. Reconnexion automatique…','wait');
      scheduleRemoteReconnect(500);
    }
  });

  conn.on('close',()=>{
    if(generation!==remoteConnectionGeneration||peerConn!==conn)return;
    if(peerConn===conn)peerConn=null;
    if(gameMode==='remote'&&remoteRoomCode){
      clearRemoteHandshakeTimer();
      remoteReady=false;
      saveRemoteSession({active:false});
      setRemoteStatus("Connexion avec l'ami interrompue. Reconnexion automatique…",'wait');
      renderGameActions();
      scheduleRemoteReconnect(document.hidden?1200:450);
    }
  });
}
async function createRemoteRoom(){
  if(remoteCreatingRoom)return;
  remoteCreatingRoom=true;
  const btn=$('createRoomBtn');
  if(btn)btn.disabled=true;

  destroyRemote();
  gameMode='remote';
  resetBoardForRemote();
  $('accessCodeBox').classList.add('hidden');
  setRemoteStatus('Création de la salle…','wait');

  try{
    await loadPeerJS();

    const code=makeRoomCode();
    remoteRoomCode=code;
    remoteIsHost=true;

    // Le code n'est affiché qu'après l'événement "open" : avant cela il
    // n'existe pas encore côté PeerServer et un ami ne peut pas le rejoindre.
    $('accessCode').textContent=code;
    $('accessCodeBox').classList.add('hidden');
    saveRemoteSession({role:'host',code,active:false});

    setRemoteStatus('Enregistrement de la salle sur le serveur…','wait');

    // IMPORTANT v76 : ne jamais attendre peer.open avec un timeout bloquant.
    // Le PeerServer Cloud peut répondre lentement. Le callback "open" de
    // createHostPeerForCode passera automatiquement l'état à "Salle prête".
    await createHostPeerForCode(code,{
      force:true,
      newRoom:true,
      waitForOpen:false
    });

    // Message informatif seulement : la salle n'est PAS détruite.
    setTimeout(()=>{
      if(
        gameMode==='remote' &&
        remoteIsHost &&
        remoteRoomCode===code &&
        peer &&
        !peer.destroyed &&
        !peer.open
      ){
        setRemoteStatus('Le serveur met du temps à répondre. La création continue automatiquement…','wait');
      }
    },8000);

  }catch(err){
    console.error(err);

    if(err&&err.type==='browser-incompatible'){
      setRemoteStatus('Ce navigateur ne permet pas la connexion pair-à-pair.','error');
    }else{
      setRemoteStatus(
        'La création de la salle sera retentée automatiquement.',
        'wait'
      );
      scheduleRemoteReconnect(1500);
    }
  }finally{
    remoteCreatingRoom=false;
    if(btn)btn.disabled=false;
  }
}
async function joinRemoteRoom(){
  const code=cleanCode($('roomCodeInput').value);
  $('roomCodeInput').value=code;
  if(code.length!==6){
    setRemoteStatus('Entre un code de 6 caractères.','error');
    return;
  }
  destroyRemote();
  gameMode='remote';
  resetBoardForRemote();
  remoteRoomCode=code;
  remoteIsHost=false;
  saveRemoteSession({role:'guest',code,active:false});
  setRemoteStatus('Connexion au code '+code+'…','wait');
  try{
    await createGuestPeerForCode(code);
  }catch(err){
    console.error(err);
    setRemoteStatus('Impossible de charger le mode en ligne.','error');
  }
}
function remoteShareUrl(code){
  const url=new URL(window.location.href);
  url.searchParams.set('room',code);
  // The visual theme is local to each player. Never force the host's
  // temporary ?theme= override on the opponent through a room link.
  url.searchParams.delete('theme');
  url.hash='';
  return url.toString();
}
async function shareRemoteCode(){
  const code=cleanCode($('accessCode')?.textContent);
  if(code.length!==6)return;
  const url=remoteShareUrl(code);
  const shareTitle=activeTheme.shareTitle||activeTheme.documentTitle||activeTheme.label||'Chess';
  const text='Rejoins ma partie '+shareTitle+' avec le code '+code+'.';
  saveRemoteSession({role:'host',code,active:!!remoteReady});
  try{
    if(navigator.share){
      await navigator.share({title:shareTitle,text,url});
      setRemoteStatus('Code partagé. Reviens simplement dans le jeu : la salle reprend avec le même code.','ok');
      return;
    }
  }catch(err){
    if(err&&err.name==='AbortError')return;
  }
  try{
    await navigator.clipboard.writeText(text+' '+url);
    setRemoteStatus('Code et lien copiés. La salle sera restaurée quand tu reviens.','ok');
  }catch(e){
    setRemoteStatus('Code : '+code+' — la salle sera restaurée quand tu reviens.','ok');
  }
}
function sendRemoteMove(move){
  if(gameMode!=='remote'||!peerConn||!peerConn.open)return;
  if(remoteDrawOfferIncoming){peerConn.send({type:'draw_decline'});remoteDrawOfferIncoming=false;}
  remoteDrawOfferByMe=false;
  setGameActionStatus('');
  peerConn.send({
    type:'move',
    from:move.from,
    to:move.to,
    clocks:{w:clockState.w,b:clockState.b},
    clockStarted:clockStarted
  });
  setTimeout(()=>saveRemoteSession({active:true}),620);
}
function canLocalMove(){
  if(manualGameFinished)return false;
  if(gameMode==='ai')return !aiThinking&&chess.turn()===playerCamp;
  if(gameMode==='remote')return remoteReady&&chess.turn()===playerCamp;
  if(gameMode==='correspondence')return correspondenceStatus==='active'&&chess.turn()===playerCamp;
  return true;
}

let aiWorker=null;
let aiWorkerSeq=0;
const aiWorkerPending=new Map();

function getAIWorker(){
  if(aiWorker)return aiWorker;
  aiWorker=new Worker(new URL('../workers/ai.worker.js',import.meta.url),{type:'module'});
  aiWorker.addEventListener('message',event=>{
    const {id,move,error}=event.data||{};
    const pending=aiWorkerPending.get(id);
    if(!pending)return;
    aiWorkerPending.delete(id);
    if(error)pending.reject(new Error(error));
    else pending.resolve(move||null);
  });
  aiWorker.addEventListener('error',error=>{
    for(const pending of aiWorkerPending.values())pending.reject(error);
    aiWorkerPending.clear();
    try{aiWorker.terminate()}catch(e){}
    aiWorker=null;
  });
  return aiWorker;
}

function pickAIMoveAsync(){
  const worker=getAIWorker();
  const id=++aiWorkerSeq;
  const fen=chess.fen();
  return new Promise((resolve,reject)=>{
    aiWorkerPending.set(id,{resolve,reject});
    worker.postMessage({id,fen,level:aiLevel});
  });
}

function scheduleAIMove(delay=650){
  if(gameMode!=='ai'||manualGameFinished||chess.game_over()||chess.turn()===playerCamp)return;
  aiThinking=true;
  document.body.classList.add('ai-thinking');
  renderStatus();
  if(aiTimer)clearTimeout(aiTimer);
  aiTimer=setTimeout(async()=>{
    aiTimer=null;
    if(gameMode!=='ai'||manualGameFinished||chess.game_over()||chess.turn()===playerCamp){
      aiThinking=false;document.body.classList.remove('ai-thinking');renderStatus();return;
    }
    const expectedFen=chess.fen();
    let move=null;
    try{move=await pickAIMoveAsync()}catch(error){console.error('AI worker:',error)}
    aiThinking=false;
    document.body.classList.remove('ai-thinking');
    if(gameMode!=='ai'||manualGameFinished||chess.game_over()||chess.turn()===playerCamp||chess.fen()!==expectedFen){
      renderStatus();return;
    }
    if(move)playMove(move.from,move.to,'ai');
    else renderStatus();
  },delay);
}

let playerCamp=null;
function showCampOverlay(){const overlay=$('campOverlay');if(overlay){overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');}}
function hideCampOverlay(){const overlay=$('campOverlay');if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}}
function prepareCampChoice(){playerCamp=null;timeoutWinner=null;clockState={w:INITIAL_CLOCK_MS,b:INITIAL_CLOCK_MS};clockLastTick=0;clockRunning=false;restoreMateTitle();renderClocks();showCampOverlay();}
function chooseCamp(camp){
  playerCamp=camp==='random'?(Math.random()<0.5?'w':'b'):camp;
  flipped=playerCamp==='b';
  eloSettled=false;
  eloLastChange=null;
  resetGameActionState();
  clearEloResult();
  if(gameMode==='ai')opponentElo=AI_ELO[aiLevel]||ELO_START;
  hideCampOverlay();
  resetClock();
  renderAll();
  if(gameMode==='ai'&&chess.turn()!==playerCamp)scheduleAIMove(700);
}
function squareOrder(){const files=flipped?['h','g','f','e','d','c','b','a']:['a','b','c','d','e','f','g','h'];const ranks=flipped?['1','2','3','4','5','6','7','8']:['8','7','6','5','4','3','2','1'];const arr=[];for(const r of ranks){for(const f of files)arr.push(f+r);}return arr;}
function coordLabels(){return {files:flipped?['h','g','f','e','d','c','b','a']:['a','b','c','d','e','f','g','h'],ranks:flipped?['1','2','3','4','5','6','7','8']:['8','7','6','5','4','3','2','1']};}
function captureSquareForMove(move){
  // A capture is only highlighted when a human has explicitly selected
  // the attacking piece. "targets" alone is never used globally.
  if(!selected||!move||!move.captured)return null;

  // Normal capture / promotion capture: victim is on destination square.
  if(chess.get(move.to))return move.to;

  // En passant: victim remains beside the selected pawn until the move is made.
  if(move.flags&&move.flags.includes('e')){
    return move.to[0]+move.from[1];
  }

  return move.to;
}

function renderBoard(){
  const board=$('board');
  board.innerHTML='';
  const order=squareOrder();
  const labels=coordLabels();

  // Build capture targets strictly from the currently selected piece.
  const captureSquares=new Set();
  if(selected){
    targets.forEach(move=>{
      const victimSquare=captureSquareForMove(move);
      if(victimSquare)captureSquares.add(victimSquare);
    });
  }

  order.forEach((sq,index)=>{
    const fileIndex=sq.charCodeAt(0)-97;
    const rank=Number(sq[1]);
    const isLight=(fileIndex+rank)%2===1;

    const btn=document.createElement('div');
    btn.className='sq '+(isLight?'light':'dark');
    btn.dataset.sq=sq;

    if(selected===sq)btn.classList.add('selected');
    if(lastMove&&(lastMove.from===sq||lastMove.to===sq))btn.classList.add('last');

    const piece=chess.get(sq);

    if(piece&&piece.type==='k'&&piece.color===chess.turn()&&chess.in_check()){
      btn.classList.add('check');
    }

    const possible=targets.find(m=>m.to===sq);
    const isVictim=!!selected&&captureSquares.has(sq);

    // Empty legal destination = normal green dot.
    // A capture destination is not shown as a generic green ring anymore:
    // the victim itself receives the red "capturable" treatment.
    if(possible&&!possible.captured){
      const hint=document.createElement('span');
      hint.className='dot';
      btn.appendChild(hint);
    }else if(possible&&possible.captured&&!piece){
      // En-passant landing square: small red landing marker while the actual
      // pawn that will be captured is highlighted on its current square.
      const hint=document.createElement('span');
      hint.className='dot capture-landing';
      btn.appendChild(hint);
    }

    if(isVictim){
      btn.classList.add('capture-target');
      btn.setAttribute('aria-label','Pièce capturable');
    }

    if(piece){
      const pieceEl=makePieceEl(piece.color,piece.type);
      if(isVictim)pieceEl.classList.add('capture-threat');
      btn.appendChild(pieceEl);
    }

    const c=index%8;
    const r=Math.floor(index/8);

    if(r===7){
      const x=document.createElement('span');
      x.className='coord file';
      x.textContent=labels.files[c];
      btn.appendChild(x);
    }
    if(c===0){
      const x=document.createElement('span');
      x.className='coord rank';
      x.textContent=labels.ranks[r];
      btn.appendChild(x);
    }

    btn.addEventListener('click',()=>onSquareClick(sq));
    board.appendChild(btn);
  });
}
function showMateOverlay(winner){
  const overlay=$('mateOverlay');
  const name=$('mateWinnerName');
  const img=$('mateCharacter');
  const title=document.querySelector('.mate-sign-top');
  const winnerLabel=document.querySelector('.mate-sign-winner');
  if(title)title.textContent='ECHEC ET MAT';
  if(winnerLabel)winnerLabel.textContent='VICTOIRE DE';
  if(name)name.textContent=winner.toUpperCase();
  setWinnerKingImage(img,winner);
  if(gameMode!=='correspondence'){
    settleEloFromWinner(winner,'checkmate');
    const winnerColor=String(winner).toLowerCase().startsWith('blanc')?'w':'b';
    if(playerCamp)recordGameHistory(winnerColor===playerCamp?1:0,'checkmate');
  }
  if(overlay){
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
}
function hideMateOverlay(){const overlay=$('mateOverlay');if(overlay){overlay.classList.remove('show');overlay.setAttribute('aria-hidden','true');}}

function showDrawOverlay(agreed=false){
  const overlay=$('mateOverlay');
  const name=$('mateWinnerName');
  const img=$('mateCharacter');
  const title=document.querySelector('.mate-sign-top');
  const winnerLabel=document.querySelector('.mate-sign-winner');

  if(title)title.textContent=agreed?'NULLE ACCEPTÉE':'PARTIE NULLE';
  if(winnerLabel)winnerLabel.textContent='RÉSULTAT :';
  if(name)name.textContent='ÉGALITÉ';
  setDrawResultImage(img);

  if(gameMode!=='correspondence'&&!agreed){
    settleElo(.5,'draw');
    recordGameHistory(.5,'draw');
  }

  if(overlay){
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
}
function showResignOverlay(winner){
  const overlay=$('mateOverlay');
  const name=$('mateWinnerName');
  const img=$('mateCharacter');
  const title=document.querySelector('.mate-sign-top');
  const winnerLabel=document.querySelector('.mate-sign-winner');
  if(title)title.textContent='ABANDON';
  if(winnerLabel)winnerLabel.textContent='VICTOIRE DE';
  if(name)name.textContent=String(winner||'').toUpperCase();
  setWinnerKingImage(img,winner);
  if(overlay){overlay.classList.add('show');overlay.setAttribute('aria-hidden','false');}
}


const TIME_CONTROLS={
  bullet1:{label:'1 min',clockLabel:'1 MIN',initialMs:1*60*1000,incrementMs:0},
  blitz5:{label:'5 min',clockLabel:'5 MIN',initialMs:5*60*1000,incrementMs:0},
  rapid10:{label:'10 min',clockLabel:'10 MIN',initialMs:10*60*1000,incrementMs:0},
  rapid15_10:{label:'15 | 10',clockLabel:'15 | 10',initialMs:15*60*1000,incrementMs:10*1000},
  long30:{label:'30 min',clockLabel:'30 MIN',initialMs:30*60*1000,incrementMs:0}
};
let selectedTimeControlKey='rapid10';
let INITIAL_CLOCK_MS=TIME_CONTROLS.rapid10.initialMs;
let CLOCK_INCREMENT_MS=TIME_CONTROLS.rapid10.incrementMs;
let TIME_CONTROL_LABEL=TIME_CONTROLS.rapid10.label;

function renderTimeControlUI(){
  const cfg=TIME_CONTROLS[selectedTimeControlKey]||TIME_CONTROLS.rapid10;
  const bottom=$('bottomTimeLabel');
  const clockLabel=$('clockModeLabel');
  if(bottom)bottom.textContent=cfg.label;
  if(clockLabel)clockLabel.textContent=cfg.clockLabel;
  document.querySelectorAll('[data-time-control]').forEach(btn=>{
    btn.classList.toggle('active',btn.dataset.timeControl===selectedTimeControlKey);
  });
}
function configureTimeControl(key){
  const valid=TIME_CONTROLS[key]?key:'rapid10';
  const cfg=TIME_CONTROLS[valid];
  selectedTimeControlKey=valid;
  INITIAL_CLOCK_MS=cfg.initialMs;
  CLOCK_INCREMENT_MS=cfg.incrementMs;
  TIME_CONTROL_LABEL=cfg.label;
  renderTimeControlUI();
}
function applyRemoteTimeControl(data){
  const key=String(data&&data.timeControlKey||'');
  if(TIME_CONTROLS[key]){configureTimeControl(key);return;}
  const initial=Number(data&&data.initialClockMs);
  const increment=Number(data&&data.incrementMs);
  if(Number.isFinite(initial)&&initial>=30000&&initial<=60*60*1000){
    INITIAL_CLOCK_MS=initial;
    CLOCK_INCREMENT_MS=Number.isFinite(increment)&&increment>=0&&increment<=60000?increment:0;
    TIME_CONTROL_LABEL=String(data&&data.timeControlLabel||'Partie').slice(0,20);
    const bottom=$('bottomTimeLabel');
    const clockLabel=$('clockModeLabel');
    if(bottom)bottom.textContent=TIME_CONTROL_LABEL;
    if(clockLabel)clockLabel.textContent=TIME_CONTROL_LABEL.toUpperCase();
  }
}

let clockState={w:INITIAL_CLOCK_MS,b:INITIAL_CLOCK_MS};
let clockLastTick=0;
let clockRunning=false;
let clockStarted=false;
let clockInterval=null;
let timeoutWinner=null;

function formatClock(ms){
  ms=Math.max(0,Math.ceil(ms/1000)*1000);
  const total=Math.floor(ms/1000);
  const m=Math.floor(total/60);
  const s=total%60;
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}
function renderClocks(){
  const w=$('clockWhite'),b=$('clockBlack');
  const cw=$('clockCardWhite'),cb=$('clockCardBlack');
  if(gameMode==='correspondence'){
    const active=(chess&&correspondenceStatus==='active')?chess.turn():null;
    const remaining=correspondenceDeadline?Math.max(0,new Date(correspondenceDeadline).getTime()-Date.now()):null;
    if(w)w.textContent=active==='w'?formatCorrespondenceRemaining(correspondenceDeadline):'—';
    if(b)b.textContent=active==='b'?formatCorrespondenceRemaining(correspondenceDeadline):'—';
    if(cw){cw.classList.toggle('active',active==='w');cw.classList.toggle('low',active==='w'&&remaining!==null&&remaining<=6*60*60*1000);cw.classList.toggle('timeout',active==='w'&&remaining===0);}
    if(cb){cb.classList.toggle('active',active==='b');cb.classList.toggle('low',active==='b'&&remaining!==null&&remaining<=6*60*60*1000);cb.classList.toggle('timeout',active==='b'&&remaining===0);}
    return;
  }
  if(w)w.textContent=formatClock(clockState.w);
  if(b)b.textContent=formatClock(clockState.b);
  const active=(!timeoutWinner&&chess&&!chess.game_over())?chess.turn():null;
  if(cw){
    cw.classList.toggle('active',clockRunning&&active==='w');
    cw.classList.toggle('low',clockState.w<=30000&&clockState.w>0);
    cw.classList.toggle('timeout',clockState.w<=0);
  }
  if(cb){
    cb.classList.toggle('active',clockRunning&&active==='b');
    cb.classList.toggle('low',clockState.b<=30000&&clockState.b>0);
    cb.classList.toggle('timeout',clockState.b<=0);
  }
}
function showTimeWinner(winner){
  const overlay=$('mateOverlay');
  const name=$('mateWinnerName');
  const img=$('mateCharacter');
  const title=document.querySelector('.mate-sign-top');
  const winnerLabel=document.querySelector('.mate-sign-winner');
  if(winnerLabel)winnerLabel.textContent='VICTOIRE DE';
  if(title)title.textContent='TEMPS ÉCOULÉ';
  if(name)name.textContent=winner.toUpperCase();
  setWinnerKingImage(img,winner);
  if(gameMode!=='correspondence'){
    settleEloFromWinner(winner,'timeout');
    const winnerColor=String(winner).toLowerCase().startsWith('blanc')?'w':'b';
    if(playerCamp)recordGameHistory(winnerColor===playerCamp?1:0,'timeout');
  }
  if(overlay){
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden','false');
  }
}
function restoreMateTitle(){
  const title=document.querySelector('.mate-sign-top');
  if(title)title.textContent='ECHEC ET MAT';
}
function stopClock(){
  clockRunning=false;
  renderClocks();
}
function commitClock(){
  if(gameMode==='correspondence')return;
  if(!clockRunning||!chess||timeoutWinner||chess.game_over())return;
  const now=performance.now();
  if(!clockLastTick){clockLastTick=now;return;}
  const active=chess.turn();
  const elapsed=now-clockLastTick;
  clockState[active]=Math.max(0,clockState[active]-elapsed);
  clockLastTick=now;
  if(clockState[active]<=0){
    clockState[active]=0;
    timeoutWinner=active==='w'?'Noirs':'Blancs';
    clockRunning=false;
    renderClocks();
    if(gameMode==='remote'&&peerConn&&peerConn.open){
      peerConn.send({type:'timeout',winner:timeoutWinner,clocks:{w:clockState.w,b:clockState.b}});
    }
    showTimeWinner(timeoutWinner);
  }
}
function clockTick(){
  commitClock();
  renderClocks();
}
function startClock(){
  if(timeoutWinner||!chess||chess.game_over())return;
  clockStarted=true;
  clockLastTick=performance.now();
  clockRunning=true;
  if(!clockInterval)clockInterval=setInterval(clockTick,200);
  renderClocks();
}
function resetClock(){
  clockState={w:INITIAL_CLOCK_MS,b:INITIAL_CLOCK_MS};
  timeoutWinner=null;
  clockLastTick=0;
  clockRunning=false;
  clockStarted=false;
  restoreMateTitle();
  renderClocks();
}

function renderStatus(){
  const turn=chess.turn()==='w'?'Blancs':'Noirs';
  let state='Partie en cours';
  let badge='Tour : '+turn;
  let status='';

  if(timeoutWinner){
    state='Temps écoulé';
    badge='Temps écoulé · '+timeoutWinner+' gagnent';
    stopClock();
  }else if(manualGameFinished){
    if(manualGameResult==='draw'){
      state='Nulle';badge='Partie nulle · accord des deux joueurs';status='Partie nulle acceptée.';
    }else{
      const winner=manualGameResult==='w'?'Blancs':'Noirs';
      state='Abandon';badge='Abandon · '+winner+' gagnent';status=winner+' gagnent par abandon.';
    }
  }else if(chess.in_checkmate()){
    const winner=chess.turn()==='w'?'Noirs':'Blancs';
    state='Échec et mat';
    badge='Échec et mat · '+winner+' gagnent';
    status=winner+' gagnent la partie !';
    restoreMateTitle();
    stopClock();
    showMateOverlay(winner);
  }else if(chess.in_draw()){
    state='Nulle';
    badge='Partie nulle';
    status='Partie nulle.';
    stopClock();
    showDrawOverlay();
  }else{
    hideMateOverlay();
    if(chess.in_check()){
      state='Échec';
      badge='Tour : '+turn+' · Échec !';
      status='Attention : le roi est en échec.';
    }
    if(gameMode==='ai'&&aiThinking)badge='IA réfléchit…';
    if(gameMode==='remote'&&!remoteReady)badge='En attente de connexion…';
    if(gameMode==='correspondence'){
      state='Partie différée';
      if(correspondenceStatus==='waiting')badge='En attente d’un adversaire…';
      else if(correspondenceStatus==='active')badge=chess.turn()===playerCamp?'À toi de jouer · 3 jours':'Tour adverse · différé';
    }
  }

  const turnTextEl=$('turnText');
  if(turnTextEl)turnTextEl.textContent=turn;
  $('turnBadge').textContent=badge;
  const stateTextEl=$('stateText');
  if(stateTextEl)stateTextEl.textContent=state;
  const statusEl=$('status');
  if(statusEl)statusEl.textContent=status;
  renderClocks();
}
function renderCaptured(){const whiteBox=$('capturedByWhite');const blackBox=$('capturedByBlack');whiteBox.innerHTML='';blackBox.innerHTML='';if(!capturedByWhite.length){const e=document.createElement('div');e.className='sub';e.textContent='Aucune';whiteBox.appendChild(e);}else{for(const p of capturedByWhite){const el=document.createElement('div');el.className='cap';el.appendChild(makePieceEl('b',p));whiteBox.appendChild(el);}}if(!capturedByBlack.length){const e=document.createElement('div');e.className='sub';e.textContent='Aucune';blackBox.appendChild(e);}else{for(const p of capturedByBlack){const el=document.createElement('div');el.className='cap';el.appendChild(makePieceEl('w',p));blackBox.appendChild(el);}}const whiteMat=capturedByWhite.reduce((s,p)=>s+(PIECE_VALUE[p]||0),0);const blackMat=capturedByBlack.reduce((s,p)=>s+(PIECE_VALUE[p]||0),0);const whiteScoreEl=$('whiteScore');if(whiteScoreEl)whiteScoreEl.textContent=whiteMat;const blackScoreEl=$('blackScore');if(blackScoreEl)blackScoreEl.textContent=blackMat;renderAdvantage(whiteMat,blackMat);} 
function renderAdvantage(whiteMat,blackMat){const totalMat=39;const whiteRemaining=Math.max(0,totalMat-blackMat);const blackRemaining=Math.max(0,totalMat-whiteMat);const whitePct=Math.max(0,Math.min(100,(whiteRemaining/totalMat)*100));const blackPct=Math.max(0,Math.min(100,(blackRemaining/totalMat)*100));const w=$('advWhite'), b=$('advBlack');w.style.width=whitePct+'%';b.style.width=blackPct+'%';w.classList.toggle('hot', whiteRemaining>=blackRemaining && (whiteRemaining!==blackRemaining || whiteRemaining===totalMat));b.classList.toggle('hot', blackRemaining>=whiteRemaining && (blackRemaining!==whiteRemaining || blackRemaining===totalMat));w.classList.toggle('strong', whiteRemaining>=28);b.classList.toggle('strong', blackRemaining>=28);w.classList.toggle('danger', whiteRemaining<=14);b.classList.toggle('danger', blackRemaining<=14);$('whiteAdvNum').textContent=whiteRemaining;$('blackAdvNum').textContent=blackRemaining;let text='Début de partie';if(whiteRemaining===blackRemaining){text = whiteRemaining===totalMat ? 'Début de partie' : 'Équilibre';}else if(whiteRemaining>blackRemaining){text='Blancs résistent mieux';}else{text='Noirs résistent mieux';}$('advantageText').textContent=text;$('advantageValue').textContent=whiteRemaining+' - '+blackRemaining;}
function renderMoves(){const box=$('movesBox');box.innerHTML='';const hist=chess.history();if(!hist.length){const e=document.createElement('div');e.className='sub';e.textContent='Aucun coup pour le moment.';box.appendChild(e);return;}for(let i=0;i<hist.length;i+=2){const row=document.createElement('div');row.className='move-row';row.innerHTML=`<div><strong>${Math.floor(i/2)+1}.</strong></div><div>${hist[i]||''}</div><div>${hist[i+1]||''}</div>`;box.appendChild(row);}box.scrollTop=box.scrollHeight;}
function renderHints(){const box=$('hintWhite');box.innerHTML='';const list=chess.turn()==='w'?chess.moves():[];const chosen=list.slice(0,8);if(!chosen.length){const e=document.createElement('span');e.className='hint-chip';e.textContent='Attends le tour des Blancs';box.appendChild(e);return;}chosen.forEach(m=>{const el=document.createElement('span');el.className='hint-chip';el.textContent=m;box.appendChild(el);});}
function renderAll(){renderBoard();renderStatus();renderCaptured();renderMoves();renderHints();renderElo();renderTeamNames();renderGameActions();}
function onSquareClick(sq){
  if(manualGameFinished||chess.game_over())return;
  if($('modeOverlay')&&$('modeOverlay').classList.contains('show'))return;
  if($('campOverlay')&&$('campOverlay').classList.contains('show'))return;
  if(!canLocalMove())return;
  const piece=chess.get(sq);if(selected){const target=targets.find(m=>m.to===sq);if(target){playMove(selected,sq);return;}}if(piece&&piece.color===chess.turn()){selected=sq;targets=chess.moves({square:sq,verbose:true});}else{selected=null;targets=[];}renderBoard();}

function animateCaptureMoveAfterShell(fromRect,toRect,color,type,targetSquare,delayMs){
  if(!fromRect||!toRect)return;

  const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);
  const finalPiece=targetEl?targetEl.querySelector('.piece'):null;
  if(finalPiece)finalPiece.classList.add('smooth-hidden');

  const actor=document.createElement('div');
  actor.className='smooth-piece-move '+(color==='w'?'white':'black');

  const sizeW=fromRect.width*.92;
  const sizeH=fromRect.height*.92;
  const startX=fromRect.left+(fromRect.width-sizeW)/2;
  const startY=fromRect.top +(fromRect.height-sizeH)/2;
  const endX=toRect.left+(toRect.width-sizeW)/2;
  const endY=toRect.top +(toRect.height-sizeH)/2;

  actor.style.left=startX+'px';
  actor.style.top=startY+'px';
  actor.style.width=sizeW+'px';
  actor.style.height=sizeH+'px';
  actor.style.transform='translate(0,0)';
  actor.style.opacity='1';

  const img=document.createElement('img');
  img.src=pieceData(color,type).src;
  img.alt=pieceData(color,type).name;
  actor.appendChild(img);
  document.body.appendChild(actor);

  actor.getBoundingClientRect();

  setTimeout(()=>{
    actor.style.transform=`translate(${endX-startX}px,${endY-startY}px)`;
  },delayMs);

  setTimeout(()=>{
    if(finalPiece)finalPiece.classList.remove('smooth-hidden');
    actor.style.opacity='0';
  },delayMs+480);

  setTimeout(()=>{
    if(finalPiece)finalPiece.classList.remove('smooth-hidden');
    actor.remove();
  },delayMs+540);
}

function animateSmoothMove(fromRect,toRect,color,type,targetSquare){
  if(!fromRect||!toRect)return;

  const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);
  const finalPiece=targetEl?targetEl.querySelector('.piece'):null;
  if(finalPiece)finalPiece.classList.add('smooth-hidden');

  const actor=document.createElement('div');
  actor.className='smooth-piece-move '+(color==='w'?'white':'black');

  const sizeW=fromRect.width*.92;
  const sizeH=fromRect.height*.92;
  const startX=fromRect.left+(fromRect.width-sizeW)/2;
  const startY=fromRect.top +(fromRect.height-sizeH)/2;
  const endX=toRect.left+(toRect.width-sizeW)/2;
  const endY=toRect.top +(toRect.height-sizeH)/2;

  actor.style.left=startX+'px';
  actor.style.top=startY+'px';
  actor.style.width=sizeW+'px';
  actor.style.height=sizeH+'px';

  const img=document.createElement('img');
  img.src=pieceData(color,type).src;
  img.alt=pieceData(color,type).name;
  actor.appendChild(img);
  document.body.appendChild(actor);

  // Force initial paint before applying the transform.
  actor.getBoundingClientRect();

  requestAnimationFrame(()=>{
    actor.style.transform=`translate(${endX-startX}px,${endY-startY}px)`;
    actor.style.opacity='1';
  });

  setTimeout(()=>{
    if(finalPiece)finalPiece.classList.remove('smooth-hidden');
    actor.style.opacity='0';
  },480);

  setTimeout(()=>{
    if(finalPiece)finalPiece.classList.remove('smooth-hidden');
    actor.remove();
  },540);
}

function currentCaptureThemeId(){
  return document.documentElement.dataset.theme||activeTheme?.id||'dark-fantasy';
}

function playMarioCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare){
  if(!fromRect||!toRect)return;
  const startX=fromRect.left+fromRect.width/2;
  const startY=fromRect.top+fromRect.height/2;
  const endX=toRect.left+toRect.width/2;
  const endY=toRect.top+toRect.height/2;
  const dx=endX-startX;
  const dy=endY-startY;
  const distance=Math.hypot(dx,dy);
  const rot=((distance/10)+360)*(dx>=0?1:-1);
  const shell=document.createElement('div');
  shell.className='shell-shot '+(attackerColor==='w'?'green':'red');
  shell.style.left=startX+'px';
  shell.style.top=startY+'px';
  shell.style.setProperty('--dx',dx+'px');
  shell.style.setProperty('--dy',dy+'px');
  shell.style.setProperty('--rot',rot+'deg');
  const shellImg=document.createElement('img');
  shellImg.src=attackerColor==='w'?SHELL_GREEN_SRC:SHELL_RED_SRC;
  shellImg.alt=PROJECTILE_ALT||'Carapace';
  shell.appendChild(shellImg);
  document.body.appendChild(shell);

  for(let i=1;i<=6;i++){
    setTimeout(()=>{
      const t=i/6;
      const trail=document.createElement('div');
      trail.className='shell-trail';
      trail.style.left=(startX+dx*t)+'px';
      trail.style.top=(startY+dy*t)+'px';
      document.body.appendChild(trail);
      setTimeout(()=>trail.remove(),420);
    },i*45);
  }

  const boardShell=document.querySelector('.board-shell');
  shell.classList.add('launch');
  setTimeout(()=>{
    const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);
    if(targetEl){
      targetEl.classList.add('capture-hit');
      setTimeout(()=>targetEl.classList.remove('capture-hit'),420);
    }
    boardShell&&boardShell.classList.add('impact');
    setTimeout(()=>boardShell&&boardShell.classList.remove('impact'),420);
    spawnCaptureImpact(endX,endY,color,type,attackerColor);
  },430);
  setTimeout(()=>shell.remove(),600);
}

function playDarkFantasyCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare){
  if(!fromRect||!toRect)return;
  const startX=fromRect.left+fromRect.width/2;
  const startY=fromRect.top+fromRect.height/2;
  const endX=toRect.left+toRect.width/2;
  const endY=toRect.top+toRect.height/2;
  const dx=endX-startX;
  const dy=endY-startY;
  const distance=Math.hypot(dx,dy);
  const rot=((distance/9)+420)*(dx>=0?1:-1);
  const shell=document.createElement('div');
  shell.className='shell-shot '+(attackerColor==='w'?'green':'red');
  shell.style.left=startX+'px';
  shell.style.top=startY+'px';
  shell.style.setProperty('--dx',dx+'px');
  shell.style.setProperty('--dy',dy+'px');
  shell.style.setProperty('--rot',rot+'deg');
  const shellImg=document.createElement('img');
  shellImg.src=attackerColor==='w'?SHELL_GREEN_SRC:SHELL_RED_SRC;
  shellImg.alt=PROJECTILE_ALT;
  shell.appendChild(shellImg);
  document.body.appendChild(shell);

  const trailGlyphs=attackerColor==='w'?['✦','✧','᛭','✶']:['✦','✧','†','⛧'];
  for(let i=1;i<=12;i++){
    setTimeout(()=>{
      const t=i/12;
      const trail=document.createElement('div');
      trail.className='shell-trail '+(attackerColor==='w'?'white':'black');
      trail.style.left=(startX+dx*t)+'px';
      trail.style.top=(startY+dy*t)+'px';
      document.body.appendChild(trail);
      setTimeout(()=>trail.remove(),560);
      if(i%2===0){
        const rune=document.createElement('div');
        rune.className='shell-rune '+(attackerColor==='w'?'white':'black');
        rune.textContent=trailGlyphs[Math.floor(Math.random()*trailGlyphs.length)];
        rune.style.left=(startX+dx*t+(Math.random()*18-9))+'px';
        rune.style.top=(startY+dy*t+(Math.random()*18-9))+'px';
        document.body.appendChild(rune);
        setTimeout(()=>rune.remove(),680);
      }
    },i*34);
  }

  const boardShell=document.querySelector('.board-shell');
  shell.classList.add('launch');
  setTimeout(()=>{
    const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);
    if(targetEl){
      targetEl.classList.add('capture-hit');
      setTimeout(()=>targetEl.classList.remove('capture-hit'),560);
    }
    boardShell&&boardShell.classList.add('impact');
    setTimeout(()=>boardShell&&boardShell.classList.remove('impact'),420);
    spawnCaptureImpact(endX,endY,color,type,attackerColor);
  },470);
  setTimeout(()=>shell.remove(),760);
}

function playPinkyTaylorCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare){
  if(!fromRect||!toRect)return;
  const startX=fromRect.left+fromRect.width/2;
  const startY=fromRect.top+fromRect.height/2;
  const endX=toRect.left+toRect.width/2;
  const endY=toRect.top+toRect.height/2;
  const dx=endX-startX;
  const dy=endY-startY;
  const rot=(Math.hypot(dx,dy)*1.8+280)*(dx>=0?1:-1);
  const side=attackerColor==='w'?'ivory':'ruby';

  const heart=document.createElement('div');
  heart.className='shell-shot pinky-heart-shot '+side;
  heart.style.left=startX+'px';
  heart.style.top=startY+'px';
  heart.style.setProperty('--dx',dx+'px');
  heart.style.setProperty('--dy',dy+'px');
  heart.style.setProperty('--rot',rot+'deg');
  const heartImg=document.createElement('img');
  heartImg.src=attackerColor==='w'?SHELL_GREEN_SRC:SHELL_RED_SRC;
  heartImg.alt=PROJECTILE_ALT;
  heart.appendChild(heartImg);
  document.body.appendChild(heart);

  const glyphs=['♥','★','×','✦'];
  for(let i=1;i<=10;i++){
    setTimeout(()=>{
      const t=i/10;
      const trail=document.createElement('div');
      trail.className='shell-trail pinky '+side;
      trail.style.left=(startX+dx*t)+'px';
      trail.style.top=(startY+dy*t)+'px';
      document.body.appendChild(trail);
      setTimeout(()=>trail.remove(),520);

      if(i%2===0){
        const glyph=document.createElement('div');
        glyph.className='pinky-flight-glyph '+side;
        glyph.textContent=glyphs[(i/2-1)%glyphs.length];
        glyph.style.left=(startX+dx*t+(Math.random()*16-8))+'px';
        glyph.style.top=(startY+dy*t+(Math.random()*16-8))+'px';
        glyph.style.setProperty('--r',(-30+Math.random()*60)+'deg');
        document.body.appendChild(glyph);
        setTimeout(()=>glyph.remove(),620);
      }
    },i*38);
  }

  const boardShell=document.querySelector('.board-shell');
  heart.classList.add('launch');
  setTimeout(()=>{
    const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);
    if(targetEl){
      targetEl.classList.add('capture-hit');
      setTimeout(()=>targetEl.classList.remove('capture-hit'),520);
    }
    boardShell&&boardShell.classList.add('impact');
    setTimeout(()=>boardShell&&boardShell.classList.remove('impact'),460);
    spawnCaptureImpact(endX,endY,color,type,attackerColor);
  },450);
  setTimeout(()=>heart.remove(),700);
}

function playShellCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare){
  const themeId=currentCaptureThemeId();
  if(themeId==='mario'){
    playMarioCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare);
    return;
  }
  if(themeId==='pinky-taylor'){
    playPinkyTaylorCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare);
    return;
  }
  playDarkFantasyCaptureRects(fromRect,toRect,color,type,attackerColor,targetSquare);
}

function playMove(from,to,source='local'){
  if(source==='local'&&gameMode==='correspondence'){
    if($('modeOverlay')&&$('modeOverlay').classList.contains('show'))return;
    if($('campOverlay')&&$('campOverlay').classList.contains('show'))return;
    if(!canLocalMove())return;
    submitCorrespondenceMove(from,to);
    return;
  }
  if(source==='local'){
    if($('modeOverlay')&&$('modeOverlay').classList.contains('show'))return;
    if($('campOverlay')&&$('campOverlay').classList.contains('show'))return;
    if(!canLocalMove())return;
  }

  if(source==='remote'){
    if(clockStarted)clockLastTick=performance.now();
  }else{
    commitClock();
  }
  if(timeoutWinner)return;

  const fromEl=document.querySelector(`[data-sq="${from}"]`);
  const toEl=document.querySelector(`[data-sq="${to}"]`);
  const fromRect=fromEl?fromEl.getBoundingClientRect():null;
  const toRect=toEl?toEl.getBoundingClientRect():null;

  const move=chess.move({from,to,promotion:'q'});
  if(!move){
    clockLastTick=performance.now();
    return;
  }

  if(source!=='remote'&&CLOCK_INCREMENT_MS>0){
    clockState[move.color]=Math.max(0,clockState[move.color]+CLOCK_INCREMENT_MS);
  }

  const wasCapture=!!move.captured;
  const capturedType=move.captured;
  if(wasCapture){
    if(move.color==='w')capturedByWhite.push(move.captured);
    else capturedByBlack.push(move.captured);
  }

  lastMove={from:move.from,to:move.to};
  selected=null;
  targets=[];

  // The clocks stay frozen at the selected initial time until the first legal move is completed.
  // Once that move is on the board, the side now to move starts losing time.
  if(!clockStarted){
    startClock();
  }else{
    clockLastTick=performance.now();
  }

  renderAll();

  if(wasCapture){
    playShellCaptureRects(fromRect,toRect,move.color==='w'?'b':'w',capturedType,move.color,move.to);
    animateCaptureMoveAfterShell(fromRect,toRect,move.color,move.piece,move.to,620);
  }else{
    animateSmoothMove(fromRect,toRect,move.color,move.piece,move.to);
  }

  if(source==='local'&&gameMode==='remote')sendRemoteMove(move);

  const visualDelay=wasCapture?1250:620;
  if(gameMode==='ai'&&source!=='ai'&&!chess.game_over()&&chess.turn()!==playerCamp){
    scheduleAIMove(visualDelay);
  }
}
function playShellCapture(fromSquare,targetSquare,color,type,attackerColor){const fromEl=document.querySelector(`[data-sq="${fromSquare}"]`);const targetEl=document.querySelector(`[data-sq="${targetSquare}"]`);if(!fromEl||!targetEl)return;playShellCaptureRects(fromEl.getBoundingClientRect(),targetEl.getBoundingClientRect(),color,type,attackerColor,targetSquare);}
function spawnMarioCaptureImpact(x,y,color,type,attackerColor){
  const overlay=document.createElement('div');
  overlay.className='capture-overlay';
  overlay.style.left=x+'px';
  overlay.style.top=(y-10)+'px';

  const flash=document.createElement('div');
  flash.className='flash';
  overlay.appendChild(flash);

  const ring=document.createElement('div');
  ring.className='ringwave';
  overlay.appendChild(ring);

  const slash=document.createElement('div');
  slash.className='slash';
  overlay.appendChild(slash);

  const victim=document.createElement('div');
  victim.className='victim';
  victim.appendChild(makePieceEl(color,type));
  overlay.appendChild(victim);

  const text=document.createElement('div');
  text.className='powtext';
  text.textContent=attackerColor==='w'?'SMASH!':'K.O.!';
  overlay.appendChild(text);

  const stars=document.createElement('div');
  stars.className='stars';
  for(let i=0;i<10;i++){
    const star=document.createElement('div');
    star.className='star';
    star.textContent=i%3===0?'★':(i%2===0?'✦':'✸');
    star.style.left=(62+Math.random()*56)+'px';
    star.style.top=(48+Math.random()*40)+'px';
    star.style.setProperty('--x',(-78+Math.random()*156)+'px');
    star.style.setProperty('--y',(-66+Math.random()*84)+'px');
    star.style.animationDelay=(Math.random()*0.12)+'s';
    stars.appendChild(star);
  }
  overlay.appendChild(stars);

  const smokes=document.createElement('div');
  smokes.className='smokes';
  for(let i=0;i<8;i++){
    const smoke=document.createElement('div');
    smoke.className='smoke';
    smoke.style.left=(75+Math.random()*30)+'px';
    smoke.style.top=(88+Math.random()*20)+'px';
    smoke.style.setProperty('--sx',(-55+Math.random()*110)+'px');
    smoke.style.setProperty('--sy',(-40-Math.random()*35)+'px');
    smoke.style.animationDelay=(Math.random()*0.1)+'s';
    smokes.appendChild(smoke);
  }
  overlay.appendChild(smokes);

  const coins=document.createElement('div');
  coins.className='coins';
  for(let i=0;i<6;i++){
    const coin=document.createElement('div');
    coin.className='coinfx';
    coin.style.left=(80+Math.random()*22)+'px';
    coin.style.top=(86+Math.random()*14)+'px';
    coin.style.setProperty('--cx',(-90+Math.random()*180)+'px');
    coin.style.setProperty('--cy',(-45-Math.random()*60)+'px');
    coin.style.animationDelay=(Math.random()*0.08)+'s';
    coins.appendChild(coin);
  }
  overlay.appendChild(coins);

  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),1250);
}

function spawnDarkFantasyCaptureImpact(x,y,color,type,attackerColor){
  const overlay=document.createElement('div');
  overlay.className='capture-overlay '+(attackerColor==='w'?'attacker-white':'attacker-black');
  overlay.style.left=x+'px';
  overlay.style.top=(y-8)+'px';

  const eclipse=document.createElement('div');
  eclipse.className='eclipse';
  overlay.appendChild(eclipse);

  for(let i=0;i<2;i++){
    const ring=document.createElement('div');
    ring.className='ringwave';
    ring.style.animationDelay=(i*0.08)+'s';
    overlay.appendChild(ring);
  }

  const flash=document.createElement('div');
  flash.className='flash';
  overlay.appendChild(flash);

  const slashA=document.createElement('div');
  slashA.className='slash slash-a';
  overlay.appendChild(slashA);
  const slashB=document.createElement('div');
  slashB.className='slash slash-b';
  overlay.appendChild(slashB);

  const victim=document.createElement('div');
  victim.className='victim';
  victim.appendChild(makePieceEl(color,type));
  overlay.appendChild(victim);

  const text=document.createElement('div');
  text.className='powtext';
  text.textContent=attackerColor==='w'?'PURIFIÉ':'ANÉANTI';
  overlay.appendChild(text);

  const embers=document.createElement('div');
  embers.className='embers';
  for(let i=0;i<18;i++){
    const ember=document.createElement('div');
    ember.className='ember';
    ember.style.left=(92+Math.random()*56)+'px';
    ember.style.top=(94+Math.random()*26)+'px';
    ember.style.setProperty('--x',(-110+Math.random()*220)+'px');
    ember.style.setProperty('--y',(-95+Math.random()*130)+'px');
    ember.style.setProperty('--s',(0.7+Math.random()*1.4).toFixed(2));
    ember.style.animationDelay=(Math.random()*0.12)+'s';
    embers.appendChild(ember);
  }
  overlay.appendChild(embers);

  const ashes=document.createElement('div');
  ashes.className='ashes';
  for(let i=0;i<16;i++){
    const ash=document.createElement('div');
    ash.className='ash';
    ash.style.left=(96+Math.random()*42)+'px';
    ash.style.top=(104+Math.random()*18)+'px';
    ash.style.setProperty('--x',(-90+Math.random()*180)+'px');
    ash.style.setProperty('--y',(-70+Math.random()*100)+'px');
    ash.style.setProperty('--s',(0.5+Math.random()*1.2).toFixed(2));
    ash.style.animationDelay=(Math.random()*0.1)+'s';
    ashes.appendChild(ash);
  }
  overlay.appendChild(ashes);

  const shards=document.createElement('div');
  shards.className='shards';
  for(let i=0;i<12;i++){
    const shard=document.createElement('div');
    shard.className='shard';
    shard.style.left=(96+Math.random()*42)+'px';
    shard.style.top=(98+Math.random()*24)+'px';
    shard.style.setProperty('--x',(-118+Math.random()*236)+'px');
    shard.style.setProperty('--y',(-90+Math.random()*140)+'px');
    shard.style.setProperty('--r',(-220+Math.random()*440)+'deg');
    shard.style.setProperty('--s',(0.65+Math.random()*1.1).toFixed(2));
    shard.style.animationDelay=(Math.random()*0.09)+'s';
    shards.appendChild(shard);
  }
  overlay.appendChild(shards);

  const runes=document.createElement('div');
  runes.className='runes';
  const runePool=attackerColor==='w'?['✦','✧','᛭','ᚱ','☽','†']:['⛧','†','☾','ᚦ','✶','✦'];
  for(let i=0;i<8;i++){
    const rune=document.createElement('div');
    rune.className='rune';
    rune.textContent=runePool[Math.floor(Math.random()*runePool.length)];
    rune.style.left=(88+Math.random()*54)+'px';
    rune.style.top=(72+Math.random()*34)+'px';
    rune.style.setProperty('--x',(-85+Math.random()*170)+'px');
    rune.style.setProperty('--y',(-90+Math.random()*60)+'px');
    rune.style.setProperty('--r',(-45+Math.random()*90)+'deg');
    rune.style.animationDelay=(Math.random()*0.16)+'s';
    runes.appendChild(rune);
  }
  overlay.appendChild(runes);

  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),1500);
}

function spawnPinkyTaylorCaptureImpact(x,y,color,type,attackerColor){
  const side=attackerColor==='w'?'ivory':'ruby';
  const overlay=document.createElement('div');
  overlay.className='capture-overlay pinky-capture-overlay '+side;
  overlay.style.left=x+'px';
  overlay.style.top=(y-6)+'px';

  const ink=document.createElement('div');
  ink.className='pinky-ink-splat';
  overlay.appendChild(ink);

  for(let i=0;i<2;i++){
    const ring=document.createElement('div');
    ring.className='ringwave pinky-ring';
    ring.style.animationDelay=(i*.07)+'s';
    overlay.appendChild(ring);
  }

  const flash=document.createElement('div');
  flash.className='flash pinky-flash';
  overlay.appendChild(flash);

  for(let i=0;i<2;i++){
    const stroke=document.createElement('div');
    stroke.className='pinky-stroke stroke-'+(i+1);
    overlay.appendChild(stroke);
  }

  const victim=document.createElement('div');
  victim.className='victim';
  victim.appendChild(makePieceEl(color,type));
  overlay.appendChild(victim);

  const text=document.createElement('div');
  text.className='powtext pinky-powtext';
  text.textContent=attackerColor==='w'?'HEART HIT!':'RUBY POP!';
  overlay.appendChild(text);

  const burst=document.createElement('div');
  burst.className='pinky-burst';
  const glyphs=['♥','★','×','✦','●'];
  for(let i=0;i<24;i++){
    const particle=document.createElement('div');
    particle.className='pinky-particle p'+(i%5)+' '+side;
    particle.textContent=glyphs[i%glyphs.length];
    particle.style.left=(102+Math.random()*36)+'px';
    particle.style.top=(104+Math.random()*30)+'px';
    particle.style.setProperty('--x',(-125+Math.random()*250)+'px');
    particle.style.setProperty('--y',(-115+Math.random()*190)+'px');
    particle.style.setProperty('--r',(-240+Math.random()*480)+'deg');
    particle.style.setProperty('--s',(0.65+Math.random()*1.15).toFixed(2));
    particle.style.animationDelay=(Math.random()*.12)+'s';
    burst.appendChild(particle);
  }
  overlay.appendChild(burst);

  document.body.appendChild(overlay);
  setTimeout(()=>overlay.remove(),1400);
}

function spawnCaptureImpact(x,y,color,type,attackerColor){
  const themeId=currentCaptureThemeId();
  if(themeId==='mario'){
    spawnMarioCaptureImpact(x,y,color,type,attackerColor);
    return;
  }
  if(themeId==='pinky-taylor'){
    spawnPinkyTaylorCaptureImpact(x,y,color,type,attackerColor);
    return;
  }
  spawnDarkFantasyCaptureImpact(x,y,color,type,attackerColor);
}
function resetGame(){
  hideMateOverlay();
  hideCampOverlay();
  resetGameActionState();
  destroyRemote();
  destroyCorrespondenceSession();
  chess.reset();
  selected=null;
  targets=[];
  lastMove=null;
  capturedByWhite=[];
  capturedByBlack=[];
  prepareModeChoice();
  renderAll();
}
async function boot(){
  try{
    setLoaderProgress(8,'Chargement du moteur d’échecs…');
    setLoaderProgress(25,'Moteur prêt');

    chess=new Chess();
    setLoaderProgress(30,'Chargement des personnages…');

    await preloadGameImages((done,total)=>{
      const pct=30+(done/Math.max(1,total))*48;
      setLoaderProgress(pct,'Chargement des personnages… '+done+'/'+total);
    });

    setLoaderProgress(79,'Préparation de l’échiquier…');

    $('newGameBtn').addEventListener('click',openPlayMenu);
    const mateClose=$('mateCloseBtn');
    if(mateClose)mateClose.addEventListener('click',hideMateOverlay);
    const mateReplay=$('mateReplayBtn');
    if(mateReplay)mateReplay.addEventListener('click',()=>{hideMateOverlay();openPlayMenu();});
    $('flipBtn').addEventListener('click',()=>{flipped=!flipped;renderBoard();});

    $('offerDrawBtn').addEventListener('click',requestDraw);
    $('resignGameBtn').addEventListener('click',requestResignation);
    $('gameActionDialogClose').addEventListener('click',closeGameActionDialog);
    $('gameActionPrimaryBtn').addEventListener('click',()=>{const fn=gameActionPrimaryHandler;if(fn)fn();});
    $('gameActionSecondaryBtn').addEventListener('click',()=>{const fn=gameActionSecondaryHandler;if(fn)fn();else closeGameActionDialog();});
    $('gameActionOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeGameActionDialog();});

    const campWhite=$('campWhiteBtn');
    if(campWhite)campWhite.addEventListener('click',()=>chooseCamp('w'));
    const campBlack=$('campBlackBtn');
    if(campBlack)campBlack.addEventListener('click',()=>chooseCamp('b'));
    const campRandom=$('campRandomBtn');
    if(campRandom)campRandom.addEventListener('click',()=>chooseCamp('random'));

    $('modeLocalBtn').addEventListener('click',startLocalMode);
    $('modeAiBtn').addEventListener('click',()=>showModeOverlay('ai'));
    $('modeRemoteBtn').addEventListener('click',()=>showModeOverlay('remote'));

    $('bottomPlayBtn').addEventListener('click',openPlayMenu);
    $('bottomProfileBtn').addEventListener('click',openProfileDashboard);
    $('playMenuCloseBtn').addEventListener('click',closePlayMenu);
    $('profileDashboardCloseBtn').addEventListener('click',closeProfileDashboard);
    $('profileDashboardLoginBtn').addEventListener('click',()=>{closeProfileDashboard();showProfileOverlay('', 'login');});
    $('profileDeleteRevealBtn').addEventListener('click',revealDeleteAccount);
    $('profileDeleteConfirmBtn').addEventListener('click',deleteCurrentAccount);
    $('profileDeletePassword').addEventListener('keydown',e=>{if(e.key==='Enter')deleteCurrentAccount();});
    $('playMenuOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closePlayMenu();});
    $('profileDashboardOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeProfileDashboard();});
    document.querySelectorAll('[data-time-control]').forEach(btn=>{
      btn.addEventListener('click',()=>selectTimeControl(btn.dataset.timeControl));
    });
    $('correspondenceTimeBtn').addEventListener('click',()=>{commitPendingThemeChoice();openCorrespondenceMenu();});
    $('correspondenceCloseBtn').addEventListener('click',closeCorrespondenceMenu);
    $('correspondenceCreateBtn').addEventListener('click',createCorrespondenceGame);
    $('correspondenceJoinBtn').addEventListener('click',joinCorrespondenceGame);
    $('correspondenceRefreshBtn').addEventListener('click',loadCorrespondenceList);
    $('correspondenceLoginBtn').addEventListener('click',()=>{closeCorrespondenceMenu();showProfileOverlay('', 'login');});
    $('correspondenceCodeInput').addEventListener('input',e=>{e.target.value=cleanCorrespondenceCode(e.target.value);});
    $('correspondenceCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinCorrespondenceGame();});
    $('correspondenceOverlay').addEventListener('click',e=>{if(e.target===e.currentTarget)closeCorrespondenceMenu();});
    const persistRemoteBeforeSuspend=()=>{
      if(gameMode==='remote'&&remoteRoomCode){
        commitClock();
        saveRemoteSession({active:!!remoteReady});
      }
    };
    const resumeRemoteAfterSuspend=()=>{
      const session=readRemoteSession();
      if(!session)return;
      if(gameMode!=='remote'||!remoteRoomCode)restoreRemoteSnapshot(session);
      // Laisse Safari réactiver le websocket avant la première tentative.
      setTimeout(()=>resumeRemoteConnection(),120);
      setTimeout(()=>{
        if(gameMode==='remote'&&(!peerConn||!peerConn.open))resumeRemoteConnection();
        else if(gameMode==='remote'&&peerConn&&peerConn.open){
          try{peerConn.send({type:'sync_request'});}catch(e){scheduleRemoteReconnect(200);}
        }
      },1100);
    };
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){persistRemoteBeforeSuspend();return;}
      refreshCurrentCorrespondenceGame(true);
      loadOngoingCorrespondenceSidebar(true);
      resumeRemoteAfterSuspend();
    });
    window.addEventListener('pagehide',persistRemoteBeforeSuspend);
    window.addEventListener('pageshow',resumeRemoteAfterSuspend);
    window.addEventListener('online',resumeRemoteAfterSuspend);
    if('onfreeze' in document)document.addEventListener('freeze',persistRemoteBeforeSuspend);
    if('onresume' in document)document.addEventListener('resume',resumeRemoteAfterSuspend);
    startOngoingGamesPolling();
    configureTimeControl(selectedTimeControlKey);

    $('authLoginTab').addEventListener('click',()=>switchAuthMode('login'));
    $('authRegisterTab').addEventListener('click',()=>switchAuthMode('register'));
    $('loginProfileBtn').addEventListener('click',loginPlayerProfile);
    $('guestLoginBtn').addEventListener('click',startGuestSession);
    $('registerProfileBtn').addEventListener('click',registerPlayerProfile);

    $('loginProfileInput').addEventListener('input',()=>{
      verifiedLoginProfileName='';
      setProfileNameCheck('');
    });
    $('loginProfileInput').addEventListener('blur',()=>{
      if(cleanPlayerName($('loginProfileInput').value))checkLoginProfileName();
    });
    $('loginProfileInput').addEventListener('keydown',e=>{
      if(e.key==='Enter'){
        e.preventDefault();
        $('loginPasswordInput')?.focus();
      }
    });
    $('loginPasswordInput').addEventListener('keydown',e=>{
      if(e.key==='Enter')loginPlayerProfile();
    });
    $('registerPasswordConfirmInput').addEventListener('keydown',e=>{
      if(e.key==='Enter')registerPlayerProfile();
    });
    $('changeProfileBtn').addEventListener('click',logoutPlayerProfile);
    $('aiBackBtn').addEventListener('click',()=>showModeOverlay('main'));
    $('remoteBackBtn').addEventListener('click',()=>{
      destroyRemote();
      setRemoteStatus('Connexion pair-à-pair sécurisée entre les deux navigateurs.');
      showModeOverlay('main');
    });

    document.querySelectorAll('[data-ai-level]').forEach(btn=>{
      btn.addEventListener('click',()=>startAIMode(btn.dataset.aiLevel));
    });

    $('createRoomBtn').addEventListener('click',createRemoteRoom);
    $('joinRoomBtn').addEventListener('click',joinRemoteRoom);
    $('roomCodeInput').addEventListener('input',e=>{e.target.value=cleanCode(e.target.value)});
    $('roomCodeInput').addEventListener('keydown',e=>{if(e.key==='Enter')joinRemoteRoom()});
    $('copyCodeBtn').addEventListener('click',async()=>{
      const code=cleanCode($('accessCode').textContent);
      saveRemoteSession({role:'host',code,active:!!remoteReady});
      try{
        await navigator.clipboard.writeText(code);
        setRemoteStatus('Code '+code+' copié. Tu peux changer d’app : la salle reste récupérable avec le même code.','ok');
      }catch(e){
        setRemoteStatus('Code : '+code+' — le même code sera récupéré à ton retour.','ok');
      }
    });
    $('shareCodeBtn').addEventListener('click',shareRemoteCode);

    // Au premier lancement, on initialise le jeu sans afficher
    // directement le choix du mode. Le thème/cadence est la première étape.
    prepareModeChoice({showOverlay:false});
    renderAll();
    renderElo();
    renderProfile();

    setLoaderProgress(82,'Connexion au profil joueur…');
    await bootstrapPlayerProfile();

    const restoredRemote=await restoreRemoteSessionOnBoot();
    if(!restoredRemote){
      const sharedCode=cleanCode(new URL(window.location.href).searchParams.get('room'));
      if(sharedCode.length===6){
        // Un lien d'invitation conserve son accès direct au salon.
        showModeOverlay('remote');
        $('roomCodeInput').value=sharedCode;
        setRemoteStatus('Code '+sharedCode+' reçu. Appuie sur Rejoindre.','ok');
      }else{
        // Nouvelle partie normale : thème -> cadence -> mode -> camp.
        openPlayMenu();
      }
    }

    setLoaderProgress(84,'Finalisation des images…');
    await waitForRenderedImages((done,total)=>{
      const pct=84+(done/Math.max(1,total))*9;
      setLoaderProgress(pct,'Finalisation des images…');
    });

    setLoaderProgress(94,'Finalisation de l’interface…');
    await waitForWindowLoad();

    if(document.fonts&&document.fonts.ready){
      try{await document.fonts.ready}catch(e){}
    }

    setLoaderProgress(98,'Démarrage…');
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    await finishLoader();
  }catch(err){
    console.error(err);
    loaderError('Impossible de charger le jeu. Vérifie ta connexion Internet.');
  }
}

document.addEventListener('selectstart',e=>e.preventDefault(),{capture:true});
document.addEventListener('dragstart',e=>e.preventDefault(),{capture:true});
document.addEventListener('contextmenu',e=>{
  const tag=(e.target&&e.target.tagName||'').toLowerCase();
  if(tag==='img')e.preventDefault();
},{capture:true});

let controllerBooted=false;
export async function bootMarioChess(){
  if(controllerBooted)return;
  controllerBooted=true;
  await boot();
}
