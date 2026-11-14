"""Zero-dependency clients for NASA CMR (NISAR/UAVSAR), NASA ASF Vertex, Planetary Computer STAC, and Meteomatics Weather API."""

from __future__ import annotations

import base64
import json
import os
import ssl
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

NASA_CMR_GRANULES_URL = "https://cmr.earthdata.nasa.gov/search/granules.json"
NASA_ASF_SEARCH_URL = "https://api.daac.asf.alaska.edu/services/search/param"
PC_STAC_SEARCH_URL = "https://planetarycomputer.microsoft.com/api/stac/v1/search"
METEOMATICS_BASE_URL = "https://api.meteomatics.com"

NISAR_COLLECTIONS = {
    "GCOV": "C2854338529-ASF",
    "GUNW": "C2854335566-ASF",
    "GSLC": "C2854332392-ASF",
}


def load_dotenv_file(env_path: str | Path = ".env") -> dict[str, str]:
    """Read key=value pairs from a local .env file if present without mutating process env."""
    loaded: dict[str, str] = {}
    path = Path(env_path)
    if not path.is_file():
        return loaded
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        k, v = stripped.split("=", 1)
        loaded[k.strip()] = v.strip().strip('"').strip("'")
    return loaded


def parse_cmr_polygon(polygon_rings: list[list[str]] | None) -> list[list[float]]:
    """Convert NASA CMR space-separated 'lat lon lat lon...' polygon string into [[lat, lon], ...]."""
    if not polygon_rings or not polygon_rings[0]:
        return []
    tokens = polygon_rings[0][0].split()
    coords: list[list[float]] = []
    for idx in range(0, len(tokens) - 1, 2):
        lat, lon = float(tokens[idx]), float(tokens[idx + 1])
        coords.append([round(lat, 5), round(lon, 5)])
    return coords


def normalize_cmr_nisar_entry(entry: dict[str, Any], product: str) -> dict[str, Any]:
    """Extract lightweight metadata and public HTTPS browse PNGs from a NASA CMR NISAR granule."""
    browse_pngs = [
        lnk["href"]
        for lnk in entry.get("links", [])
        if str(lnk.get("href", "")).startswith("https://")
        and str(lnk.get("href", "")).lower().endswith(".png")
    ]
    preferred_browse = next(
        (u for u in browse_pngs if u.endswith("_LATLON.png")),
        browse_pngs[0] if browse_pngs else None,
    )
    return {
        "granule_id": entry.get("title", ""),
        "product": product,
        "collection_id": entry.get("collection_concept_id", ""),
        "time_start": entry.get("time_start"),
        "time_end": entry.get("time_end"),
        "polygon_latlon": parse_cmr_polygon(entry.get("polygons")),
        "browse_url": preferred_browse,
        "browse_layers": browse_pngs,
    }


def _default_ssl_context() -> ssl.SSLContext:
    return ssl._create_unverified_context()


def fetch_nasa_nisar_granules(
    bbox: tuple[float, float, float, float],
    product: str = "GCOV",
    page_size: int = 4,
    timeout: int = 20,
) -> list[dict[str, Any]]:
    """Query NASA CMR for NISAR L2 granules (GCOV/GUNW/GSLC) intersecting bbox (W,S,E,N)."""
    concept_id = NISAR_COLLECTIONS.get(product.upper())
    if not concept_id:
        raise ValueError(f"Unknown NISAR product '{product}'. Expected one of {list(NISAR_COLLECTIONS)}.")
    params = urllib.parse.urlencode(
        {
            "collection_concept_id": concept_id,
            "bounding_box": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
            "page_size": str(page_size),
            "sort_key": "-start_date",
        }
    )
    req = urllib.request.Request(
        f"{NASA_CMR_GRANULES_URL}?{params}",
        headers={"User-Agent": "OrbitalSAR-Reflex/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_default_ssl_context()) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    entries = payload.get("feed", {}).get("entry", [])
    return [normalize_cmr_nisar_entry(e, product.upper()) for e in entries]


def fetch_asf_scenes(
    bbox: tuple[float, float, float, float],
    platform: str = "Sentinel-1",
    max_results: int = 3,
    timeout: int = 20,
) -> list[dict[str, Any]]:
    """Query NASA ASF Search API for Sentinel-1 or UAVSAR granules."""
    params = urllib.parse.urlencode(
        {
            "bbox": f"{bbox[0]},{bbox[1]},{bbox[2]},{bbox[3]}",
            "platform": platform,
            "maxResults": str(max_results),
            "output": "json",
        }
    )
    req = urllib.request.Request(
        f"{NASA_ASF_SEARCH_URL}?{params}",
        headers={"User-Agent": "OrbitalSAR-Reflex/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_default_ssl_context()) as resp:
        raw = json.loads(resp.read().decode("utf-8"))
    items = raw[0] if isinstance(raw, list) and raw else []
    results = []
    for it in items:
        browse = it.get("browse")
        browse_url = browse[0] if isinstance(browse, list) and browse else browse
        results.append(
            {
                "granule_name": it.get("granuleName"),
                "platform": it.get("platform"),
                "start_time": it.get("startTime"),
                "polarization": it.get("polarization"),
                "beam_mode": it.get("beamModeType") or it.get("beamMode"),
                "flight_direction": it.get("flightDirection"),
                "browse_url": browse_url,
                "url": it.get("url"),
            }
        )
    return results


def fetch_planetary_computer_s1(
    bbox: tuple[float, float, float, float],
    limit: int = 4,
    timeout: int = 20,
) -> list[dict[str, Any]]:
    """Query Microsoft Planetary Computer public STAC API for sentinel-1-rtc scenes."""
    body = json.dumps(
        {
            "collections": ["sentinel-1-rtc"],
            "bbox": [bbox[0], bbox[1], bbox[2], bbox[3]],
            "limit": limit,
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        PC_STAC_SEARCH_URL,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": "OrbitalSAR-Reflex/1.0"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_default_ssl_context()) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    scenes = []
    for feat in payload.get("features", []):
        props = feat.get("properties", {})
        assets = feat.get("assets", {})
        scenes.append(
            {
                "id": feat.get("id"),
                "datetime": props.get("datetime"),
                "orbit_state": props.get("sat:orbit_state"),
                "polarizations": props.get("sar:polarizations"),
                "bbox": feat.get("bbox"),
                "preview_url": assets.get("rendered_preview", {}).get("href"),
                "tilejson_url": assets.get("tilejson", {}).get("href"),
            }
        )
    return scenes


def fetch_meteomatics_series(
    lat: float,
    lon: float,
    start_iso: str,
    end_iso: str,
    step: str = "P2D",
    env_path: str | Path = ".env",
    timeout: int = 20,
) -> dict[str, Any]:
    """Fetch Meteomatics temperature, 24h precipitation, wind, and RH series using env/.env credentials."""
    dotenv = load_dotenv_file(env_path)
    user = os.environ.get("METEOMATICS_USER") or dotenv.get("METEOMATICS_USER")
    password = os.environ.get("METEOMATICS_PASS") or dotenv.get("METEOMATICS_PASS")
    if not user or not password:
        raise RuntimeError("Missing METEOMATICS_USER or METEOMATICS_PASS in environment or .env.")

    params = "t_2m:C,precip_24h:mm,wind_speed_10m:ms,relative_humidity_2m:p"
    url = f"{METEOMATICS_BASE_URL}/{start_iso}--{end_iso}:{step}/{params}/{lat},{lon}/json"
    token = base64.b64encode(f"{user}:{password}".encode("utf-8")).decode("ascii")
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Basic {token}", "User-Agent": "OrbitalSAR-Reflex/1.0"},
    )
    with urllib.request.urlopen(req, timeout=timeout, context=_default_ssl_context()) as resp:
        raw = json.loads(resp.read().decode("utf-8"))

    by_date: dict[str, dict[str, Any]] = {}
    for item in raw.get("data", []):
        param_name = item.get("parameter")
        for pt in item.get("coordinates", [{}])[0].get("dates", []):
            d = pt.get("date")
            if d:
                by_date.setdefault(d, {"date": d})[param_name] = pt.get("value")
    series = [by_date[k] for k in sorted(by_date)]
    return {"status": raw.get("status"), "lat": lat, "lon": lon, "series": series}
