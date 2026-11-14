# OrbitalSAR Reflex — System Architecture

## 1. End-to-End Multi-Sensor Pipeline

```text
+---------------------------+     +----------------------------------+     +------------------------+
| NASA CMR NISAR L2         |     | NASA ASF Search Vertex           |     | Microsoft Planetary    |
| C2854338529-ASF (GCOV)    |     | Sentinel-1 GRD/SLC & L-Band      |     | Computer STAC          |
| C2854335566-ASF (GUNW)    |     | Quad-Pol UAVSAR                  |     | sentinel-1-rtc         |
+-------------+-------------+     +----------------+-----------------+     +-----------+------------+
              |                                    |                                   |
              +------------------------------------+-----------------------------------+
                                                   |
                                                   v
                              [ src/nasa_stac_client.py + data/study_sites.json ]
                                                   |
              +------------------------------------+-----------------------------------+
              |                                                                        |
              v                                                                        v
+----------------------------------------+                        +-----------------------------------+
| Meteomatics Weather API                |                        | SAR Scattering Physics Engine     |
| precip_24h:mm, t_2m:C, wind, RH        | ---------------------> | src/sar_reflex_core.py            |
+----------------------------------------+                        | - compute_log_ratio_db            |
                                                                  | - compute_dual_pol_rvi            |
                                                                  | - compute_weather_flood_confidence|
                                                                  | - classify_sar_anomaly (codes 0-5)|
                                                                  +-----------------+-----------------+
                                                                                    |
                                                                                    v
                                                                  +-----------------------------------+
                                                                  | 24-Byte Deterministic FNS Frame   |
                                                                  | <IffffBBH> + IEEE CRC-16          |
                                                                  | Bit-exact Python & Browser JS     |
                                                                  +-----------------+-----------------+
                                                                                    |
                                                                                    v
                                                                  +-----------------------------------+
                                                                  | Live Web Observatory (index.html) |
                                                                  | Swath Map · Wipe Slider · Charts  |
                                                                  +-----------------------------------+
```

## 2. Anomaly Classification Decision Rules (`classify_sar_anomaly`)

1. **`FLOOD_INUNDATION` (`1`):** `log_ratio_db <= -3.0 dB` and `coherence_drop >= 0.35` (specular reflection drop; fused with Meteomatics `precip_24h:mm` via `compute_weather_flood_confidence`).
2. **`STRUCTURAL_DAMAGE` (`3`):** `log_ratio_db >= +3.0 dB` and `coherence_drop >= 0.45` (urban rubble double-bounce / corner-reflector surge + coherence loss).
3. **`WILDFIRE_SCAR` (`4`):** `rvi_delta <= -0.25` and `coherence_drop >= 0.35` (L-band cross-pol canopy volume loss).
4. **`GLACIER_SURGE` (`5`):** `temperature_c <= 2.0 °C` and `coherence_drop >= 0.50` (sub-zero cryosphere kinematic decorrelation).
5. **`SURFACE_DEFORMATION` (`2`):** `coherence_drop >= 0.35` (fault slip, subsidence, or soil shift).
6. **`NOMINAL` (`0`):** All metrics within baseline variability (`severity = 0`).

## 3. 24-Byte FNS Binary Packet Layout (`<IffffBBH>`)

| Offset | Size (B) | Type | Field | Description |
|-------:|---------:|------|-------|-------------|
| 0 | 4 | `uint32` | `timestamp_s` | UTC epoch seconds |
| 4 | 4 | `float32` | `lat` | Latitude (degrees) |
| 8 | 4 | `float32` | `lon` | Longitude (degrees) |
| 12 | 4 | `float32` | `log_ratio_db` | SAR backscatter log-ratio ($\Delta\sigma^0$ dB) |
| 16 | 4 | `float32` | `coherence_drop` | Interferometric coherence drop $\Delta\gamma \in [0, 1]$ |
| 20 | 1 | `uint8` | `anomaly_code` | `0=NOMINAL`, `1=FLOOD_INUNDATION`, `2=SURFACE_DEFORMATION`, `3=STRUCTURAL_DAMAGE`, `4=WILDFIRE_SCAR`, `5=GLACIER_SURGE` |
| 21 | 1 | `uint8` | `severity` | Severity score `0–255` |
| 22 | 2 | `uint16` | `crc16` | `zlib.crc32(payload[:22]) & 0xFFFF` (matches JS IEEE-802.3 CRC32 low 16 bits) |

Total: **24 bytes** (`>7.5×10⁷×` alert compression compared to GB-class SAR granules).
