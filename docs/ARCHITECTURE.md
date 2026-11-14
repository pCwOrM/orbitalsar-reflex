# OrbitalSAR Reflex — Architecture

## 1. Pipeline Overview

```text
[Pre/Post SAR Pair (σ⁰_pre, σ⁰_post, Δγ)]
                  │
                  ▼
      [compute_log_ratio_db]
    10 * log10(σ⁰_post / σ⁰_pre)
                  │
                  ▼
     [classify_sar_anomaly]
  ├─ Flood Inundation   (Δσ⁰ <= -3.0 dB and Δγ >= 0.35)
  ├─ Structural Damage  (Δσ⁰ >= +3.0 dB and Δγ >= 0.45)
  ├─ Surface Deformation(Δγ >= 0.35)
  └─ Nominal            (otherwise)
                  │
                  ▼
    [encode_fns_packet_24b]
  24-byte Little-Endian Binary Frame + CRC-16
```

## 2. 24-Byte FNS Binary Packet Layout (`<IffffBBH`)

| Offset | Size (B) | Type | Field | Description |
|-------:|---------:|------|-------|-------------|
| 0 | 4 | `uint32` | `timestamp_s` | UTC epoch seconds |
| 4 | 4 | `float32` | `lat` | Latitude (degrees) |
| 8 | 4 | `float32` | `lon` | Longitude (degrees) |
| 12 | 4 | `float32` | `log_ratio_db` | SAR backscatter log-ratio (dB) |
| 16 | 4 | `float32` | `coherence_drop` | Interferometric coherence drop `[0, 1]` |
| 20 | 1 | `uint8` | `anomaly_code` | `0=NOMINAL`, `1=FLOOD`, `2=DEFORMATION`, `3=DAMAGE` |
| 21 | 1 | `uint8` | `severity` | Severity score `0–255` |
| 22 | 2 | `uint16` | `crc16` | `zlib.crc32(payload[:22]) & 0xFFFF` |

Total: **24 bytes**.
