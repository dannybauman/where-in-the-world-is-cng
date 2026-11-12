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


if __name__ == "__main__":
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            fn()
            print("ok", name)
