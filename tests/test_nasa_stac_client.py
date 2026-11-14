"""Unit tests for NASA CMR / ASF / Planetary Computer STAC parsers and curated data integrity."""

import json
import tempfile
import unittest
from pathlib import Path

from src.nasa_stac_client import (
    load_dotenv_file,
    normalize_cmr_nisar_entry,
    parse_cmr_polygon,
)
from src.sar_reflex_core import decode_fns_packet_24b


class TestNasaStacClient(unittest.TestCase):
    def test_parse_cmr_polygon(self) -> None:
        rings = [["35.89 33.98 38.00 33.19 37.31 30.48 35.89 33.98"]]
        coords = parse_cmr_polygon(rings)
        self.assertEqual(len(coords), 4)
        self.assertEqual(coords[0], [35.89, 33.98])
        self.assertEqual(parse_cmr_polygon(None), [])

    def test_normalize_cmr_nisar_entry(self) -> None:
        sample = {
            "title": "NISAR_L2_PR_GCOV_033_100_A_020",
            "collection_concept_id": "C2854338529-ASF",
            "time_start": "2026-10-19T03:01:19Z",
            "time_end": "2026-10-19T03:01:54Z",
            "polygons": [["35.89 33.98 38.00 33.19 35.89 33.98"]],
            "links": [
                {"href": "s3://bucket/ignore.png"},
                {"href": "https://example.org/scene_NATIVE.png"},
                {"href": "https://example.org/scene_LATLON.png"},
            ],
        }
        out = normalize_cmr_nisar_entry(sample, "GCOV")
        self.assertEqual(out["product"], "GCOV")
        self.assertEqual(out["browse_url"], "https://example.org/scene_LATLON.png")
        self.assertEqual(len(out["browse_layers"]), 2)

    def test_load_dotenv_file(self) -> None:
        with tempfile.TemporaryDirectory() as td:
            p = Path(td) / ".env"
            p.write_text("# comment\nKEY_ONE=alpha\nKEY_TWO='beta'\n", encoding="utf-8")
            parsed = load_dotenv_file(p)
            self.assertEqual(parsed, {"KEY_ONE": "alpha", "KEY_TWO": "beta"})

    def test_compiled_study_sites_if_present(self) -> None:
        data_file = Path(__file__).resolve().parent.parent / "data" / "study_sites.json"
        if not data_file.is_file():
            self.skipTest("data/study_sites.json not yet built")
        bundle = json.loads(data_file.read_text(encoding="utf-8"))
        sites = bundle.get("study_sites", [])
        self.assertGreaterEqual(len(sites), 4)
        for site in sites:
            hex_pkt = site["reflex_alert"]["packet_24b_hex"]
            raw = bytes.fromhex(hex_pkt)
            decoded = decode_fns_packet_24b(raw)
            self.assertEqual(decoded["anomaly_label"], site["reflex_alert"]["anomaly_label"])


if __name__ == "__main__":
    unittest.main()
