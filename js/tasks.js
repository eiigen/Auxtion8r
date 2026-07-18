const DAILY = [
  { id: "d1", name: "Place 3 Bids", reward: 80, check: s => (s.aToday||0) >= 3 },
  { id: "d2", name: "Win 1 Auction", reward: 120, check: s => (s.wToday||0) >= 1 },
  { id: "d3", name: "Spend 100", reward: 150, check: s => (s.sToday||0) >= 100 }
];
const WEEKLY = [
  { id: "w1", name: "Win 5", reward: 500, check: s => (s.wWeek||0) >= 5 },
  { id: "w2", name: "Own 10", reward: 300, check: s => s.items >= 10 },
  { id: "w3", name: "Own 3 Rare+", reward: 600, check: s => s.inventory.filter(id=>{const i=getItem(id);return i&&["rare","epic","legendary"].includes(i.rarity)}).length >= 3 },
  { id: "w4", name: "Have 500 coins", reward: 400, check: s => s.coins >= 500 },
  { id: "w5", name: "Place 15 Bids", reward: 350, check: s => (s.bWeek||0) >= 15 }
];
const PERM = [
  { id: "p1", name: "First Win", reward: 100, check: s => s.won >= 1 },
  { id: "p2", name: "10 Unique", reward: 500, check: s => new Set(s.inventory).size >= 10 },
  { id: "p3", name: "25 Unique", reward: 1000, check: s => new Set(s.inventory).size >= 25 },
  { id: "p4", name: "5 Rare+", reward: 2000, check: s => s.inventory.filter(id=>{const i=getItem(id);return i&&["rare","epic","legendary"].includes(i.rarity)}).length >= 5 },
  { id: "p5", name: "Own Legendary", reward: 5000, check: s => s.inventory.some(id=>getItem(id)?.rarity==="legendary") }
];

function getDaily(s){return DAILY.map(t=>({...t,done:t.check(s),claimed:s.daily.done.includes(t.id)}))}
function getWeekly(s){return WEEKLY.map(t=>({...t,done:t.check(s),claimed:s.weekly.done.includes(t.id)}))}
function getPerm(s){return PERM.map(t=>({...t,done:t.check(s),claimed:s.perm.done.includes(t.id)}))}
function claimDaily(id,s){const t=DAILY.find(x=>x.id===id);if(t&&t.check(s)&&!s.daily.done.includes(id)){s.daily.done.push(id);s.coins+=t.reward;s.earned+=t.reward;return saveGame(s)}return s}
function claimWeekly(id,s){const t=WEEKLY.find(x=>x.id===id);if(t&&t.check(s)&&!s.weekly.done.includes(id)){s.weekly.done.push(id);s.coins+=t.reward;s.earned+=t.reward;return saveGame(s)}return s}
function claimPerm(id,s){const t=PERM.find(x=>x.id===id);if(t&&t.check(s)&&!s.perm.done.includes(id)){s.perm.done.push(id);s.coins+=t.reward;s.earned+=t.reward;return saveGame(s)}return s}
