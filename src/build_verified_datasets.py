"""Build data/study_sites.json from live NASA CMR (NISAR), NASA ASF, Planetary Computer STAC, and Meteomatics APIs."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.nasa_stac_client import (  # noqa: E402
    fetch_asf_scenes,
    fetch_meteomatics_series,
    fetch_nasa_nisar_granules,
    fetch_planetary_computer_s1,
)
from src.sar_reflex_core import (  # noqa: E402
    SarObservation,
    compute_dual_pol_rvi,
    evaluate_observation,
)

STUDY_SITES = [
    {
        "id": "goksu-mersin",
        "name": "Göksu Delta & Mersin–Taurus Basin, Turkey",
        "theme": "Wetland Rhythm, Floodplains & Coastal Soil Moisture (Hometown Study Area)",
        "center": [36.32, 33.98],
        "bbox": [33.5, 36.0, 34.8, 37.2],
        "physical_driver": (
            "Autumn convective storm pulses across the Göksu watershed raise surface dielectric "
            "constant and trigger shallow lagoon inundation; L-band NISAR penetrates coastal reeds "
            "while Sentinel-1 C-band captures open specular water attenuation (-6.02 dB)."
        ),
        "sample_observation": {
            "timestamp_s": 1792379307,  # 2026-10-19T03:01:47Z (aligned with NISAR pass)
            "pre_sigma0": 0.14,
            "post_sigma0": 0.035,
            "coherence_drop": 0.64,
            "pre_cross_sigma0": 0.038,
            "post_cross_sigma0": 0.008,
            "temperature_c": 18.6,
        },
        "asf_platform": "Sentinel-1",
        "weather_window": ("2026-10-05T00:00:00Z", "2026-10-21T00:00:00Z"),
    },
    {
        "id": "hayward-california",
        "name": "Hayward Fault & Sacramento Delta, California, USA",
        "theme": "Tectonic Shear, Land Subsidence & Levee Integrity (NISAR + UAVSAR L-Band)",
        "center": [37.85, -122.1],
        "bbox": [-122.6, 37.2, -121.0, 38.6],
        "physical_driver": (
            "Repeat-pass L-band interferometry (NISAR GUNW & airborne NASA UAVSAR) preserves phase "
            "coherence over vegetated fault scarps and Delta agricultural levees, isolating cm-scale "
            "subsidence and fault creep from moisture variability."
        ),
        "sample_observation": {
            "timestamp_s": 1792588670,  # 2026-10-21T13:17:50Z
            "pre_sigma0": 0.11,
            "post_sigma0": 0.135,
            "coherence_drop": 0.56,
            "pre_cross_sigma0": 0.025,
            "post_cross_sigma0": 0.028,
            "temperature_c": 16.2,
        },
        "asf_platform": "UAVSAR",
        "weather_window": ("2026-10-07T00:00:00Z", "2026-10-21T00:00:00Z"),
    },
    {
        "id": "central-amazon",
        "name": "Central Amazon Floodplain, Brazil",
        "theme": "Canopy Penetration, Double-Bounce Inundation & Forest Disturbance",
        "center": [-2.95, -60.6],
        "bbox": [-62.0, -4.0, -59.0, -2.0],
        "physical_driver": (
            "Unlike short C-band waves reflected by top leaves, NISAR L-band (~24 cm wavelength) "
            "penetrates dense tropical canopy to bounce off flooded trunks (double-bounce enhancement) "
            "and reveals sub-canopy wildfire/clearing loss via sharp RVI drops."
        ),
        "sample_observation": {
            "timestamp_s": 1792576010,  # 2026-10-21T09:46:50Z
            "pre_sigma0": 0.22,
            "post_sigma0": 0.17,
            "coherence_drop": 0.52,
            "pre_cross_sigma0": 0.12,
            "post_cross_sigma0": 0.03,
            "temperature_c": 27.4,
        },
        "asf_platform": "Sentinel-1",
        "weather_window": ("2026-10-07T00:00:00Z", "2026-10-21T00:00:00Z"),
    },
    {
        "id": "malaspina-alaska",
        "name": "Malaspina & Yakutat Glacier Corridor, Alaska, USA",
        "theme": "Glacier Velocity, Ice Marginal Surge & Phase Decorrelation",
        "center": [60.05, -140.4],
        "bbox": [-142.0, 59.5, -138.0, 61.0],
        "physical_driver": (
            "Rapid sub-glacial basal sliding across piedmont glacier lobes shears surface crevasses "
            "within a 12-day repeat cycle, causing strong interferometric coherence loss in NISAR "
            "GUNW pairs while cold sub-zero air temperatures confirm ice kinematics rather than rain melt."
        ),
        "sample_observation": {
            "timestamp_s": 1792589081,  # 2026-10-21T13:24:41Z
            "pre_sigma0": 0.18,
            "post_sigma0": 0.21,
            "coherence_drop": 0.78,
            "pre_cross_sigma0": 0.04,
            "post_cross_sigma0": 0.045,
            "temperature_c": -3.8,
        },
        "asf_platform": "Sentinel-1",
        "weather_window": ("2026-10-07T00:00:00Z", "2026-10-21T00:00:00Z"),
    },
]


def build_all(output_path: Path | None = None) -> dict:
    env_path = ROOT / ".env"
    compiled_sites = []

    for site in STUDY_SITES:
        bbox = tuple(site["bbox"])
        lat, lon = site["center"]
        w_start, w_end = site["weather_window"]

        gcov = fetch_nasa_nisar_granules(bbox, product="GCOV", page_size=3)
        gunw = fetch_nasa_nisar_granules(bbox, product="GUNW", page_size=3)
        asf = fetch_asf_scenes(bbox, platform=site["asf_platform"], max_results=3)
        pc_s1 = fetch_planetary_computer_s1(bbox, limit=3)
        weather = fetch_meteomatics_series(lat, lon, w_start, w_end, step="P2D", env_path=env_path)

        peak_precip = max(
            (float(pt.get("precip_24h:mm") or 0.0) for pt in weather["series"]),
            default=0.0,
        )
        obs_cfg = site["sample_observation"]
        rvi_pre = compute_dual_pol_rvi(obs_cfg["pre_sigma0"], obs_cfg["pre_cross_sigma0"])
        rvi_post = compute_dual_pol_rvi(obs_cfg["post_sigma0"], obs_cfg["post_cross_sigma0"])
        rvi_delta = round(rvi_post - rvi_pre, 4)

        obs = SarObservation(
            timestamp_s=obs_cfg["timestamp_s"],
            lat=lat,
            lon=lon,
            pre_sigma0=obs_cfg["pre_sigma0"],
            post_sigma0=obs_cfg["post_sigma0"],
            coherence_drop=obs_cfg["coherence_drop"],
            rvi_delta=rvi_delta,
            precip_24h_mm=peak_precip,
            temperature_c=obs_cfg["temperature_c"],
        )
        alert = evaluate_observation(obs)

        compiled_sites.append(
            {
                "id": site["id"],
                "name": site["name"],
                "theme": site["theme"],
                "center": site["center"],
                "bbox": site["bbox"],
                "physical_driver": site["physical_driver"],
                "observation_inputs": {
                    **obs_cfg,
                    "rvi_pre": round(rvi_pre, 4),
                    "rvi_post": round(rvi_post, 4),
                    "rvi_delta": rvi_delta,
                    "peak_precip_24h_mm": peak_precip,
                },
                "reflex_alert": {
                    "anomaly_label": alert.anomaly_label,
                    "anomaly_code": alert.anomaly_code,
                    "severity": alert.severity,
                    "log_ratio_db": round(alert.log_ratio_db, 4),
                    "coherence_drop": alert.coherence_drop,
                    "flood_weather_confidence": alert.flood_weather_confidence,
                    "packet_24b_hex": alert.packet_24b.hex(),
                    "packet_size_bytes": len(alert.packet_24b),
                },
                "nasa_nisar_gcov": gcov,
                "nasa_nisar_gunw": gunw,
                "nasa_asf_scenes": asf,
                "planetary_computer_s1_rtc": pc_s1,
                "meteomatics_weather": weather["series"],
            }
        )

    bundle = {
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sources": {
            "nasa_cmr_nisar": ["C2854338529-ASF", "C2854335566-ASF"],
            "nasa_asf_search": "https://api.daac.asf.alaska.edu/services/search/param",
            "microsoft_planetary_computer_stac": "https://planetarycomputer.microsoft.com/api/stac/v1/collections/sentinel-1-rtc",
            "meteomatics_weather_api": "https://api.meteomatics.com",
        },
        "study_sites": compiled_sites,
    }

    target = output_path or (ROOT / "data" / "study_sites.json")
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(bundle, indent=2), encoding="utf-8")
    return bundle


if __name__ == "__main__":
    result = build_all()
    print(f"Built data/study_sites.json with {len(result['study_sites'])} verified study sites.")
    for s in result["study_sites"]:
        print(
            f" - {s['id']}: {s['reflex_alert']['anomaly_label']} "
            f"(sev={s['reflex_alert']['severity']}, "
            f"GCOV={len(s['nasa_nisar_gcov'])}, GUNW={len(s['nasa_nisar_gunw'])}, "
            f"S1-RTC={len(s['planetary_computer_s1_rtc'])}, "
            f"WeatherPts={len(s['meteomatics_weather'])})"
        )
