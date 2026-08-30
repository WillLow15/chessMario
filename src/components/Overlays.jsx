import React from 'react';
import { themeChoices } from '../themes/index.js';

export function Overlays({ themeId, onThemeChange }) {
  return (
    <>
    <div className={"game-action-overlay"} id={"gameActionOverlay"} aria-hidden={"true"}>
      <div className={"game-action-dialog"} role={"dialog"} aria-modal={"true"} aria-labelledby={"gameActionDialogTitle"}>
        <button className={"game-action-dialog-close"} id={"gameActionDialogClose"} type={"button"} aria-label={"Fermer"}>×</button>
        <div className={"game-action-dialog-icon"} id={"gameActionDialogIcon"}>½</div>
        <div className={"game-action-dialog-title"} id={"gameActionDialogTitle"}>Proposition de nulle</div>
        <div className={"game-action-dialog-text"} id={"gameActionDialogText"}></div>
        <div className={"game-action-dialog-actions"}>
          <button className={"secondary"} id={"gameActionSecondaryBtn"} type={"button"}>Annuler</button>
          <button className={"primary"} id={"gameActionPrimaryBtn"} type={"button"}>Confirmer</button>
        </div>
      </div>
    </div>
    <div className={"mate-overlay"} id={"mateOverlay"} aria-hidden={"true"}>
      <div className={"mate-panel"}>
        <button className={"mate-close"} id={"mateCloseBtn"} type={"button"} aria-label={"Fermer"}>×</button>
        <div className={"mate-character"}>
          <img id={"mateCharacter"} alt={"Personnage victoire"} />
        </div>
        <div className={"mate-sign"}>
          <div className={"mate-sign-top"}>ECHEC ET MAT</div>
          <div className={"mate-sign-winner"}>WINNER :</div>
          <div className={"mate-sign-name"} id={"mateWinnerName"}>BLANCS</div>
          <div className={"elo-result hidden"} id={"eloResult"}>
            <span id={"eloResultLabel"}>ELO</span>
            <strong id={"eloResultDelta"}>+0</strong>
            <small id={"eloResultDetail"}>1200 → 1200</small>
          </div>
          <button className={"mate-replay"} id={"mateReplayBtn"} type={"button"}>REJOUER</button>
        </div>
      </div>
    </div>
    <div className={"profile-overlay"} id={"profileOverlay"} aria-hidden={"true"}>
      <div className={"profile-card auth-card"}>
        <div className={"profile-icon"}>♟</div>
        <div className={"profile-title"}>Compte joueur</div>
        <div className={"profile-sub"}>Connecte-toi pour retrouver ton classement ELO.</div>
        <div className={"auth-tabs"} role={"tablist"} aria-label={"Connexion joueur"}>
          <button className={"auth-tab active"} id={"authLoginTab"} type={"button"}>SE CONNECTER</button>
          <button className={"auth-tab"} id={"authRegisterTab"} type={"button"}>CRÉER UN PROFIL</button>
        </div>
        <div className={"auth-panel"} id={"authLoginPanel"}>
          <label className={"profile-field"}>
            <span>PSEUDO</span>
            <input id={"loginProfileInput"} type={"text"} maxLength={"20"} autoComplete={"username"} autoCapitalize={"none"} spellCheck={"false"} placeholder={"Entre ton pseudo exact"} />
          </label>
          <label className={"profile-field"}>
            <span>MOT DE PASSE</span>
            <input id={"loginPasswordInput"} type={"password"} maxLength={"128"} autoComplete={"current-password"} placeholder={"Ton mot de passe"} />
          </label>
          <div className={"profile-name-check"} id={"profileNameCheck"} aria-live={"polite"}></div>
          <button className={"profile-save"} id={"loginProfileBtn"} type={"button"}>SE CONNECTER</button>
          <div className={"auth-or"}>
            <span>OU</span>
          </div>
          <button className={"guest-login-btn"} id={"guestLoginBtn"} type={"button"}>JOUER EN INVITÉ</button>
          <div className={"guest-login-note"}>Aucune donnée ne sera enregistrée dans la base.</div>
        </div>
        <div className={"auth-panel hidden"} id={"authRegisterPanel"}>
          <label className={"profile-field"}>
            <span>NOM DU JOUEUR</span>
            <input id={"registerNameInput"} type={"text"} maxLength={"20"} autoComplete={"nickname"} autoCapitalize={"words"} spellCheck={"false"} placeholder={"Ton pseudo"} />
          </label>
          <label className={"profile-field"}>
            <span>MOT DE PASSE</span>
            <input id={"registerPasswordInput"} type={"password"} maxLength={"128"} autoComplete={"new-password"} placeholder={"8 caractères minimum"} />
          </label>
          <label className={"profile-field"}>
            <span>CONFIRMER LE MOT DE PASSE</span>
            <input id={"registerPasswordConfirmInput"} type={"password"} maxLength={"128"} autoComplete={"new-password"} placeholder={"Répète ton mot de passe"} />
          </label>
          <button className={"profile-save"} id={"registerProfileBtn"} type={"button"}>CRÉER LE PROFIL</button>
        </div>
        <div className={"profile-status"} id={"profileStatus"}>
      Les mots de passe sont hachés côté serveur et ne sont jamais enregistrés en clair.
    </div>
      </div>
    </div>
    <div className={"mode-overlay"} id={"modeOverlay"} aria-hidden={"true"}>
      <div className={"mode-card"}>
        <div className={"mode-panel"} id={"modeMainPanel"}>
          <div className={"mode-title"}>Mode de jeu</div>
          <div className={"mode-sub"}>Comment veux-tu jouer ?</div>
          <div className={"db-profile-badge"} id={"dbProfileBadge"}>
            <span id={"profileNameDisplay"}>Joueur</span>
            <strong id={"profileEloDisplay"}>1200 ELO</strong>
            <button id={"changeProfileBtn"} type={"button"}>Changer</button>
          </div>
          <div className={"mode-grid"}>
            <button className={"mode-choice local"} id={"modeLocalBtn"} type={"button"}>
              <strong>2 joueurs</strong>
              <span>Sur le même écran</span>
            </button>
            <button className={"mode-choice ai"} id={"modeAiBtn"} type={"button"}>
              <strong>Contre l'IA</strong>
              <span>3 niveaux disponibles</span>
            </button>
            <button className={"mode-choice remote"} id={"modeRemoteBtn"} type={"button"}>
              <strong>Avec un ami</strong>
              <span>Partage un code d'accès</span>
            </button>
          </div>
        </div>
        <div className={"mode-panel hidden"} id={"aiPanel"}>
          <button className={"mode-back"} id={"aiBackBtn"} type={"button"}>‹ Retour</button>
          <div className={"mode-title"}>Niveau de l'IA</div>
          <div className={"mode-sub"}>Choisis la difficulté.</div>
          <div className={"ai-levels"}>
            <button className={"level-btn easy"} data-ai-level={"easy"} type={"button"}>
              <strong>Facile</strong>
              <span>IA · ELO 800</span>
            </button>
            <button className={"level-btn medium"} data-ai-level={"medium"} type={"button"}>
              <strong>Normal</strong>
              <span>IA · ELO 1200</span>
            </button>
            <button className={"level-btn hard"} data-ai-level={"hard"} type={"button"}>
              <strong>Difficile</strong>
              <span>IA · ELO 1600</span>
            </button>
          </div>
        </div>
        <div className={"mode-panel hidden"} id={"remotePanel"}>
          <button className={"mode-back"} id={"remoteBackBtn"} type={"button"}>‹ Retour</button>
          <div className={"mode-title"}>Jouer avec un ami</div>
          <div className={"mode-sub"}>Le créateur joue les Blancs, l'ami qui rejoint joue les Noirs.</div>
          <div className={"remote-box"}>
            <button className={"remote-main-btn"} id={"createRoomBtn"} type={"button"}>Créer une partie</button>
            <div className={"access-code-box hidden"} id={"accessCodeBox"}>
              <span>CODE D'ACCÈS</span>
              <strong id={"accessCode"}>------</strong>
              <div className={"access-code-actions"}>
                <button id={"copyCodeBtn"} type={"button"}>Copier</button>
                <button className={"share-code-btn"} id={"shareCodeBtn"} type={"button"}>Partager</button>
              </div>
            </div>
          </div>
          <div className={"remote-divider"}>
            <span>OU</span>
          </div>
          <div className={"join-box"}>
            <input id={"roomCodeInput"} type={"text"} maxLength={"6"} autoComplete={"off"} spellCheck={"false"} placeholder={"ENTRE LE CODE"} />
            <button className={"remote-main-btn join"} id={"joinRoomBtn"} type={"button"}>Rejoindre</button>
          </div>
          <div className={"remote-status"} id={"remoteStatus"}>Connexion pair-à-pair sécurisée entre les deux navigateurs.</div>
        </div>
      </div>
    </div>
    <div className={"app-sheet-overlay"} id={"playMenuOverlay"} aria-hidden={"true"}>
      <div className={"app-sheet play-menu-sheet"} role={"dialog"} aria-modal={"true"} aria-labelledby={"playMenuTitle"}>
        <div className={"app-sheet-handle"} aria-hidden={"true"}></div>
        <button className={"app-sheet-close"} id={"playMenuCloseBtn"} type={"button"} aria-label={"Fermer"}>×</button>
        <div className={"app-sheet-title"} id={"playMenuTitle"}>Nouvelle partie</div>
        <div className={"app-sheet-sub"}>Choisis le thème de ta prochaine partie, puis la cadence et le mode de jeu.</div>
        <section className={"theme-picker"} aria-label={"Thème du jeu"}>
          <div className={"theme-picker-head"}>
            <strong>Univers de jeu</strong>
            <span>Le thème sera appliqué au lancement de la partie.</span>
          </div>
          <div className={"theme-picker-grid"} role={"radiogroup"} aria-label={"Choisir l’univers"}>
            {themeChoices.map(choice=>(
              <button
                key={choice.id}
                className={"theme-picker-btn"+(themeId===choice.id?' active':'')}
                data-theme-choice={choice.id}
                type={"button"}
                role={"radio"}
                aria-checked={themeId===choice.id}
                onClick={()=>onThemeChange?.(choice.id)}
              >
                <span className={"theme-picker-preview"} aria-hidden={"true"}>
                  <img src={choice.preview} alt={""} />
                </span>
                <span className={"theme-picker-copy"}>
                  <strong>{choice.label}</strong>
                  <small>{choice.description}</small>
                </span>
                <span className={"theme-picker-check"} aria-hidden={"true"}>✓</span>
              </button>
            ))}
          </div>
        </section>
        <div className={"time-control-grid"}>
          <button className={"time-control-btn"} data-time-control={"bullet1"} type={"button"}>
            <strong>1 min</strong>
            <span>Bullet · 1+0</span>
          </button>
          <button className={"time-control-btn"} data-time-control={"blitz5"} type={"button"}>
            <strong>5 min</strong>
            <span>Blitz · 5+0</span>
          </button>
          <button className={"time-control-btn active"} data-time-control={"rapid10"} type={"button"}>
            <strong>10 min</strong>
            <span>Rapide · 10+0</span>
          </button>
          <button className={"time-control-btn"} data-time-control={"rapid15_10"} type={"button"}>
            <strong>15 | 10</strong>
            <span>15 min + 10 s / coup</span>
          </button>
          <button className={"time-control-btn"} data-time-control={"long30"} type={"button"}>
            <strong>30 min</strong>
            <span>Longue · 30+0</span>
          </button>
          <button className={"time-control-btn correspondence"} id={"correspondenceTimeBtn"} data-correspondence={"3d"} type={"button"}>
            <strong>3 jours</strong>
            <span>Différé · 3 jours par coup</span>
          </button>
        </div>
      </div>
    </div>
    <div className={"correspondence-overlay"} id={"correspondenceOverlay"} aria-hidden={"true"}>
      <div className={"correspondence-sheet"} role={"dialog"} aria-modal={"true"} aria-labelledby={"correspondenceTitle"}>
        <button className={"app-sheet-close correspondence-close"} id={"correspondenceCloseBtn"} type={"button"} aria-label={"Fermer"}>×</button>
        <div className={"app-sheet-title"} id={"correspondenceTitle"}>Partie en différé</div>
        <div className={"app-sheet-sub"}>Chaque joueur dispose de 3 jours pour jouer son coup. Tu peux fermer le site et reprendre plus tard.</div>
        <div className={"correspondence-auth-note hidden"} id={"correspondenceAuthNote"}>
          <strong>Connexion requise</strong>
          <span>Les parties différées sont enregistrées dans ton compte.</span>
          <button id={"correspondenceLoginBtn"} type={"button"}>SE CONNECTER</button>
        </div>
        <div id={"correspondenceContent"}>
          <div className={"correspondence-actions"}>
            <button className={"correspondence-create-btn"} id={"correspondenceCreateBtn"} type={"button"}>Créer une partie 3 jours</button>
            <div className={"correspondence-join-row"}>
              <input id={"correspondenceCodeInput"} type={"text"} maxLength={"6"} autoComplete={"off"} autoCapitalize={"characters"} spellCheck={"false"} placeholder={"CODE À 6 CARACTÈRES"} />
              <button id={"correspondenceJoinBtn"} type={"button"}>Rejoindre</button>
            </div>
          </div>
          <div className={"correspondence-created hidden"} id={"correspondenceCreatedBox"}>
            <span>CODE À PARTAGER</span>
            <strong id={"correspondenceCreatedCode"}>------</strong>
            <small>La partie commencera dès que l'autre joueur aura rejoint.</small>
          </div>
          <div className={"correspondence-status"} id={"correspondenceStatus"} aria-live={"polite"}></div>
          <div className={"correspondence-list-head"}>
            <strong>Mes parties en différé</strong>
            <button id={"correspondenceRefreshBtn"} type={"button"}>Actualiser</button>
          </div>
          <div className={"correspondence-list"} id={"correspondenceList"}>
            <div className={"correspondence-empty"}>Chargement…</div>
          </div>
        </div>
      </div>
    </div>
    <div className={"profile-dashboard-overlay"} id={"profileDashboardOverlay"} aria-hidden={"true"}>
      <div className={"profile-dashboard"} role={"dialog"} aria-modal={"true"} aria-labelledby={"profileDashboardTitle"}>
        <div className={"profile-dashboard-head"}>
          <div className={"profile-dashboard-avatar"} aria-hidden={"true"}>♟</div>
          <div className={"profile-dashboard-identity"}>
            <span>PROFIL</span>
            <strong id={"profileDashboardTitle"}>Joueur</strong>
            <small id={"profileDashboardMemberSince"}>—</small>
          </div>
          <div className={"profile-dashboard-elo"}>
            <span>ELO</span>
            <strong id={"profileDashboardElo"}>—</strong>
          </div>
          <button className={"profile-dashboard-close"} id={"profileDashboardCloseBtn"} type={"button"} aria-label={"Fermer"}>×</button>
        </div>
        <div className={"profile-dashboard-status"} id={"profileDashboardStatus"}></div>
        <div className={"profile-stats-grid"} id={"profileStatsGrid"}>
          <div className={"profile-stat"}>
            <span>Parties</span>
            <strong id={"profileStatGames"}>—</strong>
          </div>
          <div className={"profile-stat win"}>
            <span>Victoires</span>
            <strong id={"profileStatWins"}>—</strong>
          </div>
          <div className={"profile-stat draw"}>
            <span>Nulles</span>
            <strong id={"profileStatDraws"}>—</strong>
          </div>
          <div className={"profile-stat loss"}>
            <span>Défaites</span>
            <strong id={"profileStatLosses"}>—</strong>
          </div>
          <div className={"profile-stat rate"}>
            <span>Taux de victoire</span>
            <strong id={"profileStatWinRate"}>—</strong>
          </div>
        </div>
        <section className={"profile-history-section"}>
          <div className={"profile-section-title"}>
            <strong>Historique des parties</strong>
            <span>50 dernières</span>
          </div>
          <div className={"profile-history-list"} id={"profileHistoryList"}>
            <div className={"profile-history-empty"}>Chargement…</div>
          </div>
        </section>
        <div className={"profile-guest-action hidden"} id={"profileGuestAction"}>
          <p>Connecte-toi pour retrouver ton ELO, tes statistiques et ton historique.</p>
          <button id={"profileDashboardLoginBtn"} type={"button"}>SE CONNECTER</button>
        </div>
        <section className={"profile-danger-zone"} id={"profileDangerZone"}>
          <button className={"profile-delete-reveal"} id={"profileDeleteRevealBtn"} type={"button"}>Supprimer mon compte</button>
          <div className={"profile-delete-confirm hidden"} id={"profileDeleteConfirm"}>
            <strong>Suppression définitive</strong>
            <p>Ton profil, tes sessions et ton historique seront supprimés définitivement.</p>
            <label>
              <span>Mot de passe</span>
              <input id={"profileDeletePassword"} type={"password"} maxLength={"128"} autoComplete={"current-password"} placeholder={"Confirme avec ton mot de passe"} />
            </label>
            <div className={"profile-delete-actions"}>
              <button className={"danger"} id={"profileDeleteConfirmBtn"} type={"button"}>SUPPRIMER DÉFINITIVEMENT</button>
            </div>
          </div>
        </section>
      </div>
    </div>
    <div className={"camp-overlay"} id={"campOverlay"} aria-hidden={"true"}>
      <div className={"camp-card"}>
        <div className={"camp-title"}>Choisis ton camp</div>
        <div className={"camp-sub"}>Sélectionne ton côté pour commencer la partie.</div>
        <div className={"camp-actions"}>
          <button className={"camp-btn white"} id={"campWhiteBtn"} type={"button"}>Blancs</button>
          <button className={"camp-btn black"} id={"campBlackBtn"} type={"button"}>Noirs</button>
          <button className={"camp-btn random"} id={"campRandomBtn"} type={"button"}>Aléatoire</button>
        </div>
      </div>
    </div>
    </>
  );
}
