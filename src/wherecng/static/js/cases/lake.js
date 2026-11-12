import { day, n, stats, WATER } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, bars, cover, star } from "../moves.js";
import { note } from "../notes.js";

const MEAD = [-114.85, 36.0, -114.35, 36.4];

export default {
  id: "lake", who: "Detective", title: "The Vanishing Lake", maxStars: 2,
  blurb: "A post says Lake Mead shrank a lot this year. Find out if it's true.",
  steps: [
    () => ({ title: "A post is going viral", text: `<p>It says Lake Mead, the biggest reservoir in the US, shrank a lot in the past year. Your editor asks: true?</p><p>You can't fly to Nevada. But satellites photograph the lake every few days, so you'll check.</p>${note("satellite")}` }),
    ctx => ({ title: "Find last summer's pictures", text: `<p>Search the archive for pictures of the lake from summer 2025.</p>`,
      go: { label: "Search summer 2025", run: async () => {
        await frame(MEAD);
        const all = await best(MEAD, "2025-07-01", "2025-08-31", 90);
        const good = all.find(i => i.cloud_cover < 10 && i.covers_aoi_pct >= 70);
        if (!good) throw new Error("No clear picture of the whole lake that summer.");
        const part = all.find(i => i.cloud_cover < 20 && i.covers_aoi_pct < 50);
        const cloudy = all.find(i => i.cloud_cover >= 40);
        ctx.good = good; ctx.list = [part, good, cloudy].filter(Boolean);
        return `<p>Found ${all.length} pictures. Here are ${ctx.list.length} of them.</p>${note("stac")}`;
      } } }),
    ctx => ({ title: "Which picture is the best evidence?", text: `<p>Tap each picture to see it on the map. Look for clouds, and for parts of the lake that are missing.</p>`,
      look: {
        hint: "Pick the one you trust most.",
        options: ctx.list.map((it, k) => ({ it, text: `Picture ${k + 1}, ${day(it.id)}`, right: it === ctx.good,
          reveal: cover(it),
          why: it === ctx.good ? "No clouds, and it shows most of the lake." : it.cloud_cover >= 40 ? "Clouds hide the water. You can't measure what you can't see." : "It's clear, but it misses part of the lake. Half a lake is half the evidence." })),
        preview: o => paint("a", o.it.id),
        then: async () => { ctx.a = ctx.good; await paint("a", ctx.good.id); return `${note("clouds")}${note("fastmaps")}`; },
      } }),
    ctx => ({ title: "Now this summer", text: `<p>Get the same place, same season, one year later.</p>`,
      go: { label: "Search summer 2026", run: async () => {
        ctx.b = (await best(MEAD, "2026-07-01", "2026-08-31"))[0];
        await paint("b", ctx.b.id);
        flip(day(ctx.a.id), day(ctx.b.id));
        return `<p>Use the switch on the map to flip between the 2 years.</p>${note("compare")}`;
      } } }),
    () => ({ title: "Your hunch?", text: `<p>Flip between the years a few times. Compared to last year, the lake has…</p>`,
      guess: { options: [{ key: "less", text: "Much less water" }, { key: "same", text: "About the same" }, { key: "more", text: "More water" }] } }),
    ctx => ({ title: "Measure it", text: `<p>Eyes can fool you. Water looks dark in infrared, so a water score over every pixel tells you how much water is in the frame.</p>`,
      go: { label: "Measure the water", wait: "Measuring every pixel…", run: async () => {
        const [a, b] = await Promise.all([stats(ctx.a.id, WATER, MEAD), stats(ctx.b.id, WATER, MEAD)]);
        ctx.ma = a; ctx.mb = b;
        const d = b - a; ctx.verdict = d < -0.03 ? "less" : d > 0.03 ? "more" : "same";
        const right = ctx.guess === ctx.verdict; if (right) star(ctx);
        const said = { less: "There's clearly less water.", same: "Barely any change. The post doesn't hold up.", more: "There's more water, not less." }[ctx.verdict];
        return `${bars("Water score", a, b, day(ctx.a.id), day(ctx.b.id))}<div class="say ${right ? "" : "wrong"}">${said} ${right ? "Your hunch was right." : "Not what you guessed, which is why we measure."}</div>${note("bands")}${note("groundtruth")}`;
      } } }),
  ],
  file: c => `Claim: Lake Mead shrank a lot in the past year.\nFinding: ${{ less: "True, there is less water.", same: "Not supported. Little change.", more: "False, there is more water." }[c.verdict]}\nEvidence: Sentinel-2 pictures from ${day(c.a.id)} and ${day(c.b.id)}. Water score went from ${n(c.ma)} to ${n(c.mb)}.\nLimits: one area, 2 days. Check the official lake level before publishing.`,
};
