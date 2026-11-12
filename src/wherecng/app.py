"""Where in the world is Cloud-Native Geospatial? Thin routes over Groundstation's tools

    uv run wherecng   # then open http://127.0.0.1:8790
"""

import re
import time
from functools import wraps
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from groundstation import tools

STATIC = Path(__file__).parent / "static"
app = FastAPI(title="Where in the world is Cloud-Native Geospatial?")

# ponytail: one in-memory dict per server, no eviction; add a size cap if many players arrive
_cache: dict = {}
DAY, TEN_MIN = 86400, 600


def cached(ttl):
    """Answer a repeat question from memory so the free services behind it see it once. Errors are not kept"""
    def deco(fn):
        @wraps(fn)
        def inner(**kw):
            key = (fn.__name__, tuple(sorted(kw.items())))
            hit = _cache.get(key)
            if hit and time.time() - hit[0] < ttl:
                return hit[1]
            try:
                r = fn(**kw)
            except Exception as e:  # a free service timing out is normal; say so plainly, keep nothing, never retry
                return JSONResponse({"error": f"{type(e).__name__}: the service didn't answer"}, status_code=502)
            if not (isinstance(r, dict) and r.get("error")):
                _cache[key] = (time.time(), r)
            return r
        return inner
    return deco


@app.get("/")
def index():
    return FileResponse(STATIC / "index.html")


@app.get("/api/geocode")
@cached(DAY)
def api_geocode(q: str):
    return tools.geocode(q)


@app.get("/api/events")
@cached(TEN_MIN)
def api_events(w: float, s: float, e: float, n: float, days: int = 30):
    return tools.active_events(bbox=[w, s, e, n], days=days, pad=0.4)


@app.get("/api/weather")
@cached(TEN_MIN)
def api_weather(lat: float, lon: float):
    return tools.weather_summary(lat, lon)


@app.get("/api/search")
@cached(DAY)
def api_search(w: float, s: float, e: float, n: float, start: str, end: str, max_cloud: float = 20):
    r = tools.search_imagery(
        "earth-search", ["sentinel-2-l2a"], bbox=[w, s, e, n],
        datetime_range=f"{start}T00:00:00Z/{end}T23:59:59Z", max_cloud_cover=max_cloud, limit=20,
    )
    items = sorted(r.get("items", []), key=lambda i: (-(i.get("covers_aoi_pct") or 0), i.get("cloud_cover") or 100))
    return {"items": items[:12], "error": r.get("error")}


@app.get("/api/stats")
@cached(DAY)
def api_stats(item: str, expression: str, w: float, s: float, e: float, n: float):
    r = tools.compute_statistics("earth-search", "sentinel-2-l2a", item, expression=expression, bbox=[w, s, e, n])
    band = next((v for v in r.values() if isinstance(v, dict) and "mean" in v), None)
    return {"stats": band, "error": None if band else str(r)[:300]}


@app.get("/api/tiles")
@cached(DAY)
def api_tiles(item: str, expression: str | None = None, colormap: str = "rdylgn"):
    if expression:
        return {"tiles": tools.tile_url_template("earth-search", "sentinel-2-l2a", item, expression=expression, colormap_name=colormap)}
    return {"tiles": tools.tile_url_template("earth-search", "sentinel-2-l2a", item, ["visual"])}


# the only scenes the game ever asks to preview, read once from the places list
S2_ID = r"S2[ABC]_\w+_\d{8}_\d+_L2A"
SCENES = set(re.findall(S2_ID, (STATIC / "js/places.js").read_text()))


@app.get("/api/preview")
def api_preview(item: str, w: float, s: float, e: float, n: float):
    if not re.fullmatch(S2_ID, item) or item not in SCENES:
        raise HTTPException(400, "unknown scene")
    return _preview(item=item, w=w, s=s, e=e, n=n)


@cached(DAY)
def _preview(item: str, w: float, s: float, e: float, n: float):
    """One picture of a box, for the mystery round. JPEG is about a tenth the size of the PNG"""
    r = tools.preview_item("earth-search", "sentinel-2-l2a", item, assets=["visual"], bbox=[w, s, e, n], max_size=640)
    return {"url": r["preview_url"].replace(".png?", ".jpg?", 1)}


# last, so the /api routes above are matched first
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def main():
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8790)
