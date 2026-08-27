import React from 'react';

export function EloToast() {
  return (
    <>
    <div className={"elo-toast"} id={"eloToast"} aria-live={"polite"}>
      <span id={"eloToastText"}>ELO mis à jour</span>
    </div>
    </>
  );
}
