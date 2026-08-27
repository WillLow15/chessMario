import React, { useEffect } from 'react';
import { GameShell } from './components/GameShell.jsx';
import { Overlays } from './components/Overlays.jsx';
import { BottomNavigation } from './components/BottomNavigation.jsx';
import { EloToast } from './components/EloToast.jsx';
import { bootMarioChess } from './game/controller.js';

export default function App(){
  useEffect(()=>{ void bootMarioChess(); },[]);
  return (
    <div className="react-app-root" data-theme="mario">
      <GameShell />
      <Overlays />
      <BottomNavigation />
      <EloToast />
    </div>
  );
}
