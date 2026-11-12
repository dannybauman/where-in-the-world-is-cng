// notebook: one idea per note, with the open project behind it
import { save, persist } from "./save.js";

export const NOTES = {
  satellite: ["Satellites", "Sentinel-2 photographs every place on Earth about every 5 days. One pixel is 10 m, about a house. The pictures are free.", ["Sentinel-2", "https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2"]],
  stac: ["Searching for pictures", "STAC is a shared way to search satellite pictures by place and date, like a library catalog. Earth Search is a free one.", ["stacspec.org", "https://stacspec.org"]],
  clouds: ["Clouds", "Satellites can't see through clouds. Pick the clearest picture that covers your whole area.", null],
  fastmaps: ["Fast maps", "The files are huge, but they're stored so a map can read just the part on screen. TiTiler draws that part in seconds.", ["TiTiler", "https://developmentseed.org/titiler/"]],
  compare: ["Before and after", "To see change, compare the same place on 2 dates in the same season.", null],
  bands: ["Seeing beyond color", "Satellites also see infrared. Water, plants and burned ground each look very different there. Simple math on 2 colors makes an index you can measure.", ["Index database", "https://www.indexdatabase.de"]],
  groundtruth: ["Ground truth", "A satellite number is a clue. Check it against a measurement on the ground before you call it fact.", ["Lake Mead levels", "https://www.usbr.gov/lc/region/g4000/hourly/levels.html"]],
  feeds: ["Live feeds", "NASA EONET and GDACS list fires, storms and floods as they happen. Open-Meteo gives weather for any spot. No account needed.", ["NASA EONET", "https://eonet.gsfc.nasa.gov"]],
  humanmade: ["Made by people", "Nature rarely draws straight lines or perfect curves. When you see them, people built it.", ["OpenStreetMap", "https://www.openstreetmap.org"]],
  watercolor: ["Water color", "Shallow water over sand looks bright blue. Deep water looks almost black. Muddy water looks brown.", ["Sentinel-2", "https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2"]],
  pivots: ["Circle fields", "A sprinkler arm turning around a center waters a circle. It's called center-pivot irrigation.", ["NASA Earth Observatory", "https://earthobservatory.nasa.gov"]],
  scale: ["Check the size", "One picture can show 1 km or 100 km. Size is a clue: a ring 40 km wide is geology, not a building.", ["OpenFreeMap", "https://openfreemap.org"]],
  plants: ["Green means water", "In a desert, green grows only where water reaches. Follow the green to find the river.", ["Sentinel-2", "https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2"]],
  city: ["Reading a city", "Cities look gray and rough. A straight grid means planned streets. Parks show up as green shapes.", ["OpenStreetMap", "https://www.openstreetmap.org"]],
  seasons: ["Seasons", "The same place looks different in winter and summer. Compare pictures from the same season.", ["Earth Search", "https://earth-search.aws.element84.com/v1"]],
  forest: ["Watching forests", "Satellites track forest loss year after year. Straight-edged cuts are a sign of clearing.", ["INPE TerraBrasilis", "https://terrabrasilis.dpi.inpe.br"]],
  shadows: ["Shadows show height", "Low sun casts shadows on one side of every ridge. That's how a flat picture shows deep valleys.", ["Sentinel-2", "https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2"]],
  thennow: ["Then and now", "The old way downloaded whole files. Cloud-optimized files (COGs) let a map read only the tiles on screen. The game sizes each scene from the archive itself. Landsat prices: USGS, which made its archive free in 2008. 25 Mbps: the FCC's broadband line from 2015 until March 2024.", ["USGS: opening the Landsat archive", "https://www.usgs.gov/centers/eros/news/opening-landsat-archive-helped-realize-its-true-value"]],
  honest: ["Honest claims", "Say what you found, how you know, and what you can't tell. People trust the claim that names its limits.", ["groundstation", "https://github.com/dannybauman/groundstation"]],
};
export const countNotes = () => (document.getElementById("nb-count").textContent = `${save.notes.length}/${Object.keys(NOTES).length}`);
// a note shows once, the first time it's earned; after that the Notebook holds it
export function note(key) {
  if (save.notes.includes(key)) return "";
  save.notes.push(key); persist(); countNotes();
  const [t, body] = NOTES[key];
  return `<div class="note"><b>New note: ${t}</b><p>${body}</p></div>`;
}
