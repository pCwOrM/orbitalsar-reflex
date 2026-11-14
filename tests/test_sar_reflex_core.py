"""Unit tests for OrbitalSAR Reflex core engine."""

import unittest

from src.sar_reflex_core import (
    PACKET_SIZE_BYTES,
    SarObservation,
    classify_sar_anomaly,
    compute_dual_pol_rvi,
    compute_log_ratio_db,
    compute_weather_flood_confidence,
    decode_fns_packet_24b,
    evaluate_observation,
)


class TestSarReflexCore(unittest.TestCase):
    def test_packet_size_is_24_bytes(self) -> None:
        self.assertEqual(PACKET_SIZE_BYTES, 24)

    def test_log_ratio_db_calculation(self) -> None:
        self.assertAlmostEqual(compute_log_ratio_db(0.10, 0.01), -10.0, places=6)
        self.assertAlmostEqual(compute_log_ratio_db(0.05, 0.05), 0.0, places=6)

    def test_dual_pol_rvi_and_weather_confidence(self) -> None:
        rvi_high = compute_dual_pol_rvi(0.20, 0.12)
        rvi_low = compute_dual_pol_rvi(0.20, 0.02)
        self.assertGreater(rvi_high, rvi_low)
        self.assertEqual(compute_dual_pol_rvi(0.0, 0.0), 0.0)

        conf_wet = compute_weather_flood_confidence(-6.0, 0.65, 22.0)
        conf_dry = compute_weather_flood_confidence(-6.0, 0.65, 0.0)
        self.assertGreater(conf_wet, conf_dry)
        self.assertLessEqual(conf_wet, 1.0)

    def test_flood_classification_and_roundtrip(self) -> None:
        obs = SarObservation(
            timestamp_s=1794680000,
            lat=36.8121,
            lon=34.6415,
            pre_sigma0=0.12,
            post_sigma0=0.03,
            coherence_drop=0.62,
            precip_24h_mm=22.2,
        )
        alert = evaluate_observation(obs)
        self.assertEqual(alert.anomaly_label, "FLOOD_INUNDATION")
        self.assertEqual(len(alert.packet_24b), 24)
        self.assertGreater(alert.severity, 0)
        self.assertGreater(alert.flood_weather_confidence, 0.5)

        decoded = decode_fns_packet_24b(alert.packet_24b)
        self.assertEqual(decoded["anomaly_label"], "FLOOD_INUNDATION")
        self.assertEqual(decoded["timestamp_s"], 1794680000)
        self.assertAlmostEqual(decoded["lat"], 36.8121, places=3)
        self.assertAlmostEqual(decoded["lon"], 34.6415, places=3)

    def test_all_anomaly_modes(self) -> None:
        self.assertEqual(classify_sar_anomaly(4.2, 0.55)[0], "STRUCTURAL_DAMAGE")
        self.assertEqual(classify_sar_anomaly(-1.1, 0.52, rvi_delta=-0.65)[0], "WILDFIRE_SCAR")
        self.assertEqual(classify_sar_anomaly(0.6, 0.78, temperature_c=-3.8)[0], "GLACIER_SURGE")
        self.assertEqual(classify_sar_anomaly(0.8, 0.50, temperature_c=18.0)[0], "SURFACE_DEFORMATION")
        nom_label, nom_sev = classify_sar_anomaly(-0.4, 0.12)
        self.assertEqual(nom_label, "NOMINAL")
        self.assertEqual(nom_sev, 0)

    def test_crc_tamper_detection(self) -> None:
        obs = SarObservation(
            timestamp_s=1794680000,
            lat=37.0,
            lon=35.3,
            pre_sigma0=0.10,
            post_sigma0=0.10,
            coherence_drop=0.45,
        )
        alert = evaluate_observation(obs)
        corrupted = bytearray(alert.packet_24b)
        corrupted[5] ^= 0xFF
        with self.assertRaises(ValueError):
            decode_fns_packet_24b(bytes(corrupted))


if __name__ == "__main__":
    unittest.main()
