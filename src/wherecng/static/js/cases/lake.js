import { day, n, stats, WATER } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, cover, star } from "../moves.js";
import { note } from "../notes.js";

// the whole lake (OpenStreetMap bounds); a picture is a whole satellite pass, so its tiles together cover the box
const MEAD = [-114.84, 36.0, -114.1, 36.43];
// the shallow north end, where the shoreline moves most
const OVERTON = [-114.48, 36.3, -114.33, 36.45];
const BOX_KM2 = (MEAD[2] - MEAD[0]) * 111.32 * Math.cos(((MEAD[1] + MEAD[3]) / 2) * Math.PI / 180) * (MEAD[3] - MEAD[1]) * 110.95;
// official end-of-month lake level in feet, from https://www.usbr.gov/lc/region/g4000/hourly/mead-elv.html (US Bureau of Reclamation, read 2026-11-12)
const LEVEL = { "2020-04": 1096.39, "2022-08": 1044.28, "2026-07": 1041.1, "2026-08": 1038.83 };
const IS_WATER = `(${WATER})>0`;

const level = it => LEVEL[it.id.match(/_(\d{4})(\d{2})\d{2}_/).slice(1, 3).join("-")];
const year = it => it.id.match(/_(\d{4})/)[1];
const ft = v => `${Math.round(v).toLocaleString("en-US")} ft`;
const km = v => Math.round(v).toLocaleString("en-US");
const flipDates = ctx => flip(day(ctx.a.id), day(ctx.b.id));
const clear = async (from, to) => (await best(MEAD, from, to, 10)).find(i => i.covers_aoi_pct >= 70);

function areaBars(rows) {
  const top = Math.max(...rows.map(r => r.km2));
  return `<div class="measure" aria-label="Water area in square km">${rows.map((r, k) => `<div class="bar${k === rows.length - 1 ? " after" : ""}"><span>${r.year}</span><div class="track"><b style="--w:${Math.max(2, (r.km2 / top) * 100)}%"></b></div><span>${km(r.km2)}</span></div>`).join("")}</div>`;
}

export default {
  id: "lake", who: "Detective", title: "The Vanishing Lake", maxStars: 3,
  blurb: "A post says Lake Mead is almost gone. Measure the water and check the official level.",
  steps: [
    ctx => ({ title: "A post is going viral", text: `<p>It says Lake Mead, the biggest reservoir in the US, is almost gone. Your editor asks: true?</p><p>Start with the latest summer's pictures.</p>`,
      go: { label: "Search summer 2026", run: async () => {
        await frame(MEAD);
        // one search for the month: a picture is a whole pass (all its tiles joined), so a month is a few dozen at most
        const all = await best(MEAD, "2026-08-01", "2026-08-31", 100);
        const whole = all.filter(i => i.covers_aoi_pct >= 70).sort((x, y) => x.cloud_cover - y.cloud_cover);
        const good = whole[0];
        if (!good || good.cloud_cover >= 10) throw new Error("No clear picture of the whole lake that summer.");
        const some = whole.find(i => i.cloud_cover >= 15 && i.cloud_cover < 40);
        const cloudy = whole.find(i => i.cloud_cover >= 40);
        ctx.good = good; ctx.list = [some, good, cloudy].filter(Boolean);
        return `<p>Found ${all.length} pictures. Here are ${ctx.list.length} of them.</p>${note("stac")}`;
      } } }),
    ctx => ({ title: "Which picture is the best evidence?", text: `<p>Tap each picture to see it on the map. All of them show the whole lake. Look for clouds.</p>`,
      look: {
        hint: "Pick the one you trust most.",
        options: ctx.list.map((it, k) => ({ it, text: `Picture ${k + 1}, ${day(it.id)}`, right: it === ctx.good,
          reveal: cover(it),
          why: it === ctx.good ? "No clouds, and it shows most of the lake." : it.cloud_cover >= 40 ? "Clouds hide the water. You can't measure what you can't see." : "A few clouds and their shadows hide bits of the lake. They would throw off the count." })),
        preview: o => paint("a", o.it.id),
        then: async () => { ctx.b = ctx.good; await paint("b", ctx.good.id); return note("clouds"); },
      } }),
    ctx => ({ title: "Go back in time", text: `<p>One picture says little. Look at spring 2020, the fullest the lake has been since these satellites launched, and at summer 2022, a very dry year.</p>`,
      go: { label: "Get 2020 and 2022", wait: "Searching 2 more years…", run: async () => {
        const [a, c] = await Promise.all([clear("2020-04-01", "2020-04-30"), clear("2022-08-10", "2022-08-31")]);
        if (!a || !c) throw new Error("No clear picture of the whole lake in one of those summers.");
        ctx.a = a; ctx.c = c;
        await paint("a", a.id); await paint("b", ctx.b.id);
        flipDates(ctx); await frame(OVERTON);
        return `<p>This is the lake's shallow north end, where a drop shows most. Flip between ${year(a)} and ${year(ctx.b)} with the switch on the map.</p>${note("compare")}`;
      } } }),
    () => ({ title: "Your hunch?", text: `<p>Flip between 2020 and 2026 a few times. Compared to 2020, the lake is…</p>`,
      guess: { options: [{ key: "gone", text: "Almost gone" }, { key: "less", text: "Smaller, but far from gone" }, { key: "same", text: "About the same" }] } }),
    ctx => ({ title: "Measure the water", text: `<p>Eyes can fool you. A water score uses infrared to mark each pixel as water or not. Count the water pixels and you get the lake's area in square km.</p>`,
      go: { label: "Measure the water", wait: "Counting water pixels…", run: async () => {
        await frame(MEAD);
        const [fa, fc, fb] = await Promise.all([ctx.a, ctx.c, ctx.b].map(it => stats(it.id, IS_WATER, MEAD)));
        ctx.rows = [{ it: ctx.a, f: fa }, { it: ctx.c, f: fc }, { it: ctx.b, f: fb }].map(r => ({ it: r.it, km2: r.f * BOX_KM2 * r.it.covers_aoi_pct / 100, year: year(r.it) }));
        ctx.drop = Math.round(((ctx.rows[0].km2 - ctx.rows[2].km2) / ctx.rows[0].km2) * 100);
        ctx.verdict = ctx.drop >= 60 ? "gone" : ctx.drop >= 8 ? "less" : "same";
        const right = ctx.guess === ctx.verdict; if (right) star(ctx);
        const said = { gone: "Almost all the water is gone.", less: `The lake is ${ctx.drop}% smaller than in ${ctx.rows[0].year}. That is a lot, but it is not almost gone.`, same: "Barely any change." }[ctx.verdict];
        return `<p>Water area in this box, square km:</p>${areaBars(ctx.rows)}<div class="say ${right ? "" : "wrong"}">${said} ${right ? "Your hunch was right." : "Not what you guessed, which is why we measure."}</div>${note("bands")}`;
      } } }),
    ctx => ({ title: "Check the official level", text: `<p>A satellite number is a clue. The US Bureau of Reclamation measures the lake's height at Hoover Dam. Put the two side by side.</p>`,
      go: { label: "Show the official levels", run: async () => {
        const rows = ctx.rows.map(r => ({ ...r, ft: level(r.it) }));
        const same = rows.every((r, k) => k === 0 || (r.km2 < rows[k - 1].km2) === (r.ft < rows[k - 1].ft));
        ctx.ftDrop = rows[0].ft - rows[2].ft;
        const lines = rows.map(r => `<li><b>${r.year}</b>: ${km(r.km2)} km² of water, official level ${ft(r.ft)}</li>`).join("");
        return `<ul>${lines}</ul><div class="say ${same ? "" : "wrong"}">${same ? `The 2 agree. Each year the water area and the level move the same way. From ${ctx.rows[0].year} to ${ctx.rows[2].year} the level fell ${ft(ctx.ftDrop)}.` : "The 2 don't line up. Don't publish until you know why."}</div>${note("groundtruth")}`;
      } } }),
    ctx => ({ title: "Brief the public", text: `<p>Which line do you hand your editor?</p>`,
      pick: { options: [
        { text: "Lake Mead is almost gone.", right: false, why: "The lake lost water but most of it is still there. Overclaiming costs trust." },
        { text: `Satellite pictures show the lake's water area is ${ctx.drop}% smaller than in ${ctx.rows[0].year}, and the official level is down ${ft(ctx.ftDrop)}. The lake is low, not gone.`, right: true, why: "What you found, how you know, and what's still unsure." },
        { text: "The lake is the cleanest it has ever been.", right: false, why: "Nothing you measured is about water quality." },
      ], then: async () => note("honest") } }),
  ],
  found: c => [`Lake Mead's water area is ${c.drop}% smaller than in ${c.rows[0].year}, and the official level is down ${ft(c.ftDrop)}.`,
    c.verdict === "gone" ? "The post holds up. The pictures and the official level agree." : "The post is wrong. The lake is low, not gone. A picture plus a measurement on the ground settles what a picture alone can't."],
  file: c => `Claim: Lake Mead is almost gone.\nFinding: Not supported. The lake is low. Its water area in the box fell ${c.drop}% from ${year(c.a)} to ${year(c.b)} (${km(c.rows[0].km2)} to ${km(c.rows[2].km2)} km²), and the official level fell ${ft(c.ftDrop)}.\nEvidence: Sentinel-2 pictures from ${day(c.a.id)}, ${day(c.c.id)} and ${day(c.b.id)}. Official end-of-month levels from the US Bureau of Reclamation: ${c.rows.map(r => `${r.year} ${ft(level(r.it))}`).join(", ")}.\nLimits: one box over the main body of the lake, 3 days, and a water score that can miss muddy or shallow water. Areas are for the box, not the whole lake.`,
};
