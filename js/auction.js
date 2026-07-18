const REFRESH_MS = 1800000;
const NPCS = [
  { id: 1, name: "Grufford", maxPct: 1.4, aggro: 0.75 },
  { id: 2, name: "Mildred", maxPct: 0.8, aggro: 0.5 },
  { id: 3, name: "Quentin", maxPct: 1.6, aggro: 0.55 }
];

function getNpc(id) { return NPCS.find(n => n.id === id); }

class Auction {
  constructor(state) {
    this.state = state;
    this.items = {};
    this.deadline = Date.now() + REFRESH_MS;
    this.history = [];
    this.sold = [];
  }

  needsRefresh() {
    return Object.keys(this.items).length === 0 || Date.now() >= this.deadline;
  }

  generate() {
    this.items = {};
    this.deadline = Date.now() + REFRESH_MS;
    this.sold = [];
    const picked = [...ITEMS].sort(() => Math.random() - 0.5).slice(0, 5);
    picked.forEach(item => {
      this.items[item.id] = {
        playerBid: item.bid,
        npcBid: item.bid,
        npcId: null,
        npcRounds: 0
      };
    });
  }

  getItems() { return Object.keys(this.items).map(Number); }
  
  getInfo(itemId) { return this.items[itemId]; }

  bid(itemId, amount) {
    if (!this.items[itemId] || amount <= this.items[itemId].playerBid) return false;
    this.items[itemId].playerBid = amount;

    NPCS.forEach(npc => {
      const info = this.items[itemId];
      if (info.npcId === npc.id && info.npcBid >= amount) return;
      const maxAmt = getItem(itemId).bid * npc.maxPct;
      if (amount >= maxAmt) return;

      if (Math.random() < npc.aggro) {
        const inc = Math.floor(amount * (0.1 + Math.random() * 0.12));
        const newBid = amount + inc;
        if (newBid <= maxAmt) {
          info.npcBid = newBid;
          info.npcId = npc.id;
          info.npcRounds = (info.npcRounds || 0) + 1;
        }
      }
    });
    return true;
  }

  winner(itemId) {
    const info = this.items[itemId];
    if (info.npcId && info.npcBid > info.playerBid) return info.npcId;
    return "player";
  }

  finalize(itemId) {
    const info = this.items[itemId];
    const w = this.winner(itemId);
    const price = w === "player" ? info.playerBid : info.npcBid;
    const result = { itemId, winner: w, winnerName: w === "player" ? "You" : getNpc(w).name, price, ts: Date.now() };
    
    this.sold.push(itemId);
    this.history.unshift(result);
    if (this.history.length > 10) this.history.pop();

    if (w === "player") {
      this.state.coins -= price;
      this.state.inventory.push(itemId);
      this.state.won++;
      this.state.items++;
      this.state.wToday = (this.state.wToday || 0) + 1;
      this.state.wWeek = (this.state.wWeek || 0) + 1;
      this.state.sToday = (this.state.sToday || 0) + price;
    }
    saveGame(this.state);
    return result;
  }
}
