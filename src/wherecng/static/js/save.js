// progress in localStorage under "gt2". Old saves keep every star and note: fields are only ever added
const KEY = "gt2";
function load() {
  const raw = localStorage.getItem(KEY);
  let s = {};
  // a save that can't be read, or isn't an object, is kept aside, never thrown away
  try { s = JSON.parse(raw || "{}"); if (!s || typeof s !== "object" || Array.isArray(s)) throw 0; }
  catch { s = {}; localStorage.setItem(KEY + "-unreadable", raw); }
  if (!Array.isArray(s.notes)) s.notes = [];
  if (!s.stars || typeof s.stars !== "object") s.stars = {};
  if (!s.mystery || typeof s.mystery !== "object") s.mystery = {};
  return s;
}
export const save = load();
export const persist = () => localStorage.setItem(KEY, JSON.stringify(save));

// ranks rise from every star: cases plus the best score on each mystery place
export const RANKS = [["Pixel Peeper", 0], ["Band Reader", 6], ["Orbit Sleuth", 16], ["Ground Truther", 30]];
const sum = o => Object.values(o).reduce((a, b) => a + (Number(b) || 0), 0);
export const totalStars = () => sum(save.stars) + sum(save.mystery);
export function rank(total = totalStars()) {
  const i = RANKS.findLastIndex(([, at]) => total >= at);
  const [name, at] = RANKS[i], [next, to] = RANKS[i + 1] || [];
  return { name, next, need: next ? to - total : 0, total, pct: next ? Math.round((100 * (total - at)) / (to - at)) : 100 };
}
