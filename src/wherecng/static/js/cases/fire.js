import { day, n, stats, BURN } from "../api.js";
import { frame, flip } from "../map.js";
import { best, paint, bars } from "../moves.js";
import { note } from "../notes.js";

const GORGE = [-122.05, 45.55, -121.75, 45.72];
const flipDates = ctx => flip(`Before: ${day(ctx.a.id)}`, `After: ${day(ctx.b.id)}`);

export default {
  id: "fire", who: "Responder", title: "After the Fire", maxStars: 4,
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
    ctx => ({ title: "Switch to infrared", text: `<p>Repaint both pictures with a plant health score. Green is healthy. Red is burned.</p>`,
      go: { label: "Show plant health", run: async () => {
        await paint("a", ctx.a.id, BURN); await paint("b", ctx.b.id, BURN);
        flipDates(ctx);
        return `<p>Flip again. The burn jumps out.</p>`;
      } } }),
    ctx => ({ title: "Send the first crew", text: `<p>Tap where you'd send the first crew: the worst-burned spot you can see. Red is burned.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.a.id, BURN, spot), stats(ctx.b.id, BURN, spot)]);
        const burned = b < 0.3 && a - b > 0.15;
        return { right: burned, html: `${bars("Plant health score at your spot", a, b, "Before", "After")}<div class="say ${burned ? "" : "wrong"}">${burned ? "Good call. That spot burned hard." : "That spot looks mostly unburned. Look for deep red south of the river."}</div>` };
      } } }),
    ctx => ({ title: "Measure the whole area", text: `<p>Now one number for the report: the plant health score over the whole box.</p>`,
      go: { label: "Measure the area", wait: "Measuring every pixel…", run: async () => {
        const [a, b] = await Promise.all([stats(ctx.a.id, BURN, GORGE), stats(ctx.b.id, BURN, GORGE)]);
        ctx.ma = a; ctx.mb = b; ctx.drop = Math.round(((a - b) / a) * 100);
        return `${bars("Plant health score", a, b, "Before", "After")}<p>Down ${ctx.drop}% across the area.</p>`;
      } } }),
    ctx => ({ title: "Brief your chief", text: `<p>Which line do you hand your chief?</p>`,
      pick: { options: [
        { text: `Satellite data shows the fire destroyed ${ctx.drop}% of the forest in the area, mostly south of the river. Crews can skip the north side.`, right: false, why: `A ${ctx.drop}% lower score is not ${ctx.drop}% of the forest destroyed. And nobody has checked the north side.` },
        { text: `Satellite data shows a ${ctx.drop}% drop in plant health across the area, mostly south of the river. Crews will confirm.`, right: true, why: "What you found, how you know, and what's still unsure." },
        { text: `Satellite data shows a ${ctx.drop}% drop in plant health across the area, mostly south of the river. The forest will not grow back.`, right: false, why: "One picture after the fire can't tell you what grows back." },
      ], then: async () => note("honest") } }),
    ctx => ({ title: "Years later", text: `<p>The gorge reopened. Did the forest come back? Look at the same time of year, 5 years on.</p>`,
      go: { label: "Show 2022", wait: "Measuring every pixel…", run: async () => {
        ctx.c = (await best(GORGE, "2022-08-20", "2022-08-31", 10))[0];
        await paint("a", ctx.b.id, BURN); await paint("b", ctx.c.id, BURN);
        flip(`Just after: ${day(ctx.b.id)}`, `2022: ${day(ctx.c.id)}`);
        ctx.mc = await stats(ctx.c.id, BURN, GORGE);
        ctx.gap = Math.round(((ctx.ma - ctx.mc) / ctx.ma) * 100);
        return `<p>Flip between them. Some red turned green.</p>${bars("Plant health score, same time of year", ctx.ma, ctx.mc, "2017, before", "2022")}<p>Plants are coming back. The area is still ${ctx.gap}% below where it was before the fire.</p>`;
      } } }),
    ctx => ({ title: "Where to replant", text: `<p>Tap a spot that is still burned in 2022. Red is burned. Crews will plant there first.</p>`,
      tap: { run: async spot => {
        const [a, c] = await Promise.all([stats(ctx.a.id, BURN, spot), stats(ctx.c.id, BURN, spot)]);
        const bare = c < 0.3 && a - c > 0.15;
        return { right: bare, html: `${bars("Plant health score at your spot", a, c, "Before", "2022")}<div class="say ${bare ? "" : "wrong"}">${bare ? "Good call. That spot burned in 2017 and is still bare." : "That spot looks green again, or it never burned. Look for the patches that are still red."}</div>` };
      } } }),
  ],
  pics: c => [["Before the fire", c.a?.id], ["After the fire", c.b?.id], ["2022", c.c?.id]],
  found: c => [`The fire cut plant health ${c.drop}% across the gorge. By 2022 the area was still ${c.gap}% below where it started.`,
    "Infrared shows a burn the eye misses. The same score, years later, shows crews where to replant."],
  file: c => `Question: Where did the 2017 Eagle Creek fire burn?\nFinding: Plant health score fell ${c.drop}% across the area (${n(c.ma)} to ${n(c.mb)}), mostly south of the river.\nEvidence: Sentinel-2 pictures from ${day(c.a.id)} and ${day(c.b.id)}.\nRecovery: by 2022 the plant health score was still ${c.gap}% below its level before the fire, at the same time of year.\nLimits: a score, not a damage survey. Crews confirm on the ground.`,
};
