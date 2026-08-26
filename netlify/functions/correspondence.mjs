import { randomBytes } from "node:crypto";
import { Chess } from "chess.js";
import { json, supabase, parseJSON, authenticatedPlayer } from "../lib/supabase.mjs";

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const MOVE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function code6() {
  const bytes = randomBytes(6);
  let out = "";
  for (let i = 0; i < 6; i++) out += CODE_CHARS[bytes[i] % CODE_CHARS.length];
  return out;
}
function deadlineFromNow() { return new Date(Date.now() + MOVE_WINDOW_MS).toISOString(); }
function cleanCode(value) { return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6); }
function cleanSquare(value) { const s = String(value || "").toLowerCase(); return /^[a-h][1-8]$/.test(s) ? s : ""; }

async function fetchPlayers(ids) {
  const unique = [...new Set(ids.filter(Boolean).map(Number))];
  if (!unique.length) return new Map();
  const q = new URLSearchParams({ id: `in.(${unique.join(",")})`, select: "id,name,elo" });
  const rows = await supabase(`players?${q.toString()}`);
  return new Map((rows || []).map(r => [Number(r.id), r]));
}

async function serializeGame(row, playerId) {
  const people = await fetchPlayers([row.white_player_id, row.black_player_id]);
  const mineWhite = Number(row.white_player_id) === Number(playerId);
  const opponentId = mineWhite ? row.black_player_id : row.white_player_id;
  const opponent = people.get(Number(opponentId));
  return {
    id: Number(row.id),
    room_code: row.room_code,
    player_color: mineWhite ? "w" : "b",
    opponent_name: opponent?.name || (row.status === "waiting" ? "En attente" : "Adversaire"),
    opponent_elo: opponent ? Number(opponent.elo) : null,
    fen: row.fen,
    moves: Array.isArray(row.moves) ? row.moves : [],
    turn: row.turn,
    status: row.status,
    result: row.result,
    reason: row.reason,
    deadline_at: row.deadline_at,
    version: Number(row.version) || 0,
    created_at: row.created_at,
    updated_at: row.updated_at,
    finished_at: row.finished_at,
  };
}

async function getGameRow(id) {
  const q = new URLSearchParams({ id: `eq.${Number(id)}`, select: "*", limit: "1" });
  const rows = await supabase(`correspondence_games?${q.toString()}`);
  return rows?.[0] || null;
}

function isParticipant(row, playerId) {
  return Number(row.white_player_id) === Number(playerId) || Number(row.black_player_id) === Number(playerId);
}

async function insertHistory(row) {
  if (!row || row.status !== "completed" || !row.black_player_id) return;
  const existingQ = new URLSearchParams({ correspondence_game_id: `eq.${row.id}`, select: "player_id", limit: "2" });
  const existing = await supabase(`games?${existingQ.toString()}`);
  if ((existing || []).length >= 2) return;
  const people = await fetchPlayers([row.white_player_id, row.black_player_id]);
  const white = people.get(Number(row.white_player_id));
  const black = people.get(Number(row.black_player_id));
  if (!white || !black) return;
  const whiteResult = row.result === "draw" ? "draw" : row.result === "white" ? "win" : "loss";
  const blackResult = row.result === "draw" ? "draw" : row.result === "black" ? "win" : "loss";
  const payload = [
    {
      player_id: Number(white.id), mode: "correspondence", opponent_name: black.name,
      opponent_elo: Number(black.elo), player_color: "w", result: whiteResult,
      reason: row.reason || "", time_control: "3 jours", rated: false,
      elo_before: Number(white.elo), elo_after: Number(white.elo), elo_delta: 0,
      correspondence_game_id: Number(row.id),
    },
    {
      player_id: Number(black.id), mode: "correspondence", opponent_name: white.name,
      opponent_elo: Number(white.elo), player_color: "b", result: blackResult,
      reason: row.reason || "", time_control: "3 jours", rated: false,
      elo_before: Number(black.elo), elo_after: Number(black.elo), elo_delta: 0,
      correspondence_game_id: Number(row.id),
    },
  ];
  try {
    await supabase("games", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(payload) });
  } catch (err) {
    // A concurrent request may already have inserted the unique history rows.
    if (err.status !== 409) console.error("correspondence history:", err);
  }
}

async function expireIfNeeded(row) {
  if (!row || row.status !== "active" || !row.deadline_at) return row;
  if (new Date(row.deadline_at).getTime() > Date.now()) return row;
  const now = new Date().toISOString();
  const winner = row.turn === "w" ? "black" : "white";
  const q = new URLSearchParams({ id: `eq.${row.id}`, version: `eq.${row.version}`, status: "eq.active" });
  const rows = await supabase(`correspondence_games?${q.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status: "completed", result: winner, reason: "timeout", deadline_at: null, finished_at: now, updated_at: now, version: Number(row.version) + 1 }),
  });
  const updated = rows?.[0] || await getGameRow(row.id);
  if (updated?.status === "completed") await insertHistory(updated);
  return updated;
}

async function createGame(player) {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = code6();
    try {
      const rows = await supabase("correspondence_games", {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({ room_code: code, white_player_id: Number(player.id), fen: START_FEN, moves: [], turn: "w", status: "waiting", version: 0 }),
      });
      return rows?.[0];
    } catch (err) {
      if (err.status !== 409) throw err;
    }
  }
  throw new Error("Impossible de générer un code de partie.");
}

async function joinGame(player, code) {
  const q = new URLSearchParams({ room_code: `eq.${code}`, select: "*", limit: "1" });
  const rows = await supabase(`correspondence_games?${q.toString()}`);
  let row = rows?.[0];
  if (!row) { const e = new Error("Code introuvable."); e.status = 404; throw e; }
  row = await expireIfNeeded(row);
  if (Number(row.white_player_id) === Number(player.id)) return row;
  if (row.black_player_id && Number(row.black_player_id) !== Number(player.id)) { const e = new Error("Cette partie a déjà un adversaire."); e.status = 409; throw e; }
  if (row.status === "completed") { const e = new Error("Cette partie est terminée."); e.status = 409; throw e; }
  if (!row.black_player_id) {
    const now = new Date().toISOString();
    const patchQ = new URLSearchParams({ id: `eq.${row.id}`, black_player_id: "is.null", status: "eq.waiting" });
    const updated = await supabase(`correspondence_games?${patchQ.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ black_player_id: Number(player.id), status: "active", deadline_at: deadlineFromNow(), updated_at: now, version: Number(row.version) + 1 }),
    });
    if (!updated?.[0]) { const e = new Error("La partie vient d’être rejointe par quelqu’un d’autre."); e.status = 409; throw e; }
    row = updated[0];
  }
  return row;
}

async function moveGame(player, body) {
  const id = Number(body.id);
  const from = cleanSquare(body.from), to = cleanSquare(body.to);
  const expectedVersion = Number(body.version);
  if (!id || !from || !to || !Number.isInteger(expectedVersion)) { const e = new Error("Coup invalide."); e.status = 400; throw e; }
  let row = await getGameRow(id);
  if (!row || !isParticipant(row, player.id)) { const e = new Error("Partie introuvable."); e.status = 404; throw e; }
  row = await expireIfNeeded(row);
  if (row.status !== "active") { const e = new Error("Cette partie n’est plus active."); e.status = 409; throw e; }
  if (Number(row.version) !== expectedVersion) { const e = new Error("La position a changé. Actualisation nécessaire."); e.status = 409; throw e; }
  const playerColor = Number(row.white_player_id) === Number(player.id) ? "w" : "b";
  if (row.turn !== playerColor) { const e = new Error("Ce n’est pas ton tour."); e.status = 409; throw e; }
  const chess = new Chess(row.fen || START_FEN);
  const move = chess.move({ from, to, promotion: "q" });
  if (!move) { const e = new Error("Coup illégal."); e.status = 400; throw e; }
  const now = new Date().toISOString();
  let status = "active", result = null, reason = null, deadline = deadlineFromNow(), finished = null;
  if (chess.isCheckmate()) {
    status = "completed"; result = move.color === "w" ? "white" : "black"; reason = "checkmate"; deadline = null; finished = now;
  } else if (chess.isDraw()) {
    status = "completed"; result = "draw"; reason = "draw"; deadline = null; finished = now;
  }
  const moves = Array.isArray(row.moves) ? [...row.moves] : [];
  moves.push({ from: move.from, to: move.to, promotion: move.promotion || "q", san: move.san, color: move.color, captured: move.captured || null, at: now });
  const patchQ = new URLSearchParams({ id: `eq.${row.id}`, version: `eq.${expectedVersion}`, status: "eq.active" });
  const updated = await supabase(`correspondence_games?${patchQ.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ fen: chess.fen(), moves, turn: chess.turn(), status, result, reason, deadline_at: deadline, finished_at: finished, updated_at: now, version: expectedVersion + 1 }),
  });
  if (!updated?.[0]) { const e = new Error("La position a changé. Actualisation nécessaire."); e.status = 409; throw e; }
  if (updated[0].status === "completed") await insertHistory(updated[0]);
  return updated[0];
}

export default async function handler(req) {
  try {
    const player = await authenticatedPlayer(req);
    if (!player) return json({ error: "Connexion requise pour les parties différées." }, 401);

    if (req.method === "GET") {
      const url = new URL(req.url);
      const id = Number(url.searchParams.get("id"));
      if (id) {
        let row = await getGameRow(id);
        if (!row || !isParticipant(row, player.id)) return json({ error: "Partie introuvable." }, 404);
        row = await expireIfNeeded(row);
        return json({ game: await serializeGame(row, player.id) });
      }
      const q = new URLSearchParams({
        or: `(white_player_id.eq.${player.id},black_player_id.eq.${player.id})`,
        status: "in.(waiting,active)", select: "*", order: "updated_at.desc", limit: "50",
      });
      const rows = await supabase(`correspondence_games?${q.toString()}`);
      const normalized = [];
      for (const raw of rows || []) normalized.push(await expireIfNeeded(raw));
      const active = normalized.filter(r => r && r.status !== "completed");
      const games = [];
      for (const row of active) games.push(await serializeGame(row, player.id));
      return json({ games });
    }

    if (req.method !== "POST") return json({ error: "Méthode non autorisée." }, 405);
    const body = await parseJSON(req);
    const action = String(body.action || "");
    if (action === "create") {
      const row = await createGame(player);
      return json({ game: await serializeGame(row, player.id) });
    }
    if (action === "join") {
      const code = cleanCode(body.code);
      if (code.length !== 6) return json({ error: "Code invalide." }, 400);
      const row = await joinGame(player, code);
      return json({ game: await serializeGame(row, player.id) });
    }
    if (action === "move") {
      const row = await moveGame(player, body);
      return json({ game: await serializeGame(row, player.id) });
    }
    return json({ error: "Action inconnue." }, 400);
  } catch (error) {
    console.error("correspondence:", error);
    const status = Number(error.status) || 500;
    return json({ error: status >= 500 ? "Erreur de partie différée." : error.message }, status);
  }
}

export const config = { path: "/api/correspondence" };
