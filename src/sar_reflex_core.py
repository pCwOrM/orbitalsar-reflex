"""Core SAR change-detection, dual-pol physics, and 24-byte FNS telemetry encoder for OrbitalSAR Reflex."""

from __future__ import annotations

import math
import struct
import zlib
from dataclasses import dataclass

PACKET_FORMAT = "<IffffBBH"
PACKET_SIZE_BYTES = struct.calcsize(PACKET_FORMAT)  # 24 bytes

ANOMALY_CODES = {
    "NOMINAL": 0,
    "FLOOD_INUNDATION": 1,
    "SURFACE_DEFORMATION": 2,
    "STRUCTURAL_DAMAGE": 3,
    "WILDFIRE_SCAR": 4,
    "GLACIER_SURGE": 5,
}
CODE_TO_ANOMALY = {code: label for label, code in ANOMALY_CODES.items()}


@dataclass(frozen=True)
class SarObservation:
    """Represents a pre/post SAR backscatter & coherence pair at a target coordinate."""

    timestamp_s: int
    lat: float
    lon: float
    pre_sigma0: float
    post_sigma0: float
    coherence_drop: float
    rvi_delta: float = 0.0
    precip_24h_mm: float = 0.0
    temperature_c: float | None = None


@dataclass(frozen=True)
class ReflexAlert:
    """Evaluated SAR anomaly classification and 24-byte telemetry packet."""

    anomaly_label: str
    anomaly_code: int
    severity: int
    log_ratio_db: float
    coherence_drop: float
    flood_weather_confidence: float
    packet_24b: bytes


def compute_log_ratio_db(pre_sigma0: float, post_sigma0: float) -> float:
    """Compute SAR backscatter log-ratio in decibels: 10 * log10(post / pre)."""
    if pre_sigma0 <= 0.0 or post_sigma0 <= 0.0:
        raise ValueError("SAR sigma0 values must be strictly positive.")
    return 10.0 * math.log10(post_sigma0 / pre_sigma0)


def compute_dual_pol_rvi(co_pol_sigma0: float, cross_pol_sigma0: float) -> float:
    """Compute Dual-Pol Radar Vegetation Index: 4 * cross / (co + cross) in [0, 4]."""
    if co_pol_sigma0 < 0.0 or cross_pol_sigma0 < 0.0:
        raise ValueError("Backscatter intensities must be non-negative.")
    denom = co_pol_sigma0 + cross_pol_sigma0
    if denom == 0.0:
        return 0.0
    return (4.0 * cross_pol_sigma0) / denom


def compute_weather_flood_confidence(
    log_ratio_db: float, coherence_drop: float, precip_24h_mm: float
) -> float:
    """Fuse SAR flood backscatter drop with Meteomatics 24h precipitation (0.0 to 1.0)."""
    sar_component = min(1.0, max(0.0, (-log_ratio_db - 1.5) / 6.5)) * 0.6
    coh_component = min(1.0, max(0.0, coherence_drop)) * 0.2
    rain_component = min(1.0, max(0.0, precip_24h_mm / 25.0)) * 0.2
    return round(sar_component + coh_component + rain_component, 4)


def classify_sar_anomaly(
    log_ratio_db: float,
    coherence_drop: float,
    *,
    rvi_delta: float = 0.0,
    temperature_c: float | None = None,
) -> tuple[str, int]:
    """Classify SAR change-detection signature into (anomaly_label, severity_0_255)."""
    if not 0.0 <= coherence_drop <= 1.0:
        raise ValueError("coherence_drop must be within [0.0, 1.0].")

    if log_ratio_db <= -3.0 and coherence_drop >= 0.35:
        label = "FLOOD_INUNDATION"
    elif log_ratio_db >= 3.0 and coherence_drop >= 0.45:
        label = "STRUCTURAL_DAMAGE"
    elif rvi_delta <= -0.25 and coherence_drop >= 0.35:
        label = "WILDFIRE_SCAR"
    elif temperature_c is not None and temperature_c <= 2.0 and coherence_drop >= 0.50:
        label = "GLACIER_SURGE"
    elif coherence_drop >= 0.35:
        label = "SURFACE_DEFORMATION"
    else:
        label = "NOMINAL"

    raw_score = min(
        1.0,
        (abs(log_ratio_db) / 10.0) * 0.45 + coherence_drop * 0.45 + min(0.1, abs(rvi_delta) * 0.1),
    )
    severity = 0 if label == "NOMINAL" else max(1, min(255, int(round(raw_score * 255))))
    return label, severity


def encode_fns_packet_24b(
    timestamp_s: int,
    lat: float,
    lon: float,
    log_ratio_db: float,
    coherence_drop: float,
    anomaly_code: int,
    severity: int,
) -> bytes:
    """Encode an alert into a fixed 24-byte little-endian binary telemetry packet."""
    if anomaly_code not in CODE_TO_ANOMALY:
        raise ValueError(f"Unsupported anomaly_code: {anomaly_code}")
    if not 0 <= severity <= 255:
        raise ValueError("severity must be in 0..255.")

    body = struct.pack(
        "<IffffBB",
        int(timestamp_s) & 0xFFFFFFFF,
        float(lat),
        float(lon),
        float(log_ratio_db),
        float(coherence_drop),
        anomaly_code,
        severity,
    )
    crc16 = zlib.crc32(body) & 0xFFFF
    return body + struct.pack("<H", crc16)


def decode_fns_packet_24b(packet: bytes) -> dict[str, float | int | str]:
    """Decode and CRC-verify a 24-byte FNS telemetry packet."""
    if len(packet) != PACKET_SIZE_BYTES:
        raise ValueError(f"Expected {PACKET_SIZE_BYTES} bytes, got {len(packet)}.")

    body, (crc_received,) = packet[:22], struct.unpack("<H", packet[22:24])
    crc_expected = zlib.crc32(body) & 0xFFFF
    if crc_received != crc_expected:
        raise ValueError(
            f"CRC mismatch: expected 0x{crc_expected:04x}, got 0x{crc_received:04x}."
        )

    timestamp_s, lat, lon, log_ratio_db, coherence_drop, anomaly_code, severity = (
        struct.unpack("<IffffBB", body)
    )
    return {
        "timestamp_s": timestamp_s,
        "lat": lat,
        "lon": lon,
        "log_ratio_db": log_ratio_db,
        "coherence_drop": coherence_drop,
        "anomaly_code": anomaly_code,
        "anomaly_label": CODE_TO_ANOMALY.get(anomaly_code, "UNKNOWN"),
        "severity": severity,
        "crc16": crc_received,
    }


def evaluate_observation(obs: SarObservation) -> ReflexAlert:
    """Run full SAR change-detection and return a ReflexAlert with 24-byte packet."""
    log_ratio_db = compute_log_ratio_db(obs.pre_sigma0, obs.post_sigma0)
    label, severity = classify_sar_anomaly(
        log_ratio_db,
        obs.coherence_drop,
        rvi_delta=obs.rvi_delta,
        temperature_c=obs.temperature_c,
    )
    code = ANOMALY_CODES[label]
    confidence = compute_weather_flood_confidence(
        log_ratio_db, obs.coherence_drop, obs.precip_24h_mm
    )
    packet = encode_fns_packet_24b(
        timestamp_s=obs.timestamp_s,
        lat=obs.lat,
        lon=obs.lon,
        log_ratio_db=log_ratio_db,
        coherence_drop=obs.coherence_drop,
        anomaly_code=code,
        severity=severity,
    )
    return ReflexAlert(
        anomaly_label=label,
        anomaly_code=code,
        severity=severity,
        log_ratio_db=log_ratio_db,
        coherence_drop=obs.coherence_drop,
        flood_weather_confidence=confidence,
        packet_24b=packet,
    )
