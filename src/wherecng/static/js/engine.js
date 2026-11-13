// the step engine. A step is (ctx) => { title, text, and one of:
// go (a button that fetches), ask (a text box), pick (a choice), guess, look (preview pictures, then choose), flipTask, tap (on the map),
// then (Then and now: an async function returning the beat, see thennow.js)
import { esc } from "./api.js";
import { play, card } from "./thennow.js";
import { note } from "./notes.js";
import { resetMap, armTap, mark, show } from "./map.js";
import { star, starRow, rankLine } from "./moves.js";
import { save, persist, rank } from "./save.js";

const $ = id => document.getElementById(id);
const view = $("view"), panel = $("panel");
const el = h => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };
let run = null;

// leaving a case drops the run, so a switch listener left behind by an old step stays quiet
export const leave = () => { run = null; };

function render() {
  // a step that returns nothing doesn't apply this run (no fire to look at) and is skipped
  let s; while (!(s = run.c.steps[run.i](run.ctx))) run.i++;
  const { c, i, ctx } = run;
  // the star rule shows once, on the first step of any case with calls to judge
  const rule = i === 0 && c.maxStars > 1 ? `<p class="rule">A right call the first time earns a star. Miss, and you get one more try.</p>` : "";
  view.innerHTML = `<div class="top"><span class="who">${c.who}: ${c.title}</span>${starRow(ctx.stars, c.maxStars)}</div>
    <div class="dots" aria-label="Step ${i + 1} of ${c.steps.length}">${c.steps.map((_, k) => `<i class="${k < i ? "done" : ""}"></i>`).join("")}</div>
    <div class="step"><h2>${s.title}</h2>${s.text || ""}${rule}<div id="body"></div><div class="row" id="ctl"></div></div>`;
  const body = $("body"), ctl = $("ctl");
  const next = () => {
    const last = i + 1 >= c.steps.length;
    const b = el(`<button class="btn" type="button">${last ? "Close the case" : "Next"}</button>`);
    b.onclick = () => { run.i++; last ? finish() : render(); };
    ctl.replaceChildren(b); b.focus({ preventScroll: true });
  };
  // hold: the step decides when to go on (a tap that gets a second try)
  const doing = async (btn, fn, waitText, hold) => {
    if (btn) { btn.disabled = true; btn.hidden = true; }
    const w = el(`<p class="wait" role="status"></p>`);
    w.textContent = waitText || "Asking the satellite archive…";
    body.replaceChildren(w);
    // a long step tells the player which part it's on
    ctx.say = t => { w.textContent = t; };
    try { body.innerHTML = await fn(); if (!hold) next(); return true; }
    catch (e) {
      body.innerHTML = `<div class="say wrong" role="alert">${esc(e.message)}</div>`;
      if (btn) { btn.disabled = false; btn.hidden = false; btn.textContent = "Try again"; }
      return false;
    }
  };
  const k = { ctx, body, ctl, next, doing, run, i };
  if (s.go) goStep(s, k);
  else if (s.ask) askStep(s, k);
  else if (s.pick || s.guess) pickStep(s, k);
  else if (s.look) lookStep(s, k);
  else if (s.flipTask) flipStep(s, k);
  else if (s.tap) tapStep(s, k);
  else if (s.then) thenStep(s, k);
  else next();
  panel.scrollTop = 0;
}

function goStep(s, { ctx, ctl, doing }) {
  const b = el(`<button class="btn" type="button">${s.go.label}</button>`);
  b.onclick = () => doing(b, () => s.go.run(ctx), s.go.wait);
  ctl.replaceChildren(b);
}

function askStep(s, { ctx, ctl, doing }) {
  const inp = el(`<input type="text" aria-label="${s.ask.label}" placeholder="${s.ask.placeholder}">`);
  const b = el(`<button class="btn" type="button">${s.ask.button}</button>`);
  const go = () => inp.value.trim() ? doing(b, () => s.ask.run(inp.value.trim(), ctx), s.ask.wait) : inp.focus();
  // an on* handler that returns false cancels the event, so `e.key === "Enter" && go()`
  // returned false for every other key and threw away each letter typed
  b.onclick = go; inp.onkeydown = e => { if (e.key === "Enter") go(); };
  ctl.replaceChildren(inp, b); inp.focus({ preventScroll: true });
}

function pickStep(s, { ctx, body, next }) {
  const p = s.pick || s.guess;
  const opts = el(`<div class="options" role="group" aria-label="Answers"></div>`);
  let tries = 0;
  p.options.forEach(o => {
    const b = el(`<button class="opt" type="button">${o.text}</button>`);
    b.onclick = async () => {
      if (s.guess) { [...opts.children].forEach(x => (x.disabled = true)); b.classList.add("right"); ctx.guess = o.key; body.innerHTML = `<div class="say">Noted. Let's find out.</div>`; return next(); }
      tries++; b.disabled = true; b.classList.add(o.right ? "right" : "wrong");
      if (!o.right && tries === 1) { body.innerHTML = `<div class="say wrong">Not quite. ${o.why} One more try.</div>`; return; }
      [...opts.children].forEach(x => (x.disabled = true));
      if (!o.right) opts.children[p.options.findIndex(x => x.right)].classList.add("right");
      if (o.right && tries === 1) star(ctx);
      body.innerHTML = `<div class="say ${o.right ? "" : "wrong"}">${o.right ? (tries === 1 ? "Good call. " : "That's it. ") : "Not quite. "}${o.why}</div>${p.then ? await p.then(ctx) : ""}`;
      next();
    };
    opts.appendChild(b);
  });
  body.before(opts);
}

// every choice must be answerable from what's on screen: tap to preview each picture, then commit
function lookStep(s, { ctx, body, ctl, next }) {
  const opts = el(`<div class="options" role="group" aria-label="Pictures"></div>`);
  const use = el(`<button class="btn" type="button" disabled>Use this picture</button>`);
  let chosen = null, chosenBtn = null, tries = 0;
  s.look.options.forEach(o => {
    const b = el(`<button class="opt" type="button" aria-pressed="false">${o.text}</button>`);
    b.onclick = async () => {
      [...opts.children].forEach(x => x.setAttribute("aria-pressed", "false"));
      b.setAttribute("aria-pressed", "true"); chosen = o; chosenBtn = b; use.disabled = false;
      try { await s.look.preview(o); } catch { body.innerHTML = `<p class="wait">That picture didn't load. Try another.</p>`; }
    };
    opts.appendChild(b);
  });
  use.onclick = async () => {
    tries++;
    if (!chosen.right && tries === 1) {
      chosenBtn.disabled = true; chosenBtn.classList.add("wrong"); use.disabled = true;
      body.innerHTML = `<div class="say wrong">Not quite. ${chosen.why} One more try.</div>`;
      return;
    }
    [...opts.children].forEach((x, k) => {
      const o = s.look.options[k];
      x.disabled = true;
      if (o.right) x.classList.add("right"); else if (x === chosenBtn) x.classList.add("wrong");
      x.insertAdjacentHTML("beforeend", `<small>${o.reveal}</small>`);
    });
    if (chosen.right && tries === 1) star(ctx);
    use.hidden = true;
    body.innerHTML = `<div class="say ${chosen.right ? "" : "wrong"}">${chosen.right ? (tries === 1 ? "Good eye. " : "That's it. ") : "Not quite. "}${chosen.why}</div>${await s.look.then(ctx, chosen)}`;
    next();
  };
  body.innerHTML = `<p class="tapnote">${s.look.hint}</p>`;
  body.before(opts); ctl.replaceChildren(use);
}

function flipStep(s, { ctx, body, next, run: mine, i }) {
  body.innerHTML = `<p class="tapnote">${s.flipTask}</p>`;
  $("flip-a").addEventListener("click", () => {
    if (run !== mine || run.i !== i) return;
    star(ctx); body.innerHTML = `<div class="say">That's the switch. Tap "From space" to bring the picture back.</div>`; next();
  }, { once: true });
}

// tap.run returns { right, html }; a miss gets one more tap
function tapStep(s, { ctx, body, doing, next }) {
  let tries = 0;
  body.innerHTML = `<p class="tapnote">Tap the map to choose a spot.</p>`;
  const arm = () => armTap(async e => {
    mark(e.lngLat);
    const { lng, lat } = e.lngLat;
    let r;
    const ok = await doing(null, async () => (r = await s.tap.run([lng - .004, lat - .003, lng + .004, lat + .003], ctx)).html, "Measuring that spot…", true);
    if (!ok) { body.insertAdjacentHTML("beforeend", `<p class="tapnote">Tap the map to try again.</p>`); return arm(); }
    tries++;
    if (r.right && tries === 1) star(ctx);
    if (r.right || tries === 2) return next();
    body.insertAdjacentHTML("beforeend", `<p class="tapnote">One more try. Tap another spot.</p>`); arm();
  });
  arm();
}

async function thenStep(s, { ctx, body, ctl, next, run: mine, i }) {
  const still = () => run === mine && run.i === i;
  body.innerHTML = `<p class="wait" role="status">Getting the numbers…</p>`;
  let spec;
  try { spec = await s.then(ctx); }
  catch { if (still()) { body.innerHTML = `<div class="say wrong" role="alert">The numbers didn't load. You can go on without them.</div>`; next(); } return; }
  if (!still()) return;
  await play(body, ctl, spec);
  if (!still()) return;
  body.insertAdjacentHTML("beforeend", card(spec) + (spec.note ? note(spec.note) : ""));
  next();
}

export function start(c, onHome, opens) {
  resetMap(); run = { c, i: 0, ctx: { stars: 0 }, onHome, opens }; render();
  if (!panel.contains(document.activeElement) || document.activeElement === panel) panel.focus({ preventScroll: true });
}

function finish() {
  const { c, ctx, onHome, opens } = run, got = ctx.stars, before = rank(), wasDone = c.id in save.stars;
  save.stars[c.id] = Math.max(save.stars[c.id] || 0, got); persist();
  if (document.getElementById("flip").classList.contains("on")) show("b");
  view.innerHTML = `<div class="end"><span class="who">${c.who}: ${c.title}</span>
    <h2 tabindex="-1">Case closed</h2>${starRow(got, c.maxStars)}
    ${c.found ? (([f, m]) => `<div class="found"><p><b>What you found</b>${f}</p><p><b>What it means</b>${m}</p></div>`)(c.found(ctx)) : ""}
    ${rankLine(before)}
    ${opens && !wasDone ? `<p class="opens">Now open: ${opens}.</p>` : ""}
    <div class="row"><button class="btn" id="back" type="button">Back to cases</button></div>
    <h3 class="file-title">Your case file</h3><p>Anyone with the same open data can check it.</p><div class="file">${c.file(ctx)}</div>
    <div class="row"><button class="btn quiet" id="copy" type="button">Copy case file</button></div></div>`;
  $("copy").onclick = async e => {
    try { await navigator.clipboard.writeText(document.querySelector(".file").innerText); e.target.textContent = "Copied"; }
    catch { e.target.textContent = "Select the text to copy it"; }
  };
  $("back").onclick = onHome;
  $("back").focus({ preventScroll: true });
}
