import React from 'react';

export function GameShell() {
  return (
    <>
    <div className={"game-loader"} id={"gameLoader"} role={"status"} aria-live={"polite"} aria-label={"Chargement du jeu"}>
      <div className={"game-loader-card"}>
        <div className={"game-loader-icon-wrap"}>
          <div className={"game-loader-ring"} aria-hidden={"true"}></div>
          <img className={"game-loader-icon"} src={"/icon-192-v40.png"} alt={""} />
        </div>
        <div className={"game-loader-title"}>MARIO CHESS</div>
        <div className={"game-loader-status"} id={"gameLoaderStatus"}>Préparation du jeu…</div>
        <div className={"game-loader-progress-shell"} aria-hidden={"true"}>
          <div className={"game-loader-progress"} id={"gameLoaderProgress"}></div>
        </div>
        <div className={"game-loader-percent"} id={"gameLoaderPercent"}>0%</div>
      </div>
    </div>
    <div className={"world-bg"} aria-hidden={"true"}>
      <div className={"parallax-back"}>
        <div className={"world-sun"}></div>
        <div className={"wonder-rays"}></div>
        <div className={"wonder-haze"}></div>
        <div className={"wonder-cloud wc1"}></div>
        <div className={"wonder-cloud wc2"}></div>
        <div className={"wonder-cloud wc3"}></div>
        <div className={"mesa mesa1"}></div>
        <div className={"mesa mesa2"}></div>
        <div className={"mesa mesa3"}></div>
        <div className={"mesa mesa4"}></div>
        <div className={"dune-band"}></div>
        <div className={"dune-ripple"}></div>
        <div className={"dune-ripple r2"}></div>
        <div className={"dune-ripple r3"}></div>
        <div className={"platform-deco p1"}></div>
        <div className={"platform-deco p2"}></div>
        <div className={"pipe-wonder"}>
          <div className={"pipe-cap"}></div>
        </div>
        <div className={"castle-silhouette"}></div>
        <div className={"sparkle-group"}>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
          <i></i>
        </div>
      </div>
      <div className={"parallax-mid"}>
        <div className={"cloud c1"}></div>
        <div className={"cloud c2"}></div>
        <div className={"cloud c3"}></div>
        <div className={"hill h1"}></div>
        <div className={"hill h2"}></div>
        <div className={"hill h3"}></div>
        <div className={"bush b1"}></div>
        <div className={"bush b2"}></div>
        <div className={"question-block q1"}>?</div>
        <div className={"question-block q2"}>?</div>
        <div className={"brick-row r1"}>
          <span className={"brick"}></span>
          <span className={"brick"}></span>
          <span className={"brick"}></span>
        </div>
        <div className={"brick-row r2"}>
          <span className={"brick"}></span>
          <span className={"brick"}></span>
        </div>
        <span className={"coin-bg c1"}></span>
        <span className={"coin-bg c2"}></span>
        <span className={"coin-bg c3"}></span>
        <span className={"coin-bg c4"}></span>
        <span className={"sparkle s1"}></span>
        <span className={"sparkle s2"}></span>
        <span className={"sparkle s3"}></span>
        <span className={"bg-qblock qb1 bg-item"}></span>
        <span className={"bg-qblock qb2 bg-item"}></span>
        <span className={"bg-qblock qb3 bg-item"}></span>
        <span className={"bg-qblock qb4 bg-item"}></span>
      </div>
      <div className={"parallax-front"}>
        <span className={"bg-flower f1 bg-item"}></span>
        <span className={"bg-flower f2 bg-item"}></span>
        <span className={"bg-flower f3 bg-item"}></span>
        <span className={"bg-flower f4 bg-item"}></span>
        <div className={"coin-stack left"}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={"coin-stack right"}>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div className={"ground-strip"}></div>
      </div>
      <div className={"world-vignette"}></div>
    </div>
    <div className={"titlebar"}>
      <div className={"logo"}>
        <span className={"red"}>Mario</span>
        <span className={"green"}>Bros</span>
        <span className={"yellow"}>Chess</span>
      </div>
    </div>
    <div className={"chess-clocks"} aria-label={"Chronos de la partie"}>
      <div className={"chess-clock white-clock"} id={"clockCardWhite"}>
        <span>BLANCS</span>
        <strong id={"clockWhite"}>10:00</strong>
      </div>
      <div className={"clock-center"} id={"clockModeLabel"}>10 MIN</div>
      <div className={"chess-clock black-clock"} id={"clockCardBlack"}>
        <span>NOIRS</span>
        <strong id={"clockBlack"}>10:00</strong>
      </div>
    </div>
    <div className={"advantage-wrap sf-wrap"}>
      <div className={"sf-topline"}>
        <span>Barres de vie des camps</span>
        <span id={"advantageText"}>Début de partie</span>
      </div>
      <div className={"sf-bars"}>
        <div className={"sf-side white-side"}>
          <div className={"sf-player-label"}>
            <span className={"dot-team white"}></span>
            Blancs
            <strong id={"whiteAdvNum"}>0</strong>
          </div>
          <div className={"sf-life white-life"}>
            <div className={"sf-life-frame"}></div>
            <div className={"sf-life-bg"}></div>
            <div className={"sf-life-fill white-fill"} id={"advWhite"}></div>
            <div className={"sf-life-gloss"}></div>
          </div>
        </div>
        <div className={"sf-center-badge"}>
          <div className={"vs-badge"}>VS</div>
          <div className={"adv-mini"} id={"advantageValue"}>0 - 0</div>
        </div>
        <div className={"sf-side black-side"}>
          <div className={"sf-player-label right"}>
            <strong id={"blackAdvNum"}>0</strong>
            Noirs
            <span className={"dot-team black"}></span>
          </div>
          <div className={"sf-life black-life"}>
            <div className={"sf-life-frame"}></div>
            <div className={"sf-life-bg"}></div>
            <div className={"sf-life-fill black-fill"} id={"advBlack"}></div>
            <div className={"sf-life-gloss"}></div>
          </div>
        </div>
      </div>
    </div>
    <div className={"wrap"}>
      <aside className={"panel"}>
        <div className={"panel-head"}>Équipe Blancs</div>
        <div className={"section"}>
          <div className={"player-card"}>
            <div className={"avatar"}>
              <img src={"/assets/mario/king-boo.webp"} alt={"Roi Boo"} />
            </div>
            <div className={"team-player-info"}>
              <strong id={"whiteTeamName"}>Blancs</strong>
              <div className={"sub"}>Pièces blanches</div>
              <div className={"team-elo-line"} id={"whiteTeamElo"}>NON CLASSÉ</div>
            </div>
          </div>
        </div>
        <section className={"ongoing-games-block"} id={"ongoingGamesBlock"}>
          <div className={"ongoing-games-head"}>
            <strong>Parties en cours</strong>
            <span className={"ongoing-games-count"} id={"ongoingGamesCount"}>0</span>
          </div>
          <div className={"ongoing-games-list"} id={"ongoingGamesList"}>
            <div className={"ongoing-games-empty"}>Connecte-toi pour voir tes parties différées.</div>
          </div>
        </section>
        <div className={"section"}>
          <strong className={"section-label-spaced"}>Pièces mangées</strong>
          <div className={"captured"} id={"capturedByWhite"}></div>
        </div>
        <div className={"section"}>
          <strong className={"section-label-spaced"}>Coups suggérés pour les Blancs</strong>
          <div className={"hint-list"} id={"hintWhite"}></div>
        </div>
        <div className={"section"}>
          <div className={"buttons"}>
            <button className={"btn-main"} id={"newGameBtn"}>Nouvelle partie</button>
            <button className={"btn-yellow"} id={"flipBtn"}>Retourner l'échiquier</button>
          </div>
        </div>
      </aside>
      <main className={"board-shell"}>
        <div className={"pipe-left"}></div>
        <div className={"pipe-right"}></div>
        <div className={"board-area"}>
          <div className={"board-topbar"}>
            <div className={"turn-badge"} id={"turnBadge"}>Tour : Blancs</div>
          </div>
          <div className={"board"} id={"board"}></div>
        </div>
        <div className={"footer-note"}></div>
      </main>
      <aside className={"panel"}>
        <div className={"panel-head"}>Équipe Noirs</div>
        <div className={"section"}>
          <div className={"player-card"}>
            <div className={"avatar"}>
              <img src={"/assets/mario/donkey-kong.webp"} alt={"Donkey Kong"} />
            </div>
            <div className={"team-player-info"}>
              <strong id={"blackTeamName"}>Noirs</strong>
              <div className={"sub"}>Pièces noires</div>
              <div className={"team-elo-line"} id={"blackTeamElo"}>NON CLASSÉ</div>
            </div>
          </div>
        </div>
        <div className={"section"}>
          <strong className={"section-label-spaced"}>Pièces mangées</strong>
          <div className={"captured"} id={"capturedByBlack"}></div>
        </div>
        <div className={"section"}>
          <strong className={"section-label-spaced"}>Historique des coups</strong>
          <div className={"moves"} id={"movesBox"}></div>
        </div>
      </aside>
    </div>
    </>
  );
}
