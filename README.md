<p align="center">
  <img src="assets/orbitalsar_reflex_mission_patch.jpg" alt="OrbitalSAR Reflex Mission Patch" width="240" />
</p>

# OrbitalSAR Reflex

**NASA Space Apps Challenge 2026 — *Dancing with the SARs* (Universal Event)**  
Live Web Observatory: **[https://pcworm.github.io/orbitalsar-reflex/](https://pcworm.github.io/orbitalsar-reflex/)**  
Primary 7-Slide Demo (EN): **[demo/slides.html](demo/slides.html)** · **[PDF (EN)](docs/OrbitalSAR_Reflex_Demo_Slides.pdf)**  
Supplementary Turkish Deck (TR): **[demo/slides_tr.html](demo/slides_tr.html)** · **[PDF (TR)](docs/OrbitalSAR_Reflex_Demo_Slides_TR.pdf)**  
Team Onboarding & Branch Guide: **[CONTRIBUTING.md](CONTRIBUTING.md)**

---

## Team & Event Details

- **Event:** NASA Space Apps Challenge 2026 (`Universal Event, Anywhere in the World`)
- **Challenge:** *Dancing with the SARs*
- **Team Page:** [OrbitalSAR Reflex on Space Apps](https://www.spaceappschallenge.org/2026/find-a-team/orbitalsar-reflex/?tab=details)
- **Members ([Team Roster](https://www.spaceappschallenge.org/2026/find-a-team/orbitalsar-reflex/?tab=members)):**
  - **Volkan Dagli** (`@pCwOrM`) — Team Owner
  - **Murat Emre ÖZKAYA**
  - **Prenses Metin** (`@PrensesMTN`)
- **Official Community & Rules:** [nasa/spaceapps](https://github.com/nasa/spaceapps) · [Space Apps Legal](https://www.spaceappschallenge.org/legal/)

---

## Core Architecture & Physical Drivers

**OrbitalSAR Reflex** connects **NASA-ISRO Synthetic Aperture Radar (NISAR)** L-band observations with **Sentinel-1** C-band backscatter, **Meteomatics Weather API** meteorological series, and a **24-byte CRC-16 verified deterministic telemetry encoder**:

1. **Multi-Sensor SAR Fusion (`data/study_sites.json` & Live CORS Queries):**
   - **NASA Earthdata CMR NISAR L2 Provisional:** `NISAR_L2_GCOV_PROVISIONAL_V1` (`C2854338529-ASF`) & `NISAR_L2_GUNW_PROVISIONAL_V1` (`C2854335566-ASF`) interferograms.
   - **NASA ASF Search Vertex:** Sentinel-1 & Quad-Pol L-band airborne **UAVSAR**.
   - **Microsoft Planetary Computer STAC:** `sentinel-1-rtc` public STAC search & rendered previews.
   - **Meteomatics Weather API:** Synced `precip_24h:mm`, `t_2m:C`, `wind_speed_10m:ms`, and `relative_humidity_2m:p` series gating flood vs. cryosphere regimes.
2. **4 Verified Study Regions:**
   - **Göksu Delta & Mersin–Taurus Basin, Turkey** *(Hometown Context — Flood / Wetland Rhythm)*: `FLOOD_INUNDATION` ($\Delta\sigma^0 = -6.02$ dB, $\Delta\gamma = 0.64$, Meteomatics peak rain `42.59 mm/24h`)
   - **Hayward Fault & Sacramento Delta, CA, USA**: `SURFACE_DEFORMATION` (NISAR `GUNW` + NASA `UAVSAR`)
   - **Central Amazon Floodplain, Brazil**: `WILDFIRE_SCAR` / L-band canopy penetration ($\Delta\text{RVI} = -0.65$)
   - **Malaspina & Yakutat Glacier Corridor, Alaska**: `GLACIER_SURGE` ($\Delta\gamma = 0.78$, sub-zero gating $-3.8^\circ\text{C}$)
3. **24-Byte Deterministic FNS Edge Packet (`<IffffBBH`):**
   - Compresses GB-scale surface-change decisions down to **24 bytes** with byte-identical Python (`zlib.crc32`) and browser JavaScript encoders.

---

## Repository Structure

```text
orbitalsar-reflex/
├── index.html                               # Main GitHub Pages Live Web Observatory (English)
├── CONTRIBUTING.md                          # Team workflow, branch rules & onboarding guide
├── .github/
│   └── PULL_REQUEST_TEMPLATE.md             # PR verification checklist
├── assets/
│   ├── app.js                               # Interactive Leaflet map, SAR wipe, Canvas weather chart & 24B encoder
│   ├── styles.css
│   └── orbitalsar_reflex_mission_patch.jpg  # Watermarked SI-GENERATED team mission patch
├── data/
│   └── study_sites.json                     # Real verified NASA NISAR + ASF + Planetary Computer + Meteomatics bundle
├── demo/
│   ├── slides.html                          # Interactive 7-slide HTML demonstration (EN)
│   └── slides_tr.html                       # Interactive 7-slide HTML demonstration (TR)
├── docs/
│   ├── ARCHITECTURE.md
│   ├── OrbitalSAR_Reflex_Demo_Slides.pdf    # Exact 7-page demonstration PDF (EN)
│   └── OrbitalSAR_Reflex_Demo_Slides_TR.pdf # Exact 7-page demonstration PDF (TR)
├── src/
│   ├── __init__.py
│   ├── sar_reflex_core.py                   # SAR physics classifier + 24-byte FNS packet codec
│   ├── nasa_stac_client.py                  # Zero-dependency NASA CMR / ASF / Planetary Computer / Meteomatics client
│   └── build_verified_datasets.py           # Reproducible dataset compiler (reads Meteomatics creds from .env)
└── tests/
    ├── test_sar_reflex_core.py
    └── test_nasa_stac_client.py
```

---

## Quickstart & Verification

Run all automated tests (zero third-party Python dependencies):

```bash
python -m unittest discover -s tests -v
```

*(Note: Never commit `.env` secrets; Meteomatics credentials are read locally via `METEOMATICS_USER` / `METEOMATICS_PASS`.)*

---

## Super Intelligence (SI) Transparency Disclosure

In accordance with NASA Space Apps Challenge 2026 SI guidelines, mission patch artwork (`assets/orbitalsar_reflex_mission_patch.jpg`) and code scaffolding were developed with AI/SI assistance without incorporating any NASA logos, flags, or official emblems. All telemetry calculations, CRC-16 packet framing, and API-fetched datasets are verified by the automated test suite in `tests/`.
