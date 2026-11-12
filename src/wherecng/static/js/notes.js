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
  honest: ["Honest claims", "Say what you found, how you know, and what you can't tell. People trust the claim that names its limits.", ["groundstation", "https://github.com/dannybauman/groundstation"]],
};
export const countNotes = () => (document.getElementById("nb-count").textContent = `${save.notes.length}/${Object.keys(NOTES).length}`);
export function note(key) {
  if (!save.notes.includes(key)) { save.notes.push(key); persist(); countNotes(); }
  const [t, body] = NOTES[key];
  return `<div class="note"><div><b>New note: ${t}</b><p>${body}</p></div></div>`;
}
