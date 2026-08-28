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
  const [themeId,setThemeId]=useState(()=>resolveThemeId());
  const theme=useMemo(()=>getTheme(themeId),[themeId]);

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

  function handleThemeChange(nextThemeId){
    // A real user choice always wins over a temporary URL override,
    // even when the user clicks the theme that is already displayed.
    const nextTheme=setActiveTheme(nextThemeId,{persist:true,clearUrlOverride:true});
    if(nextTheme.id!==themeId)setThemeId(nextTheme.id);
  }

  return (
    <div className="react-app-root" data-theme={theme.id}>
      <GameShell theme={theme} />
      <Overlays themeId={theme.id} onThemeChange={handleThemeChange} />
      <BottomNavigation />
      <EloToast />
    </div>
  );
}
