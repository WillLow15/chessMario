import React from 'react';

export function BottomNavigation() {
  return (
    <>
    <nav className={"bottom-app-nav"} id={"bottomAppNav"} aria-label={"Navigation principale"}>
      <button className={"bottom-nav-btn play"} id={"bottomPlayBtn"} type={"button"}>
        <span className={"bottom-nav-icon"} aria-hidden={"true"}>♟</span>
        <span className={"bottom-nav-copy"}>
          <strong>Jouer</strong>
          <small id={"bottomTimeLabel"}>10 min</small>
        </span>
      </button>
      <div className={"game-actions hidden"} id={"gameActions"} aria-label={"Actions de la partie"}>
        <button className={"game-action-btn draw"} id={"offerDrawBtn"} type={"button"}>
          <span className={"game-action-icon"} aria-hidden={"true"}>½</span>
          <span id={"offerDrawBtnText"}>Nulle</span>
        </button>
        <button className={"game-action-btn resign"} id={"resignGameBtn"} type={"button"}>
          <span className={"game-action-icon"} aria-hidden={"true"}>⚑</span>
          <span>Abandonner</span>
        </button>
        <div className={"game-action-status"} id={"gameActionStatus"} aria-live={"polite"}></div>
      </div>
      <button className={"bottom-nav-btn profile"} id={"bottomProfileBtn"} type={"button"}>
        <span className={"bottom-nav-icon"} aria-hidden={"true"}>●</span>
        <span className={"bottom-nav-copy"}>
          <strong>Profil</strong>
          <small id={"bottomProfileLabel"}>Mon compte</small>
        </span>
      </button>
    </nav>
    </>
  );
}
