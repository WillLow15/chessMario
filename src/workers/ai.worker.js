import { Chess } from 'chess.js-legacy';

const AI_VALUES={p:100,n:320,b:330,r:500,q:900,k:20000};

function evaluate(chess,aiColor){
  if(chess.in_checkmate())return chess.turn()===aiColor?-100000:100000;
  if(chess.in_draw())return 0;
  let score=0;
  const board=chess.board();
  for(let r=0;r<8;r++){
    for(let c=0;c<8;c++){
      const p=board[r][c];
      if(!p)continue;
      let v=AI_VALUES[p.type]||0;
      const center=(3.5-Math.abs(3.5-c))+(3.5-Math.abs(3.5-r));
      if(p.type==='n'||p.type==='b'||p.type==='q')v+=center*3;
      score+=(p.color===aiColor?v:-v);
    }
  }
  return score;
}

function orderedMoves(chess){
  return chess.moves({verbose:true}).sort((a,b)=>{
    const av=(a.captured?AI_VALUES[a.captured]:0)+(a.promotion?800:0);
    const bv=(b.captured?AI_VALUES[b.captured]:0)+(b.promotion?800:0);
    return bv-av;
  });
}

function search(chess,depth,alpha,beta,aiColor){
  if(depth<=0||chess.game_over())return evaluate(chess,aiColor);
  const maximizing=chess.turn()===aiColor;
  let moves=orderedMoves(chess);
  if(moves.length>24)moves=moves.slice(0,24);
  if(maximizing){
    let best=-Infinity;
    for(const m of moves){
      chess.move({from:m.from,to:m.to,promotion:m.promotion||'q'});
      const val=search(chess,depth-1,alpha,beta,aiColor);
      chess.undo();
      best=Math.max(best,val); alpha=Math.max(alpha,val);
      if(beta<=alpha)break;
    }
    return best;
  }
  let best=Infinity;
  for(const m of moves){
    chess.move({from:m.from,to:m.to,promotion:m.promotion||'q'});
    const val=search(chess,depth-1,alpha,beta,aiColor);
    chess.undo();
    best=Math.min(best,val); beta=Math.min(beta,val);
    if(beta<=alpha)break;
  }
  return best;
}

function pick(fen,level){
  const chess=new Chess(fen);
  const moves=chess.moves({verbose:true});
  if(!moves.length)return null;
  if(level==='easy')return moves[Math.floor(Math.random()*moves.length)];
  if(level==='medium'){
    let best=-Infinity,bestMoves=[];
    for(const m of moves){
      let score=(m.captured?(AI_VALUES[m.captured]||0):0)-(AI_VALUES[m.piece]||0)*.08;
      if(m.promotion)score+=750;
      chess.move({from:m.from,to:m.to,promotion:m.promotion||'q'});
      if(chess.in_check())score+=55;
      score+=evaluate(chess,m.color)*.015;
      chess.undo();
      score+=Math.random()*25;
      if(score>best+1){best=score;bestMoves=[m]}
      else if(Math.abs(score-best)<=1)bestMoves.push(m);
    }
    return bestMoves[Math.floor(Math.random()*bestMoves.length)];
  }
  const aiColor=chess.turn();
  let best=-Infinity,bestMove=moves[0];
  for(const m of orderedMoves(chess)){
    chess.move({from:m.from,to:m.to,promotion:m.promotion||'q'});
    const value=search(chess,2,-Infinity,Infinity,aiColor);
    chess.undo();
    if(value>best){best=value;bestMove=m}
  }
  return bestMove;
}

self.addEventListener('message',event=>{
  const {id,fen,level}=event.data||{};
  try{
    const move=pick(fen,level);
    self.postMessage({id,move:move?{from:move.from,to:move.to,promotion:move.promotion||'q'}:null});
  }catch(error){
    self.postMessage({id,error:error?.message||'AI error'});
  }
});
