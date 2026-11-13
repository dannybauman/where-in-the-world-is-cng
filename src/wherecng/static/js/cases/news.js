import { api, q, esc, box, n, day, geocode } from "../api.js";
import { frame } from "../map.js";
import { clearest, paint } from "../moves.js";
import { note } from "../notes.js";

export default {
  id: "news", who: "Reporter", title: "Right Now, Near You", maxStars: 1,
  blurb: "Pick any place. Find out what's happening there today, and write a headline.",
  steps: [
    ctx => ({ title: "Pick a place", text: `<p>Readers ask: is anything going on near us? Choose a town, lake, mountain or park.</p>`,
      ask: { label: "Place name", placeholder: "e.g. Portland, Oregon", button: "Check this place", wait: "Finding the place…", run: async name => {
        const g = await geocode(name);
        const [w, s, e, nn] = g.bbox, pad = Math.max(0.05, (e - w) * 0.1);
        Object.assign(ctx, { box: [w - pad, s - pad, e + pad, nn + pad], name: esc(g.name.split(/[,(]/)[0].trim()), full: esc(g.name), lat: g.lat, lon: g.lon });
        frame(ctx.box);
        ctx.say("Checking fires, storms, floods and weather…");
        // weather is a side note: if it doesn't answer, the story goes on without it
        const [ev, wx] = await Promise.all([api(`/api/events?${q({ ...box(ctx.box), days: 30 })}`), api(`/api/weather?${q({ lat: ctx.lat, lon: ctx.lon })}`).catch(() => null)]);
        ctx.events = [...(ev.eonet || []), ...(ev.gdacs || [])].map(x => esc(x.title || x.name || "event")).slice(0, 4);
        ctx.feedsOk = Object.values(ev.sources || {}).every(s => s.ok);
        const d = wx?.daily;
        if (d) {
          const today = new Date().toISOString().slice(0, 10), k = Math.max(0, d.time.indexOf(today));
          ctx.rain = d.precipitation_sum.slice(0, k).reduce((a, b) => a + (b || 0), 0); ctx.high = d.temperature_2m_max[k];
        }
        ctx.weather = d ? `${n(ctx.rain, 0)} mm of rain this past week, high of ${n(ctx.high, 0)} °C today` : "";
        ctx.say("Getting the latest clear picture…");
        try { const it = await clearest(ctx.box, 45, 30); ctx.scene = day(it.id); await paint("a", it.id); }
        catch { ctx.scene = null; }
        const evs = ctx.events.length ? ctx.events.map(t => `<li>${t}</li>`).join("") : `<li>No fires, storms or floods listed${ctx.feedsOk ? "" : " (one feed didn't answer)"}</li>`;
        return `<p>${ctx.full}, last 30 days:</p><ul class="list">${evs}<li>${ctx.weather || "Weather didn't answer this time"}</li>
          <li>${ctx.scene ? `Latest clear picture: ${ctx.scene}` : "Too cloudy for a clear picture in 45 days"}</li></ul>${note("feeds")}`;
      } } }),
    ctx => {
      const k = ctx.events.length;
      const fact = k ? `${k} natural event${k > 1 ? "s" : ""} listed near ${ctx.name} this month` : `No disaster alerts near ${ctx.name} this month`;
      return { title: "Write the headline", text: `<p>Pick the one you'd put your name on.</p>`, pick: { options: [
        { text: k ? `${ctx.name} in danger as disasters strike` : `${ctx.name} is totally safe, experts say`, right: false, why: k ? "\"In danger\" isn't in the data." : "An empty feed isn't proof of safety, and no expert said it." },
        { text: `${fact}, per NASA and GDACS feeds`, right: true, why: "It says what the data shows and where it came from." },
        { text: `Satellites spy on ${ctx.name}`, right: false, why: "Catchy, but it tells readers nothing." },
      ], then: async () => { ctx.headline = `${fact}, per NASA and GDACS feeds`; return note("honest"); } } };
    },
  ],
  file: c => `Headline: ${c.headline}\nEvidence: ${c.events.length ? c.events.join("; ") : "no events listed"} (NASA EONET and GDACS, 30 days).${c.weather ? ` ${c.weather} (Open-Meteo).` : ""} Latest clear picture: ${c.scene || "none in 45 days"}.\nLimits: feeds list reported events only.`,
};
