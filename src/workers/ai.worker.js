import { chooseAIMove } from '../game/ai-engine.js';

self.addEventListener('message',event=>{
  const {id,fen,level}=event.data||{};
  try{
    const move=chooseAIMove(fen,level);
    self.postMessage({id,move});
  }catch(error){
    self.postMessage({id,error:error?.message||'AI error'});
  }
});
