"""Where in the world is Cloud-Native Geospatial? Thin routes over Groundstation's tools

    uv run wherecng   # then open http://127.0.0.1:8790
"""

import time
from functools import wraps
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse
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
            r = fn(**kw)
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


def main():
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8790)
