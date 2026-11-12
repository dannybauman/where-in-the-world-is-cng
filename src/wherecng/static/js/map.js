// the one map, and everything a case may do to it
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
// motion length comes from the --motion-slow token, which is 0ms under prefers-reduced-motion
export const fade = () => parseFloat(css("--motion-slow"));

export const map = new maplibregl.Map({ container: "map", style: "https://tiles.openfreemap.org/styles/positron", center: [-40, 30], zoom: 1.3, attributionControl: { compact: true } });
map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
const ready = new Promise(r => map.on("load", r));
export const flyHome = () => map.flyTo({ center: [-40, 30], zoom: 1.3, duration: fade() * 3 });

let caseBox = null, tapHandler = null, marker = null;
const $ = id => document.getElementById(id);

export async function frame(b) {
  caseBox = b;
  await ready;
  const ring = [[b[0], b[1]], [b[2], b[1]], [b[2], b[3]], [b[0], b[3]], [b[0], b[1]]];
  const gj = { type: "Feature", geometry: { type: "Polygon", coordinates: [ring] } };
  if (map.getSource("box")) map.getSource("box").setData(gj);
  else { map.addSource("box", { type: "geojson", data: gj }); map.addLayer({ id: "box", type: "line", source: "box", paint: { "line-color": css("--color-life"), "line-width": 3 } }); }
  map.fitBounds([[b[0], b[1]], [b[2], b[3]]], { padding: 32, duration: fade() * 4 });
}

const dropPicture = id => { if (map.getLayer(id)) map.removeLayer(id); if (map.getSource(id)) map.removeSource(id); };
export async function picture(slot, url) {
  await ready;
  const id = "pic-" + slot;
  dropPicture(id);
  // the free tile service draws only the case box, at zooms where a 10 m pixel can be seen; past 14 the map stretches tiles it has
  const pad = caseBox && Math.max(caseBox[2] - caseBox[0], caseBox[3] - caseBox[1]) * 0.5;
  map.addSource(id, { type: "raster", tiles: [url], tileSize: 256, minzoom: 8, maxzoom: 14, ...(caseBox && { bounds: [caseBox[0] - pad, caseBox[1] - pad, caseBox[2] + pad, caseBox[3] + pad] }), attribution: "Sentinel-2 via Earth Search, drawn by TiTiler" });
  map.addLayer({ id, type: "raster", source: id, paint: { "raster-opacity-transition": { duration: fade() } } }, map.getLayer("box") ? "box" : undefined);
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
export function armTap(fn) {
  tapHandler = e => { disarm(); fn(e); };
  map.getCanvas().style.cursor = "crosshair";
  map.on("click", tapHandler);
}
function disarm() {
  if (tapHandler) { map.off("click", tapHandler); tapHandler = null; }
  map.getCanvas().style.cursor = "";
}
export function mark(lngLat) {
  marker?.remove();
  marker = new maplibregl.Marker({ color: css("--color-ink") }).setLngLat(lngLat).addTo(map);
}

export function resetMap() {
  dropPicture("pic-a"); dropPicture("pic-b");
  disarm();
  marker?.remove(); marker = null;
  if (map.getLayer("box")) { map.removeLayer("box"); map.removeSource("box"); }
  $("flip").classList.remove("on");
}
