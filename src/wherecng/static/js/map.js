// the one map, and everything a case may do to it
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
// motion length comes from the --motion-slow token, which is 0ms under prefers-reduced-motion
export const fade = () => parseFloat(css("--motion-slow"));
const pad = () => parseFloat(css("--space-map"));

export const map = new maplibregl.Map({ container: "map", style: "https://tiles.openfreemap.org/styles/positron", center: [-40, 30], zoom: 1.3, attributionControl: { compact: true } });
// the compact credits open on load and cover the bottom of a phone map; the (i) button still opens them
map.on("load", () => document.querySelector(".maplibregl-ctrl-attrib")?.classList.remove("maplibregl-compact-show"));
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
const ready = new Promise(r => map.on("load", r));
// the whole world in view: one zoom level is a doubling, so the zoom follows the map's width (512 px shows the world once)
export const flyHome = () => map.flyTo({ center: [10, 25], zoom: Math.max(0, Math.log2(map.getContainer().clientWidth / 512)), duration: fade() * 3 });

let caseBox = null, tapHandler = null, marker = null;

// the tile service sends no Timing-Allow-Origin header, so the browser's resource timing reports 0 bytes for its tiles;
// fetching them through this protocol counts the bytes that really arrive, for Then and now
let tileBytes = 0;
export const bytesRead = () => tileBytes;
maplibregl.addProtocol("count", async (params, abort) => {
  const r = await fetch(params.url.replace(/^count:/, "https:"), { signal: abort.signal });
  if (!r.ok) throw new Error(`tile ${r.status}`);
  const data = await r.arrayBuffer();
  tileBytes += data.byteLength;
  return { data };
});
const $ = id => document.getElementById(id);

export async function frame(b) {
  caseBox = b;
  await ready;
  const ring = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [b[0], b[1]]];
  const gj = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] } };
  if (map.getSource("box")) map.getSource("box").setData(gj);
  else { map.addSource("box", { type: "geojson", data: gj }); map.addLayer({ id: "box", type: "line", source: "box", paint: { "line-color": css("--color-brand"), "line-width": parseFloat(css("--border-accent")) } }); }
  map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: pad(), duration: fade() * 4 });
}

const dropPicture = id => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); };
export async function picture(slot, url) {
  await ready;
  const id = "pic-" + slot;
  dropPicture(id);
  // the free tile service draws only the case box, at zooms where a 10 m pixel can be seen; past 14 the map stretches tiles it has
  const grow = caseBox && Math.max(caseBox[2] - caseBox[0], caseBox[3] - caseBox[1]) * 0.5;
  map.addSource(id, { type: "raster", tiles: [url.replace(/^https:/, "count:")], tileSize: 256, minzoom: 8, maxzoom: 14, ...(caseBox && { bounds: [caseBox[0] - grow, caseBox[1] - grow, caseBox[2] + grow, caseBox[3] + grow] }), attribution: "Sentinel-2 via Earth Search, drawn by TiTiler" });
  map.addLayer({ id, type: "raster", source: id, paint: { "raster-opacity-transition": { duration: fade() } } }, map.getLayer("box") ? "box" : undefined);
  await settled();
}
// resolves once the map has drawn every tile it asked for, so "ready" means the picture is on screen
const settled = () => new Promise(r => { const t = setTimeout(r, parseFloat(css("--motion-settle"))); map.once("idle", () => { clearTimeout(t); r(); }); });

// the mystery round: a dotted flight from the guess to the answer along the great circle
const flightLen = () => parseFloat(css("--motion-flight"));
function arc([x1, y1], [x2, y2], steps = 96) {
  const r = Math.PI / 180, v = (x, y) => [Math.cos(y * r) * Math.cos(x * r), Math.cos(y * r) * Math.sin(x * r), Math.sin(y * r)];
  const a = v(x1, y1), b = v(x2, y2), d = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])) || 1e-9;
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, ka = Math.sin((1 - t) * d) / Math.sin(d), kb = Math.sin(t * d) / Math.sin(d);
    const p = [0, 1, 2].map(k => ka * a[k] + kb * b[k]);
    let lon = Math.atan2(p[1], p[0]) / r;
    // keep the line continuous across the date line instead of jumping back over the whole map
    if (pts.length) lon += Math.round((pts.at(-1)[0] - lon) / 360) * 360;
    pts.push([lon, Math.atan2(p[2], Math.hypot(p[0], p[1])) / r]);
  }
  return pts;
}
let answer = null, round = 0; // resetMap ends the round; a flight that outlives it must not draw
export async function flight(from, to) {
  const mine = round;
  await ready;
  const pts = arc(from, to), line = c => ({ type: "Feature", geometry: { type: "LineString", coordinates: c } });
  if (!map.getSource("flight")) {
    map.addSource("flight", { type: "geojson", data: line([]) });
    map.addLayer({ id: "flight", type: "line", source: "flight", layout: { "line-cap": "round" },
      paint: { "line-color": css("--color-ink"), "line-width": parseFloat(css("--border-flight")), "line-dasharray": [0, 2] } });
  }
  const src = map.getSource("flight"), xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  map.fitBounds([[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]], { padding: pad() * 2, maxZoom: 6, duration: fade() * 2 });
  const total = flightLen();
  await new Promise(done => {
    const t0 = performance.now();
    const step = now => {
      const k = total ? Math.min(1, (now - t0) / total) : 1;
      if (map.getSource("flight") !== src) return done();
      src.setData(line(pts.slice(0, Math.max(2, Math.ceil(k * pts.length)))));
      k < 1 ? requestAnimationFrame(step) : done();
    };
    requestAnimationFrame(step);
  });
  if (mine !== round) return;
  answer?.remove();
  answer = new maplibregl.Marker({ color: css("--color-brand") }).setLngLat(to).addTo(map);
}

// the before/after switch
export function show(slot) {
  if (map.getLayer("pic-b")) map.setPaintProperty("pic-b", "raster-opacity", slot === "b" ? 1 : 0);
  $("flip-a").setAttribute("aria-pressed", slot === "a");
  $("flip-b").setAttribute("aria-pressed", slot === "b");
}
export function flip(labelA, labelB) {
  $("flip-a").textContent = labelA;
  $("flip-b").textContent = labelB;
  $("flip").classList.add("on");
  show("b");
}
$("flip-a").onclick = () => show("a");
$("flip-b").onclick = () => show("b");

// one tap on the map, then the handler is gone; arm again to try again
export function armTap(fn, many = false) {
  disarm();
  tapHandler = e => { if (!many) disarm(); fn(e); };
  map.getCanvas().classList.add("is-picking");
  map.on("click", tapHandler);
}
export function disarm() {
  if (tapHandler) { map.off("click", tapHandler); tapHandler = null; }
  map.getCanvas().classList.remove("is-picking");
}
export function mark(lngLat) {
  marker?.remove();
  marker = new maplibregl.Marker({ color: css("--color-ink") }).setLngLat(lngLat).addTo(map);
}

export function resetMap() {
  dropPicture("pic-a"); dropPicture("pic-b");
  disarm(); round++;
  map.getCanvas().onkeydown = null;
  marker?.remove(); marker = null;
  answer?.remove(); answer = null;
  caseBox = null;
  for (const id of ["box", "flight"]) if (map.getLayer(id)) { map.removeLayer(id); map.removeSource(id); }
  $("flip").classList.remove("on");
}
