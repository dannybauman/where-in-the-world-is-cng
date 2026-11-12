import { esc, day, tiles, geocode } from "../api.js";
import { frame, picture, flip } from "../map.js";
import { newest } from "../moves.js";
import { note } from "../notes.js";

export default {
  id: "first", who: "Explorer", title: "First Look", maxStars: 1,
  blurb: "See a place you know from space, and learn the map. Takes 2 minutes.",
  steps: [
    ctx => ({ title: "Pick a place you know", text: `<p>Your town, a park, a landmark. You'll see it the way a satellite does.</p>`,
      ask: { label: "Place name", placeholder: "e.g. Golden Gate Bridge", button: "Go", wait: "Finding it…", run: async name => {
        const g = await geocode(name);
        // a big place (a state, a country) gets a box about 30 km wide at its middle, the size one picture shows well
        const [w, s, e, n] = g.bbox;
        const cx = (w + e) / 2, cy = (s + n) / 2, half = Math.min(0.15, Math.max(e - w, n - s) * 0.65 + 0.02);
        Object.assign(ctx, { box: [cx - half, cy - half, cx + half, cy + half], full: esc(g.name) });
        await frame(ctx.box);
        return `<p>Found ${ctx.full}.</p>`;
      } } }),
    ctx => ({ title: "See it from space", text: `<p>Get the newest clear picture of this place.</p>`,
      go: { label: "Get the picture", run: async () => {
        let it;
        for (const days of [60, 365]) { try { it = await newest(ctx.box, days); break; } catch {} }
        if (!it) throw new Error("It's been too cloudy there. Go back and try another place.");
        ctx.scene = day(it.id);
        await picture("b", await tiles(it.id)); flip("Map", "From space");
        return `<p>Taken ${ctx.scene}.</p>${note("satellite")}`;
      } } }),
    () => ({ title: "Meet the switch", text: `<p>The switch at the bottom of the map flips between views. You'll use it to compare pictures.</p>`,
      flipTask: `Tap "Map" on the switch.` }),
    () => ({ title: "Look around", text: `<p>Drag to move. Pinch, scroll or use + and − to zoom.</p><p>Each pixel is about the size of a house, so you can spot fields, roads and big buildings, but not cars.</p>` }),
  ],
  file: c => `Place: ${c.full}\nPicture: Sentinel-2, taken ${c.scene}. Free and open.`,
};
