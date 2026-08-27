import React, { useEffect } from 'react';
import { GameShell } from './components/GameShell.jsx';
import { Overlays } from './components/Overlays.jsx';
import { BottomNavigation } from './components/BottomNavigation.jsx';
import { EloToast } from './components/EloToast.jsx';
import { bootMarioChess } from './game/controller.js';
import { activeTheme } from './themes/index.js';

export default function App(){
  useEffect(()=>{
    document.title=activeTheme.documentTitle || activeTheme.label || 'Chess';
    document.documentElement.dataset.theme=activeTheme.id;
    void bootMarioChess();
  },[]);

  return (
    <div className="react-app-root" data-theme={activeTheme.id}>
      <GameShell theme={activeTheme} />
      <Overlays />
      <BottomNavigation />
      <EloToast />
    </div>
  );
}
