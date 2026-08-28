import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GameShell } from './components/GameShell.jsx';
import { Overlays } from './components/Overlays.jsx';
import { BottomNavigation } from './components/BottomNavigation.jsx';
import { EloToast } from './components/EloToast.jsx';
import { applyGameTheme, bootMarioChess } from './game/controller.js';
import { getTheme, getThemeUrlOverride, resolveThemeId, setActiveTheme } from './themes/index.js';

export default function App(){
  const initialUrlThemeRef=useRef(getThemeUrlOverride());
  const firstThemeApplyRef=useRef(true);

  // themeId = thème réellement utilisé par la partie / l'interface.
  // pendingThemeId = thème choisi dans "Jouer" pour la prochaine partie.
  const [themeId,setThemeId]=useState(()=>resolveThemeId());
  const [pendingThemeId,setPendingThemeId]=useState(()=>resolveThemeId());
  const pendingThemeIdRef=useRef(pendingThemeId);
  const pendingThemeDirtyRef=useRef(false);

  const theme=useMemo(()=>getTheme(themeId),[themeId]);

  useEffect(()=>{
    pendingThemeIdRef.current=pendingThemeId;
  },[pendingThemeId]);

  useEffect(()=>{
    const isInitialApply=firstThemeApplyRef.current;
    firstThemeApplyRef.current=false;

    // A ?theme= URL is only a temporary preview/debug override.
    // It must not silently replace the player's saved preference.
    const persist=!(isInitialApply&&initialUrlThemeRef.current===themeId);
    const nextTheme=setActiveTheme(themeId,{persist});
    document.title=nextTheme.documentTitle || nextTheme.label || 'Chess';
    document.documentElement.dataset.theme=nextTheme.id;
    applyGameTheme(nextTheme);
  },[themeId]);

  useEffect(()=>{
    void bootMarioChess();
  },[]);

  useEffect(()=>{
    const resetPendingTheme=()=>{
      pendingThemeDirtyRef.current=false;
      pendingThemeIdRef.current=themeId;
      setPendingThemeId(themeId);
    };

    const commitPendingTheme=()=>{
      const wanted=getTheme(pendingThemeIdRef.current).id;
      const explicitChoice=pendingThemeDirtyRef.current;

      // Le clic sur une cadence valide le thème de la prochaine partie.
      // Un ?theme= de debug reste temporaire tant que le joueur
      // n'a pas explicitement choisi un univers dans le sélecteur.
      const nextTheme=setActiveTheme(wanted,{
        persist:explicitChoice,
        clearUrlOverride:explicitChoice
      });

      document.title=nextTheme.documentTitle || nextTheme.label || 'Chess';
      document.documentElement.dataset.theme=nextTheme.id;
      applyGameTheme(nextTheme);

      pendingThemeDirtyRef.current=false;
      pendingThemeIdRef.current=nextTheme.id;
      setPendingThemeId(nextTheme.id);
      setThemeId(nextTheme.id);
    };

    window.addEventListener('chess:theme-picker-open',resetPendingTheme);
    window.addEventListener('chess:commit-pending-theme',commitPendingTheme);

    return ()=>{
      window.removeEventListener('chess:theme-picker-open',resetPendingTheme);
      window.removeEventListener('chess:commit-pending-theme',commitPendingTheme);
    };
  },[themeId]);

  function handleThemeChange(nextThemeId){
    // On prépare seulement la prochaine partie :
    // aucune modification visuelle de la partie en cours ici.
    const nextId=getTheme(nextThemeId).id;
    pendingThemeDirtyRef.current=true;
    pendingThemeIdRef.current=nextId;
    setPendingThemeId(nextId);
  }

  return (
    <div className="react-app-root" data-theme={theme.id}>
      <GameShell theme={theme} />
      <Overlays themeId={pendingThemeId} onThemeChange={handleThemeChange} />
      <BottomNavigation />
      <EloToast />
    </div>
  );
}
