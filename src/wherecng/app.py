"""Where in the world is Cloud-Native Geospatial? Thin routes over Groundstation's tools

    uv run wherecng   # then open http://127.0.0.1:8790
"""

import json
import re
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from groundstation import tools

from wherecng.passes import group, ownership

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
def api_search(w: float, s: float, e: float, n: float, start: str, end: str, max_cloud: float = 20, radar: bool = False):
    if radar:  # radar sees through cloud, so no cloud filter; one scene covers the box, so no pass grouping
        r = tools.search_imagery(
            "planetary-computer", ["sentinel-1-rtc"], bbox=[w, s, e, n],
            datetime_range=f"{start}T00:00:00Z/{end}T23:59:59Z", limit=20,
        )
        items = sorted([i for i in r.get("items", []) if i.get("footprint")], key=lambda i: -(i.get("covers_aoi_pct") or 0))
        return {"items": items, "error": r.get("error")}
    r = tools.search_imagery(
        "earth-search", ["sentinel-2-l2a"], bbox=[w, s, e, n],
        datetime_range=f"{start}T00:00:00Z/{end}T23:59:59Z", max_cloud_cover=max_cloud, limit=100,
    )
    passes = group([i for i in r.get("items", []) if i.get("footprint")], [w, s, e, n])
    passes.sort(key=lambda i: (-i["covers_aoi_pct"], i.get("cloud_cover") or 100))
    return {"items": passes[:12], "error": r.get("error")}


@app.get("/api/stats")
def api_stats(item: str, expression: str, w: float, s: float, e: float, n: float, tiles: str = ""):
    ids = [t for t in tiles.split(",") if t]
    if len(ids) > 8 or not all(re.fullmatch(S2_ID, t) for t in ids) or not (re.fullmatch(S2_ID, item) or re.fullmatch(S1_ID, item)):
        raise HTTPException(400, "unknown scene")
    if len(ids) < 2:
        return _stats(item=item, expression=expression, w=w, s=s, e=e, n=n)
    return _pass_stats(tiles=",".join(ids), expression=expression, w=w, s=s, e=e, n=n)


@cached(DAY)
def _stats(item: str, expression: str, w: float, s: float, e: float, n: float):
    cat, coll = _source(item)
    return _band(tools.compute_statistics(cat, coll, item, expression=expression, bbox=[w, s, e, n]))


def _band(r):
    band = next((v for v in r.values() if isinstance(v, dict) and "mean" in v), None)
    return {"stats": band, "error": None if band else str(r)[:300]}


@cached(DAY)
def _footprint(item: str):
    with urllib.request.urlopen(EARTH_SEARCH + item, timeout=20) as r:
        return json.load(r)["geometry"]


def _rect(r):
    x0, y0, x1, y1 = r
    return [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]]


@cached(DAY)
def _pass_stats(tiles: str, expression: str, w: float, s: float, e: float, n: float):
    """One pass measured as one: each tile counts only the part of the box it owns, then the means are weighted by area and valid pixels"""
    ids = tiles.split(",")
    with ThreadPoolExecutor(8) as pool:
        feet = list(pool.map(lambda t: _footprint(item=t), ids))
        if any(isinstance(f, JSONResponse) for f in feet):  # _footprint's cached() wrapper hands back a 502 response on failure
            return {"stats": None, "error": "a tile's outline didn't come back"}
        owned, cover, share = ownership([w, s, e, n], list(zip(ids, feet)))

        def one(t):
            feat = {"type": "Feature", "properties": {}, "geometry": {"type": "MultiPolygon", "coordinates": [_rect(r) for r in owned[t]]}}
            return _band(tools.compute_statistics("earth-search", "sentinel-2-l2a", t, expression=expression, aoi_geojson=feat))["stats"]

        parts = list(pool.map(one, list(owned)))
    pairs = [(b, share[t] * (100 if b.get("valid_percent") is None else b["valid_percent"]) / 100) for t, b in zip(owned, parts) if b and b.get("mean") is not None]
    total = sum(x for _, x in pairs)
    if not total:
        return {"stats": None, "error": "no valid pixels in any tile"}
    return {"stats": {"mean": sum(b["mean"] * x for b, x in pairs) / total, "covers_pct": round(cover, 1), "parts": len(pairs)}, "error": None}


@app.get("/api/tiles")
@cached(DAY)
def api_tiles(item: str, expression: str | None = None, colormap: str = "rdylgn"):
    if re.fullmatch(S1_ID, item):  # planetary-computer ignores expressions, so radar is plain gray
        return {"tiles": tools.tile_url_template("planetary-computer", "sentinel-1-rtc", item, ["vv"], rescale="0,0.3")}
    if expression:
        return {"tiles": tools.tile_url_template("earth-search", "sentinel-2-l2a", item, expression=expression, colormap_name=colormap)}
    return {"tiles": tools.tile_url_template("earth-search", "sentinel-2-l2a", item, ["visual"])}


# the only scenes the game ever asks to preview, read once from the places list
S2_ID = r"S2[ABC]_[0-9A-Z]+_\d{8}_\d+_L2A"
S1_ID = r"S1[ABC]_IW_GRDH_1SDV_\w+_rtc"


def _source(item):
    return ("planetary-computer", "sentinel-1-rtc") if re.fullmatch(S1_ID, item) else ("earth-search", "sentinel-2-l2a")


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


EARTH_SEARCH = "https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a/items/"
STAC_SEARCH = "https://earth-search.aws.element84.com/v1/search"


def _head_size(url):
    with urllib.request.urlopen(urllib.request.Request(url, method="HEAD"), timeout=15) as r:
        n = r.headers.get("Content-Length")
    if not n:  # a size we can't read fails the whole answer, so a too-small total is never shown or cached
        raise ValueError(f"no size for {url}")
    return int(n)


@app.get("/api/size")
def api_size(item: str):
    if not re.fullmatch(S2_ID, item):
        raise HTTPException(400, "unknown scene")
    return _size(item=item)


# ponytail: any well-formed id is accepted (First Look picks any scene) and the cache never evicts; bound it if this leaves 127.0.0.1
@cached(DAY)
def _size(item: str):
    """What the old way downloaded: every file of the scene as the open archive stores it, sized by HEAD, never fetched"""
    with urllib.request.urlopen(EARTH_SEARCH + item, timeout=20) as r:
        assets = json.load(r)["assets"]
    tifs = {k: a["href"] for k, a in assets.items() if a.get("href", "").startswith("https://") and a["href"].endswith(".tif")}
    with ThreadPoolExecutor(6) as pool:
        sizes = dict(zip(tifs, pool.map(_head_size, tifs.values())))
    return {"files": len(sizes), "bytes": sum(sizes.values()), "visual": sizes.get("visual", 0)}


@app.get("/api/find")
def api_find(w: float, s: float, e: float, n: float):
    """The mystery round's "now": one real search of the open Sentinel-2 archive for this box, every date, timed.
    Never cached, so the time is a real search"""
    body = json.dumps({"collections": ["sentinel-2-l2a"], "bbox": [w, s, e, n], "limit": 1, "fields": {"include": ["id"]}}).encode()
    req = urllib.request.Request(STAC_SEARCH, body, {"content-type": "application/json"})
    t0 = time.perf_counter()
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            matched = json.load(r).get("numberMatched")
    except Exception as ex:  # same as cached(): say so plainly, never retry
        return JSONResponse({"error": f"{type(ex).__name__}: the service didn't answer"}, status_code=502)
    return {"matched": matched, "secs": round(time.perf_counter() - t0, 2)}


# last, so the /api routes above are matched first
app.mount("/static", StaticFiles(directory=STATIC), name="static")


def main():
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8790)
