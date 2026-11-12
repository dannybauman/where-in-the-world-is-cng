// the home screen (rank, today's mystery, the story path) and the notebook
import CASES from "./cases/index.js";
import { resetMap, flyHome } from "./map.js";
import { start, leave } from "./engine.js";
import { starRow } from "./moves.js";
import { NOTES } from "./notes.js";
import { save, rank } from "./save.js";
import { PLACES, todayIndex } from "./places.js";
import { mystery, photo, nextPlace } from "./mystery.js";
import { iso } from "./api.js";

const $ = id => document.getElementById(id);

function rankCard() {
  const r = rank();
  return `<div class="rank"><div class="rank-top"><span class="who">Your rank</span><b>${r.name}</b><span class="stars" aria-label="${r.total} stars">★ ${r.total}</span></div>
    <div class="meter" aria-hidden="true"><i style="--w:${r.pct}%"></i></div>
    <p>${r.next ? `${r.need} more ${r.need === 1 ? "star" : "stars"} to ${r.next}. Earn them in cases and mysteries.` : "Top rank. Keep playing for the notebook."}</p></div>`;
}

function mysteryCard(open) {
  if (!open) return `<div class="mcard locked"><div class="thumb"></div><div><span class="who">Mystery</span><h2>Where in the world is this?</h2><p>Opens after First Look.</p></div></div>`;
  const done = save.day?.date === iso(new Date()) ? save.day : null;
  return `<div class="mcard"><figure class="thumb"><img alt=""></figure><div><span class="who">Today's mystery</span><h2>Where in the world is this?</h2>
    <p>${done ? `Solved today: ${done.km.toLocaleString("en-US")} km away. ${starRow(done.stars, 3)}` : "A picture from space, 3 clues and one pin."}</p>
    <div class="row">${done ? "" : `<button class="btn" type="button" id="today">Play today's mystery</button>`}
    <button class="btn ${done ? "" : "quiet"}" type="button" id="another">${done ? "Play another" : "Play a random place"}</button></div></div></div>`;
}

// what finishing case i opens, said on its last screen
const opensAfter = i => [i === 0 && "today's mystery", CASES[i + 1]?.title].filter(Boolean).join(" and ");

export function home() {
  resetMap(); leave(); flyHome();
  const firstDone = "first" in save.stars;
  $("view").innerHTML = `<div class="intro"><h1>Solve mysteries with pictures from space</h1>
    <p>Free satellite pictures of real places. No experience needed.</p></div>
    ${firstDone ? rankCard() + mysteryCard(true) : ""}
    <h2 class="path-title">Cases</h2>
    <ol class="path">${CASES.map((c, i) => {
      const done = c.id in save.stars, prevDone = i === 0 || CASES[i - 1].id in save.stars, open = done || prevDone;
      const tag = done ? c.who : open ? "Start here" : c.who;
      return `<li class="${done ? "done" : open ? "next" : "locked"}"><span class="node" aria-hidden="true">${i + 1}</span>
        <button class="case" type="button" data-i="${i}" ${open ? "" : "disabled"}><span class="who">${tag}</span>
        <h3>${c.title}</h3><p>${open ? c.blurb : `Opens after ${CASES[i - 1].title}.`}</p>${open ? starRow(save.stars[c.id] || 0, c.maxStars) : ""}</button></li>`;
    }).join("")}</ol>
    ${firstDone ? "" : mysteryCard(false)}`;
  $("view").querySelectorAll(".case:not([disabled])").forEach(b => (b.onclick = () => start(CASES[+b.dataset.i], home, opensAfter(+b.dataset.i))));
  if (!firstDone) return;
  const t = todayIndex(), img = $("view").querySelector(".mcard img");
  img.onload = () => img.parentElement.classList.add("loaded");
  photo(PLACES[t]).then(u => (img.src = u)).catch(() => {});
  $("today")?.addEventListener("click", () => mystery(t, home));
  $("another").onclick = () => mystery(nextPlace(t), home);
}

export function notebook() {
  const total = Object.keys(NOTES).length;
  $("nb-body").innerHTML = `<h2>Notebook</h2><p>${save.notes.length} of ${total} found. Cases and mysteries fill it.</p>` +
    Object.entries(NOTES).map(([k, [t, d, link]]) => save.notes.includes(k)
      ? `<div class="term"><h3>${t}</h3><p>${d}</p>${link ? `<a href="${link[1]}" target="_blank" rel="noopener">${link[0]}</a>` : ""}</div>`
      : `<div class="term locked">Not found yet</div>`).join("") +
    `<div class="row"><button class="btn" type="button" id="nb-close">Close</button></div>`;
  $("nb-close").onclick = () => $("nb").close();
  $("nb").showModal();
}
