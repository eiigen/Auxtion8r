function Game(){
  this.state=getSave();
  this.auction=null;
  this.currentScreen="menu";
  this.selectedItem=null;
  this.tab="daily";
  this.init();
}

Game.prototype.init=function(){
  var self=this;
  if(!this.state){
    document.addEventListener("click",function(e){
      if(e.target.dataset.action==="newgame"){
        self.state=newGame();
        self.auction=new Auction(self.state);
        self.auction.generate();
        self.render();
      }
    });
    this.render();
    return;
  }
  var result=addPassive(this.state);
  this.state=result.state;
  saveGame(this.state);
  if(isDaily(this.state))this.state=resetDaily(this.state);
  if(isWeekly(this.state))this.state=resetWeekly(this.state);
  this.auction=new Auction(this.state);
  if(this.auction.needsRefresh())this.auction.generate();

  document.addEventListener("click",function(e){
    var a=e.target.dataset.action,sc=e.target.dataset.screen,bid=e.target.dataset.bid,
        amt=e.target.dataset.amount,cl=e.target.dataset.claim,tp=e.target.dataset.type,tab=e.target.dataset.tab;
    if(a==="newgame"){self.state=newGame();self.auction=new Auction(self.state);self.auction.generate();}
    if(sc)self.currentScreen=sc;
    if(bid){self.selectedItem=Number(bid);self.currentScreen="bidding";}
    if(amt){var n=Number(amt);if(self.state.coins>=n){self.auction.bid(self.selectedItem,n);self.state.aToday=(self.state.aToday||0)+1;self.state.bWeek=(self.state.bWeek||0)+1;saveGame(self.state);}}
    if(cl){if(tp==="daily")self.state=claimDaily(cl,self.state);else if(tp==="weekly")self.state=claimWeekly(cl,self.state);else if(tp==="perm")self.state=claimPerm(cl,self.state);}
    if(tab){self.currentScreen="tasks";self.tab=tab;}
    self.render();
  });
  this.render();
};

Game.prototype.esc=function(s){return String(s).replace(/</g,"&lt;").replace(/>/g,"&gt;")};

Game.prototype.render=function(){
  var root=document.getElementById("app");
  if(!this.state){
    root.innerHTML='<div class="screen menu-screen"><div class="menu-box"><h1 class="title">AUXTION8R</h1><p class="sub">Pixel-Art Auction Game</p><div class="menu-btns"><button class="btn btn-primary" data-action="newgame">New Game</button><button class="btn btn-ghost" data-screen="collection">Collection</button></div></div></div>';
    return;
  }
  var s=this.state;
  var inc=calcIncome(s);
  var coins='<div class="coins">🪙 '+s.coins.toLocaleString()+'</div>';
  var income='<div class="inc">+'+inc+'/min</div>';
  var tl=Math.max(0,this.auction.deadline-Date.now());
  var timer='<div class="timer">Refresh: '+Math.floor(tl/60000)+':'+String(Math.floor((tl%60000)/1000)).padStart(2,"0")+'</div>';
  var nav='<div class="nav"><button class="nav-btn '+(this.currentScreen==="dashboard"?"active":"")+'" data-screen="dashboard">Home</button><button class="nav-btn '+(this.currentScreen==="auction"?"active":"")+'" data-screen="auction">Auction</button><button class="nav-btn '+(this.currentScreen==="collection"?"active":"")+'" data-screen="collection">Items</button><button class="nav-btn '+(this.currentScreen==="tasks"?"active":"")+'" data-screen="tasks">Tasks</button><button class="nav-btn '+(this.currentScreen==="gallery"?"active":"")+'" data-screen="gallery">Gallery</button></div>';
  var topbar='<div class="topbar">'+coins+(this.currentScreen==="auction"?timer:income)+'</div>';

  if(this.currentScreen==="menu"){
    root.innerHTML='<div class="screen menu-screen"><div class="menu-box"><h1 class="title">AUXTION8R</h1><p class="sub">Pixel-Art Auction Game</p><div class="menu-btns"><button class="btn btn-primary" data-action="newgame">New Game</button><button class="btn btn-ghost" data-screen="collection">Collection</button></div></div></div>';
  }
  else if(this.currentScreen==="dashboard"){
    var d=getDaily(s),w=getWeekly(s);
    var html='<div class="screen">'+topbar+'<div class="grid"><div class="card"><h3>Stats</h3><div class="row"><span>Items:</span><span>'+s.inventory.length+'</span></div><div class="row"><span>Won:</span><span>'+s.won+'</span></div><div class="row"><span>Earned:</span><span>'+s.earned.toLocaleString()+'</span></div></div><div class="card"><h3>Daily</h3>';
    d.slice(0,2).forEach(function(t){html+='<div class="row '+(t.done?"done":"")+'"><span>'+self.esc(t.name)+'</span><span>'+t.reward+'🪙</span></div>';});
    html+='</div><div class="card"><h3>Weekly</h3>';
    w.slice(0,2).forEach(function(t){html+='<div class="row '+(t.done?"done":"")+'"><span>'+self.esc(t.name)+'</span><span>'+t.reward+'🪙</span></div>';});
    html+='</div></div>'+nav+'</div>';
    root.innerHTML=html;
  }
  else if(this.currentScreen==="auction"){
    var items="";
    var self=this;
    this.auction.getItems().map(function(id){
      var it=getItem(id);
      var info=self.auction.getInfo(id);
      var rc=RARITY[it.rarity];
      var sold=self.auction.sold.includes(id);
      items+='<div class="a-card '+(sold?"sold":"")+'"><div class="sprite" style="background:'+rc.color+'"></div><div class="info"><div class="iname">'+self.esc(it.name)+'</div><div class="rarity" style="color:'+rc.color+'">'+rc.label+'</div><div class="inc">+'+it.income+'/min</div></div><div class="bidinfo"><div class="cbid">Bid: '+info.playerBid+'🪙</div>'+(info.npcId?'<div class="npcbid">'+getNpc(info.npcId).name+': '+info.npcBid+'🪙</div>':"")+'</div>'+(sold?'<div class="soldtag">SOLD</div>':'<button class="btn bidbtn" data-bid="'+it.id+'">Bid</button>')+'</div>';
    });
    root.innerHTML='<div class="screen">'+topbar+'<h2 class="sec-title">Auction House</h2><div class="auction-grid">'+items+'</div>'+nav+'</div>';
  }
  else if(this.currentScreen==="bidding"){
    if(!this.selectedItem){this.currentScreen="auction";this.render();return;}
    var it=getItem(this.selectedItem);
    var info=this.auction.getInfo(this.selectedItem);
    var rc=RARITY[it.rarity];
    var mB=Math.max(info.playerBid,info.npcBid)+Math.floor(Math.max(info.playerBid,info.npcBid)*0.1);
    var mB2=mB+Math.floor(mB*0.15);
    var npcInfo=info.npcId?'<div class="npcind"><span>'+getNpc(info.npcId).name+'</span><span>'+info.npcBid+'🪙</span></div>':'<div class="npcind idle">No NPC bidding</div>';
    root.innerHTML='<div class="screen bidding-screen"><div class="topbar"><button class="btn backbtn" data-screen="auction">← Back</button>'+coins+'</div><div class="bid-container"><div class="showcase"><div class="bigsprite" style="background:'+rc.color+'"></div><h2>'+this.esc(it.name)+'</h2><div class="rtag" style="color:'+rc.color+'">'+rc.label+'</div><div class="itag">+'+it.income+'/min</div></div><div class="bidpanel"><div class="cbid-display"><div class="blabel">Current Bid</div><div class="bamount">'+info.playerBid+'🪙</div></div><div class="npcstatus">'+npcInfo+'</div><div class="bidctrls"><button class="btn bidaction" data-amount="'+mB+'">Bid '+mB+'🪙</button><button class="btn bidaction" data-amount="'+mB2+'">Bid '+mB2+'🪙</button><button class="btn passbtn" data-screen="auction">Pass</button></div></div></div></div>';
  }
  else if(this.currentScreen==="collection"){
    var owned=[].concat(new Set(s.inventory));
    var inc2=calcIncome(s);
    var top='<div class="topbar"><div class="coins">🪙 '+s.coins.toLocaleString()+'</div><div class="inc">+'+inc2+'/min</div></div>';
    var grid="";
    var self=this;
    ITEMS.map(function(it){
      var cnt=s.inventory.filter(function(id){return id===it.id}).length;
      var rc=RARITY[it.rarity];
      grid+='<div class="coll-slot '+(cnt>0?"owned":"empty")+'" style="border-color:'+(cnt>0?rc.color:"#333")+'"><div class="ssprite" style="background:'+(cnt>0?rc.color:"#222")+'"></div><div class="sname">'+(cnt>0?self.esc(it.name):"???")+'</div>'+(cnt>1?'<div class="scount">x'+cnt+'</div>':"")+'</div>';
    });
    root.innerHTML='<div class="screen">'+top+'<h2 class="sec-title">Collection ('+owned.length+'/50)</h2><div class="coll-grid">'+grid+'</div>'+nav+'</div>';
  }
  else if(this.currentScreen==="tasks"){
    var list=this.tab==="daily"?getDaily(s):this.tab==="weekly"?getWeekly(s):getPerm(s);
    var tabs='<div class="tabs"><button class="tab '+(this.tab==="daily"?"active":"")+'" data-tab="daily">Daily</button><button class="tab '+(this.tab==="weekly"?"active":"")+'" data-tab="weekly">Weekly</button><button class="tab '+(this.tab==="perm"?"active":"")+'" data-tab="perm">Permanent</button></div>';
    var tlist="";
    var self=this;
    list.map(function(t){
      var status=t.claimed?"<div class="claimedtag">CLAIMED</div>":t.done?'<button class="btn claimbtn" data-claim="'+t.id+'" data-type="'+self.tab+'">Claim</button>':"<div class="pendtag">Pending</div>";
      tlist+='<div class="taskitem '+(t.done?"done":"")+' '+(t.claimed?"claimed":"")+'"><div class="tinfo"><div class="tname">'+self.esc(t.name)+'</div><div class="tdesc">'+(t.desc||"")+'</div></div><div class="treward">'+t.reward+'🪙</div>'+status+'</div>';
    });
    root.innerHTML='<div class="screen">'+topbar+'<h2 class="sec-title">Task Board</h2>'+tabs+'<div class="tasklist">'+tlist+'</div>'+nav+'</div>';
  }
  else if(this.currentScreen==="gallery"){
    var grid="";
    var self=this;
    ITEMS.map(function(it){
      var owned=s.inventory.includes(it.id);
      var rc=RARITY[it.rarity];
      grid+='<div class="gall-item '+(owned?"owned":"locked")+'"><div class="gsprite" style="background:'+(owned?rc.color:"#333")+'"></div><div class="gname">'+(owned?self.esc(it.name):"???")+'</div><div class="grarity" style="color:'+rc.color+'">'+rc.label+'</div></div>';
    });
    root.innerHTML='<div class="screen">'+topbar+'<h2 class="sec-title">Item Gallery</h2><div class="gall-grid">'+grid+'</div>'+nav+'</div>';
  }
};

document.addEventListener("DOMContentLoaded",function(){window.game=new Game()});