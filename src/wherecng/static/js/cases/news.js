import { api, q, esc, box, n, day, iso, geocode, stats, BURN } from "../api.js";
import { frame, flip, flight } from "../map.js";
import { best, paint, bars } from "../moves.js";
import { note } from "../notes.js";

const WORLD = [-180, -90, 180, 90];
const km = (a, b) => {
  const r = Math.PI / 180, x = Math.sin((b[1] - a[1]) * r / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin((b[0] - a[0]) * r / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(x));
};
const place = f => f.title.replace(/^(Wildfire|Prescribed Fire)\s*/, "");
const newest = xs => [...xs].sort((x, y) => y.datetime.localeCompare(x.datetime));
const flipDates = ctx => flip(`Before: ${day(ctx.a.id)}`, `After: ${day(ctx.b.id)}`);

// a fire we can show: a clear picture from before it started and one from after, with the box clear of cloud
async function look(f) {
  const start = new Date(f.date), b = [f.at[0] - 0.04, f.at[1] - 0.03, f.at[0] + 0.04, f.at[1] + 0.03];
  const before = await best(b, iso(new Date(start - 60 * 864e5)), iso(new Date(start - 864e5)), 30).catch(() => []);
  if (!before.length) return null;
  const after = await best(b, iso(new Date(+start + 864e5)), iso(new Date()), 60).catch(() => []);
  for (const it of newest(after).slice(0, 3)) if (await stats(it.id, "scl>=8", b).catch(() => 1) < 0.2)
    return { ...f, box: b, a: newest(before)[0], b: it };
  return null;
}

export default {
  id: "news", who: "Reporter", title: "Right Now, Near You", maxStars: 2,
  blurb: "Pick any place. Find the nearest fire burning this month, see it from space, and write the headline.",
  steps: [
    ctx => ({ title: "Pick a place", text: `<p>Readers ask: is anything going on near us? Choose a town, lake, mountain or park.</p>`,
      ask: { label: "Place name", placeholder: "e.g. Portland, Oregon", button: "Check this place", wait: "Finding the place…", run: async name => {
        const g = await geocode(name);
        Object.assign(ctx, { name: esc(g.name.split(/[,(]/)[0].trim()), at: [g.lon, g.lat] });
        ctx.say("Checking live fires, storms and floods…");
        const [ev, wx] = await Promise.all([api(`/api/events?${q({ ...box(WORLD), days: 30 })}`), api(`/api/weather?${q({ lat: g.lat, lon: g.lon })}`).catch(() => null)]);
        const all = [...(ev.eonet || []).map(x => ({ title: x.title, at: x.coordinates, date: x.date, kind: x.category })),
          ...(ev.gdacs || []).map(x => ({ title: x.title, at: x.coordinates, date: x.from, kind: x.type }))]
          .filter(x => x.at).map(x => ({ ...x, title: esc(x.title), km: km(ctx.at, x.at) })).sort((x, y) => x.km - y.km);
        ctx.near = all.filter(x => x.km < 300);
        const d = wx?.daily, k = d ? Math.max(0, d.time.indexOf(iso(new Date()))) : 0;
        ctx.weather = d ? `${n(d.precipitation_sum.slice(0, k).reduce((a, b) => a + (b || 0), 0), 0)} mm of rain this past week, high of ${n(d.temperature_2m_max[k], 0)} °C today` : "";
        // a picture shows a fire's scar; quakes and storms at sea it mostly can't, so we go and look at a fire.
        // ponytail: the title is the feed's only wildfire-vs-planned-burn signal; planned burns are the fallback
        const fires = all.filter(x => x.kind === "Wildfires"), wild = fires.filter(x => x.title.startsWith("Wildfire"));
        ctx.say("Finding the nearest fire a satellite can see…");
        ctx.fire = null;
        for (const f of [...wild.slice(0, 4), ...fires.filter(x => !wild.includes(x)).slice(0, 2)]) if ((ctx.fire = await look(f))) break;
        const evs = ctx.near.length ? ctx.near.slice(0, 4).map(x => `<li>${x.title}, ${Math.round(x.km)} km away</li>`).join("") : `<li>No fires, storms or floods listed within 300 km</li>`;
        return `<p>Near ${ctx.name}, last 30 days:</p><ul class="list">${evs}<li>${ctx.weather || "Weather didn't answer this time"}</li></ul>
          <p>${ctx.fire ? `Nearest fire we can see from space: <b>${ctx.fire.title}</b>, ${Math.round(ctx.fire.km).toLocaleString("en-US")} km away.` : "No fire this month has a clear picture yet. Try again in a few days."}</p>${note("feeds")}`;
      } } }),
    ctx => ctx.fire ? ({ title: "Go and look", text: `<p>The feed says a fire burned at ${place(ctx.fire)} on ${new Date(ctx.fire.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}. A list can't tell you how big. A picture can.</p>`,
      go: { label: "Fly there", run: async () => {
        await flight(ctx.at, ctx.fire.at);
        await frame(ctx.fire.box);
        ctx.a = ctx.fire.a; ctx.b = ctx.fire.b;
        await paint("a", ctx.a.id); await paint("b", ctx.b.id);
        flipDates(ctx);
        return `<p>Flip between before and after. The smoke is gone, but the scar stays.</p>${note("compare")}`;
      } } }) : null,
    ctx => ctx.fire ? ({ title: "Show the burn", text: `<p>Repaint both with the burn score. Green is healthy. Red is burned.</p>`,
      go: { label: "Show the burn score", run: async () => {
        await paint("a", ctx.a.id, BURN); await paint("b", ctx.b.id, BURN);
        flipDates(ctx);
        return `<p>Look for red in "After" that was green in "Before".</p>`;
      } } }) : null,
    ctx => ctx.fire ? ({ title: "Find the scar", text: `<p>Tap the spot that burned. Readers will want a number.</p>`,
      tap: { run: async spot => {
        const [a, b] = await Promise.all([stats(ctx.a.id, BURN, spot), stats(ctx.b.id, BURN, spot)]);
        const burned = a - b > 0.15; if (burned) ctx.drop = a - b;
        return { right: burned, html: `${bars("Burn score at your spot", a, b, "Before", "After")}<div class="say ${burned ? "" : "wrong"}">${burned ? "That's the scar. The burn score fell sharply there." : "That spot barely changed. Look for red that wasn't there before."}</div>` };
      } } }) : null,
    ctx => {
      const f = ctx.fire;
      const fact = f ? `Satellite pictures show a fresh burn scar at ${place(f)}, ${Math.round(f.km)} km from ${ctx.name}` : `No disaster alerts near ${ctx.name} this month`;
      const src = f ? "per NASA EONET and Sentinel-2" : "per NASA and GDACS feeds";
      return { title: "Write the headline", text: `<p>Pick the one you'd put your name on.</p>`, pick: { options: [
        { text: f ? `Wildfire threatens ${ctx.name}` : `${ctx.name} is totally safe, experts say`, right: false, why: f ? `It's ${Math.round(f.km)} km away, and nothing you saw says it threatens anyone.` : "An empty feed isn't proof of safety, and no expert said it." },
        { text: `${fact}, ${src}`, right: true, why: "It says what you saw and where it came from." },
        { text: `Satellites spy on ${ctx.name}`, right: false, why: "Catchy, but it tells readers nothing." },
      ], then: async () => { ctx.headline = `${fact}, ${src}`; return note("honest"); } } };
    },
  ],
  found: c => c.fire
    ? [`A fresh burn scar at ${place(c.fire)}, ${Math.round(c.fire.km).toLocaleString("en-US")} km from ${c.name}, seen from space.`,
      "A feed says something happened. A picture shows how big it was. Together they make a headline you can stand behind."]
    : [`No fire this month had a clear picture yet.`, "An empty result is a finding too. Say what you checked, and check again in a few days."],
  file: c => `Headline: ${c.headline}\nNear ${c.name}: ${c.near.length ? c.near.slice(0, 4).map(x => x.title).join("; ") : "nothing listed within 300 km"} (NASA EONET and GDACS, 30 days).${c.weather ? ` ${c.weather} (Open-Meteo).` : ""}\n${c.fire ? `Fire: ${c.fire.title}, ${Math.round(c.fire.km)} km away. Sentinel-2 ${day(c.a.id)} and ${day(c.b.id)}.${c.drop ? ` Burn score fell ${n(c.drop)} at the scar.` : ""}` : "No fire with a clear picture this month."}\nLimits: feeds list reported events only; a burn score is not a damage survey.`,
};
