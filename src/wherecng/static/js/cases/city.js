import { day, stats, BURN } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, star, pctBars } from "../moves.js";
import { note } from "../notes.js";

// Altadena (Eaton fire) and Pacific Palisades, boxes the same size so their numbers compare
const EATON = [-118.18, 34.17, -118.06, 34.24], PALI = [-118.62, 34.03, -118.5, 34.1];
const km2 = b => (b[2] - b[0]) * 111.32 * Math.cos(((b[1] + b[3]) / 2) * Math.PI / 180) * (b[3] - b[1]) * 110.95;
// share of the ground that reads as burned. The mean burn score is no use on these pictures:
// ash and dark roofs push both bands near zero, so a few pixels divide by almost nothing and swing the average
const SCORCH = `${BURN}<0.1`;
const top = xs => [...xs].sort((x, y) => (y.covers_aoi_pct || 0) - (x.covers_aoi_pct || 0) || y.datetime.localeCompare(x.datetime))[0];
const newly = (a, b, box) => Math.max(0, Math.round((b - a) * km2(box)));
const flipDates = ctx => flip(`Before: ${day(ctx.a.id)}`, `After: ${day(ctx.b.id)}`);

export default {
  id: "city", who: "Responder", title: "Fire in the City", maxStars: 3,
  blurb: "January 2025. Two wildfires burn into Los Angeles neighborhoods. Measure how much burned.",
  steps: [
    ctx => ({ title: "Two fires at once", text: `<p>January 7, 2025. Hurricane-force winds push two wildfires into Los Angeles: one in Pacific Palisades by the ocean, one in Altadena by the mountains.</p><p>You're on the county's recovery team. Start with Altadena: a picture from just before, and one from after.</p>`,
      go: { label: "Get before and after", run: async () => {
        await frame(EATON);
        const [a, b] = await Promise.all([best(EATON, "2024-12-20", "2025-01-06", 10), best(EATON, "2025-02-15", "2025-02-25", 10)]);
        ctx.a = top(a); ctx.b = top(b);
        await paint("a", ctx.a.id); await paint("b", ctx.b.id);
        flipDates(ctx);
        return `<p>Flip between them. Look at the streets below the mountains.</p>${note("compare")}`;
      } } }),
    ctx => ({ title: "Show the burn", text: `<p>Repaint both with the burn score. Burned brush and burned houses both turn red.</p>`,
      go: { label: "Show the burn score", run: async () => {
        await paint("a", ctx.a.id, BURN); await paint("b", ctx.b.id, BURN);
        flipDates(ctx);
        return `<p>The red spreads through whole neighborhoods, not only the hills.</p>`;
      } } }),
    ctx => ({ title: "Find a burned block", text: `<p>Tap a neighborhood that burned. Red is burned.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.a.id, SCORCH, spot), stats(ctx.b.id, SCORCH, spot)]);
        const hit = b - a > 0.3; if (hit) star(ctx);
        return `${pctBars("Burned ground at your spot", a, b, "Before", "After")}<div class="say ${hit ? "" : "wrong"}">${hit ? "Good call. Most of that block burned." : "Not much changed there. Look for red that was green before."}</div>`;
      } } }),
    ctx => ({ title: "How much burned?", text: `<p>The recovery plan needs one number: how much ground burned in Altadena.</p>`,
      go: { label: "Measure the area", wait: "Measuring every pixel…", run: async () => {
        const [ea, eb, pa, pb] = await Promise.all([[ctx.a, EATON], [ctx.b, EATON], [ctx.a, PALI], [ctx.b, PALI]].map(([it, bx]) => stats(it.id, SCORCH, bx)));
        Object.assign(ctx, { ea, eb, pa, pb, ek: newly(ea, eb, EATON), pk: newly(pa, pb, PALI) });
        return `${pctBars("Burned ground in the box", ea, eb, "Before", "After")}<p>About ${ctx.ek} km² newly burned in your box.</p>`;
      } } }),
    ctx => ({ title: "Which fire burned more?", text: `<p>Same size box over Pacific Palisades. Did more ground burn there, or in Altadena?</p>`,
      pick: { options: [
        { text: "Pacific Palisades", right: ctx.pk > ctx.ek * 1.2, why: `The Palisades box lost about ${ctx.pk} km², Altadena about ${ctx.ek} km².` },
        { text: "Altadena", right: ctx.ek > ctx.pk * 1.2, why: `Altadena lost about ${ctx.ek} km², the Palisades box about ${ctx.pk} km².` },
        { text: "About the same", right: Math.abs(ctx.pk - ctx.ek) <= Math.max(ctx.pk, ctx.ek) * 0.2, why: `About ${ctx.pk} km² in the Palisades box and ${ctx.ek} km² in Altadena.` },
      ], then: async () => {
        await frame(PALI); await paint("a", ctx.a.id, BURN); await paint("b", ctx.b.id, BURN); flipDates(ctx);
        return `${pctBars("Burned ground, Palisades box", ctx.pa, ctx.pb, "Before", "After")}<p>Same pictures, same test, a different place. That's how one team sizes up many fires at once.</p>`;
      } } }),
    ctx => ({ title: "Brief the county", text: `<p>Which line goes in the recovery plan?</p>`,
      pick: { options: [
        { text: "Altadena and Pacific Palisades were wiped out.", right: false, why: "The map shows big burned areas, and streets that made it. Overclaiming costs trust." },
        { text: `Satellite pictures show about ${ctx.ek} km² newly burned in Altadena and ${ctx.pk} km² in the Palisades, inside the areas measured. Crews will count homes.`, right: true, why: "What you found, how you know, and what's still unsure." },
        { text: "The fires were caused by the drought.", right: false, why: "Nothing you measured says what caused them." },
      ], then: async () => note("honest") } }),
  ],
  file: c => `Question: How much ground burned in the January 2025 Los Angeles fires?\nFinding: About ${c.ek} km² newly burned in the Altadena box and ${c.pk} km² in the Pacific Palisades box (each about ${Math.round(km2(EATON))} km²).\nEvidence: Sentinel-2 pictures from ${day(c.a.id)} and ${day(c.b.id)}; ground counted as burned where the burn score is under 0.1.\nLimits: two boxes, not the full fire areas. A burn score shows burned ground, not how many homes were lost.`,
};
