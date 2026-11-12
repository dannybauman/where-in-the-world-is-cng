// the home list and the notebook
import CASES from "./cases/index.js";
import { resetMap, flyHome } from "./map.js";
import { start, leave } from "./engine.js";
import { starRow } from "./moves.js";
import { NOTES } from "./notes.js";
import { save } from "./save.js";

const $ = id => document.getElementById(id);

export function home() {
  resetMap(); leave(); flyHome();
  $("view").innerHTML = `<div class="intro"><h1>Solve real cases with pictures from space</h1>
    <p>Satellites photograph the whole planet every few days, and the pictures are free. Use them to answer real questions. No experience needed.</p></div>
    ${CASES.map((c, i) => {
      const prevDone = i === 0 || CASES[i - 1].id in save.stars;
      const open = prevDone || c.id in save.stars, fresh = prevDone && !(c.id in save.stars);
      return `<button class="case" type="button" data-i="${i}" ${open ? "" : "disabled"}><span class="who">${fresh ? "Start here" : c.who}</span>
      <h3>${c.title}</h3><p>${open ? c.blurb : "Opens when you finish the case above."}</p>${open ? starRow(save.stars[c.id] || 0, c.maxStars) : ""}</button>`;
    }).join("")}`;
  $("view").querySelectorAll(".case:not([disabled])").forEach(b => (b.onclick = () => start(CASES[b.dataset.i], home)));
}

export function notebook() {
  const total = Object.keys(NOTES).length;
  $("nb-body").innerHTML = `<h2>Notebook</h2><p>${save.notes.length} of ${total} found. Solve cases to fill it.</p>` +
    Object.entries(NOTES).map(([k, [t, d, link]]) => save.notes.includes(k)
      ? `<div class="term"><h3>${t}</h3><p>${d}</p>${link ? `<a href="${link[1]}" target="_blank" rel="noopener">${link[0]}</a>` : ""}</div>`
      : `<div class="term locked">Not found yet</div>`).join("") +
    `<div class="row"><button class="btn" type="button" id="nb-close">Close</button></div>`;
  $("nb-close").onclick = () => $("nb").close();
  $("nb").showModal();
}
