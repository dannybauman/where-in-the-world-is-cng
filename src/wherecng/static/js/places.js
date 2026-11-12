// the mystery places. Each scene was picked once, by hand, on 2026-11-12: under 1% cloud and covering the
// whole box, checked to draw. Nothing here is searched while playing. `cloudy` is a real cloudier date of the same place
export const PLACES = [
  { id: "palm", name: "Palm Jumeirah, Dubai", box: [55.08, 25.08, 55.18, 25.15], scene: "S2B_40RCN_20260731_0_L2A", note: "humanmade",
    clues: ["Shapes this neat are made by people, not by nature.", "Pale sand, dark sea and a desert coast.", "A rich city on the Persian Gulf built it."],
    fact: "These islands were built from sand pumped up from the sea floor." },
  { id: "exuma", name: "the Exuma Cays, Bahamas", box: [-76.65, 23.95, -76.3, 24.25], scene: "S2C_18QUM_20250319_0_L2A", note: "watercolor",
    clues: ["The bright blue is shallow water over white sand.", "The near-black edge is deep ocean.", "A chain of small islands, a short flight from Florida."],
    fact: "Most of the bright bank is only a few meters deep. Light bounces off the sand and comes back blue." },
  { id: "pivots", name: "Al Jawf, Saudi Arabia", box: [38.05, 30.35, 38.35, 30.6], scene: "S2A_37RDP_20260821_3_L2A", note: "pivots",
    clues: ["The fields are circles. A long sprinkler arm turns around the middle.", "Green circles in sand mean water is pumped up from deep underground.", "A desert country that fills most of the Arabian Peninsula."],
    fact: "Many of these farms pump ancient groundwater. Rain here does not fill it back up." },
  { id: "richat", name: "the Richat Structure, Mauritania", box: [-11.6, 20.95, -11.2, 21.3], scene: "S2C_29QKD_20260714_0_L2A", note: "scale",
    clues: ["The rings are rock, about 40 km across, worn down by wind.", "No green at all. This is the biggest hot desert on Earth.", "West Africa, a few hundred km from the Atlantic."],
    fact: "Astronauts use these rings as a landmark. They are a worn-down dome of rock, not a crater." },
  { id: "nile", name: "the Nile at Luxor, Egypt", box: [32.5, 25.55, 32.8, 25.8], scene: "S2C_36RVP_20260901_0_L2A", note: "plants",
    clues: ["A green strip runs along a river, with desert on both sides.", "One river waters every field you can see.", "The river flows north into the Mediterranean."],
    fact: "Almost everyone in Egypt lives within a few km of the Nile." },
  { id: "manhattan", name: "Manhattan, New York", box: [-74.06, 40.69, -73.9, 40.83], scene: "S2C_18TWL_20261006_0_L2A", note: "city",
    clues: ["Gray and rough means city: roofs and roads.", "A straight street grid, with one long green rectangle.", "An island between 2 rivers, on the Atlantic coast."],
    fact: "Central Park is over 3 km long. From space it's an easy green rectangle." },
  { id: "fuji", name: "Mount Fuji, Japan", box: [138.6, 35.28, 138.85, 35.45], scene: "S2B_54STE_20260215_1_L2A", note: "seasons",
    clues: ["A white cone is snow on a lone volcano.", "Snow this low means the picture is from winter.", "An island country in the Pacific, close to its capital."],
    fact: "Mount Fuji is 3,776 m tall. It last erupted in 1707." },
  { id: "venice", name: "Venice, Italy", box: [12.2, 45.33, 12.45, 45.5], scene: "S2C_32TQR_20260815_0_L2A", note: "city",
    clues: ["A city sits on islands in a shallow lagoon.", "A long thin bridge joins it to the mainland.", "A country shaped like a boot."],
    fact: "Venice is built on more than 100 small islands, joined by hundreds of bridges." },
  { id: "dam", name: "the Afsluitdijk dam, Netherlands", box: [5.0, 52.9, 5.4, 53.15], scene: "S2A_31UFU_20260322_1_L2A", cloudy: "S2C_31UFU_20260916_0_L2A", note: "humanmade",
    clues: ["A perfectly straight line across water is a dam.", "One side is a calm lake. The other side is the sea.", "A low, flat country that took land back from the sea."],
    fact: "This dam is 32 km long. Since 1932 it has turned a salty bay into a freshwater lake." },
  { id: "delta", name: "the Mississippi River Delta, USA", box: [-89.5, 28.9, -89.05, 29.3], scene: "S2B_16RBT_20251127_0_L2A", cloudy: "S2C_16RBT_20260819_0_L2A", note: "watercolor",
    clues: ["A river splits into fingers where it meets the sea. That's a delta.", "The brown swirls are mud the river carries.", "North America's biggest river ends here, in a warm gulf."],
    fact: "This bird's-foot delta is built from mud carried down from half a continent." },
  { id: "rondonia", name: "Rondônia, Brazil", box: [-62.95, -10.0, -62.65, -9.75], scene: "S2C_20LNQ_20250812_0_L2A", note: "forest",
    clues: ["Dark green blocks are forest. Brown blocks are cleared land.", "Straight edges mean people cut it, not fire or storms.", "The biggest rainforest on Earth, in South America."],
    fact: "New roads in the 1970s and 80s opened this forest to farms. The clearings follow the roads." },
  { id: "canyon", name: "the Grand Canyon, Arizona", box: [-112.28, 36.08, -112.03, 36.26], scene: "S2B_12SUF_20260605_0_L2A", note: "shadows",
    clues: ["Branching lines are side canyons cut by water.", "Red and pale rock, almost no green: a dry place.", "The dry southwest of a big North American country."],
    fact: "The Colorado River cut this canyon about 1.8 km deep." },
];

// everyone gets the same place on the same UTC day, matching iso() in api.js
export const todayIndex = (d = new Date()) => Math.floor(d.getTime() / 864e5) % PLACES.length;
export const center = b => [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];

// great-circle distance in km
export function km([lon1, lat1], [lon2, lat2]) {
  const r = Math.PI / 180, a = Math.sin((lat2 - lat1) * r / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin((lon2 - lon1) * r / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}
export const starsFor = d => (d <= 300 ? 3 : d <= 1000 ? 2 : d <= 3000 ? 1 : 0);
