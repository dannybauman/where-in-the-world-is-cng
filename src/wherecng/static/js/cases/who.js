import { day, n, stats, BURN, WATER } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, pct, pctBars, bars } from "../moves.js";
import { note } from "../notes.js";

// Scene 1: south of Laurel, Mississippi. Scene 2: northern Dominica. Scene 3: Manchar Lake, Sindh
const T = [-89.58, 31.56, -89.28, 31.80];
const D = [-61.5, 15.3, -61.2, 15.6];
const M = [67.45, 26.4, 67.75, 26.7];
const T_IDS = ["S2A_16SBA_20200405_0_L2A", "S2B_16SBA_20200430_0_L2A"];
const D_IDS = ["S2B_20PPC_20170904_0_L2A", "S2A_20PPC_20171029_0_L2A"];
const M_IDS = ["S2B_42RUQ_20220607_0_L2A", "S2A_42RUQ_20220910_0_L2A", "S2B_42RUQ_20221008_0_L2A", "S2A_42RUQ_20221122_0_L2A", "S2B_42RUQ_20221227_0_L2A"];
const MONTHS = ["June", "Sept", "Oct", "Nov", "Dec"];
const GREEN = "((nir-red)/(nir+red))>0.5";
const IS_WATER = `(${WATER})>0`;
// 3 cross-sections of the Mississippi track: their centers, and the direction across the track in km (east, north)
const CENTERS = [[-89.50, 31.61], [-89.41, 31.66], [-89.33, 31.71]];
const ACROSS = [-28.9, 44.6], STEP = 0.3, HALF = 7, DROP = -0.1;
const QUARTERS = [["Northwest", [-61.5, 15.45, -61.35, 15.6]], ["Northeast", [-61.35, 15.45, -61.2, 15.6]], ["Southwest", [-61.5, 15.3, -61.35, 15.45]], ["Southeast", [-61.35, 15.3, -61.2, 15.45]]];

// a search by place and one date, then the picture with that id
const find = async (b, d, id) => { const all = await best(b, d, d, 100); return all.find(i => i.id === id) || all[0]; };
const km1 = v => n(v, 1);

// change in plant health score at one point of a cross-section: after minus before
async function change(ctx, [cx, cy], k) {
  const len = Math.hypot(...ACROSS), d = k * STEP, lat = cy + (d * ACROSS[1] / len) / 110.95, lon = cx + (d * ACROSS[0] / len) / (111.32 * Math.cos(cy * Math.PI / 180));
  const b = [lon - 0.001, lat - 0.0009, lon + 0.001, lat + 0.0009];
  const [x, y] = await Promise.all([stats(ctx.ta.id, BURN, b), stats(ctx.tb.id, BURN, b)]);
  return y - x;
}
// the longest run of points that dropped by DROP or more and holds the deepest drop, times the step
function width(ch) {
  const m = ch.indexOf(Math.min(...ch));
  if (ch[m] > DROP) return 0;
  let lo = m, hi = m;
  while (lo > 0 && ch[lo - 1] <= DROP) lo--;
  while (hi < ch.length - 1 && ch[hi + 1] <= DROP) hi++;
  return (hi - lo + 1) * STEP;
}
const lineLen = () => {
  const [a, b] = [CENTERS[0], CENTERS.at(-1)], my = (a[1] + b[1]) / 2 * Math.PI / 180;
  return Math.hypot((b[0] - a[0]) * 111.32 * Math.cos(my), (b[1] - a[1]) * 110.95);
};

function waterBars(rows) {
  const top = Math.max(...rows.map(r => r.f));
  return `<div class="measure" aria-label="Share of the box under water">${rows.map((r, k) => `<div class="bar${k === rows.length - 1 ? " after" : ""}"><span>${r.m}</span><div class="track"><b style="--w:${Math.max(2, (r.f / top) * 100)}%"></b></div><span>${pct(r.f)}</span></div>`).join("")}</div>`;
}

export default {
  id: "who", who: "Investigator", title: "Who Did It?", maxStars: 4,
  blurb: "Three disasters, three wrong guesses about what caused them. Read the mark each one left and name the real one.",
  steps: [
    ctx => ({ title: "Scene 1: Mississippi, April 2020", text: `<p>You work for a disaster aid fund. In each scene, someone blames the wrong kind of event. You measure the mark it left and name the real one. Not every suspect is weather.</p><p>A local post says straight-line winds flattened the woods south of Laurel. The National Weather Service survey team needs to know where to walk.</p>`,
      go: { label: "Search before and after", run: async () => {
        await frame(T);
        const [a, b] = await Promise.all([find(T, "2020-04-05", T_IDS[0]), find(T, "2020-04-30", T_IDS[1])]);
        ctx.ta = a; ctx.tb = b;
        await paint("a", a.id); await paint("b", b.id);
        flip(day(a.id), day(b.id));
        return `<p>Flip between ${day(a.id)} and ${day(b.id)}. Look for a faint brown band running southwest to northeast.</p>${note("stac")}`;
      } } }),
    ctx => ({ title: "Find the damage", text: `<p>Tap the damage.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.ta.id, BURN, spot), stats(ctx.tb.id, BURN, spot)]);
        const hit = b - a <= -0.08;
        return { right: hit, html: `${bars("Plant health score at your spot", a, b, "Before", "After")}<div class="say ${hit ? "" : "wrong"}">${hit ? "Good call. Plant health dropped here." : "Not much changed here. Look for the brown band and tap on it."}</div>` };
      } } }),
    ctx => ({ title: "Measure across it", text: `<p>How wide is the band, and how long? Take 3 cross-sections along it. Each one reads 15 points, 0.3 km apart.</p>`,
      go: { label: "Measure the band", wait: "Measuring the band…", run: async () => {
        let done = 0;
        const total = CENTERS.length * (2 * HALF + 1);
        const ch = await Promise.all(CENTERS.map(c => Promise.all(Array.from({ length: 2 * HALF + 1 }, (_, i) => change(ctx, c, i - HALF).then(v => { ctx.say?.(`Measured ${++done} of ${total} points…`); return v; })))));
        ctx.w = ch.map(width); ctx.len = lineLen();
        const ok = ctx.w.filter(Boolean);
        if (!ok.length) throw new Error("The band didn't show in the measurements. Try again.");
        ctx.avg = ok.reduce((x, y) => x + y, 0) / ok.length;
        const lines = ctx.w.map((w, k) => `<li>Cross-section ${k + 1}: ${w ? `${km1(w)} km wide` : "no clear band"}</li>`).join("");
        return `<ul>${lines}</ul><p>Length: about ${Math.round(ctx.len)} km between the first and last.</p><div class="say">Between ${km1(Math.min(...ok))} and ${km1(Math.max(...ok))} km wide, along at least ${Math.round(ctx.len)} km.</div>${note("mark")}`;
      } } }),
    ctx => ({ title: "Who did it?", text: `<p>You measured a mark about ${km1(ctx.avg)} km wide and at least ${Math.round(ctx.len)} km long. Which suspect leaves that mark?</p>`,
      pick: { options: [
        { text: "Tornado: a narrow, straight track, a few hundred meters to 2 km wide, many km long.", right: true, why: `Your own cross-sections were about ${km1(ctx.avg)} km wide and ran at least ${Math.round(ctx.len)} km. That is a tornado track. The National Weather Service survey later rated this one EF4.` },
        { text: "Straight-line winds: damage spread wide, field after field, with no single track.", right: false, why: `A band ${km1(ctx.avg)} km wide and at least ${Math.round(ctx.len)} km long is a track. Straight-line winds spread damage wide.` },
        { text: "Hurricane: damage tens of km wide, across whole regions.", right: false, why: `Your band is about ${km1(ctx.avg)} km wide, not tens of km.` },
        { text: "Hail: a swath 5 to 15 km wide, mostly in crops.", right: false, why: `Your band is about ${km1(ctx.avg)} km wide. A hail swath is 5 to 15 km.` },
      ] } }),
    ctx => ({ title: "Scene 2: Dominica, September 2017", text: `<p>An early report says a flash flood tore down one valley of Dominica. An aid team has to choose: send everything to one valley, or spread out over the whole island.</p>`,
      go: { label: "Search before and after", run: async () => {
        await frame(D);
        const [a, b] = await Promise.all([find(D, "2017-09-04", D_IDS[0]), find(D, "2017-10-29", D_IDS[1])]);
        ctx.da = a; ctx.db = b;
        await paint("a", a.id); await paint("b", b.id);
        flip(day(a.id), day(b.id));
        return `<p>Flip between ${day(a.id)} and ${day(b.id)}. Does the change sit in one valley, or everywhere?</p>`;
      } } }),
    ctx => ({ title: "Measure the green in 4 parts of the island", text: `<p>Split the box into 4 parts. In each one, measure the share of the box that is green forest, before and after.</p>`,
      go: { label: "Measure the 4 parts", wait: "Measuring 8 places…", run: async () => {
        const r = await Promise.all(QUARTERS.map(([, q]) => Promise.all([stats(ctx.da.id, GREEN, q), stats(ctx.db.id, GREEN, q)])));
        ctx.q = r;
        ctx.loss = Math.floor(Math.min(...r.map(([a, b]) => (a - b) / a)) * 10) * 10;
        const out = r.map(([a, b], k) => `<p><b>${QUARTERS[k][0]}</b></p>${pctBars(`${QUARTERS[k][0]} green forest`, a, b, "Before", "After")}`).join("");
        return `${out}<div class="say">Every part lost at least ${ctx.loss}% of its green. The damage spread over the whole island, not one valley.</div>`;
      } } }),
    ctx => ({ title: "Who did it?", text: `<p>Every part of the island lost green forest. Which suspect leaves that mark?</p>`,
      pick: { options: [
        { text: "Hurricane: wide damage across a whole region, every slope at once.", right: true, why: `All 4 parts lost at least ${ctx.loss}% of their green. That is Hurricane Maria.` },
        { text: "Flash flood: a narrow scoured channel down one valley, and mud where it meets the sea.", right: false, why: "A flash flood hits one valley. You measured loss in all 4 parts." },
        { text: "Tornado: one narrow track.", right: false, why: "A tornado leaves one track a few km wide at most. The loss here covers the island." },
        { text: "Landslide: bare scars on steep slopes, one hillside at a time.", right: false, why: "Landslides scar one hillside at a time. The loss here is everywhere." },
      ] } }),
    ctx => ({ title: "Scene 3: Sindh, Pakistan, 2022", text: `<p>A post says a dam broke at Manchar Lake. It calls it a flash flood and says the water will be gone in days. A farm aid program has to decide whether farmers can plant winter wheat in November.</p>`,
      go: { label: "Search June and September", run: async () => {
        await frame(M);
        const [a, b] = await Promise.all([find(M, "2022-06-07", M_IDS[0]), find(M, "2022-09-10", M_IDS[1])]);
        ctx.m = [a, b];
        await paint("a", a.id); await paint("b", b.id);
        flip(day(a.id), day(b.id));
        return `<p>Flip between ${day(a.id)} and ${day(b.id)}. Green, muddy water spreads over the flat land around the lake.</p>`;
      } } }),
    () => ({ title: "Your hunch?", text: `<p>The post says the water will be gone in days. How much of the flood water do you think is left in late November?</p>`,
      guess: { options: [{ key: "gone", text: "Mostly gone" }, { key: "half", text: "About half left" }, { key: "still", text: "Still mostly there" }] } }),
    ctx => ({ title: "Search the next 3 months", text: `<p>Look at October, November and December too. Then measure the water on all 5 dates.</p>`,
      go: { label: "Measure all 5 dates", wait: "Searching 3 more months…", run: async () => {
        const rest = await Promise.all([["2022-10-08", 2], ["2022-11-22", 3], ["2022-12-27", 4]].map(([d, k]) => find(M, d, M_IDS[k])));
        ctx.m = [...ctx.m, ...rest];
        ctx.say?.("Measuring the water on 5 dates…");
        const f = await Promise.all(ctx.m.map(it => stats(it.id, IS_WATER, M)));
        ctx.f = f;
        const rows = f.map((v, k) => ({ m: MONTHS[k], f: v }));
        // share of the extra water at the September peak still there in November
        ctx.left = (f[3] - f[0]) / (f[1] - f[0]);
        ctx.verdict = ctx.left > 0.6 ? "still" : ctx.left < 0.25 ? "gone" : "half";
        const right = ctx.guess === ctx.verdict;
        return `${waterBars(rows)}<div class="say ${right ? "" : "wrong"}">By late November, water covered ${pct(f[3])} of the box, against ${pct(f[0])} in June and ${pct(f[1])} at the peak. About ${pct(ctx.left)} of the flood water was still there. ${right ? "Your hunch was right." : "Not what you guessed, which is why we measure."}</div>${note("fastmaps")}`;
      } } }),
    ctx => ({ title: "Who did it?", text: `<p>The water peaked at ${pct(ctx.f[1])} of the box in September. It was still ${pct(ctx.f[3])} in November and ${pct(ctx.f[4])} in December. Which suspect leaves that mark?</p>`,
      pick: { options: [
        { text: "Monsoon flood: slow, wide, shallow water over flat land that stays for weeks or months.", right: true, why: `Water covered ${pct(ctx.f[0])} in June, ${pct(ctx.f[1])} in September and still ${pct(ctx.f[3])} in November. It stays for months, so the wheat has to wait.` },
        { text: "Flash flood: drains within days and leaves a scoured channel and mud.", right: false, why: `A flash flood drains in days. You measured ${pct(ctx.f[3])} water in November.` },
        { text: "Tsunami: not weather at all. An earthquake or landslide pushes the sea, and it hits the coast. Manchar Lake is about 300 km from the sea.", right: false, why: "A tsunami hits the coast. This lake is about 300 km inland." },
        { text: "Dam break: a sudden wall of water from one point, gone in days.", right: false, why: `A dam break is gone in days. Your water was still ${pct(ctx.f[3])} in November.` },
      ], then: async () => note("honest") } }),
  ],
  pics: c => [["Mississippi before", c.ta?.id], ["Mississippi after", c.tb?.id], ["Dominica before", c.da?.id], ["Dominica after", c.db?.id], ["Pakistan June", c.m?.[0]?.id], ["Pakistan September", c.m?.[1]?.id], ["Pakistan November", c.m?.[3]?.id]],
  ground: () => "The National Weather Service surveyed the Mississippi track on foot and rated it EF4.",
  also: "The National Weather Service, the National Hurricane Center and Pakistan's flood agencies reported these events.",
  found: c => [`Mississippi was a tornado: a band about ${km1(c.avg)} km wide and at least ${Math.round(c.len)} km long. Dominica was a hurricane: every part of the island lost at least ${c.loss}% of its green. Sindh was a monsoon flood: water covered ${pct(c.f[3])} of the box in November, against ${pct(c.f[0])} in June.`,
    "The mark tells you the cause. Free open data measured it, and nobody had to visit."],
  file: c => `Claim: Three posts blamed the wrong event. Mississippi, April 2020: straight-line winds. Dominica, September 2017: a flash flood down one valley. Sindh, 2022: a dam break and a flash flood that drains in days.\nFinding: Mississippi was a tornado, a band about ${km1(c.avg)} km wide (${c.w.map(km1).join(", ")} km at 3 places) along at least ${Math.round(c.len)} km. Dominica was Hurricane Maria, with green forest at ${c.q.map(([a, b], k) => `${QUARTERS[k][0]} ${pct(a)} to ${pct(b)}`).join(", ")}. Sindh was a monsoon flood, with water over ${c.f.map((v, k) => `${pct(v)} of the box in ${MONTHS[k]}`).join(", ")}.\nEvidence: Sentinel-2 pictures from ${day(c.ta.id)} and ${day(c.tb.id)}, ${day(c.da.id)} and ${day(c.db.id)}, and ${c.m.map(i => day(i.id)).join(", ")}. A plant health score ${BURN} and a water score ${WATER}. The National Weather Service surveyed the Mississippi track on foot and rated it EF4.\nLimits: one box per scene and only a few dates. Spring green-up between the 2 Mississippi dates raises plant health, so the drop on the track, if anything, reads smaller than it was. The Dominica pictures have clouds (about 18% in both, which does not explain the drop). A water score can miss muddy water. The game cannot check these events against the live event feed, because that feed lists only open events.`,
};
