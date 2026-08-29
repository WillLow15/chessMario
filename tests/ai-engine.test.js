import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js-legacy';
import { chooseAIMove } from '../src/game/ai-engine.js';

const deterministicOptions={random:()=>0,timeLimitMs:5_000};

function applyChoice(fen,level,options=deterministicOptions){
  const chess=new Chess(fen);
  const move=chooseAIMove(fen,level,options);
  assert.ok(move,`${level} doit proposer un coup`);
  const played=chess.move(move);
  assert.ok(played,`${level} doit proposer un coup légal`);
  return {chess,move,played};
}

test('les trois niveaux saisissent un mat en un',()=>{
  const fen='7k/5Q2/6K1/8/8/8/8/8 w - - 0 1';
  for(const level of ['easy','medium','hard']){
    const {chess}=applyChoice(fen,level);
    assert.equal(chess.in_checkmate(),true,`${level} doit conclure immédiatement`);
  }
});

test('le niveau facile reste varié mais ne joue plus de coup illégal',()=>{
  const fen=new Chess().fen();
  const first=applyChoice(fen,'easy',{random:()=>0}).move;
  const last=applyChoice(fen,'easy',{random:()=>0.999_999}).move;
  assert.notDeepEqual(first,last,'le niveau facile doit conserver de la variété');
});

test('les niveaux normal et difficile capturent une dame offerte',()=>{
  const fen='4k3/8/8/8/3q4/8/3R4/4K3 w - - 0 1';
  for(const level of ['medium','hard']){
    const {played}=applyChoice(fen,level);
    assert.equal(played.captured,'q',`${level} doit gagner la dame`);
  }
});

test('le niveau difficile trouve un mat forcé court',()=>{
  const fen='8/4K2k/8/8/1Q6/8/8/8 w - - 0 1';
  const {move}=applyChoice(fen,'hard',{...deterministicOptions,maxDepth:4});
  assert.deepEqual(
    {from:move.from,to:move.to},
    {from:'e7',to:'f7'},
    'le moteur doit trouver Kf7, unique premier coup du mat forcé'
  );
});
