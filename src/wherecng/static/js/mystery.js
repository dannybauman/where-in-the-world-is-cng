// the mystery round: a satellite picture, 3 clues, one pin, a flight to the answer
import { api, q, box, tiles, iso, esc } from "./api.js";
import { map, resetMap, flyHome, armTap, disarm, mark, flight, frame, picture, fade } from "./map.js";
import { PLACES, todayIndex, center, km, starsFor } from "./places.js";
import { leave } from "./engine.js";
import { note } from "./notes.js";
import { starRow, rankLine } from "./moves.js";
import { save, persist, rank } from "./save.js";

const $ = id => document.getElementById(id);
export const photo = async (p, scene = p.scene) => (await api(`/api/preview?${q({ item: scene, ...box(p.box) })}`)).url;
// the picture comes back in web mercator, so its shape is the box's mercator shape
const ratio = ([w, s, e, n]) => { const r = Math.PI / 180, y = l => Math.log(Math.tan(Math.PI / 4 + l * r / 2)); return ((e - w) * r) / (y(n) - y(s)); };
export const CLOUD = `<svg class="cloud-svg" viewBox="0 0 120 70" aria-hidden="true"><path d="M30 62a22 22 0 0 1-2-44 26 26 0 0 1 49-6 20 20 0 0 1 31 20 18 18 0 0 1-6 30z"/><circle class="eye" cx="52" cy="38" r="3.5"/><circle class="eye" cx="70" cy="38" r="3.5"/><path class="grin" stroke-width="3" d="M54 48q7 6 14 0"/></svg>`;

// a new round prefers places not yet solved with 3 stars, and never repeats the one just played
export function nextPlace(last) {
  const open = PLACES.map((_, i) => i).filter(i => i !== last && (save.mystery[PLACES[i].id] || 0) < 3);
  const pool = open.length ? open : PLACES.map((_, i) => i).filter(i => i !== last);
  return pool[Math.floor(Math.random() * pool.length)];
}

export function mystery(i, onHome) {
  const p = PLACES[i], daily = i === todayIndex(), view = $("view");
  leave(); resetMap(); flyHome();
  let shown = 1, guess = null;
  view.innerHTML = `<div class="mystery">
    <span class="who">${daily ? "Today's mystery" : "Mystery place"}</span>
    <h2 tabindex="-1">Where in the world is this?</h2>
    <figure class="photo" style="aspect-ratio:${ratio(p.box).toFixed(3)}">
      <img alt="A satellite picture of the mystery place. No labels.">
      ${p.cloudy ? `<div class="cloud">${CLOUD}</div>` : ""}
    </figure>
    <div id="cloudctl"></div>
    <ol class="clues" aria-live="polite"></ol>
    <div class="row"><button class="btn quiet" type="button" id="more">Show another clue</button></div>
    <p class="tapnote" id="hint">Tap the map to drop your pin.<span class="sr"> Or move the map with the arrow keys and press Enter to drop it in the middle.</span></p>
    <div class="row"><button class="btn" type="button" id="lock" disabled>Lock in my guess</button></div></div>`;
  $("panel").scrollTop = 0;
  $("view").querySelector("h2").focus({ preventScroll: true });

  const img = view.querySelector(".photo img"), fig = img.parentElement;
  const load = async scene => {
    fig.classList.remove("loaded", "failed");
    try { img.src = await photo(p, scene); } catch { fig.classList.add("failed"); }
  };
  img.onload = () => fig.classList.add("loaded");
  img.onerror = () => fig.classList.add("failed");
  load(p.cloudy || p.scene);

  // the cheeky cloud: a real cloudier date of this place. Beating it is the lesson: pick a clearer date
  if (p.cloudy) {
    $("cloudctl").innerHTML = `<p class="cloudsay">A cloud got in the way. This picture is from a cloudy day.</p><div class="row"><button class="btn" type="button" id="clear">Pick a clearer date</button></div>`;
    $("clear").onclick = () => {
      fig.querySelector(".cloud").classList.add("gone");
      load(p.scene);
      $("cloudctl").innerHTML = `<p class="cloudsay">Gone. Satellites pass every few days, so a clearer day is never far.</p>${note("clouds")}`;
    };
  }

  const clues = view.querySelector(".clues"), more = $("more");
  const showClues = () => {
    clues.innerHTML = p.clues.slice(0, shown).map(c => `<li>${c}</li>`).join("");
    more.textContent = `Show another clue (${shown + 1} of 3)`;
    more.hidden = shown >= p.clues.length;
  };
  more.onclick = () => { shown++; showClues(); };
  showClues();

  const lock = $("lock"), hint = $("hint");
  const drop = ll => {
    guess = ll; mark(ll); lock.disabled = false;
    hint.textContent = "Pin dropped. Tap again to move it.";
    lock.scrollIntoView({ block: "nearest", behavior: fade() ? "smooth" : "auto" });
  };
  armTap(e => drop([e.lngLat.lng, e.lngLat.lat]), true);
  const canvas = map.getCanvas();
  canvas.onkeydown = e => { if (e.key === "Enter") { const c = map.getCenter(); drop([c.lng, c.lat]); } };

  lock.onclick = async () => {
    disarm(); canvas.onkeydown = null;
    lock.disabled = true; more.disabled = true;
    const goal = center(p.box), d = Math.round(km(guess, goal)), stars = starsFor(d);
    const before = rank();
    save.mystery[p.id] = Math.max(save.mystery[p.id] || 0, stars);
    if (daily) save.day = { date: iso(new Date()), id: p.id, km: d, stars };
    persist();
    hint.innerHTML = `<span class="wait" role="status">Flying to the answer…</span>`;
    await flight(guess, goal);
    if (!fig.isConnected) return;
    view.innerHTML = `<div class="result">
      <p class="score"><b>${d.toLocaleString("en-US")}</b> km away</p>
      ${starRow(stars, 3)}
      <h2 tabindex="-1">${d <= 50 ? "Right on it. " : ""}It's ${p.name}.</h2>
      <figure class="photo small loaded" style="aspect-ratio:${ratio(p.box).toFixed(3)}"><img src="${esc(img.src)}" alt="The picture you were shown, of ${p.name}"></figure>
      <p>${p.fact}</p>
      ${note(p.note)}
      ${rankLine(before)}
      <div class="row"><button class="btn" type="button" id="again">Play another</button><button class="btn quiet" type="button" id="home2">Back to cases</button></div></div>`;
    $("again").onclick = () => mystery(nextPlace(i), onHome);
    $("home2").onclick = onHome;
    $("panel").scrollTop = 0;
    $("again").focus({ preventScroll: true });
    // a beat on the whole line, then land on the answer and lay the same picture into the real map, inside its box only
    await new Promise(r => setTimeout(r, fade() * 3));
    if (!$("again")) return;
    frame(p.box);
    try { await picture("b", await tiles(p.scene)); } catch {}
  };
}
