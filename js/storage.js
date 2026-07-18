const SAVE_KEY = "auxtion8r_save";

function getSave() {
  try {
    const d = localStorage.getItem(SAVE_KEY);
    if (!d) return null;
    const p = JSON.parse(d);
    return validateChecksum(p) ? p : null;
  } catch (e) { return null; }
}

function saveGame(state) {
  const data = { ...state, ts: Date.now() };
  localStorage.setItem(SAVE_KEY, JSON.stringify({ ...data, _cs: computeChecksum(data) }));
  return data;
}

function validateChecksum(s) {
  if (!s || !s._cs) return false;
  const copy = { ...s }; delete copy._cs;
  return s._cs === computeChecksum(copy);
}

function computeChecksum(s) {
  const salt = "aX8r_";
  let h = 0;
  for (const c of salt + JSON.stringify(s)) h = ((h << 5) - h + c.charCodeAt(0)) | 0;
  return h.toString(36);
}

function newGame() {
  return saveGame({
    coins: 100, inventory: [],
    daily: { last: Date.now(), done: [] },
    weekly: { last: Date.now(), done: [] },
    perm: { done: [] },
    lastPassive: Date.now(),
    won: 0, earned: 100, items: 0,
    aToday: 0, wToday: 0, sToday: 0,
    bWeek: 0, wWeek: 0
  });
}

function resetGame() { localStorage.removeItem(SAVE_KEY); }

function passiveIncome(state) {
  const el = (Date.now() - state.lastPassive) / 60000;
  return Math.floor(state.inventory.reduce((s, id) => s + (getItem(id)?.income || 0), 0) * el);
}

function isDaily(s) {
  const a = new Date(s.daily.last), b = new Date();
  return a.getDate() !== b.getDate() || a.getMonth() !== b.getMonth();
}

function isWeekly(s) { return Date.now() - s.weekly.last >= 604800000; }

function resetDaily(s) {
  s.daily = { last: Date.now(), done: [] };
  s.aToday = s.wToday = s.sToday = 0;
  return saveGame(s);
}

function resetWeekly(s) {
  s.weekly = { last: Date.now(), done: [] };
  s.bWeek = s.wWeek = 0;
  return saveGame(s);
}
