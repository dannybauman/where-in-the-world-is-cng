import { day, n, stats, BURN } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, bars, star } from "../moves.js";
import { note } from "../notes.js";

const GORGE = [-122.05, 45.55, -121.75, 45.72];
const flipDates = ctx => flip(`Before: ${day(ctx.a.id)}`, `After: ${day(ctx.b.id)}`);

export default {
  id: "fire", who: "Responder", title: "After the Fire", maxStars: 3,
  blurb: "A 2017 wildfire burned in Oregon's Columbia River Gorge. Find where, and send crews.",
  steps: [
    ctx => ({ title: "The gorge is burning", text: `<p>September 2017. A wildfire burns for weeks in the Columbia River Gorge. You lead recovery: where did it burn, and how badly?</p><p>Start with a picture from just before the fire and one from just after.</p>`,
      go: { label: "Get before and after", run: async () => {
        await frame(GORGE);
        const [a, b] = await Promise.all([best(GORGE, "2017-08-20", "2017-08-31", 10), best(GORGE, "2017-10-01", "2017-10-10", 10)]);
        ctx.a = a[0]; ctx.b = b[0];
        await paint("a", ctx.a.id); await paint("b", ctx.b.id);
        flipDates(ctx);
        return `<p>Flip between them with the switch on the map.</p>${note("compare")}`;
      } } }),
    () => ({ title: "Hard to see, right?", text: `<p>Autumn colors, shadows and haze all look brown. How could you see the burn more clearly?</p>`,
      pick: { options: [
        { text: "Zoom in closer", right: false, why: "More zoom just shows more brown." },
        { text: "Look in infrared", right: true, why: "Healthy plants glow in infrared. Burned ground doesn't." },
        { text: "Wait for the trees to grow back", right: false, why: "Crews need the answer now." },
      ], then: async () => note("bands") } }),
    ctx => ({ title: "Switch to infrared", text: `<p>Repaint both pictures with a burn score. Green is healthy. Red is burned.</p>`,
      go: { label: "Show the burn score", run: async () => {
        await paint("a", ctx.a.id, BURN); await paint("b", ctx.b.id, BURN);
        flipDates(ctx);
        return `<p>Flip again. The burn jumps out.</p>`;
      } } }),
    ctx => ({ title: "Send the first crew", text: `<p>Tap where you'd send the first crew: the worst-burned spot you can see. Red is burned.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.a.id, BURN, spot), stats(ctx.b.id, BURN, spot)]);
        const burned = b < 0.3 && a - b > 0.15; if (burned) star(ctx);
        return `${bars("Burn score at your spot", a, b, "Before", "After")}<div class="say ${burned ? "" : "wrong"}">${burned ? "Good call. That spot burned hard." : "That spot looks mostly unburned. Look for deep red south of the river."}</div>`;
      } } }),
    ctx => ({ title: "Measure the whole area", text: `<p>Now one number for the report: the burn score over the whole box.</p>`,
      go: { label: "Measure the area", wait: "Measuring every pixel…", run: async () => {
        const [a, b] = await Promise.all([stats(ctx.a.id, BURN, GORGE), stats(ctx.b.id, BURN, GORGE)]);
        ctx.ma = a; ctx.mb = b; ctx.drop = Math.round(((a - b) / a) * 100);
        return `${bars("Burn score", a, b, "Before", "After")}<p>Down ${ctx.drop}% across the area.</p>`;
      } } }),
    ctx => ({ title: "Brief the public", text: `<p>Which line do you hand your chief?</p>`,
      pick: { options: [
        { text: "The whole gorge was destroyed.", right: false, why: "The map shows patches, not everything. Overclaiming costs trust." },
        { text: `Satellite data shows a ${ctx.drop}% drop in plant health across the area, mostly south of the river. Crews will confirm.`, right: true, why: "What you found, how you know, and what's still unsure." },
        { text: "The fire caused flooding.", right: false, why: "Nothing you measured is about flooding." },
      ], then: async () => note("honest") } }),
  ],
  file: c => `Question: Where did the 2017 Eagle Creek fire burn?\nFinding: Burn score fell ${c.drop}% across the area (${n(c.ma)} to ${n(c.mb)}), mostly south of the river.\nEvidence: Sentinel-2 pictures from ${day(c.a.id)} and ${day(c.b.id)}.\nLimits: a score, not a damage survey. Crews confirm on the ground.`,
};
