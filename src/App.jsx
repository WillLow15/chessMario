import React, { useEffect, useMemo, useState } from 'react';
import { GameShell } from './components/GameShell.jsx';
import { Overlays } from './components/Overlays.jsx';
import { BottomNavigation } from './components/BottomNavigation.jsx';
import { EloToast } from './components/EloToast.jsx';
import { applyGameTheme, bootMarioChess } from './game/controller.js';
import { getTheme, resolveThemeId, setActiveTheme } from './themes/index.js';

export default function App(){
  const [themeId,setThemeId]=useState(()=>resolveThemeId());
  const theme=useMemo(()=>getTheme(themeId),[themeId]);

  useEffect(()=>{
    const nextTheme=setActiveTheme(themeId,{persist:true});
    document.title=nextTheme.documentTitle || nextTheme.label || 'Chess';
    document.documentElement.dataset.theme=nextTheme.id;
    applyGameTheme(nextTheme);
  },[themeId]);

  useEffect(()=>{
    void bootMarioChess();
  },[]);

  function handleThemeChange(nextThemeId){
    if(nextThemeId===themeId)return;
    const nextTheme=setActiveTheme(nextThemeId,{persist:true,clearUrlOverride:true});
    setThemeId(nextTheme.id);
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
