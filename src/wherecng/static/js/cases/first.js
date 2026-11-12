import { esc, day, tiles, geocode } from "../api.js";
import { frame, picture, flip } from "../map.js";
import { clearest } from "../moves.js";
import { note } from "../notes.js";

export default {
  id: "first", who: "Explorer", title: "First Look", maxStars: 1,
  blurb: "See a place you know from space. Takes 2 minutes.",
  steps: [
    ctx => ({ title: "Pick a place you know", text: `<p>Your town, a park, a landmark. You'll see it the way a satellite does.</p>`,
      ask: { label: "Place name", placeholder: "e.g. Golden Gate Bridge", button: "Show it from space", wait: "Finding the place…", run: async name => {
        const g = await geocode(name);
        // a big place (a state, a country) gets a box about 30 km wide at its middle, the size one picture shows well
        const [w, s, e, n] = g.bbox;
        const cx = (w + e) / 2, cy = (s + n) / 2, half = Math.min(0.15, Math.max(e - w, n - s) * 0.65 + 0.02);
        Object.assign(ctx, { box: [cx - half, cy - half, cx + half, cy + half], full: esc(g.name.split(",")[0]) });
        frame(ctx.box);
        ctx.say("Searching for a clear picture…");
        let it;
        for (const days of [60, 365]) { try { it = await clearest(ctx.box, days); break; } catch {} }
        if (!it) throw new Error("It's been too cloudy there. Try another place.");
        ctx.scene = day(it.id);
        ctx.say("Drawing the picture…");
        await picture("b", await tiles(it.id)); flip("Map", "From space");
        return `<p>${ctx.full}, taken ${ctx.scene}.</p>${note("satellite")}`;
      } } }),
    () => ({ title: "Meet the switch", text: `<p>The switch on the map flips between the map and the picture. You'll use it to compare.</p>`,
      flipTask: `Tap "Map" on the switch.` }),
    () => ({ title: "Look around", text: `<p>Drag to move. Pinch or scroll to zoom.</p><p>One pixel is about a house. You'll spot fields and roads, but not cars.</p>${note("fastmaps")}` }),
  ],
  file: c => `Place: ${c.full}\nPicture: Sentinel-2, taken ${c.scene}. Free and open.`,
};
