var SAVE_KEY = "auxtion8r_save";

function getSave() {
  try {
    var d = localStorage.getItem(SAVE_KEY);
    if (!d) return null;
    var p = JSON.parse(d);
    return validateChecksum(p) ? p : null;
  } catch (e) { return null; }
}

function saveGame(state) {
  var data = Object.assign({}, state, { ts: Date.now() });
  localStorage.setItem(SAVE_KEY, JSON.stringify(Object.assign({}, data, { _cs: computeChecksum(data) })));
  return data;
}

function validateChecksum(s) {
  if (!s || !s._cs) return false;
  var copy = Object.assign({}, s); delete copy._cs;
  return s._cs === computeChecksum(copy);
}

function computeChecksum(s) {
  var salt = "aX8r_";
  var h = 0;
  for (var i = 0; i < (salt + JSON.stringify(s)).length; i++) {
    h = ((h << 5) - h + (salt + JSON.stringify(s)).charCodeAt(i)) | 0;
  }
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
  var el = (Date.now() - state.lastPassive) / 60000;
  return Math.floor(state.inventory.reduce(function(s, id) { return s + (getItem(id) ? getItem(id).income : 0); }, 0) * el);
}

function isDaily(state) {
  var a = new Date(state.daily.last), b = new Date();
  return a.getDate() !== b.getDate() || a.getMonth() !== b.getMonth();
}

function isWeekly(state) { return Date.now() - state.weekly.last >= 604800000; }

function resetDaily(state) {
  state.daily = { last: Date.now(), done: [] };
  state.aToday = state.wToday = state.sToday = 0;
  return saveGame(state);
}

function resetWeekly(state) {
  state.weekly = { last: Date.now(), done: [] };
  state.bWeek = state.wWeek = 0;
  return saveGame(state);
}
