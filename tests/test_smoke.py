"""Smoke check, no network. Run: uv run python tests/test_smoke.py (pytest also works if installed)"""

import re
import subprocess
from pathlib import Path

from fastapi.testclient import TestClient

from wherecng.app import STATIC, app

client = TestClient(app)
FILES = sorted(p for p in STATIC.rglob("*") if p.is_file())
JS = [p for p in FILES if p.suffix == ".js"]
TYPES = {".js": "javascript", ".css": "text/css", ".html": "text/html"}


def test_index_links_the_module_entry():
    r = client.get("/")
    assert r.status_code == 200
    assert '<script type="module" src="/static/js/main.js">' in r.text


def test_every_static_file_is_served_with_a_sensible_type():
    for p in FILES:
        r = client.get("/static/" + p.relative_to(STATIC).as_posix())
        assert r.status_code == 200, p
        assert TYPES[p.suffix] in r.headers["content-type"], (p, r.headers["content-type"])


def test_every_relative_import_resolves():
    for p in JS:
        for spec in re.findall(r"""(?:from|import)\s*\(?\s*["'](\.[^"']+)["']""", p.read_text()):
            assert (p.parent / spec).is_file(), f"{p.name} imports missing {spec}"


def test_every_js_file_parses_as_a_module():
    for p in JS:
        r = subprocess.run(["node", "--check", "--input-type=module"], input=p.read_text(), text=True, capture_output=True)
        assert r.returncode == 0, f"{p.name}: {r.stderr}"


def test_mystery_places_are_complete():
    """Every place has a sane box, a scene id, 3 clues and a note that exists; distance and stars behave"""
    check = """
    import { PLACES, km, starsFor, todayIndex } from "./places.js";
    const notes = process.argv[1], ids = new Set();
    for (const p of PLACES) {
      const [w, s, e, n] = p.box;
      if (!(w < e && s < n && e - w < 1 && n - s < 1)) throw new Error(p.id + " box");
      if (!/^S2[ABC]_\\w{5}_\\d{8}_\\d_L2A$/.test(p.scene) || (p.cloudy && !/^S2[ABC]_/.test(p.cloudy))) throw new Error(p.id + " scene");
      if (p.clues.length !== 3 || !p.fact || !notes.includes(` ${p.note}: [`)) throw new Error(p.id + " clues, fact or note");
      if (ids.has(p.id)) throw new Error(p.id + " twice"); ids.add(p.id);
    }
    if (Math.round(km([0, 0], [0, 1])) !== 111 || starsFor(10) !== 3 || starsFor(5000) !== 0) throw new Error("scoring");
    if (todayIndex() < 0 || todayIndex() >= PLACES.length) throw new Error("daily pick");
    """
    js = STATIC / "js"
    r = subprocess.run(["node", "--input-type=module", "-e", check, (js / "notes.js").read_text()], cwd=js, text=True, capture_output=True)
    assert r.returncode == 0, r.stderr


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
