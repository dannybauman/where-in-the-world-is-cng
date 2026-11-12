# Where in the world is Cloud-Native Geospatial?

A browser game for people new to satellite data. Solve cases as a detective, a responder or a reporter, and learn the open tools and data behind each answer along the way.

Built on [Groundstation](https://github.com/dannybauman/groundstation), which does the real work: searching satellite pictures with [STAC](https://stacspec.org), drawing them with [TiTiler](https://developmentseed.org/titiler/), and reading live feeds from [NASA EONET](https://eonet.gsfc.nasa.gov) and [Open-Meteo](https://open-meteo.com). Pictures are [Sentinel-2](https://sentinels.copernicus.eu/web/sentinel/missions/sentinel-2) via [Earth Search](https://element84.com/earth-search/). The map is [MapLibre](https://maplibre.org) with [OpenFreeMap](https://openfreemap.org) tiles.

A love letter to the geography games we grew up with.

## Run it

```bash
uv run wherecng
```

Then open http://127.0.0.1:8790.
