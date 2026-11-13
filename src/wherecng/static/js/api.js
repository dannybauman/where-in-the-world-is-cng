// groundstation, through the game's own /api routes, plus the small helpers every case uses
export async function api(path) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 90000);
  try {
    const r = await fetch(path, { signal: ctrl.signal });
    if (!r.ok) throw new Error("The data service didn't answer.");
    return await r.json();
  } catch (e) { throw new Error(e.name === "AbortError" ? "The data service is slow right now." : e.message); }
  finally { clearTimeout(t); }
}
export const q = o => new URLSearchParams(o).toString();
// outside text (place names, alert titles) is escaped once, where it enters the game
export const esc = t => String(t ?? "").replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
export const box = b => ({ w: b[0], s: b[1], e: b[2], n: b[3] });
export const n = (x, d = 2) => Number(x).toFixed(d);
export const iso = d => d.toISOString().slice(0, 10);
export const day = id => { const m = id.match(/_(\d{4})(\d{2})(\d{2})[_T]/); return m ? new Date(`${m[1]}-${m[2]}-${m[3]}T12:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : esc(id); };
export const WATER = "(green-nir)/(green+nir)", BURN = "(nir-swir22)/(nir+swir22)", RADAR_WATER = "vv<0.02";

// a picture is a satellite pass of several tiles: search() remembers which tiles each pass is made of
const passTiles = new Map();
export const search = async (b, start, end, cloud = 20, radar = false) => {
  const r = await api(`/api/search?${q({ ...box(b), start, end, max_cloud: cloud, ...(radar && { radar: 1 }) })}`);
  for (const it of r.items || []) passTiles.set(it.id, it.tiles || [it.id]);
  return r;
};
// the first tile of a picture, for a link to its catalog item
export const firstTile = id => (passTiles.get(id) || [id])[0];
export const stats = async (item, ex, b) => { const t = passTiles.get(item) || [], r = await api(`/api/stats?${q({ item, expression: ex, ...box(b), ...(t.length > 1 && { tiles: t.join(",") }) })}`); if (!r.stats) throw new Error("The measurement didn't come back."); return r.stats.mean; };
// one tile URL template per tile of the pass; a scene that never came from a search is one tile
export const tiles = (id, ex) => Promise.all((passTiles.get(id) || [id]).map(item => api(`/api/tiles?${q(ex ? { item, expression: ex } : { item })}`).then(r => r.tiles)));
// the error text is escaped later, where the step engine shows it
export async function geocode(name) {
  const g = await api(`/api/geocode?${q({ q: name })}`);
  if (!g.bbox) throw new Error(`Couldn't find "${name}". Try adding a state or country.`);
  return g;
}
