// moves that more than one case makes
import { search, tiles, iso, n } from "./api.js";
import { picture } from "./map.js";
import { rank } from "./save.js";

export async function best(b, from, to, cloud = 20, radar = false) {
  const r = await search(b, from, to, cloud, radar);
  if (!r.items?.length) throw new Error(`No clear pictures between ${from} and ${to}.`);
  return r.items;
}
// a recent clear picture that covers the most of the box: among those within 5 points of the best cover, the newest.
// The newest alone can show half the box, because a satellite strip edge often cuts through it
export async function clearest(b, days, cloud = 20) {
  const to = new Date(), items = await best(b, iso(new Date(to - days * 864e5)), iso(to), cloud);
  const top = Math.max(...items.map(i => i.covers_aoi_pct || 0));
  return items.filter(i => (i.covers_aoi_pct || 0) >= top - 5).sort((x, y) => y.datetime.localeCompare(x.datetime))[0];
}
// put a scene on the map in slot "a" or "b", plain or painted with an index
export const paint = async (slot, id, expression) => picture(slot, await tiles(id, expression));

export function bars(name, a, b, la, lb) {
  const w = v => Math.max(2, Math.min(100, ((v + 1) / 2) * 100));
  return `<div class="measure" aria-label="${name}">
    <div class="bar"><span>${la}</span><div class="track"><b style="--w:${w(a)}%"></b></div><span>${n(a)}</span></div>
    <div class="bar after"><span>${lb}</span><div class="track"><b style="--w:${w(b)}%"></b></div><span>${n(b)}</span></div></div>`;
}
export const cover = it => `${n(it.cloud_cover, 0)}% cloud, shows ${n(it.covers_aoi_pct, 0)}% of the lake`;

export const star = ctx => { ctx.stars = (ctx.stars || 0) + 1; };
// where the player stands after a win; a rank gained since `before` gets its moment
export function rankLine(before) {
  const now = rank(), up = now.name !== before.name;
  return `<div class="rank-line${up ? " up" : ""}" role="status"><b>${up ? `New rank: ${now.name}` : now.name}</b>
    <span>${now.next ? `${now.need} more ${now.need === 1 ? "star" : "stars"} to ${now.next}` : "Top rank. Every place is still yours to replay."}</span></div>`;
}
export const starRow = (got, of) => `<span class="stars" aria-label="${got} of ${of} stars">${"★".repeat(got)}<span class="off">${"★".repeat(of - got)}</span></span>`;
