/* OrbitalSAR Reflex — Interactive NASA NISAR / Sentinel-1 / Meteomatics Web Observatory */

const ANOMALY_CODES = {
  NOMINAL: 0,
  FLOOD_INUNDATION: 1,
  SURFACE_DEFORMATION: 2,
  STRUCTURAL_DAMAGE: 3,
  WILDFIRE_SCAR: 4,
  GLACIER_SURGE: 5,
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const ANOMALY_COLORS = {
  NOMINAL: "#10b981",
  FLOOD_INUNDATION: "#38bdf8",
  SURFACE_DEFORMATION: "#f59e0b",
  STRUCTURAL_DAMAGE: "#f43f5e",
  WILDFIRE_SCAR: "#fb7185",
  GLACIER_SURGE: "#60a5fa",
};

const ANOMALY_TR = {
  NOMINAL: "NOMINAL (Normal)",
  FLOOD_INUNDATION: "SU BASKINI (Flood)",
  SURFACE_DEFORMATION: "YÜZEY DEFORMASYONU",
  STRUCTURAL_DAMAGE: "YAPISAL HASAR",
  WILDFIRE_SCAR: "ORMAN YANGINI İZİ",
  GLACIER_SURGE: "BUZUL KAYMASI (Surge)",
};

const SITE_TR = {
  "goksu-mersin": {
    name: "Göksu Deltası ve Mersin–Toros Havzası, Türkiye",
    theme: "Sulak Alan Ritmi, Taşkın Ovaları ve Kıyı Toprak Nemi (Ev Sahibi Çalışma Bölgesi)",
    driver: "Göksu havzası üzerindeki sonbahar konvektif yağış darbeleri yüzey dielektrik sabitini yükselterek sığ lagün taşkınlarını tetikler; L-bant NISAR kıyı sazlıklarının altına nüfuz ederken Sentinel-1 C-bant açık ayna suyundaki sinyal sönümlenmesini (−6.02 dB) yakalar.",
  },
  "hayward-california": {
    name: "Hayward Fayı ve Sacramento Deltası, Kaliforniya, ABD",
    theme: "Tektonik Kayma, Zemin Çökmesi ve Sedde Bütünlüğü (NISAR + UAVSAR L-Bant)",
    driver: "Tekrarlı L-bant interferometrisi (NISAR GUNW ve havadan NASA UAVSAR), bitki örtülü fay diklikleri ve tarım seddeleri üzerinde faz koheransını koruyarak cm ölçeğinde zemin çökmesi ve fay sürünmesini nem değişiminden ayrıştırır.",
  },
  "central-amazon": {
    name: "Orta Amazon Taşkın Ovası, Brezilya",
    theme: "Kanopi Nüfuziyeti, Çift-Yansımalı Taşkın ve Orman Tahribatı",
    driver: "Üst yapraklardan yansıyan kısa C-bant dalgalarının aksine, NISAR L-bant (~24 cm dalga boyu) yoğun tropikal kanopiye nüfuz ederek su basmış gövdelerden çift-yansıma güçlenmesiyle döner ve keskin ΔRVI düşüşüyle kanopi altı yanma/tahribatı ortaya çıkarır.",
  },
  "malaspina-alaska": {
    name: "Malaspina ve Yakutat Buzul Koridoru, Alaska, ABD",
    theme: "Buzul Hızı, Buz Kenarı Kayması ve Faz Dekorelasyonu",
    driver: "Dağ eteği buzul loblarındaki hızlı taban kayması 12 günlük tekrar döngüsünde yüzey yarıklarını parçalayarak NISAR GUNW çiftlerinde güçlü koherans kaybına yol açar; sıfırın altındaki hava sıcaklığı erime yerine buz kinematiğini doğrular.",
  },
};

const UI_I18N = {
  en: {
    pageTitle: "OrbitalSAR Reflex — Autonomous NISAR & Multi-SAR Change Observatory",
    kickerLbl: "NASA Space Apps Challenge 2026 · Dancing with the SARs",
    metaLineLbl: "Volkan Dagli · Murat Emre ÖZKAYA · Prenses Metin · Universal Event",
    langBtnText: "TR / EN",
    demoText: "7-Slide Demo (EN)",
    demoHref: "demo/slides.html",
    pdfText: "Pitch PDF (EN)",
    pdfHref: "docs/OrbitalSAR_Reflex_Demo_Slides.pdf",
    githubText: "GitHub Repo",
    siteBarLabel: "VERIFIED NASA NISAR × METEOMATICS STUDY SITES:",
    statLblLogRatio: "Δσ⁰ Backscatter",
    statLblCoh: "Coherence Drop (Δγ)",
    statLblRain: "Peak 24h Rain",
    statLblCompression: "24B Packet Compression",
    card1Title: "1. Orbital Swath Map (Live Footprints)",
    card1Sub: "NASA NISAR L2 GCOV/GUNW & Planetary Computer Sentinel-1 RTC polygons",
    liveQueryBtn: "Query Live NASA + STAC",
    liveQueryDefault: "Showing pre-verified snapshot footprints (click Query Live NASA + STAC for live CORS fetch).",
    legGcov: "NISAR GCOV",
    legGunw: "NISAR GUNW",
    legS1: "Sentinel-1 RTC",
    card2Title: "2. Multi-Layer SAR Wipe Comparator",
    card2Sub: "Drag divider to compare NASA NISAR GCOV / Polarization / GUNW Interferogram / S1-RTC",
    lblLeftLayer: "Left:",
    lblRightLayer: "Right:",
    imgFallbackTxt: "Loading remote NASA/STAC browse layer...",
    rawImageLink: "Open Raw Image ↗",
    wipeAria: "SAR wipe position",
    card3Title: "3. Meteomatics Weather × SAR Pass Timeline",
    card3Sub: "Synced 24h Precipitation (mm), 2m Temperature (°C) & NISAR Acquisition Epochs",
    card4Title: "4. 0-SRAM / 24-Byte FNS Edge Reflex Simulator",
    card4Sub: "Bit-exact <IffffBBH> telemetry encoder (mirrors src/sar_reflex_core.py + CRC-16)",
    downloadBinBtn: "Download 24B .bin",
    sLblPre: "Pre σ⁰<sub>co</sub>",
    sLblPost: "Post σ⁰<sub>co</sub>",
    sLblCoh: "Coherence Drop (Δγ)",
    sLblRvi: "ΔRVI (Veg Index Shift)",
    sLblRain: "24h Precip (Meteomatics)",
    sLblTemp: "Air Temp (°C)",
    hexTitleLbl: "24-Byte Deterministic FNS Frame (Little-Endian + CRC-16):",
    card5Title: "5. Verified Granule Catalog & NASA / Partner Data Lineage",
    card5Sub: "Direct links to public NASA Earthdata Cloud NISAR browse products, ASF Vertex, and Planetary Computer STAC",
    footerDataHtml: `<strong>Team Contact:</strong>
      <a href="mailto:info@orbitalsar.space">info@orbitalsar.space</a> ·
      <strong>NASA &amp; Partner Data Used:</strong>
      NASA CMR NISAR L2 Provisional (GCOV <code>C2854338529-ASF</code>, GUNW <code>C2854335566-ASF</code>) ·
      NASA ASF Search Vertex (Sentinel-1 &amp; UAVSAR L-Band) ·
      Microsoft Planetary Computer STAC (<code>sentinel-1-rtc</code>) ·
      Meteomatics Weather API.`,
    footerSiHtml: `<strong>Super Intelligence (SI) Transparency Disclosure:</strong>
      Mission patch artwork (<code>assets/orbitalsar_reflex_mission_patch.jpg</code>) and scaffolding workflows were assisted by AI/SI tools without using any NASA logo, flag, or official emblem; all telemetry algorithms, packet framing, and API datasets were verified via automated tests in <code>tests/</code>.`,
  },
  tr: {
    pageTitle: "OrbitalSAR Reflex — Otonom NISAR ve Çoklu-SAR Değişim Gözlemevi",
    kickerLbl: "NASA Space Apps Challenge 2026 · Dancing with the SARs",
    metaLineLbl: "Volkan Dağlı · Murat Emre ÖZKAYA · Prenses Metin · Universal Event",
    langBtnText: "TR / EN",
    demoText: "7 Slayt Demo (TR)",
    demoHref: "demo/slides_tr.html",
    pdfText: "Sunum PDF (TR)",
    pdfHref: "docs/OrbitalSAR_Reflex_Demo_Slides_TR.pdf",
    githubText: "GitHub Deposu",
    siteBarLabel: "DOĞRULANMIŞ NASA NISAR × METEOMATICS ÇALIŞMA SAHALARI:",
    statLblLogRatio: "Δσ⁰ Geri Saçılım",
    statLblCoh: "Koherans Kaybı (Δγ)",
    statLblRain: "24sa Zirve Yağış",
    statLblCompression: "24B Paket Sıkıştırma",
    card1Title: "1. Yörünge Tarama Haritası (Canlı Ayak İzleri)",
    card1Sub: "NASA NISAR L2 GCOV/GUNW ve Planetary Computer Sentinel-1 RTC poligonları",
    liveQueryBtn: "Canlı NASA + STAC Sorgula",
    liveQueryDefault: "Ön-doğrulanmış anlık izler gösteriliyor (canlı CORS sorgusu için düğmeye tıklayın).",
    legGcov: "NISAR GCOV",
    legGunw: "NISAR GUNW",
    legS1: "Sentinel-1 RTC",
    card2Title: "2. Çok Katmanlı SAR Kaydırma Karşılaştırıcısı",
    card2Sub: "NASA NISAR GCOV / Polarizasyon / GUNW İnterferogram / S1-RTC katmanlarını sürükleyip karşılaştırın",
    lblLeftLayer: "Sol:",
    lblRightLayer: "Sağ:",
    imgFallbackTxt: "Uzak NASA/STAC tarama katmanı yükleniyor...",
    rawImageLink: "Ham Görseli Aç ↗",
    wipeAria: "SAR karşılaştırma kaydırıcısı konumu",
    card3Title: "3. Meteomatics Hava Durumu × SAR Geçiş Zaman Çizelgesi",
    card3Sub: "Eşzamanlı 24 saat Yağış (mm), 2m Sıcaklık (°C) ve NISAR Çekim Anları",
    card4Title: "4. 0-SRAM / 24-Bayt FNS Kenar Refleks Simülatörü",
    card4Sub: "Bit-düzeyinde <IffffBBH> telemetri kodlayıcı (src/sar_reflex_core.py + CRC-16 ile özdeş)",
    downloadBinBtn: "24B .bin İndir",
    sLblPre: "Öncesi σ⁰<sub>co</sub>",
    sLblPost: "Sonrası σ⁰<sub>co</sub>",
    sLblCoh: "Koherans Kaybı (Δγ)",
    sLblRvi: "ΔRVI (Bitki Örtüsü Farkı)",
    sLblRain: "24sa Yağış (Meteomatics)",
    sLblTemp: "Hava Sıcaklığı (°C)",
    hexTitleLbl: "24-Bayt Deterministik FNS Çerçevesi (Little-Endian + CRC-16):",
    card5Title: "5. Doğrulanmış Granül Kataloğu ve NASA / İş Ortağı Veri Soykütüğü",
    card5Sub: "Halka açık NASA Earthdata Cloud NISAR ürünlerine, ASF Vertex ve Planetary Computer STAC arşivlerine doğrudan bağlantılar",
    footerDataHtml: `<strong>Takım İletişimi:</strong>
      <a href="mailto:info@orbitalsar.space">info@orbitalsar.space</a> ·
      <strong>Kullanılan NASA ve İş Ortağı Verileri:</strong>
      NASA CMR NISAR L2 Geçici Sürüm (GCOV <code>C2854338529-ASF</code>, GUNW <code>C2854335566-ASF</code>) ·
      NASA ASF Search Vertex (Sentinel-1 ve UAVSAR L-Bant) ·
      Microsoft Planetary Computer STAC (<code>sentinel-1-rtc</code>) ·
      Meteomatics Hava Durumu API.`,
    footerSiHtml: `<strong>Süper Zekâ (SI) Şeffaflık Beyanı:</strong>
      Görev arması görseli (<code>assets/orbitalsar_reflex_mission_patch.jpg</code>) ve iskelet iş akışları, herhangi bir NASA logosu, bayrağı veya resmi amblemi kullanılmaksızın YZ/SI araçlarıyla hazırlanmıştır; tüm telemetri algoritmaları, paket çerçeveleme ve API veri kümeleri <code>tests/</code> altındaki otomatik testlerle doğrulanmıştır.`,
  },
};

function getInitialLang() {
  try {
    const qs = new URLSearchParams(window.location.search).get("lang");
    if (qs === "tr" || qs === "en") return qs;
    const saved = window.localStorage.getItem("orbitalsar_lang");
    if (saved === "tr" || saved === "en") return saved;
  } catch (_) {}
  return "en";
}

let currentLang = getInitialLang();
let lastLiveQueryState = { kind: "default" };

// Standard IEEE 802.3 CRC32 table matching Python zlib.crc32(body) & 0xFFFF
const CRC32_TABLE = (() => {
  const tbl = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    tbl[i] = c >>> 0;
  }
  return tbl;
})();

function crc32Low16(bytes) {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  }
  return ((crc ^ 0xffffffff) >>> 0) & 0xffff;
}

function classifySarAnomaly(logRatioDb, cohDrop, rviDelta, tempC) {
  let label = "NOMINAL";
  if (logRatioDb <= -3.0 && cohDrop >= 0.35) label = "FLOOD_INUNDATION";
  else if (logRatioDb >= 3.0 && cohDrop >= 0.45) label = "STRUCTURAL_DAMAGE";
  else if (rviDelta <= -0.25 && cohDrop >= 0.35) label = "WILDFIRE_SCAR";
  else if (tempC !== null && tempC <= 2.0 && cohDrop >= 0.50) label = "GLACIER_SURGE";
  else if (cohDrop >= 0.35) label = "SURFACE_DEFORMATION";

  const raw = Math.min(
    1.0,
    (Math.abs(logRatioDb) / 10.0) * 0.45 + cohDrop * 0.45 + Math.min(0.1, Math.abs(rviDelta) * 0.1)
  );
  const severity = label === "NOMINAL" ? 0 : Math.max(1, Math.min(255, Math.round(raw * 255)));
  return { label, code: ANOMALY_CODES[label], severity };
}

function encodePacket24B(timestampS, lat, lon, logRatioDb, cohDrop, code, severity) {
  const buf = new ArrayBuffer(24);
  const view = new DataView(buf);
  view.setUint32(0, timestampS >>> 0, true);
  view.setFloat32(4, lat, true);
  view.setFloat32(8, lon, true);
  view.setFloat32(12, logRatioDb, true);
  view.setFloat32(16, cohDrop, true);
  view.setUint8(20, code);
  view.setUint8(21, severity);
  const crc16 = crc32Low16(new Uint8Array(buf, 0, 22));
  view.setUint16(22, crc16, true);
  return { bytes: new Uint8Array(buf), crc16 };
}

let bundle = null;
let activeSite = null;
let map = null;
let swathLayerGroup = null;
let currentPacketBytes = null;

function formatAnomalyLabel(label) {
  return currentLang === "tr" ? (ANOMALY_TR[label] || label) : label;
}

function getSiteCopy(site) {
  if (currentLang === "tr" && SITE_TR[site.id]) {
    return SITE_TR[site.id];
  }
  return { name: site.name, theme: site.theme, driver: site.physical_driver };
}

function renderLiveQueryStatus() {
  const statusEl = document.getElementById("liveQueryStatus");
  const tr = currentLang === "tr";
  if (lastLiveQueryState.kind === "loading") {
    statusEl.textContent = tr
      ? `[${lastLiveQueryState.bbox}] için canlı NASA CMR (NISAR GCOV) ve Planetary Computer STAC sorgulanıyor...`
      : `Querying live NASA CMR (NISAR GCOV) & Planetary Computer STAC for [${lastLiveQueryState.bbox}]...`;
  } else if (lastLiveQueryState.kind === "ok") {
    statusEl.textContent = tr
      ? `CANLI CORS BAŞARILI — NASA NISAR GCOV sonucu: ${lastLiveQueryState.nisCount} (son: ${lastLiveQueryState.latestNisar}) | Planetary Computer S1-RTC sonucu: ${lastLiveQueryState.s1Count} (son: ${lastLiveQueryState.latestS1}).`
      : `LIVE CORS OK — NASA NISAR GCOV hits: ${lastLiveQueryState.nisCount} (latest: ${lastLiveQueryState.latestNisar}) | Planetary Computer S1-RTC hits: ${lastLiveQueryState.s1Count} (latest: ${lastLiveQueryState.latestS1}).`;
  } else if (lastLiveQueryState.kind === "err") {
    statusEl.textContent = tr
      ? `Canlı sorgu notu: ${lastLiveQueryState.msg} (doğrulanmış çevrimdışı anlık veri etkin).`
      : `Live query note: ${lastLiveQueryState.msg} (cached verified snapshot active).`;
  } else {
    statusEl.textContent = UI_I18N[currentLang].liveQueryDefault;
  }
}

function applyStaticI18n() {
  const t = UI_I18N[currentLang];
  document.documentElement.lang = currentLang;
  document.title = t.pageTitle;
  document.getElementById("kickerLbl").textContent = t.kickerLbl;
  document.getElementById("metaLineLbl").textContent = t.metaLineLbl;
  document.getElementById("langToggle").textContent = t.langBtnText;

  const demoLink = document.getElementById("demoDeckLink");
  demoLink.textContent = t.demoText;
  demoLink.href = t.demoHref;

  const pdfLink = document.getElementById("pitchPdfLink");
  pdfLink.textContent = t.pdfText;
  pdfLink.href = t.pdfHref;

  document.getElementById("githubRepoLink").textContent = t.githubText;
  document.getElementById("siteBarLabel").textContent = t.siteBarLabel;
  document.getElementById("statLblLogRatio").textContent = t.statLblLogRatio;
  document.getElementById("statLblCoh").textContent = t.statLblCoh;
  document.getElementById("statLblRain").textContent = t.statLblRain;
  document.getElementById("statLblCompression").textContent = t.statLblCompression;
  document.getElementById("card1Title").textContent = t.card1Title;
  document.getElementById("card1Sub").textContent = t.card1Sub;
  document.getElementById("liveQueryBtn").textContent = t.liveQueryBtn;
  document.getElementById("legGcov").textContent = t.legGcov;
  document.getElementById("legGunw").textContent = t.legGunw;
  document.getElementById("legS1").textContent = t.legS1;
  document.getElementById("card2Title").textContent = t.card2Title;
  document.getElementById("card2Sub").textContent = t.card2Sub;
  document.getElementById("lblLeftLayer").textContent = t.lblLeftLayer;
  document.getElementById("lblRightLayer").textContent = t.lblRightLayer;
  document.getElementById("imgFallbackTxt").textContent = t.imgFallbackTxt;
  document.getElementById("rawImageLink").textContent = t.rawImageLink;
  document.getElementById("wipeRange").setAttribute("aria-label", t.wipeAria);
  document.getElementById("card3Title").textContent = t.card3Title;
  document.getElementById("card3Sub").textContent = t.card3Sub;
  document.getElementById("card4Title").textContent = t.card4Title;
  document.getElementById("card4Sub").textContent = t.card4Sub;
  document.getElementById("downloadBinBtn").textContent = t.downloadBinBtn;
  document.getElementById("sLblPre").innerHTML = t.sLblPre;
  document.getElementById("sLblPost").innerHTML = t.sLblPost;
  document.getElementById("sLblCoh").textContent = t.sLblCoh;
  document.getElementById("sLblRvi").textContent = t.sLblRvi;
  document.getElementById("sLblRain").textContent = t.sLblRain;
  document.getElementById("sLblTemp").textContent = t.sLblTemp;
  document.getElementById("hexTitleLbl").textContent = t.hexTitleLbl;
  document.getElementById("card5Title").textContent = t.card5Title;
  document.getElementById("card5Sub").textContent = t.card5Sub;
  document.getElementById("footerDataSources").innerHTML = t.footerDataHtml;
  document.getElementById("footerSiNote").innerHTML = t.footerSiHtml;
  renderLiveQueryStatus();
}

function refreshLanguageView() {
  applyStaticI18n();
  if (!bundle || !activeSite) return;
  renderTabs();
  selectSite(activeSite.id, { preserveSimulator: true });
}

async function init() {
  applyStaticI18n();
  const resp = await fetch("data/study_sites.json");
  bundle = await resp.json();
  initMap();
  renderTabs();
  selectSite(bundle.study_sites[0].id);
  wireSimulator();
  wireWipeControls();
  document.getElementById("langToggle").addEventListener("click", () => {
    currentLang = currentLang === "en" ? "tr" : "en";
    try {
      window.localStorage.setItem("orbitalsar_lang", currentLang);
      const url = new URL(window.location.href);
      url.searchParams.set("lang", currentLang);
      window.history.replaceState({}, "", url.toString());
    } catch (_) {}
    refreshLanguageView();
  });
  document.getElementById("liveQueryBtn").addEventListener("click", runLiveCorsQuery);
  document.getElementById("downloadBinBtn").addEventListener("click", downloadPacketBin);
}

function initMap() {
  if (typeof L === "undefined") {
    document.getElementById("sarMap").innerHTML =
      currentLang === "tr"
        ? "<div style='padding:20px;color:#94a3b8'>Harita kütüphanesi çevrimdışı yedeği etkin; granül koordinatları aşağıdaki katalog tablosunda yer almaktadır.</div>"
        : "<div style='padding:20px;color:#94a3b8'>Map library offline fallback active; granule coordinates remain in the catalog table below.</div>";
    return;
  }
  map = L.map("sarMap", { zoomControl: true }).setView([36.32, 33.98], 7);
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
      attribution: "Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics",
      maxZoom: 18,
    }
  ).addTo(map);
  swathLayerGroup = L.layerGroup().addTo(map);
}

function renderTabs() {
  const container = document.getElementById("siteTabs");
  container.innerHTML = "";
  for (const s of bundle.study_sites) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "site-tab";
    btn.dataset.siteId = s.id;
    btn.textContent = getSiteCopy(s).name;
    btn.addEventListener("click", () => selectSite(s.id));
    container.appendChild(btn);
  }
}

function setBadgeStyle(el, label) {
  const color = ANOMALY_COLORS[label] || "#38bdf8";
  el.textContent = formatAnomalyLabel(label);
  el.style.color = color;
  el.style.borderColor = color;
  el.style.background = color + "24";
}

function selectSite(siteId, options = {}) {
  const preserveSimulator = Boolean(options.preserveSimulator);
  activeSite = bundle.study_sites.find((s) => s.id === siteId) || bundle.study_sites[0];
  document.querySelectorAll(".site-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.siteId === activeSite.id);
  });

  const a = activeSite.reflex_alert;
  const obs = activeSite.observation_inputs;
  const copy = getSiteCopy(activeSite);
  const sevLbl = currentLang === "tr" ? "Şiddet" : "Sev";
  setBadgeStyle(document.getElementById("siteBadge"), a.anomaly_label);
  document.getElementById("siteTitle").textContent = copy.name;
  document.getElementById("siteTheme").textContent = copy.theme;
  document.getElementById("siteDriver").textContent = copy.driver;
  document.getElementById("statLogRatio").textContent = `${a.log_ratio_db.toFixed(2)} dB`;
  document.getElementById("statCoh").textContent = `${a.coherence_drop.toFixed(2)} (${sevLbl} ${a.severity}/255)`;
  document.getElementById("statRain").textContent = `${obs.peak_precip_24h_mm.toFixed(1)} mm`;

  plotSiteSwaths();
  populateLayerSelectors();
  drawWeatherTimeline();
  if (preserveSimulator) {
    updateSimulator();
  } else {
    loadSiteIntoSimulator();
  }
  renderGranuleTable();
}

function plotSiteSwaths() {
  if (!map || !swathLayerGroup) return;
  swathLayerGroup.clearLayers();
  map.setView(activeSite.center, 6);
  const copy = getSiteCopy(activeSite);
  const alertPrefix = currentLang === "tr" ? "Uyarı" : "Alert";
  const interferogramTitle = currentLang === "tr" ? "NISAR GUNW İnterferogram" : "NISAR GUNW Interferogram";

  L.circleMarker(activeSite.center, {
    radius: 7,
    color: "#ffffff",
    fillColor: ANOMALY_COLORS[activeSite.reflex_alert.anomaly_label] || "#38bdf8",
    fillOpacity: 0.95,
  })
    .bindPopup(`<b>${escapeHtml(copy.name)}</b><br/>${alertPrefix}: ${escapeHtml(formatAnomalyLabel(activeSite.reflex_alert.anomaly_label))}`)
    .addTo(swathLayerGroup);

  activeSite.nasa_nisar_gcov.slice(0, 2).forEach((g) => {
    if (g.polygon_latlon?.length >= 3) {
      L.polygon(g.polygon_latlon, { color: "#38bdf8", weight: 2, fillOpacity: 0.08 })
        .bindPopup(`<b>NISAR GCOV</b><br/>${escapeHtml(g.granule_id)}<br/>${escapeHtml(g.time_start)}`)
        .addTo(swathLayerGroup);
    }
  });

  activeSite.nasa_nisar_gunw.slice(0, 2).forEach((g) => {
    if (g.polygon_latlon?.length >= 3) {
      L.polygon(g.polygon_latlon, { color: "#f59e0b", weight: 2, dashArray: "5,4", fillOpacity: 0.06 })
        .bindPopup(`<b>${interferogramTitle}</b><br/>${escapeHtml(g.granule_id)}<br/>${escapeHtml(g.time_start)} → ${escapeHtml(g.time_end)}`)
        .addTo(swathLayerGroup);
    }
  });

  activeSite.planetary_computer_s1_rtc.slice(0, 2).forEach((s) => {
    if (s.bbox?.length === 4) {
      const [w, so, e, n] = s.bbox;
      L.polygon(
        [
          [so, w],
          [n, w],
          [n, e],
          [so, e],
        ],
        { color: "#a78bfa", weight: 1.5, dashArray: "2,4", fillOpacity: 0.05 }
      )
        .bindPopup(`<b>Sentinel-1 RTC (Planetary Computer)</b><br/>${escapeHtml(s.id)}<br/>${escapeHtml(s.datetime)}`)
        .addTo(swathLayerGroup);
    }
  });
}

function buildAvailableLayers() {
  const layers = [];
  const gcov = activeSite.nasa_nisar_gcov[0];
  if (gcov) {
    for (const url of gcov.browse_layers || []) {
      if (url.endsWith("_thumbnail.png")) continue;
      const fname = url.split("/").pop() || "";
      const suffix = fname.replace(gcov.granule_id + "_", "").replace(/\.png$/i, "");
      layers.push({
        label: `NISAR GCOV (${suffix}) · ${gcov.time_start.slice(0, 10)}`,
        url,
        caption: `NASA NISAR L2 GCOV: ${gcov.granule_id}`,
      });
    }
  }
  const gunw = activeSite.nasa_nisar_gunw[0];
  if (gunw && gunw.browse_url) {
    const gunwLbl = currentLang === "tr" ? "NISAR GUNW İnterferogram" : "NISAR GUNW Interferogram";
    layers.push({
      label: `${gunwLbl} · ${gunw.time_start.slice(0, 10)} → ${gunw.time_end.slice(0, 10)}`,
      url: gunw.browse_url,
      caption: `NASA NISAR L2 GUNW: ${gunw.granule_id}`,
    });
  }
  const asf = activeSite.nasa_asf_scenes?.[0];
  if (asf && asf.browse_url) {
    layers.push({
      label: `NASA ASF (${asf.platform}) · ${(asf.start_time || "").slice(0, 10)}`,
      url: asf.browse_url,
      caption: `NASA ASF ${asf.platform}: ${asf.granule_name}`,
    });
  }
  const s1 = activeSite.planetary_computer_s1_rtc[0];
  if (s1 && s1.preview_url) {
    layers.push({
      label: `Sentinel-1 RTC (VV/VH) · ${s1.datetime.slice(0, 10)}`,
      url: s1.preview_url,
      caption: `Microsoft Planetary Computer Sentinel-1 RTC: ${s1.id}`,
    });
  }
  return layers;
}

function populateLayerSelectors() {
  const layers = buildAvailableLayers();
  const leftSel = document.getElementById("leftLayerSelect");
  const rightSel = document.getElementById("rightLayerSelect");
  leftSel.innerHTML = "";
  rightSel.innerHTML = "";
  layers.forEach((l, idx) => {
    const o1 = new Option(l.label, idx);
    const o2 = new Option(l.label, idx);
    leftSel.add(o1);
    rightSel.add(o2);
  });
  if (layers.length > 1) {
    const gunwIdx = layers.findIndex((l) => l.label.includes("GUNW"));
    rightSel.selectedIndex = gunwIdx >= 0 ? gunwIdx : 1;
  }
  updateWipeImages(layers);
  leftSel.onchange = () => updateWipeImages(layers);
  rightSel.onchange = () => updateWipeImages(layers);
}

function updateWipeImages(layers) {
  const lIdx = Number(document.getElementById("leftLayerSelect").value || 0);
  const rIdx = Number(document.getElementById("rightLayerSelect").value || 0);
  const left = layers[lIdx];
  const right = layers[rIdx];
  const imgL = document.getElementById("imgLeft");
  const imgR = document.getElementById("imgRight");
  const fb = document.getElementById("imgFallback");

  fb.hidden = true;
  if (left) {
    imgL.src = left.url;
    document.getElementById("wipeTagLeft").textContent = left.label.split("·")[0].trim();
    document.getElementById("rawImageLink").href = left.url;
    imgL.onerror = () => { fb.hidden = false; };
  }
  if (right) {
    imgR.src = right.url;
    document.getElementById("wipeTagRight").textContent = right.label.split("·")[0].trim();
    imgR.onerror = () => { fb.hidden = false; };
  }
  document.getElementById("granuleCaption").textContent = `${left?.caption || ""} | ${right?.caption || ""}`;
  syncOverlayImgWidth();
}

function syncOverlayImgWidth() {
  const container = document.getElementById("wipeContainer");
  const overlayImg = document.getElementById("imgLeft");
  overlayImg.style.width = `${container.clientWidth}px`;
}

function wireWipeControls() {
  const container = document.getElementById("wipeContainer");
  const range = document.getElementById("wipeRange");
  const overlay = document.getElementById("wipeOverlay");
  const handle = document.getElementById("wipeHandle");
  const setPos = (pct) => {
    const clamped = Math.max(5, Math.min(95, Number(pct)));
    range.value = String(clamped);
    overlay.style.width = `${clamped}%`;
    handle.style.left = `${clamped}%`;
  };

  let dragging = false;
  const updateFromClientX = (clientX) => {
    const rect = container.getBoundingClientRect();
    if (!rect.width) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPos(pct);
  };

  container.addEventListener("pointerdown", (e) => {
    dragging = true;
    container.setPointerCapture?.(e.pointerId);
    updateFromClientX(e.clientX);
  });
  container.addEventListener("pointermove", (e) => {
    if (dragging) updateFromClientX(e.clientX);
  });
  container.addEventListener("pointerup", () => { dragging = false; });
  container.addEventListener("pointercancel", () => { dragging = false; });

  range.addEventListener("input", () => setPos(range.value));
  window.addEventListener("resize", syncOverlayImgWidth);
}

function drawWeatherTimeline() {
  const canvas = document.getElementById("weatherCanvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const series = activeSite.meteomatics_weather || [];
  if (!series.length) return;

  const pad = { l: 48, r: 44, t: 28, b: 42 };
  const pw = w - pad.l - pad.r;
  const ph = h - pad.t - pad.b;

  const rains = series.map((d) => Number(d["precip_24h:mm"] || 0));
  const temps = series.map((d) => Number(d["t_2m:C"] || 0));
  const maxRain = Math.max(10, ...rains) * 1.15;
  const minT = Math.min(...temps) - 3;
  const maxT = Math.max(...temps) + 3;

  // Grid
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = pad.t + (ph * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad.l, y);
    ctx.lineTo(w - pad.r, y);
    ctx.stroke();
  }

  // Rain bars
  const barW = Math.max(12, (pw / series.length) * 0.56);
  series.forEach((d, i) => {
    const x = pad.l + (pw * (i + 0.5)) / series.length;
    const r = Number(d["precip_24h:mm"] || 0);
    const bh = (r / maxRain) * ph;
    ctx.fillStyle = "rgba(56, 189, 248, 0.55)";
    ctx.fillRect(x - barW / 2, pad.t + ph - bh, barW, bh);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(d.date.slice(5, 10), x, h - 18);
  });

  // Temp line
  ctx.strokeStyle = "#f59e0b";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  series.forEach((d, i) => {
    const x = pad.l + (pw * (i + 0.5)) / series.length;
    const t = Number(d["t_2m:C"] || 0);
    const y = pad.t + ph - ((t - minT) / (maxT - minT || 1)) * ph;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Labels
  const tr = currentLang === "tr";
  ctx.fillStyle = "#38bdf8";
  ctx.font = "11px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    tr
      ? `24sa Yağış (maks ${Math.max(...rains).toFixed(1)} mm)`
      : `Precip 24h (max ${Math.max(...rains).toFixed(1)} mm)`,
    pad.l,
    16
  );
  ctx.fillStyle = "#f59e0b";
  ctx.textAlign = "right";
  ctx.fillText(
    tr
      ? `2m Sıcaklık (${minT.toFixed(0)}..${maxT.toFixed(0)} °C)`
      : `Temp 2m (${minT.toFixed(0)}..${maxT.toFixed(0)} °C)`,
    w - pad.r,
    16
  );

  const gcovDate = activeSite.nasa_nisar_gcov[0]?.time_start?.slice(0, 10) || "N/A";
  document.getElementById("weatherNote").textContent = tr
    ? `(${activeSite.center[0]}, ${activeSite.center[1]}) konumunda NISAR GCOV çekim tarihi (${gcovDate}) ile eşzamanlı gerçek Meteomatics zaman serisi.`
    : `Real Meteomatics time series at (${activeSite.center[0]}, ${activeSite.center[1]}) synced with NISAR GCOV acquisition ${gcovDate}.`;
}

function loadSiteIntoSimulator() {
  const obs = activeSite.observation_inputs;
  document.getElementById("inPre").value = obs.pre_sigma0;
  document.getElementById("inPost").value = obs.post_sigma0;
  document.getElementById("inCoh").value = obs.coherence_drop;
  document.getElementById("inRvi").value = obs.rvi_delta;
  document.getElementById("inRain").value = obs.peak_precip_24h_mm;
  document.getElementById("inTemp").value = obs.temperature_c;
  updateSimulator();
}

function wireSimulator() {
  ["inPre", "inPost", "inCoh", "inRvi", "inRain", "inTemp"].forEach((id) => {
    document.getElementById(id).addEventListener("input", updateSimulator);
  });
}

function updateSimulator() {
  if (!activeSite) return;
  const pre = parseFloat(document.getElementById("inPre").value);
  const post = parseFloat(document.getElementById("inPost").value);
  const coh = parseFloat(document.getElementById("inCoh").value);
  const rvi = parseFloat(document.getElementById("inRvi").value);
  const rain = parseFloat(document.getElementById("inRain").value);
  const temp = parseFloat(document.getElementById("inTemp").value);

  document.getElementById("vPre").textContent = pre.toFixed(3);
  document.getElementById("vPost").textContent = post.toFixed(3);
  document.getElementById("vCoh").textContent = coh.toFixed(2);
  document.getElementById("vRvi").textContent = rvi.toFixed(2);
  document.getElementById("vRain").textContent = `${rain.toFixed(1)} mm`;
  document.getElementById("vTemp").textContent = `${temp.toFixed(1)} °C`;

  const db = 10 * Math.log10(post / pre);
  const { label, code, severity } = classifySarAnomaly(db, coh, rvi, temp);
  const conf = Math.min(1, Math.max(0, (-db - 1.5) / 6.5)) * 0.6 + coh * 0.2 + Math.min(1, rain / 25) * 0.2;

  const tr = currentLang === "tr";
  setBadgeStyle(document.getElementById("simBadge"), label);
  document.getElementById("simSummary").textContent = tr
    ? `Δσ⁰ = ${db.toFixed(2)} dB · Şiddet = ${severity}/255 · Taşkın×Hava Güveni = ${(conf * 100).toFixed(1)}%`
    : `Δσ⁰ = ${db.toFixed(2)} dB · Severity = ${severity}/255 · Flood×Weather Conf = ${(conf * 100).toFixed(1)}%`;

  const ts = activeSite.observation_inputs.timestamp_s || Math.floor(Date.now() / 1000);
  const [lat, lon] = activeSite.center;
  const { bytes, crc16 } = encodePacket24B(ts, lat, lon, db, coh, code, severity);
  currentPacketBytes = bytes;

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(" ");
  document.getElementById("hexDump").textContent = hex;

  document.getElementById("byteBreakdown").innerHTML = tr
    ? `
    <div class="byte-chip">Bayt 0..3 (Zaman)<b>${ts} sn</b></div>
    <div class="byte-chip">Bayt 4..11 (Konum)<b>${lat.toFixed(2)}, ${lon.toFixed(2)}</b></div>
    <div class="byte-chip">Bayt 12..19 (SAR)<b>${db.toFixed(2)} dB / Δγ ${coh.toFixed(2)}</b></div>
    <div class="byte-chip">Bayt 20..21 (Uyarı)<b>Kod ${code} · Şiddet ${severity}</b></div>
    <div class="byte-chip">Bayt 22..23 (CRC-16)<b>0x${crc16.toString(16).padStart(4, "0")}</b></div>
  `
    : `
    <div class="byte-chip">Bytes 0..3 (Epoch)<b>${ts} s</b></div>
    <div class="byte-chip">Bytes 4..11 (Geo)<b>${lat.toFixed(2)}, ${lon.toFixed(2)}</b></div>
    <div class="byte-chip">Bytes 12..19 (SAR)<b>${db.toFixed(2)} dB / Δγ ${coh.toFixed(2)}</b></div>
    <div class="byte-chip">Bytes 20..21 (Alert)<b>Code ${code} · Sev ${severity}</b></div>
    <div class="byte-chip">Bytes 22..23 (CRC-16)<b>0x${crc16.toString(16).padStart(4, "0")}</b></div>
  `;
}

function downloadPacketBin() {
  if (!currentPacketBytes) return;
  const blob = new Blob([currentPacketBytes], { type: "application/octet-stream" });
  const a = document.createElement("a");
  const blobUrl = URL.createObjectURL(blob);
  a.href = blobUrl;
  a.download = `orbitalsar_${activeSite.id}_24b.bin`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1500);
}

function renderGranuleTable() {
  const tr = currentLang === "tr";
  const rows = [];
  activeSite.nasa_nisar_gcov.forEach((g) => {
    rows.push({
      source: "NASA NISAR L2 GCOV",
      id: g.granule_id,
      time: g.time_start,
      meta: tr ? `${g.browse_layers.length} PNG katmanı` : `${g.browse_layers.length} PNG layers`,
      url: g.browse_url,
    });
  });
  activeSite.nasa_nisar_gunw.forEach((g) => {
    rows.push({
      source: "NASA NISAR L2 GUNW",
      id: g.granule_id,
      time: `${g.time_start.slice(0, 10)} → ${g.time_end.slice(0, 10)}`,
      meta: tr ? "Tekrar-geçiş InSAR" : "Repeat-pass InSAR",
      url: g.browse_url,
    });
  });
  activeSite.nasa_asf_scenes.forEach((s) => {
    rows.push({
      source: `NASA ASF (${s.platform})`,
      id: s.granule_name,
      time: s.start_time,
      meta: `${s.polarization || ""} ${s.beam_mode || ""}`.trim(),
      url: s.browse_url || s.url,
    });
  });
  activeSite.planetary_computer_s1_rtc.forEach((s) => {
    rows.push({
      source: "Planetary Computer S1-RTC",
      id: s.id,
      time: s.datetime,
      meta: (s.polarizations || []).join("+"),
      url: s.preview_url,
    });
  });

  const inspectLabel = tr ? "İncele ↗" : "Inspect ↗";
  const html = `
    <table>
      <thead><tr><th>${tr ? "Kaynak" : "Source"}</th><th>${tr ? "Granül / Öğe ID" : "Granule / Item ID"}</th><th>${tr ? "Çekim Zamanı" : "Acquisition Time"}</th><th>${tr ? "Mod / Katmanlar" : "Mode / Layers"}</th><th>${tr ? "Bağlantı" : "Link"}</th></tr></thead>
      <tbody>
        ${rows
          .map(
            (r) => {
              const safeUrl = /^https?:\/\//i.test(r.url || "") ? escapeHtml(r.url) : "";
              return `
          <tr>
            <td><strong>${escapeHtml(r.source)}</strong></td>
            <td><code>${escapeHtml(r.id)}</code></td>
            <td>${escapeHtml(r.time)}</td>
            <td>${escapeHtml(r.meta)}</td>
            <td>${safeUrl ? `<a href="${safeUrl}" target="_blank" rel="noopener">${inspectLabel}</a>` : "--"}</td>
          </tr>`;
            }
          )
          .join("")}
      </tbody>
    </table>`;
  document.getElementById("granuleTableWrap").innerHTML = html;
}

async function runLiveCorsQuery() {
  const bbox = activeSite.bbox;
  lastLiveQueryState = { kind: "loading", bbox: bbox.join(", ") };
  renderLiveQueryStatus();
  try {
    const cmrUrl = `https://cmr.earthdata.nasa.gov/search/granules.json?collection_concept_id=C2854338529-ASF&bounding_box=${bbox.join(",")}&page_size=3&sort_key=-start_date`;
    const stacPromise = fetch("https://planetarycomputer.microsoft.com/api/stac/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ collections: ["sentinel-1-rtc"], bbox, limit: 3 }),
    }).then((r) => r.json());
    const [cmrData, stacData] = await Promise.all([fetch(cmrUrl).then((r) => r.json()), stacPromise]);
    lastLiveQueryState = {
      kind: "ok",
      nisCount: cmrData?.feed?.entry?.length || 0,
      latestNisar: cmrData?.feed?.entry?.[0]?.title || (currentLang === "tr" ? "yok" : "none"),
      s1Count: stacData?.features?.length || 0,
      latestS1: stacData?.features?.[0]?.id || (currentLang === "tr" ? "yok" : "none"),
    };
    renderLiveQueryStatus();
  } catch (err) {
    lastLiveQueryState = { kind: "err", msg: err.message };
    renderLiveQueryStatus();
  }
}

init();
