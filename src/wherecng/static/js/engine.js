// the step engine. A step is (ctx) => { title, text, and one of:
// go (a button that fetches), ask (a text box), pick (a choice), guess, look (preview pictures, then choose), flipTask, tap (on the map)
import { esc } from "./api.js";
import { resetMap, armTap, mark } from "./map.js";
import { star, starRow } from "./moves.js";
import { save, persist } from "./save.js";

const $ = id => document.getElementById(id);
const view = $("view"), panel = $("panel");
const el = h => { const t = document.createElement("template"); t.innerHTML = h.trim(); return t.content.firstChild; };
let run = null;

// leaving a case drops the run, so a switch listener left behind by an old step stays quiet
export const leave = () => { run = null; };

function render() {
  const { c, i, ctx } = run, s = c.steps[i](ctx);
  view.innerHTML = `<div class="top"><span class="who">${c.who}: ${c.title}</span></div>
    <div class="dots" aria-label="Step ${i + 1} of ${c.steps.length}">${c.steps.map((_, k) => `<i class="${k < i ? "done" : ""}"></i>`).join("")}</div>
    <div class="step"><h2>${s.title}</h2>${s.text || ""}<div id="body"></div><div class="row" id="ctl"></div></div>`;
  const body = $("body"), ctl = $("ctl");
  const next = () => {
    const last = i + 1 >= c.steps.length;
    const b = el(`<button class="btn" type="button">${last ? "Close the case" : "Next"}</button>`);
    b.onclick = () => { run.i++; last ? finish() : render(); };
    ctl.replaceChildren(b); b.focus({ preventScroll: true });
  };
  const doing = async (btn, fn, waitText) => {
    if (btn) { btn.disabled = true; btn.hidden = true; }
    body.innerHTML = `<p class="wait" role="status">${waitText || "Asking the satellite archive…"}</p>`;
    try { body.innerHTML = await fn(); next(); return true; }
    catch (e) {
      body.innerHTML = `<div class="say wrong" role="alert">${esc(e.message)} Try again in a moment.</div>`;
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
  p.options.forEach(o => {
    const b = el(`<button class="opt" type="button">${o.text}</button>`);
    b.onclick = async () => {
      [...opts.children].forEach(x => (x.disabled = true));
      if (s.guess) { b.classList.add("right"); ctx.guess = o.key; body.innerHTML = `<div class="say">Noted. Let's find out.</div>`; return next(); }
      b.classList.add(o.right ? "right" : "wrong");
      if (!o.right) opts.children[p.options.findIndex(x => x.right)].classList.add("right");
      if (o.right) star(ctx);
      body.innerHTML = `<div class="say ${o.right ? "" : "wrong"}">${o.right ? "Good call. " : "Not quite. "}${o.why}</div>${p.then ? await p.then(ctx) : ""}`;
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
  let chosen = null, chosenBtn = null;
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
    [...opts.children].forEach((x, k) => {
      const o = s.look.options[k];
      x.disabled = true;
      if (o.right) x.classList.add("right"); else if (x === chosenBtn) x.classList.add("wrong");
      x.insertAdjacentHTML("beforeend", `<small>${o.reveal}</small>`);
    });
    if (chosen.right) star(ctx);
    use.hidden = true;
    body.innerHTML = `<div class="say ${chosen.right ? "" : "wrong"}">${chosen.right ? "Good eye. " : "Not quite. "}${chosen.why}</div>${await s.look.then(ctx, chosen)}`;
    next();
  };
  body.innerHTML = `<p class="tapnote">${s.look.hint}</p>`;
  body.before(opts); ctl.replaceChildren(use);
}

function flipStep(s, { ctx, body, next, run: mine, i }) {
  body.innerHTML = `<p class="tapnote">${s.flipTask}</p>`;
  $("flip-a").addEventListener("click", () => {
    if (run !== mine || run.i !== i) return;
    star(ctx); body.innerHTML = `<div class="say">That's the switch. Tap "From space" to come back. You'll use it in every case.</div>`; next();
  }, { once: true });
}

function tapStep(s, { ctx, body, doing }) {
  body.innerHTML = `<p class="tapnote">Tap the map to choose a spot.</p>`;
  const arm = () => armTap(async e => {
    mark(e.lngLat);
    const { lng, lat } = e.lngLat;
    const ok = await doing(null, () => s.tap.run([lng - .004, lat - .003, lng + .004, lat + .003], ctx), "Measuring that spot…");
    if (!ok) { body.insertAdjacentHTML("beforeend", `<p class="tapnote">Tap the map to try again.</p>`); arm(); }
  });
  arm();
}

export function start(c, onHome) {
  resetMap(); run = { c, i: 0, ctx: { stars: 0 }, onHome }; render();
  if (!panel.contains(document.activeElement) || document.activeElement === panel) panel.focus({ preventScroll: true });
}

function finish() {
  const { c, ctx, onHome } = run, got = ctx.stars;
  save.stars[c.id] = Math.max(save.stars[c.id] || 0, got); persist();
  view.innerHTML = `<div class="end"><span class="who">${c.who}: ${c.title}</span>
    <h2>Case closed</h2>${starRow(got, c.maxStars)}
    <p>Your case file. Anyone with the same open data can check it.</p><div class="file">${c.file(ctx)}</div>
    <div class="row"><button class="btn" id="copy" type="button">Copy case file</button><button class="btn quiet" id="back" type="button">More cases</button></div></div>`;
  $("copy").onclick = async e => { await navigator.clipboard.writeText(document.querySelector(".file").innerText); e.target.textContent = "Copied"; };
  $("back").onclick = onHome;
  $("back").focus({ preventScroll: true });
}
