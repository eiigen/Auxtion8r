var REFRESH_MS=1800000;
var NPCS=[{id:1,name:"Grufford",maxPct:1.4,aggro:0.75},{id:2,name:"Mildred",maxPct:0.8,aggro:0.5},{id:3,name:"Quentin",maxPct:1.6,aggro:0.55}];
function getNpc(id){return NPCS.find(function(n){return n.id===id})}

function Auction(state){
  this.state=state;
  this.items={};
  this.deadline=Date.now()+REFRESH_MS;
  this.history=[];
  this.sold=[];
}

Auction.prototype.needsRefresh=function(){return Object.keys(this.items).length===0||Date.now()>=this.deadline};

Auction.prototype.generate=function(){
  this.items={};this.deadline=Date.now()+REFRESH_MS;this.sold=[];
  var picked=[].concat(ITEMS).sort(function(){return Math.random()-0.5}).slice(0,5);
  var self=this;
  picked.forEach(function(item){
    self.items[item.id]={playerBid:item.bid,npcBid:item.bid,npcId:null,npcRounds:0};
  });
};

Auction.prototype.getItems=function(){return Object.keys(this.items).map(Number)};
Auction.prototype.getInfo=function(id){return this.items[id]};

Auction.prototype.bid=function(itemId,amount){
  if(!this.items[itemId]||amount<=this.items[itemId].playerBid)return false;
  this.items[itemId].playerBid=amount;
  var self=this;
  NPCS.forEach(function(npc){
    var info=self.items[itemId];
    if(info.npcId===npc.id&&info.npcBid>=amount)return;
    var maxAmt=getItem(itemId).bid*npc.maxPct;
    if(amount>=maxAmt)return;
    if(Math.random()<npc.aggro){
      var inc=Math.floor(amount*(0.1+Math.random()*0.12));
      var newBid=amount+inc;
      if(newBid<=maxAmt){info.npcBid=newBid;info.npcId=npc.id;info.npcRounds=(info.npcRounds||0)+1;}
    }
  });
  return true;
};

Auction.prototype.winner=function(itemId){
  var info=this.items[itemId];
  if(info.npcId&&info.npcBid>info.playerBid)return info.npcId;
  return "player";
};

Auction.prototype.finalize=function(itemId){
  var info=this.items[itemId];
  var w=this.winner(itemId);
  var price=w==="player"?info.playerBid:info.npcBid;
  var result={itemId:itemId,winner:w,winnerName:w==="player"?"You":getNpc(w).name,price:price,ts:Date.now()};
  this.sold.push(itemId);
  this.history.unshift(result);
  if(this.history.length>10)this.history.pop();
  if(w==="player"){
    this.state.coins-=price;this.state.inventory.push(itemId);this.state.won++;
    this.state.items++;this.state.wToday=(this.state.wToday||0)+1;
    this.state.wWeek=(this.state.wWeek||0)+1;this.state.sToday=(this.state.sToday||0)+price;
  }
  saveGame(this.state);
  return result;
};