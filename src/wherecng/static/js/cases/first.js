import { esc, day, tiles, geocode, api, q } from "../api.js";
import { frame, picture, flip, bytesRead } from "../map.js";
import { size, atBroadband } from "../thennow.js";
import { clearest } from "../moves.js";
import { note } from "../notes.js";

export default {
  id: "first", who: "Explorer", title: "First Look", maxStars: 1,
  blurb: "See a place you know from space. Takes 2 minutes.",
  steps: [
    ctx => ({ title: "Pick a place you know", text: `<p>Your town, a park, a landmark. You'll see it the way a satellite does.</p>`,
      ask: { label: "Place name", placeholder: "e.g. Golden Gate Bridge", button: "Show it from space", wait: "Finding the place…", run: async name => {
        const t0 = performance.now();
        ctx.bytes0 = bytesRead();
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
        // the old way's size, asked now so it's ready by the end; a failure shows as "numbers didn't load"
        ctx.size = api(`/api/size?${q({ item: it.id })}`);
        ctx.size.catch(() => {});
        ctx.say("Drawing the picture…");
        await picture("b", await tiles(it.id)); flip("Map", "From space");
        ctx.secs = Math.max(1, Math.round((performance.now() - t0) / 1000));
        return `<p>${ctx.full}, taken ${ctx.scene}.</p>${note("satellite")}`;
      } } }),
    () => ({ title: "Meet the switch", text: `<p>The switch on the map flips between the map and the picture. You'll use it to compare.</p>`,
      flipTask: `Tap "Map" on the switch.` }),
    () => ({ title: "Look around", text: `<p>Drag to move. Pinch or scroll to zoom.</p><p>One pixel is about a house. You'll spot fields and roads, but not cars.</p>${note("fastmaps")}` }),
    () => ({ title: "Then and now", text: `<p>You just saw your place from space. Here's how that went before maps could read just part of a file.</p>`, then: async ctx => {
      const sz = await ctx.size, read = bytesRead() - ctx.bytes0;
      ctx.read = read; ctx.whole = sz.bytes;
      return {
        lines: [
          { text: "Search a catalog for your place and pick a scene." },
          { text: `Download the whole scene: ${sz.files} files.`, bytes: sz.bytes },
          { text: "Open the files in desktop map software." },
          { text: "Crop to your place and mix 3 colors into 1 picture." },
        ],
        head: read ? `You moved about ${Math.round(sz.bytes / read).toLocaleString("en-US")} times less data.` : "",
        rows: [
          ["Data", `${size(sz.bytes)}, the whole scene`, `${size(read)}, only the tiles you looked at`],
          ["Wait", `About ${atBroadband(sz.bytes)} just to download, on 25 Mbps broadband`, `${ctx.secs} seconds from your question to the picture`],
          ["Tools", "Desktop map software and room on your disk", "This web page"],
          ["Price", "Before 2008, one Landsat picture cost $400 to $4,000", "Free"],
        ],
        note: "thennow",
      };
    } }),
  ],
  file: c => `Place: ${c.full}\nPicture: Sentinel-2, taken ${c.scene}. Free and open.${c.read ? `\nRead: ${size(c.read)} of a ${size(c.whole)} scene.` : ""}`,
};
