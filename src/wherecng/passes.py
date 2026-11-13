"""A picture is one satellite pass: every tile of one satellite on one date, each owning the part of the box nobody before it covers"""

from collections import defaultdict


def _ring_has(pt, ring):
    x, y, c = pt[0], pt[1], False
    for (x1, y1), (x2, y2) in zip(ring, ring[1:] + ring[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def inside(pt, geom):
    # ponytail: outer rings only, holes ignored; a Sentinel-2 footprint has none that matter
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    return any(_ring_has(pt, [tuple(p[:2]) for p in poly[0]]) for poly in polys)


def ownership(box, footprints, n=32):
    """Each of n*n cells goes to the first tile that holds all 4 corners. -> (owned rects by id, cover %, area share by id)"""
    w, s, e, nn = box
    xs = [w + (e - w) * i / n for i in range(n + 1)]
    ys = [s + (nn - s) * j / n for j in range(n + 1)]
    ins = {tid: [[inside((x, y), g) for x in xs] for y in ys] for tid, g in footprints}
    cells, owned = defaultdict(int), defaultdict(list)
    for j in range(n):
        run = None  # (id, first column)
        for i in range(n + 1):
            who = None
            if i < n:
                who = next((t for t, _ in footprints if ins[t][j][i] and ins[t][j][i + 1] and ins[t][j + 1][i] and ins[t][j + 1][i + 1]), None)
            if who:
                cells[who] += 1
            if run and who != run[0]:
                owned[run[0]].append([xs[run[1]], ys[j], xs[i], ys[j + 1]])
                run = None
            if who and not run:
                run = (who, i)
    return dict(owned), sum(cells.values()) / n**2 * 100, {t: c / n**2 for t, c in cells.items()}


def group(items, box):
    """Search items -> one entry per (satellite, date): the primary tile's fields, `tiles` in ownership order, pass-wide cover and cloud"""
    by = defaultdict(list)
    for it in items:
        sat, _, date = it["id"].split("_")[:3]
        by[sat, date].append(it)
    out = []
    for tiles in by.values():
        tiles.sort(key=lambda t: -(t.get("covers_aoi_pct") or 0))
        owned, cover, share = ownership(box, [(t["id"], t["footprint"]) for t in tiles])
        kept = [t for t in tiles if t["id"] in owned]
        if not kept:
            continue
        top = {k: v for k, v in kept[0].items() if k != "footprint"}
        top["tiles"] = [t["id"] for t in kept]
        top["covers_aoi_pct"] = round(cover, 1)
        top["cloud_cover"] = sum((t.get("cloud_cover") or 0) * share[t["id"]] for t in kept) / sum(share.values())
        out.append(top)
    return out


if __name__ == "__main__":
    sq = lambda x0, x1: dict(type="Polygon", coordinates=[[(x0, -1), (x1, -1), (x1, 11), (x0, 11), (x0, -1)]])
    box = [0, 0, 10, 10]
    owned, cover, share = ownership(box, [("a", sq(-1, 6)), ("b", sq(4, 11))])
    assert cover == 100 and abs(share["a"] + share["b"] - 1) < 1e-9, (cover, share)
    assert all(r[2] <= 6 for r in owned["a"]) and all(r[0] >= 6 - 10 / 32 for r in owned["b"])
    assert min(r[0] for r in owned["b"]) > 5.9 and max(r[2] for r in owned["a"]) < 6.2  # overlap counted once, cells fully in b only go to b
    items = [dict(id=f"S2C_{t}_20260822_0_L2A", cloud_cover=c, covers_aoi_pct=p, footprint=g)
             for t, c, p, g in [("11A", 0, 60, sq(-1, 6)), ("11B", 10, 60, sq(4, 11)), ("11C", 50, 0, sq(30, 40))]]
    items.append(dict(id="S2B_11A_20260823_0_L2A", cloud_cover=5, covers_aoi_pct=60, footprint=sq(-1, 6)))
    g = {p["id"][:3]: p for p in group(items, box)}
    assert g["S2C"]["tiles"] == ["S2C_11A_20260822_0_L2A", "S2C_11B_20260822_0_L2A"] and g["S2C"]["covers_aoi_pct"] == 100.0
    assert "footprint" not in g["S2C"] and g["S2B"]["covers_aoi_pct"] < 100 and 0 < g["S2C"]["cloud_cover"] < 10
    print("ok")
