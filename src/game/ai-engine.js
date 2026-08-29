import { Chess } from 'chess.js-legacy';

const PIECE_VALUES=Object.freeze({p:100,n:320,b:330,r:500,q:900,k:0});
const MATE_SCORE=1_000_000;
const INFINITY=MATE_SCORE+100_000;

const LEVEL_CONFIG=Object.freeze({
  easy:Object.freeze({mode:'guided',candidateRatio:0.4,replyWeight:0.55}),
  medium:Object.freeze({mode:'search',maxDepth:3,quiescenceDepth:4,timeLimitMs:450,scoreTolerance:28,maxCandidates:3}),
  hard:Object.freeze({mode:'search',maxDepth:5,quiescenceDepth:7,timeLimitMs:1_250,scoreTolerance:0,maxCandidates:1})
});

class SearchTimeout extends Error{}

function moveKey(move){
  return `${move.from}${move.to}${move.promotion||''}`;
}

function playMove(chess,move){
  return chess.move({from:move.from,to:move.to,promotion:move.promotion||'q'});
}

function terminalScore(chess,aiColor,ply=0){
  if(chess.in_checkmate())return chess.turn()===aiColor?-MATE_SCORE+ply:MATE_SCORE-ply;
  if(chess.in_draw())return 0;
  return null;
}

function advancement(color,row){
  return color==='w'?7-row:row;
}

function positionalBonus(piece,row,column,endgame){
  const centerDistance=Math.abs(3.5-column)+Math.abs(3.5-row);
  const center=7-centerDistance;
  const advanced=advancement(piece.color,row);

  switch(piece.type){
    case 'p':
      return advanced*8+center*4+([3,4].includes(column)?12:0)+(advanced===6?22:0);
    case 'n':
      return center*10-(column===0||column===7||row===0||row===7?18:0);
    case 'b':
      return center*5+advanced*2;
    case 'r':
      return advanced*2+(advanced===6?12:0);
    case 'q':
      return center*2;
    case 'k':
      if(endgame)return center*9;
      return (column<=2||column>=6?28:0)-center*7;
    default:
      return 0;
  }
}

function evaluatePosition(chess,aiColor){
  const terminal=terminalScore(chess,aiColor);
  if(terminal!==null)return terminal;

  const board=chess.board();
  const pieces=[];
  const pawns={w:Array.from({length:8},()=>[]),b:Array.from({length:8},()=>[])};
  const bishops={w:0,b:0};
  const rooks=[];
  const kings={w:null,b:null};
  let nonPawnMaterial=0;

  for(let row=0;row<8;row++){
    for(let column=0;column<8;column++){
      const piece=board[row][column];
      if(!piece)continue;
      pieces.push({piece,row,column});
      if(piece.type==='p')pawns[piece.color][column].push(row);
      else if(piece.type!=='k')nonPawnMaterial+=PIECE_VALUES[piece.type]||0;
      if(piece.type==='b')bishops[piece.color]++;
      if(piece.type==='r')rooks.push({piece,row,column});
      if(piece.type==='k')kings[piece.color]={row,column};
    }
  }

  const endgame=nonPawnMaterial<=2_600;
  let whiteScore=0;

  for(const {piece,row,column} of pieces){
    const value=(PIECE_VALUES[piece.type]||0)+positionalBonus(piece,row,column,endgame);
    whiteScore+=piece.color==='w'?value:-value;
  }

  for(const color of ['w','b']){
    let pawnStructure=0;
    const enemy=color==='w'?'b':'w';

    for(let file=0;file<8;file++){
      const filePawns=pawns[color][file];
      if(filePawns.length>1)pawnStructure-=(filePawns.length-1)*16;

      for(const row of filePawns){
        const hasNeighbour=(file>0&&pawns[color][file-1].length>0)||(file<7&&pawns[color][file+1].length>0);
        if(!hasNeighbour)pawnStructure-=11;

        let passed=true;
        for(let enemyFile=Math.max(0,file-1);enemyFile<=Math.min(7,file+1)&&passed;enemyFile++){
          passed=!pawns[enemy][enemyFile].some(enemyRow=>color==='w'?enemyRow<row:enemyRow>row);
        }
        if(passed)pawnStructure+=18+advancement(color,row)*7;
      }
    }

    if(bishops[color]>=2)pawnStructure+=28;

    for(const rook of rooks){
      if(rook.piece.color!==color)continue;
      if(pawns[color][rook.column].length===0)pawnStructure+=10;
      if(pawns[color][rook.column].length===0&&pawns[enemy][rook.column].length===0)pawnStructure+=8;
    }

    const king=kings[color];
    if(king&&!endgame){
      const direction=color==='w'?-1:1;
      const shieldRow=king.row+direction;
      let shield=0;
      if(shieldRow>=0&&shieldRow<8){
        for(let file=Math.max(0,king.column-1);file<=Math.min(7,king.column+1);file++){
          const piece=board[shieldRow][file];
          if(piece?.type==='p'&&piece.color===color)shield++;
        }
      }
      pawnStructure+=shield*9;
    }

    whiteScore+=color==='w'?pawnStructure:-pawnStructure;
  }

  if(chess.in_check())whiteScore+=chess.turn()==='w'?-38:38;
  whiteScore+=chess.turn()==='w'?7:-7;
  return aiColor==='w'?whiteScore:-whiteScore;
}

function tacticalMoveScore(move){
  let score=0;
  if(move.san?.includes('#'))score+=900_000;
  else if(move.san?.includes('+'))score+=28_000;
  if(move.promotion)score+=(PIECE_VALUES[move.promotion]||900)*20;
  if(move.captured)score+=(PIECE_VALUES[move.captured]||0)*18-(PIECE_VALUES[move.piece]||0);
  if(move.flags?.includes('k')||move.flags?.includes('q'))score+=800;
  return score;
}

function orderedMoves(chess,context,ply,preferredMove=null,moves=null){
  const killers=context.killers.get(ply)||[];
  return [...(moves||chess.moves({verbose:true}))].sort((a,b)=>{
    const score=move=>{
      const key=moveKey(move);
      let value=tacticalMoveScore(move)+(context.history.get(key)||0);
      if(key===preferredMove)value+=2_000_000;
      const killerIndex=killers.indexOf(key);
      if(killerIndex>=0)value+=12_000-killerIndex*1_000;
      return value;
    };
    const difference=score(b)-score(a);
    return difference||moveKey(a).localeCompare(moveKey(b));
  });
}

function positionKey(chess){
  return chess.fen().split(' ').slice(0,4).join(' ');
}

function touchNode(context){
  context.nodes++;
  if((context.nodes&255)===0&&Date.now()>=context.deadline)throw new SearchTimeout();
}

function rememberCutoff(context,move,ply,depth){
  if(move.captured||move.promotion)return;
  const key=moveKey(move);
  const killers=context.killers.get(ply)||[];
  if(!killers.includes(key))context.killers.set(ply,[key,...killers].slice(0,2));
  context.history.set(key,(context.history.get(key)||0)+depth*depth);
}

function quiescence(chess,alpha,beta,aiColor,context,ply,depthLeft){
  touchNode(context);
  const terminal=terminalScore(chess,aiColor,ply);
  if(terminal!==null)return terminal;

  const maximizing=chess.turn()===aiColor;
  const inCheck=chess.in_check();
  let best=evaluatePosition(chess,aiColor);

  if(depthLeft<=0)return best;

  if(!inCheck){
    if(maximizing){
      if(best>=beta)return best;
      alpha=Math.max(alpha,best);
    }else{
      if(best<=alpha)return best;
      beta=Math.min(beta,best);
    }
  }else{
    best=maximizing?-INFINITY:INFINITY;
  }

  const legalMoves=chess.moves({verbose:true});
  const tacticalMoves=inCheck?legalMoves:legalMoves.filter(move=>move.captured||move.promotion);
  const moves=orderedMoves(chess,context,ply,null,tacticalMoves);

  for(const move of moves){
    playMove(chess,move);
    let score;
    try{
      score=quiescence(chess,alpha,beta,aiColor,context,ply+1,depthLeft-1);
    }finally{
      chess.undo();
    }

    if(maximizing){
      best=Math.max(best,score);
      alpha=Math.max(alpha,best);
    }else{
      best=Math.min(best,score);
      beta=Math.min(beta,best);
    }
    if(beta<=alpha)break;
  }

  return best;
}

function alphaBeta(chess,depth,alpha,beta,aiColor,context,ply){
  touchNode(context);
  const terminal=terminalScore(chess,aiColor,ply);
  if(terminal!==null)return terminal;
  if(depth<=0)return quiescence(chess,alpha,beta,aiColor,context,ply,context.quiescenceDepth);

  const key=positionKey(chess);
  const cached=context.table.get(key);
  const originalAlpha=alpha;
  const originalBeta=beta;

  if(cached&&cached.depth>=depth){
    if(cached.flag==='exact')return cached.score;
    if(cached.flag==='lower')alpha=Math.max(alpha,cached.score);
    else if(cached.flag==='upper')beta=Math.min(beta,cached.score);
    if(alpha>=beta)return cached.score;
  }

  const maximizing=chess.turn()===aiColor;
  const moves=orderedMoves(chess,context,ply,cached?.move||null);
  let best=maximizing?-INFINITY:INFINITY;
  let bestMove=null;

  for(const move of moves){
    playMove(chess,move);
    let score;
    try{
      score=alphaBeta(chess,depth-1,alpha,beta,aiColor,context,ply+1);
    }finally{
      chess.undo();
    }

    if(maximizing){
      if(score>best){best=score;bestMove=move;}
      alpha=Math.max(alpha,best);
    }else{
      if(score<best){best=score;bestMove=move;}
      beta=Math.min(beta,best);
    }

    if(beta<=alpha){
      rememberCutoff(context,move,ply,depth);
      break;
    }
  }

  let flag='exact';
  if(best<=originalAlpha)flag='upper';
  else if(best>=originalBeta)flag='lower';
  if(context.table.size<80_000)context.table.set(key,{depth,score:best,flag,move:bestMove?moveKey(bestMove):null});
  return best;
}

function guidedMove(chess,config,random){
  const aiColor=chess.turn();
  const candidates=[];

  for(const move of chess.moves({verbose:true})){
    playMove(chess,move);
    let score;
    try{
      if(chess.in_checkmate())return move;

      const afterMove=evaluatePosition(chess,aiColor);
      let worstReply=afterMove;
      const replies=chess.moves({verbose:true});
      for(const reply of replies){
        playMove(chess,reply);
        let replyScore;
        try{
          replyScore=evaluatePosition(chess,aiColor);
        }finally{
          chess.undo();
        }
        worstReply=Math.min(worstReply,replyScore);
      }

      score=afterMove+(worstReply-afterMove)*config.replyWeight;
      if(move.captured)score+=(PIECE_VALUES[move.captured]||0)*0.12;
      if(move.promotion)score+=80;
      if(move.san?.includes('+'))score+=18;
    }finally{
      chess.undo();
    }
    candidates.push({move,score});
  }

  candidates.sort((a,b)=>b.score-a.score||moveKey(a.move).localeCompare(moveKey(b.move)));
  const poolSize=Math.max(2,Math.ceil(candidates.length*config.candidateRatio));
  const pool=candidates.slice(0,poolSize);
  const best=pool[0].score;
  const weights=pool.map((candidate,index)=>Math.max(1,150-(best-candidate.score)-index*8));
  const total=weights.reduce((sum,value)=>sum+value,0);
  let roll=random()*total;
  for(let index=0;index<pool.length;index++){
    roll-=weights[index];
    if(roll<=0)return pool[index].move;
  }
  return pool[0].move;
}

function searchedMove(chess,config,random,options){
  const aiColor=chess.turn();
  const maxDepth=options.maxDepth??config.maxDepth;
  const timeLimitMs=options.timeLimitMs??config.timeLimitMs;
  const context={
    deadline:Date.now()+Math.max(20,timeLimitMs),
    history:new Map(),
    killers:new Map(),
    nodes:0,
    quiescenceDepth:options.quiescenceDepth??config.quiescenceDepth,
    table:new Map()
  };

  let rootMoves=orderedMoves(chess,context,0);
  let completedResults=rootMoves.map(move=>({move,score:evaluatePosition(chess,aiColor)}));

  for(let depth=1;depth<=maxDepth;depth++){
    const iteration=[];
    let alpha=-INFINITY;
    let completed=true;

    try{
      for(const move of rootMoves){
        if(Date.now()>=context.deadline)throw new SearchTimeout();
        playMove(chess,move);
        let score;
        try{
          const rootAlpha=config.scoreTolerance>0?-INFINITY:alpha;
          score=alphaBeta(chess,depth-1,rootAlpha,INFINITY,aiColor,context,1);
        }finally{
          chess.undo();
        }
        iteration.push({move,score});
        alpha=Math.max(alpha,score);
      }
    }catch(error){
      if(!(error instanceof SearchTimeout))throw error;
      completed=false;
    }

    if(!completed)break;
    // Array#sort est stable : à score égal, on conserve la préférence de
    // l'itération moins profonde au lieu de retomber sur l'ordre alphabétique.
    iteration.sort((a,b)=>b.score-a.score);
    completedResults=iteration;
    rootMoves=iteration.map(result=>result.move);
    if(iteration[0]?.score>=MATE_SCORE-depth)break;
  }

  completedResults.sort((a,b)=>b.score-a.score);
  const bestScore=completedResults[0].score;
  const nearBest=completedResults
    .filter(result=>result.score>=bestScore-config.scoreTolerance)
    .slice(0,config.maxCandidates);
  return nearBest[Math.floor(random()*nearBest.length)]?.move||completedResults[0].move;
}

export function chooseAIMove(fen,level='medium',options={}){
  const chess=new Chess(fen);
  const legalMoves=chess.moves({verbose:true});
  if(!legalMoves.length)return null;

  const config=LEVEL_CONFIG[level]||LEVEL_CONFIG.medium;
  const random=typeof options.random==='function'?options.random:Math.random;
  const move=config.mode==='guided'
    ? guidedMove(chess,config,random)
    : searchedMove(chess,config,random,options);

  return move?{from:move.from,to:move.to,promotion:move.promotion||'q'}:null;
}

export const AI_LEVEL_CONFIG=LEVEL_CONFIG;
