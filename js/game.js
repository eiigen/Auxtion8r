class Game {
  constructor() {
    this.state = getSave();
    this.auction = null;
    this.currentScreen = "menu";
    this.selectedItem = null;
    this.init();
  }

  init() {
    if (!this.state) {
      document.addEventListener("click", e => {
        if (e.target.dataset.action === "newgame") {
          this.state = newGame();
          this.auction = new Auction(this.state);
          this.auction.generate();
          this.render();
        }
      });
      return;
    }
    
    const result = addPassive(this.state);
    this.state = result.state;
    saveGame(this.state);
    
    if (isDaily(this.state)) this.state = resetDaily(this.state);
    if (isWeekly(this.state)) this.state = resetWeekly(this.state);
    
    this.auction = new Auction(this.state);
    if (this.auction.needsRefresh()) this.auction.generate();
    
    document.addEventListener("click", e => {
      const action = e.target.dataset.action;
      const screen = e.target.dataset.screen;
      const bid = e.target.dataset.bid;
      const amount = e.target.dataset.amount;
      const claim = e.target.dataset.claim;
      const type = e.target.dataset.type;
      const tab = e.target.dataset.tab;

      if (action === "newgame") { this.state = newGame(); this.auction = new Auction(this.state); this.auction.generate(); }
      if (screen) this.currentScreen = screen;
      if (bid) { this.selectedItem = Number(bid); this.currentScreen = "bidding"; }
      if (amount) {
        const amt = Number(amount);
        if (this.state.coins >= amt) {
          this.auction.bid(this.selectedItem, amt);
          this.state.aToday = (this.state.aToday || 0) + 1;
          this.state.bWeek = (this.state.bWeek || 0) + 1;
          saveGame(this.state);
        }
      }
      if (claim) {
        if (type === "daily") this.state = claimDaily(claim, this.state);
        else if (type === "weekly") this.state = claimWeekly(claim, this.state);
        else if (type === "perm") this.state = claimPerm(claim, this.state);
      }
      if (tab) {
        this.currentScreen = "tasks";
        this._activeTab = tab;
      }
      this.render();
    });

    this.render();
  }

  getTab() { return this._activeTab || "daily"; }

  esc(s) { return String(s).replace(/'/g, "&#39;").replace(/"/g, "&quot;") }

  render() {
    const root = document.getElementById("app");
    const menu = `<div class="screen menu-screen"><div class="menu-box"><h1 class="title">AUXTION8R</h1><p class="sub">Pixel-Art Auction Game</p><div class="menu-btns"><button class="btn btn-primary" data-action="newgame">New Game</button><button class="btn btn-ghost" data-screen="collection">Collection</button></div></div></div>`;

    if (!this.state) { root.innerHTML = menu; return; }

    const s = this.state;
    const inc = calcIncome(s);
    const coins = `<div class="coins">🪙 ${s.coins.toLocaleString()}</div>`;
    const income = `<div class="inc">+${inc}/min</div>`;
    const tl = Math.max(0, this.auction.deadline - Date.now());
    const timer = `<div class="timer">Refresh: ${Math.floor(tl/60000)}:${String(Math.floor((tl%60000)/1000)).padStart(2,"0")}</div>`;

    const nav = `
      <div class="nav">
        <button class="nav-btn ${this.currentScreen === "dashboard" ? "active" : ""}" data-screen="dashboard">Home</button>
        <button class="nav-btn ${this.currentScreen === "auction" ? "active" : ""}" data-screen="auction">Auction</button>
        <button class="nav-btn ${this.currentScreen === "collection" ? "active" : ""}" data-screen="collection">Items</button>
        <button class="nav-btn ${this.currentScreen === "tasks" ? "active" : ""}" data-screen="tasks">Tasks</button>
        <button class="nav-btn ${this.currentScreen === "gallery" ? "active" : ""}" data-screen="gallery">Gallery</button>
      </div>`;

    const topbar = `<div class="topbar">${coins}${this.currentScreen === "auction" ? timer : income}</div>`;

    if (this.currentScreen === "menu") { root.innerHTML = menu; }
    else if (this.currentScreen === "dashboard") {
      const daily = getDaily(s);
      const weekly = getWeekly(s);
      root.innerHTML = `<div class="screen">${topbar}<div class="grid"><div class="card"><h3>Stats</h3><div class="row"><span>Items:</span><span>${s.inventory.length}</span></div><div class="row"><span>Won:</span><span>${s.won}</span></div><div class="row"><span>Earned:</span><span>${s.earned.toLocaleString()}</span></div></div><div class="card"><h3>Daily</h3>${daily.slice(0,2).map(t=>`<div class="row ${t.done?"done":""}"><span>${this.esc(t.name)}</span><span>${t.reward}🪙</span></div>`).join("")}</div><div class="card"><h3>Weekly</h3>${weekly.slice(0,2).map(t=>`<div class="row ${t.done?"done":""}"><span>${this.esc(t.name)}</span><span>${t.reward}🪙</span></div>`).join("")}</div></div>${nav}</div>`;
    }
    else if (this.currentScreen === "auction") {
      const items = this.auction.getItems().map(id => {
        const item = getItem(id);
        const info = this.auction.getInfo(id);
        const rc = RARITY[item.rarity];
        const sold = this.auction.sold.includes(id);
        return `<div class="a-card ${sold?"sold":""}"><div class="sprite" style="background:${rc.color}"></div><div class="info"><div class="iname">${this.esc(item.name)}</div><div class="rarity" style="color:${rc.color}">${rc.label}</div><div class="inc">+${item.income}/min</div></div><div class="bidinfo"><div class="cbid">Bid: ${info.playerBid}🪙</div>${info.npcId?`<div class="npcbid">${getNpc(info.npcId).name}: ${info.npcBid}🪙</div>`:""}</div>${sold?`<div class="soldtag">SOLD</div>`:`<button class="btn bidbtn" data-bid="${item.id}">Bid</button>`}</div>`;
      }).join("");
      root.innerHTML = `<div class="screen">${topbar}<h2 class="sec-title">Auction House</h2><div class="auction-grid">${items}</div>${nav}</div>`;
    }
    else if (this.currentScreen === "bidding") {
      if (!this.selectedItem) return this.currentScreen = "auction", this.render();
      const item = getItem(this.selectedItem);
      const info = this.auction.getInfo(this.selectedItem);
      const rc = RARITY[item.rarity];
      const minB = Math.max(info.playerBid, info.npcBid) + Math.floor(Math.max(info.playerBid, info.npcBid) * 0.1);
      const minB2 = minB + Math.floor(minB * 0.15);
      root.innerHTML = `<div class="screen bidding-screen"><div class="topbar"><button class="btn backbtn" data-screen="auction">← Back</button>${coins}</div><div class="bid-container"><div class="showcase"><div class="bigsprite" style="background:${rc.color}"></div><h2>${this.esc(item.name)}</h2><div class="rtag" style="color:${rc.color}">${rc.label}</div><div class="itag">+${item.income}/min</div></div><div class="bidpanel"><div class="cbid-display"><div class="blabel">Current Bid</div><div class="bamount">${info.playerBid}🪙</div></div><div class="npcstatus">${info.npcId?`<div class="npcind"><span>${getNpc(info.npcId).name}</span><span>${info.npcBid}🪙</span></div>`:'<div class="npcind idle">No NPC bidding</div>'}</div><div class="bidctrls"><button class="btn bidaction" data-amount="${minB}">Bid ${minB}🪙</button><button class="btn bidaction" data-amount="${minB2}">Bid ${minB2}🪙</button><button class="btn passbtn" data-screen="auction">Pass</button></div></div></div></div>`;
    }
    else if (this.currentScreen === "collection") {
      const owned = [...new Set(this.state.inventory)];
      const inc2 = calcIncome(s);
      const top = `<div class="topbar"><div class="coins">🪙 ${s.coins.toLocaleString()}</div><div class="inc">+${inc2}/min</div></div>`;
      const grid = ITEMS.map(item => {
        const cnt = s.inventory.filter(id => id === item.id).length;
        const rc = RARITY[item.rarity];
        return `<div class="coll-slot ${cnt>0?"owned":"empty"}" style="border-color:${cnt>0?rc.color:"#333"}"><div class="ssprite" style="background:${cnt>0?rc.color:"#222"}"></div><div class="sname">${cnt>0?this.esc(item.name):"???"}</div>${cnt>1?`<div class="scount">x${cnt}</div>`:""}</div>`;
      }).join("");
      root.innerHTML = `<div class="screen">${top}<h2 class="sec-title">Collection (${owned.length}/50)</h2><div class="coll-grid">${grid}</div>${nav}</div>`;
    }
    else if (this.currentScreen === "tasks") {
      const tab = this.getTab();
      const list = tab === "daily" ? getDaily(s) : tab === "weekly" ? getWeekly(s) : getPerm(s);
      const tabs = `<div class="tabs"><button class="tab ${tab==="daily"?"active":""}" data-tab="daily">Daily</button><button class="tab ${tab==="weekly"?"active":""}" data-tab="weekly">Weekly</button><button class="tab ${tab==="perm"?"active":""}" data-tab="perm">Permanent</button></div>`;
      const tlist = list.map(t => `<div class="taskitem ${t.done?"done":""} ${t.claimed?"claimed":""}"><div class="tinfo"><div class="tname">${this.esc(t.name)}</div><div class="tdesc">${t.desc||""}</div></div><div class="treward">${t.reward}🪙</div>${t.claimed?'<div class="claimedtag">CLAIMED</div>':t.done?`<button class="btn claimbtn" data-claim="${t.id}" data-type="${tab}">Claim</button>`:'<div class="pendtag">Pending</div>'}</div>`).join("");
      root.innerHTML = `<div class="screen">${topbar}<h2 class="sec-title">Task Board</h2>${tabs}<div class="tasklist">${tlist}</div>${nav}</div>`;
    }
    else if (this.currentScreen === "gallery") {
      const grid = ITEMS.map(item => {
        const owned = s.inventory.includes(item.id);
        const rc = RARITY[item.rarity];
        return `<div class="gall-item ${owned?"owned":"locked"}"><div class="gsprite" style="background:${owned?rc.color:"#333"}"></div><div class="gname">${owned?this.esc(item.name):"???"}</div><div class="grarity" style="color:${rc.color}">${rc.label}</div></div>`;
      }).join("");
      root.innerHTML = `<div class="screen">${topbar}<h2 class="sec-title">Item Gallery</h2><div class="gall-grid">${grid}</div>${nav}</div>`;
    } else {
      root.innerHTML = menu;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => { window.game = new Game(); });
