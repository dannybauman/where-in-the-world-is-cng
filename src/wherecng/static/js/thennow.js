// Then and now: a short, skippable re-creation of the old way, then the old and new numbers side by side.
// A case's `then` step returns { lines: [{ text, bytes? }], head?, rows: [[what, then, now]], note? }
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export const size = b => b >= 1e9 ? `${(b / 1e9).toFixed(1)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;
// the FCC's broadband line from 2015 until it was raised to 100 Mbps in March 2024 (sources in the "thennow" note)
const BROADBAND = 25e6;
export const atBroadband = b => { const s = (b * 8) / BROADBAND; return s < 90 ? `${Math.round(s)} seconds` : `${Math.round(s / 60)} minutes`; };

const lineHtml = l => `<li>${l.text}${l.bytes ? `<div class="track" aria-hidden="true"><b style="--w:100%"></b></div><span class="tick">${size(l.bytes)}</span>` : ""}</li>`;

// plays the lines one by one; Skip ahead (or reduced motion) shows them all at once
export function play(body, ctl, spec) {
  const dur = parseFloat(css("--motion-oldway"));
  body.innerHTML = `<p class="then-label">The old way, re-created and sped up</p><ol class="oldway"></ol>`;
  const ol = body.querySelector("ol");
  return new Promise(done => {
    let i = 0, timer, raf, over = false;
    const finish = () => {
      if (over) return; over = true;
      clearTimeout(timer); cancelAnimationFrame(raf);
      // lines already shown keep their nodes, so a screen reader hears each line once
      [...ol.children].forEach((li, k) => { const tick = li.querySelector(".tick"); if (tick) { tick.textContent = size(spec.lines[k].bytes); tick.removeAttribute("aria-hidden"); li.querySelector("b").style.setProperty("--w", "100%"); } });
      ol.insertAdjacentHTML("beforeend", spec.lines.slice(i).map(lineHtml).join(""));
      ctl.replaceChildren(); done();
    };
    if (!dur) return finish();
    const skip = document.createElement("button");
    skip.type = "button"; skip.className = "btn quiet"; skip.textContent = "Skip ahead"; skip.onclick = finish;
    ctl.replaceChildren(skip);
    const step = () => {
      if (over) return;
      if (i >= spec.lines.length) return finish();
      const l = spec.lines[i++];
      ol.insertAdjacentHTML("beforeend", lineHtml(l));
      if (l.bytes) {
        // the download fills over the line's time; its ticking number stays hidden from screen readers until finish() sets the total
        const li = ol.lastElementChild, bar = li.querySelector("b"), tick = li.querySelector(".tick"), t0 = performance.now();
        tick.setAttribute("aria-hidden", "true");
        const grow = now => {
          const k = Math.min(1, (now - t0) / dur);
          bar.style.setProperty("--w", `${k * 100}%`); tick.textContent = `${size(k * l.bytes)} of ${size(l.bytes)}`;
          if (k < 1 && !over) raf = requestAnimationFrame(grow);
        };
        raf = requestAnimationFrame(grow);
      }
      timer = setTimeout(step, dur);
    };
    step();
  });
}

export const card = spec => `${spec.head ? `<p class="tn-head">${spec.head}</p>` : ""}
  <table class="tn"><thead><tr><th scope="col"><span class="sr">What</span></th><th scope="col">Then</th><th scope="col">Now</th></tr></thead>
  <tbody>${spec.rows.map(([w, a, b]) => `<tr><th scope="row">${w}</th><td>${a}</td><td>${b}</td></tr>`).join("")}</tbody></table>`;
