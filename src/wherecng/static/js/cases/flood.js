import { day, n, stats, RADAR_WATER } from "../api.js";
import { frame, flip, show } from "../map.js";
import { best, paint, star, pct, pctBars } from "../moves.js";
import { note } from "../notes.js";

// north Porto Alegre: the Salgado Filho airport, Sarandi, Humaita
const FLOOD = [-51.2, -30.0, -51.12, -29.95];
const BOX_KM2 = (FLOOD[2] - FLOOD[0]) * 111.32 * Math.cos(((FLOOD[1] + FLOOD[3]) / 2) * Math.PI / 180) * (FLOOD[3] - FLOOD[1]) * 110.95;
const km = v => v < 1 ? n(v, 1) : Math.round(v).toLocaleString("en-US");

const flipDates = ctx => flip(`Normal: ${day(ctx.a.id)}`, `Flood: ${day(ctx.b.id)}`);

export default {
  id: "flood", who: "Responder", title: "Flood Under the Clouds", maxStars: 3,
  blurb: "Record rain floods southern Brazil. Clouds hide it from the camera. See it with radar.",
  steps: [
    ctx => ({ title: "The rain won't stop", text: `<p>May 2024. Record rain floods Rio Grande do Sul, Brazil. Porto Alegre's airport and northern neighborhoods went under.</p><p>It's May 11. You plan rescues: which streets are still under water? Start with today's picture.</p>`,
      go: { label: "Get today's picture", run: async () => {
        await frame(FLOOD);
        // cloud over this box, from the picture's own cloud mask; a scene's cloud_cover is for the whole tile and can say 39% when the box is clear
        const all = await best(FLOOD, "2024-05-05", "2024-05-12", 100);
        const byDate = [...all].sort((x, y) => x.datetime.localeCompare(y.datetime));
        ctx.opt = byDate.at(-1);
        const [now, last] = await Promise.all([ctx.opt, byDate[0]].map(it => stats(it.id, "scl>=8", FLOOD)));
        await paint("b", ctx.opt.id); show("b");
        return `<p>${pct(now)} cloud over your area. The last clear look was ${day(byDate[0].id)} (${pct(last)} cloud). Since then, clouds.</p>${note("clouds")}`;
      } } }),
    () => ({ title: "How do you see under the clouds?", text: `<p>People are waiting on roofs. You need the answer now.</p>`,
      pick: { options: [
        { text: "Wait for clear skies", right: false, why: "People are waiting on roofs now." },
        { text: "Use radar", right: true, why: "Radar sends its own signal and sees through cloud." },
        { text: "Zoom in", right: false, why: "Closer clouds are still clouds." },
      ], then: async () => note("radar") } }),
    ctx => ({ title: "Radar, before and during", text: `<p>In radar, calm water is black. Roofs and streets bounce the signal back bright.</p><p>Flip to see the new black.</p>`,
      go: { label: "Get radar, before and during", run: async () => {
        const [a, b] = await Promise.all([best(FLOOD, "2021-12-05", "2021-12-15", 100, true), best(FLOOD, "2024-05-05", "2024-05-12", 100, true)]);
        ctx.a = a[0]; ctx.b = b[0];
        await paint("a", ctx.a.id); await paint("b", ctx.b.id);
        flipDates(ctx);
        return `<p>Flip between ${day(ctx.a.id)} and ${day(ctx.b.id)}. Dark patches appear in the flood.</p>`;
      } } }),
    ctx => ({ title: "Send the first boat", text: `<p>Tap where you'd send the first boat: a spot that is dark in the flood picture.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.a.id, RADAR_WATER, spot), stats(ctx.b.id, RADAR_WATER, spot)]);
        const wet = b >= 0.5 && a < 0.2; if (wet) star(ctx);
        return `${pctBars("Water at your spot", a, b, "Normal", "Flood")}<div class="say ${wet ? "" : "wrong"}">${wet ? "Good call. That spot was dry and is now under water." : "That spot looks dry in both. Look for new black around the airport and the streets east of the river."}</div>`;
      } } }),
    ctx => ({ title: "Measure the flooded area", text: `<p>Now one number for the rescue center: how much of the box is under water.</p>`,
      go: { label: "Measure the flooded area", wait: "Counting water pixels…", run: async () => {
        const [fa, fb] = await Promise.all([stats(ctx.a.id, RADAR_WATER, FLOOD), stats(ctx.b.id, RADAR_WATER, FLOOD)]);
        ctx.fa = fa; ctx.fb = fb; ctx.ka = fa * BOX_KM2; ctx.kb = fb * BOX_KM2;
        return `${pctBars("Water in the box", fa, fb, "Normal", "Flood")}<p>About ${km(ctx.kb)} km² under water, up from almost none.</p>`;
      } } }),
    ctx => ({ title: "Brief the rescue center", text: `<p>Which line do you hand the center?</p>`,
      pick: { options: [
        { text: "The whole city is under water.", right: false, why: "You measured one box, not the whole city. Overclaiming costs trust." },
        { text: `Radar shows about ${km(ctx.kb)} km² of north Porto Alegre under water on ${day(ctx.b.id)}, around the airport. In a normal year there is almost none. Teams on the ground will confirm street by street.`, right: true, why: "What you found, how you know, and what's still unsure." },
        { text: "The rain has stopped, so the danger is over.", right: false, why: "Nothing you measured says that." },
      ], then: async () => note("honest") } }),
  ],
  file: c => `Question: Which parts of north Porto Alegre were under water in the May 2024 flood?\nFinding: About ${km(c.kb)} km² of the box was under water, up from ${km(c.ka)} km² in a normal week (${pct(c.fb)} of the box, up from ${pct(c.fa)}).\nEvidence: Sentinel-1 radar from ${day(c.a.id)} and ${day(c.b.id)}. The optical pictures that week were ${n(c.least, 0)}% to ${n(c.opt.cloud_cover, 0)}% cloud.\nLimits: one box and one radar pass. Smooth surfaces like runways can look like water. Radar can miss water under trees or between tall buildings.`,
};
