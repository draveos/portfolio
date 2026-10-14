/* ================= CONFIG ================= */

// Cesium ion 토큰 (https://ion.cesium.com → Access Tokens 에서 무료 발급)
// 비워두면 위성 이미저리만으로 동작하고, 넣으면 지형(World Terrain) + OSM 3D 빌딩이 켜진다.
const ION_TOKEN = ""; // 임베드본은 토큰을 비운다. 지형과 3D 타일 없이 이미저리만 쓴다.

// 임베드본: sandcastle.cesium.com 은 CORS 헤더가 없어 다른 출처에서 XHR 로드가 막힌다.
// 같은 Cesium 저장소 샘플 모델을 jsdelivr(GitHub 미러, access-control-allow-origin: *)에서 받는다. 로컬 복사 없음.
const DRONE_GLB =
  "https://cdn.jsdelivr.net/gh/CesiumGS/cesium@1.130/Apps/SampleData/models/CesiumDrone/CesiumDrone.glb";

// 투어 경유지: 전부 공개 좌표. radius = 선회 반경(m), height = 선회 고도(m, 타원체 기준)
const STOPS = [
  { name: "SEOUL",        desc: "N Seoul Tower",   lon: 126.9882, lat: 37.5512,  radius: 800,  height: 500 },
  { name: "TOKYO",        desc: "Tokyo Tower",     lon: 139.7454, lat: 35.6586,  radius: 900,  height: 550 },
  { name: "SYDNEY",       desc: "Opera House",     lon: 151.2153, lat: -33.8568, radius: 700,  height: 400 },
  { name: "DUBAI",        desc: "Burj Khalifa",    lon: 55.2744,  lat: 25.1972,  radius: 900,  height: 950 },
  { name: "PARIS",        desc: "Tour Eiffel",     lon: 2.2945,   lat: 48.8584,  radius: 700,  height: 450 },
  { name: "NEW YORK",     desc: "Midtown",         lon: -73.9857, lat: 40.7484,  radius: 900,  height: 550 },
  { name: "GRAND CANYON", desc: "South Rim",       lon: -112.113, lat: 36.0997,  radius: 1600, height: 1200 },
];

// 임베드 시작 도시. 배열을 회전해 이 도시의 선회부터 투어가 시작된다(루프 복귀점도 여기).
const START_CITY = "PARIS";
{ const i = STOPS.findIndex((s) => s.name === START_CITY); if (i > 0) STOPS.push(...STOPS.splice(0, i)); }

const ORBIT_SECONDS = 80;
const TRANSIT_SECONDS = 45;
const ORBIT_SAMPLES = 48;
const TRANSIT_SAMPLES = 32;

/* ================= TOUR FLIGHT PATH ================= */

const startJD = Cesium.JulianDate.fromIso8601("2026-01-01T03:00:00Z");
const tourProp = new Cesium.SampledPositionProperty();
const segments = []; // { name, type: 'orbit'|'transit', t0, t1 }

function addTourSample(tSec, lon, lat, height) {
  const time = Cesium.JulianDate.addSeconds(startJD, tSec, new Cesium.JulianDate());
  tourProp.addSample(time, Cesium.Cartesian3.fromDegrees(lon, lat, height));
}

// 선회 시작점은 도시 중심 기준 정북(각도 0) 방향
function orbitPoint(stop, angle) {
  const dLat = (stop.radius * Math.cos(angle)) / 111320;
  const dLon =
    (stop.radius * Math.sin(angle)) /
    (111320 * Math.cos(Cesium.Math.toRadians(stop.lat)));
  return { lon: stop.lon + dLon, lat: stop.lat + dLat, height: stop.height };
}

function addOrbit(stop, t0) {
  for (let k = 0; k <= ORBIT_SAMPLES; k++) {
    const angle = (2 * Math.PI * k) / ORBIT_SAMPLES;
    const p = orbitPoint(stop, angle);
    addTourSample(t0 + (ORBIT_SECONDS * k) / ORBIT_SAMPLES, p.lon, p.lat, p.height);
  }
  return t0 + ORBIT_SECONDS;
}

// 대권(great-circle) 경로로 다음 도시까지 이동. 거리에 비례해 순항 고도를 올려서
// 대륙 간 이동에서는 지구 곡률이 보이게 한다.
function addTransit(from, to, t0) {
  const geodesic = new Cesium.EllipsoidGeodesic(
    Cesium.Cartographic.fromDegrees(from.lon, from.lat),
    Cesium.Cartographic.fromDegrees(to.lon, to.lat)
  );
  const cruise = Cesium.Math.clamp(geodesic.surfaceDistance * 0.12, 4000, 400000);
  for (let k = 1; k < TRANSIT_SAMPLES; k++) {
    const f = k / TRANSIT_SAMPLES;
    const carto = geodesic.interpolateUsingFraction(f);
    const height =
      from.height + (to.height - from.height) * f + Math.sin(Math.PI * f) * cruise;
    addTourSample(
      t0 + TRANSIT_SECONDS * f,
      Cesium.Math.toDegrees(carto.longitude),
      Cesium.Math.toDegrees(carto.latitude),
      height
    );
  }
  return t0 + TRANSIT_SECONDS;
}

let t = 0;
STOPS.forEach((stop, i) => {
  const o0 = t;
  t = addOrbit(stop, t);
  segments.push({ name: stop.name, type: "orbit", t0: o0, t1: t });

  const next = STOPS[(i + 1) % STOPS.length];
  const tr0 = t;
  const fromP = orbitPoint(stop, 0);
  const toP = orbitPoint(next, 0);
  t = addTransit(
    { ...fromP, height: stop.height },
    { ...toP, height: next.height },
    t
  );
  segments.push({ name: `→ ${next.name}`, type: "transit", t0: tr0, t1: t });
});
const totalSeconds = t;
// 마지막 트랜짓의 종점 샘플 = 첫 선회 시작점이라 루프가 이어진다
const first = orbitPoint(STOPS[0], 0);
addTourSample(totalSeconds, first.lon, first.lat, STOPS[0].height);

tourProp.setInterpolationOptions({
  interpolationDegree: 2,
  interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
});

const stopJD = Cesium.JulianDate.addSeconds(startJD, totalSeconds, new Cesium.JulianDate());

/* ================= VIEWER ================= */

if (ION_TOKEN) Cesium.Ion.defaultAccessToken = ION_TOKEN;

const viewer = new Cesium.Viewer("cesiumContainer", {
  baseLayer: false,
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: false,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: false,
  infoBox: false,
  selectionIndicator: false,
});
const scene = viewer.scene;

async function setupScene() {
  try {
    const esri = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
      "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"
    );
    viewer.imageryLayers.addImageryProvider(esri);
  } catch (e) {
    viewer.imageryLayers.addImageryProvider(
      new Cesium.OpenStreetMapImageryProvider({ url: "https://tile.openstreetmap.org/" })
    );
  }
  if (ION_TOKEN) {
    try {
      scene.setTerrain(Cesium.Terrain.fromWorldTerrain());
    } catch (e) {
      console.warn("ion terrain unavailable:", e);
    }
  }
}
setupScene();

const clock = viewer.clock;

/* ================= DRONE ================= */

const tourAvailability = new Cesium.TimeIntervalCollection([
  new Cesium.TimeInterval({ start: startJD, stop: stopJD }),
]);

const drone = viewer.entities.add({
  availability: tourAvailability,
  position: tourProp,
  orientation: new Cesium.VelocityOrientationProperty(tourProp),
  model: {
    uri: DRONE_GLB,
    minimumPixelSize: 56,
    maximumScale: 60,
  },
  point: {
    pixelSize: 5,
    color: Cesium.Color.fromCssColorString("#7fd4ff"),
  },
  path: {
    resolution: 1,
    leadTime: 0,
    trailTime: 50,
    width: 7,
    material: new Cesium.PolylineGlowMaterialProperty({
      glowPower: 0.18,
      color: Cesium.Color.fromCssColorString("#7fd4ff"),
    }),
  },
});

// HUD/진행바가 참조하는 현재 활성 비행
let activeProp = tourProp;
let activeStart = startJD;
let activeTotal = totalSeconds;

/* ================= CAMERA ================= */

const CAM_OFFSETS = {
  chase: new Cesium.Cartesian3(-150, -150, 75),
  top: new Cesium.Cartesian3(1, 1, 1800),
};

let cineActive = false;

function setCamMode(camMode) {
  document
    .querySelectorAll("#camGroup button")
    .forEach((b) => b.classList.toggle("active", b.dataset.cam === camMode));
  if (camMode === "cine") {
    cineActive = true;
    viewer.trackedEntity = undefined;
    return;
  }
  if (cineActive) {
    cineActive = false;
    viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
  }
  if (camMode === "free") {
    viewer.trackedEntity = undefined;
    return;
  }
  drone.viewFrom = CAM_OFFSETS[camMode];
  viewer.trackedEntity = undefined; // 재추적해야 viewFrom이 다시 적용된다
  viewer.trackedEntity = drone;
}

/* 시네마틱 카메라: 선회 중 로우앵글→하이앵글 진화 + 좌우 스윙, 트랜짓에선 고도 비례 풀백.
   모든 파라미터가 세그먼트 경계에서 값이 일치하는 sin 커브라 컷 없이 이어진다. */
const cineJD = new Cesium.JulianDate();
const cineDiff = new Cesium.Cartesian3();
const cineLocal = new Cesium.Cartesian3();
const cineMat = new Cesium.Matrix4();
let lastCineHeading = 0;

scene.preRender.addEventListener(() => {
  if (!cineActive || !drone.show) return;
  const now = clock.currentTime;
  const pos = activeProp.getValue(now);
  if (!pos) return;

  // 진행방향(속도) 헤딩 계산 — 경로 끝에서는 마지막 헤딩 유지
  const p2 = activeProp.getValue(Cesium.JulianDate.addSeconds(now, 0.5, cineJD));
  let heading = lastCineHeading;
  if (p2) {
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(pos);
    Cesium.Matrix4.inverseTransformation(enu, cineMat);
    Cesium.Cartesian3.subtract(p2, pos, cineDiff);
    Cesium.Matrix4.multiplyByPointAsVector(cineMat, cineDiff, cineLocal);
    if (Cesium.Cartesian3.magnitude(cineLocal) > 0.01) {
      heading = Math.atan2(cineLocal.x, cineLocal.y); // x=east, y=north
      lastCineHeading = heading;
    }
  }

  const carto = Cesium.Cartographic.fromCartesian(pos);
  const elapsed = Cesium.JulianDate.secondsDifference(now, activeStart);

  let pitchDeg = -24;
  let base = 430;
  let swing = 0;
  if (mode === "tour") {
    const seg = segments.find((s) => elapsed >= s.t0 && elapsed < s.t1);
    if (seg) {
      const f = (elapsed - seg.t0) / (seg.t1 - seg.t0);
      if (seg.type === "orbit") {
        pitchDeg = -34 + 22 * Math.sin(Math.PI * f); // 로우앵글 진입 → 중반 하이 → 복귀
        base = 430 - 170 * Math.sin(Math.PI * f);    // push-in / pull-out
        swing = 0.5 * Math.sin(2 * Math.PI * f);     // 드론 주위 좌우 스윙 (±~28°)
      } else {
        pitchDeg = -34;
      }
    }
  }
  // 고도가 오르면 자동 풀백 — 트랜짓 와이드샷
  const range = base + Cesium.Math.clamp((carto.height - 1500) * 0.03, 0, 12000);

  viewer.camera.lookAt(
    pos,
    new Cesium.HeadingPitchRange(heading + swing, Cesium.Math.toRadians(pitchDeg), range)
  );
});

document.querySelectorAll("#camGroup button").forEach((b) =>
  b.addEventListener("click", () => setCamMode(b.dataset.cam))
);
document.querySelectorAll("#speedGroup button").forEach((b) =>
  b.addEventListener("click", () => {
    clock.multiplier = Number(b.dataset.speed);
    document
      .querySelectorAll("#speedGroup button")
      .forEach((x) => x.classList.toggle("active", x === b));
  })
);

/* ================= MODES (TOUR / MISSION) ================= */

let mode = "tour";
let savedTourTime = null;

function enterTour() {
  mode = "tour";
  if (flying) setFlightLock(false);
  document.body.classList.remove("mission-mode");
  drone.show = true;
  drone.position = tourProp;
  drone.orientation = new Cesium.VelocityOrientationProperty(tourProp);
  drone.availability = tourAvailability;
  activeProp = tourProp;
  activeStart = startJD;
  activeTotal = totalSeconds;
  clock.startTime = startJD.clone();
  clock.stopTime = stopJD.clone();
  clock.currentTime = savedTourTime ? savedTourTime.clone() : startJD.clone();
  clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  clock.shouldAnimate = true;
  setCamMode("cine");
}

function enterMission() {
  mode = "mission";
  savedTourTime = clock.currentTime.clone();
  document.body.classList.add("mission-mode");
  clock.shouldAnimate = false;
  drone.show = false;
  setCamMode("free");
}

document.querySelectorAll("#modeGroup button").forEach((b) =>
  b.addEventListener("click", () => {
    if (b.dataset.mode === mode) return;
    document
      .querySelectorAll("#modeGroup button")
      .forEach((x) => x.classList.toggle("active", x === b));
    b.dataset.mode === "tour" ? enterTour() : enterMission();
  })
);

/* ================= MISSION PLANNING ================= */

const wpts = []; // { lon, lat, groundH, entity, riser }
let flying = false;
const mSpeed = document.getElementById("mSpeed");
const mAlt = document.getElementById("mAlt");
const missionAlt = () => Number(mAlt.value);

viewer.entities.add({
  polyline: {
    positions: new Cesium.CallbackProperty(
      () =>
        wpts.map((w) =>
          Cesium.Cartesian3.fromDegrees(w.lon, w.lat, w.groundH + missionAlt())
        ),
      false
    ),
    width: 3,
    material: new Cesium.PolylineDashMaterialProperty({
      color: Cesium.Color.fromCssColorString("#ffd47f"),
    }),
    show: new Cesium.CallbackProperty(() => wpts.length > 1, false),
  },
});

function addWaypoint(lon, lat, groundH) {
  const wp = { lon, lat, groundH };
  // 지면 → 비행고도 수직 라인 (z 시각화)
  wp.riser = viewer.entities.add({
    polyline: {
      positions: new Cesium.CallbackProperty(
        () => [
          Cesium.Cartesian3.fromDegrees(lon, lat, groundH),
          Cesium.Cartesian3.fromDegrees(lon, lat, groundH + missionAlt()),
        ],
        false
      ),
      width: 1.5,
      material: Cesium.Color.WHITE.withAlpha(0.35),
    },
  });
  wp.entity = viewer.entities.add({
    position: new Cesium.CallbackProperty(
      () => Cesium.Cartesian3.fromDegrees(lon, lat, groundH + missionAlt()),
      false
    ),
    point: {
      pixelSize: 9,
      color: Cesium.Color.fromCssColorString("#ffd47f"),
      outlineColor: Cesium.Color.fromCssColorString("#05080c"),
      outlineWidth: 2,
    },
    label: {
      text: String(wpts.length + 1),
      font: "11px monospace",
      fillColor: Cesium.Color.fromCssColorString("#ffd47f"),
      pixelOffset: new Cesium.Cartesian2(0, -18),
      style: Cesium.LabelStyle.FILL,
    },
  });
  wpts.push(wp);
  updateMissionReadout();
}

const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
handler.setInputAction((evt) => {
  if (mode !== "mission" || flying) return;
  let cart = scene.pickPositionSupported ? scene.pickPosition(evt.position) : undefined;
  if (!Cesium.defined(cart)) {
    cart = viewer.camera.pickEllipsoid(evt.position, Cesium.Ellipsoid.WGS84);
  }
  if (!Cesium.defined(cart)) return;
  const carto = Cesium.Cartographic.fromCartesian(cart);
  addWaypoint(
    Cesium.Math.toDegrees(carto.longitude),
    Cesium.Math.toDegrees(carto.latitude),
    Math.max(0, carto.height)
  );
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

function missionDistance() {
  let d = 0;
  for (let i = 1; i < wpts.length; i++) {
    d += new Cesium.EllipsoidGeodesic(
      Cesium.Cartographic.fromDegrees(wpts[i - 1].lon, wpts[i - 1].lat),
      Cesium.Cartographic.fromDegrees(wpts[i].lon, wpts[i].lat)
    ).surfaceDistance;
  }
  return d;
}

function updateMissionReadout() {
  const d = missionDistance();
  document.getElementById("mDist").textContent = `${(d / 1000).toFixed(1)} km`;
  const sec = d / Number(mSpeed.value);
  document.getElementById("mEta").textContent =
    wpts.length > 1
      ? `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(Math.round(sec % 60)).padStart(2, "0")}`
      : "--:--";
}

document.getElementById("mUndo").addEventListener("click", () => {
  if (flying) return;
  const wp = wpts.pop();
  if (wp) {
    viewer.entities.remove(wp.entity);
    viewer.entities.remove(wp.riser);
  }
  updateMissionReadout();
});
document.getElementById("mClear").addEventListener("click", () => {
  if (flying) return;
  wpts.forEach((w) => {
    viewer.entities.remove(w.entity);
    viewer.entities.remove(w.riser);
  });
  wpts.length = 0;
  updateMissionReadout();
});
mSpeed.addEventListener("input", () => {
  document.getElementById("speedVal").textContent = mSpeed.value;
  updateMissionReadout();
});
mAlt.addEventListener("input", () => {
  document.getElementById("altVal").textContent = mAlt.value;
});

/* ================= MISSION FLIGHT ================= */

const mFlyBtn = document.getElementById("mFly");
const mpHint = document.getElementById("mpHint");

// 비행 중 잠금: 우상단 그룹 + 카메라만 허용, 웨이포인트/슬라이더/ENV는 STOP 전까지 잠근다
function setFlightLock(on) {
  flying = on;
  document.body.classList.toggle("flight-locked", on);
  [mSpeed, mAlt].forEach((s) => (s.disabled = on));
  document.getElementById("mUndo").disabled = on;
  document.getElementById("mClear").disabled = on;
  mFlyBtn.textContent = on ? "STOP ■" : "FLY ▶";
  mFlyBtn.classList.toggle("stop", on);
  mpHint.textContent = on
    ? "🔒 flight in progress — press STOP to edit"
    : "click the globe to drop waypoints";
}

function stopMissionFlight() {
  clock.shouldAnimate = false;
  drone.show = false;
  viewer.trackedEntity = undefined;
  setFlightLock(false);
}

document.getElementById("mFly").addEventListener("click", () => {
  if (mode !== "mission") return;
  if (flying) {
    stopMissionFlight();
    return;
  }
  if (wpts.length < 2) return;

  const speed = Number(mSpeed.value);
  const prop = new Cesium.SampledPositionProperty();
  const mStart = startJD;
  let tSec = 0;

  const add = (sec, lon, lat, h) =>
    prop.addSample(
      Cesium.JulianDate.addSeconds(mStart, sec, new Cesium.JulianDate()),
      Cesium.Cartesian3.fromDegrees(lon, lat, h)
    );

  add(0, wpts[0].lon, wpts[0].lat, wpts[0].groundH + missionAlt());
  for (let i = 1; i < wpts.length; i++) {
    const a = wpts[i - 1];
    const b = wpts[i];
    const geo = new Cesium.EllipsoidGeodesic(
      Cesium.Cartographic.fromDegrees(a.lon, a.lat),
      Cesium.Cartographic.fromDegrees(b.lon, b.lat)
    );
    const dur = geo.surfaceDistance / speed;
    // 장거리 구간은 지오데식을 따라 세분화해서 지구 곡률 아래로 파고들지 않게 한다
    const n = Cesium.Math.clamp(Math.ceil(geo.surfaceDistance / 2000), 1, 64);
    for (let k = 1; k <= n; k++) {
      const f = k / n;
      const c = geo.interpolateUsingFraction(f);
      const h =
        a.groundH + (b.groundH - a.groundH) * f + missionAlt();
      add(
        tSec + dur * f,
        Cesium.Math.toDegrees(c.longitude),
        Cesium.Math.toDegrees(c.latitude),
        h
      );
    }
    tSec += dur;
  }

  prop.setInterpolationOptions({
    interpolationDegree: 2,
    interpolationAlgorithm: Cesium.HermitePolynomialApproximation,
  });

  const mStop = Cesium.JulianDate.addSeconds(mStart, tSec, new Cesium.JulianDate());
  drone.position = prop;
  drone.orientation = new Cesium.VelocityOrientationProperty(prop);
  drone.availability = new Cesium.TimeIntervalCollection([
    new Cesium.TimeInterval({ start: mStart, stop: mStop }),
  ]);
  drone.show = true;

  activeProp = prop;
  activeStart = mStart;
  activeTotal = tSec;
  clock.startTime = mStart.clone();
  clock.stopTime = mStop.clone();
  clock.currentTime = mStart.clone();
  clock.clockRange = Cesium.ClockRange.CLAMPED;
  clock.shouldAnimate = true;
  setFlightLock(true);
  setCamMode("chase");
});

/* ================= ENVIRONMENT (sun / haze) ================= */

const sunHour = document.getElementById("sunHour");
const hazeSlider = document.getElementById("haze");
const lightToggle = document.getElementById("lightToggle");
let lightingOn = false;
let lastCarto = Cesium.Cartographic.fromDegrees(STOPS[0].lon, STOPS[0].lat, 0);
const defaultLight = scene.light;

function applySun() {
  if (!lightingOn) return;
  const h = Number(sunHour.value);
  const elevation = Cesium.Math.toRadians(
    Math.max(2, Math.sin(((h - 6) / 12) * Math.PI) * 65)
  );
  const azimuth = Cesium.Math.toRadians((h / 24) * 360 + 180);
  const enu = Cesium.Transforms.eastNorthUpToFixedFrame(
    Cesium.Cartesian3.fromRadians(lastCarto.longitude, lastCarto.latitude, 0)
  );
  const local = new Cesium.Cartesian3(
    Math.cos(elevation) * Math.sin(azimuth),
    Math.cos(elevation) * Math.cos(azimuth),
    Math.sin(elevation)
  );
  const world = Cesium.Matrix4.multiplyByPointAsVector(enu, local, new Cesium.Cartesian3());
  Cesium.Cartesian3.normalize(world, world);
  Cesium.Cartesian3.negate(world, world); // 태양 → 지표 방향
  scene.light = new Cesium.DirectionalLight({ direction: world });
}

lightToggle.addEventListener("click", () => {
  lightingOn = !lightingOn;
  lightToggle.textContent = lightingOn ? "SUN ●" : "SUN ○";
  lightToggle.classList.toggle("active", lightingOn);
  scene.globe.enableLighting = lightingOn;
  if (!lightingOn) scene.light = defaultLight;
  else applySun();
});

sunHour.addEventListener("input", () => {
  const h = Number(sunHour.value);
  const mm = Math.round((h % 1) * 60);
  document.getElementById("sunVal").textContent =
    `${String(Math.floor(h)).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  applySun();
});

hazeSlider.addEventListener("input", () => {
  const f = Number(hazeSlider.value) / 100;
  document.getElementById("hazeVal").textContent = hazeSlider.value;
  scene.fog.density = 2.0e-4 * (1 + f * 40);
  scene.fog.minimumBrightness = 0.03 + f * 0.25;
  scene.skyAtmosphere.brightnessShift = -f * 0.25;
});

/* ================= MODAL ================= */

const modalBackdrop = document.getElementById("modalBackdrop");
const modalOk = document.getElementById("modalOk");
const modalCancel = document.getElementById("modalCancel");

function showModal(title, body, okLabel = "ENABLE", showCancel = true) {
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalBody").textContent = body;
  modalOk.textContent = okLabel;
  modalCancel.style.display = showCancel ? "" : "none";
  modalBackdrop.hidden = false;
  return new Promise((resolve) => {
    const done = (v) => {
      modalBackdrop.hidden = true;
      modalOk.onclick = modalCancel.onclick = null;
      resolve(v);
    };
    modalOk.onclick = () => done(true);
    modalCancel.onclick = () => done(false);
  });
}

/* ================= ABOUT ================= */

const aboutBackdrop = document.getElementById("aboutBackdrop");
document.getElementById("aboutToggle").addEventListener("click", () => {
  aboutBackdrop.hidden = false;
});
document.getElementById("aboutClose").addEventListener("click", () => {
  aboutBackdrop.hidden = true;
});
aboutBackdrop.addEventListener("click", (e) => {
  if (e.target === aboutBackdrop) aboutBackdrop.hidden = true;
});

/* ================= 3D TILESETS (OSM buildings / Google Photorealistic) ================= */

const bldgBtn = document.getElementById("bldgToggle");
const photoBtn = document.getElementById("photoToggle");
let osmTileset = null;
let googleTileset = null;
const perfWarned = { osm: false, google: false };

async function requireToken() {
  await showModal(
    "ION TOKEN REQUIRED",
    "3D 타일은 Cesium ion 토큰이 필요해요. ion.cesium.com에서 무료 토큰을 발급받아 main.js 상단의 ION_TOKEN에 넣어주세요.",
    "OK",
    false
  );
}

bldgBtn.addEventListener("click", async () => {
  if (osmTileset) {
    scene.primitives.remove(osmTileset);
    osmTileset = null;
    bldgBtn.classList.remove("active");
    return;
  }
  if (!ION_TOKEN) return requireToken();
  if (!perfWarned.osm) {
    const ok = await showModal(
      "HEAVY RENDER WARNING",
      "OSM 3D 빌딩은 전 세계 건물 지오메트리를 스트리밍합니다. GPU/네트워크 사용량이 크게 늘고, 노트북에서는 프레임 드랍이 있을 수 있어요."
    );
    if (!ok) return;
    perfWarned.osm = true;
  }
  try {
    bldgBtn.disabled = true;
    // Google 3D와 동시 사용은 중복 렌더라 끈다
    if (googleTileset) {
      scene.primitives.remove(googleTileset);
      googleTileset = null;
      photoBtn.classList.remove("active");
    }
    osmTileset = scene.primitives.add(await Cesium.createOsmBuildingsAsync());
    bldgBtn.classList.add("active");
  } catch (e) {
    console.warn("OSM buildings failed:", e);
    showModal("LOAD FAILED", "OSM 빌딩 로드에 실패했어요. 토큰 권한(asset 96188 / 2)을 확인해주세요.", "OK", false);
  } finally {
    bldgBtn.disabled = false;
  }
});

photoBtn.addEventListener("click", async () => {
  if (googleTileset) {
    scene.primitives.remove(googleTileset);
    googleTileset = null;
    photoBtn.classList.remove("active");
    return;
  }
  if (!ION_TOKEN) return requireToken();
  if (!perfWarned.google) {
    const ok = await showModal(
      "HEAVY RENDER WARNING",
      "Google Photorealistic 3D Tiles는 실사 메시를 대량 스트리밍합니다. 데이터 사용량이 매우 크고 GPU 부하가 높아요. 켠 상태로 투어를 돌리면 로딩이 비행을 못 따라올 수 있습니다."
    );
    if (!ok) return;
    perfWarned.google = true;
  }
  try {
    photoBtn.disabled = true;
    if (osmTileset) {
      scene.primitives.remove(osmTileset);
      osmTileset = null;
      bldgBtn.classList.remove("active");
    }
    googleTileset = scene.primitives.add(
      await Cesium.Cesium3DTileset.fromIonAssetId(2275207)
    );
    photoBtn.classList.add("active");
  } catch (e) {
    console.warn("Google 3D tiles failed:", e);
    showModal(
      "LOAD FAILED",
      "Google 3D Tiles 로드에 실패했어요. ion 대시보드에서 'Google Photorealistic 3D Tiles' 에셋(2275207)을 계정에 추가했는지 확인해주세요.",
      "OK",
      false
    );
  } finally {
    photoBtn.disabled = false;
  }
});

/* ================= WEATHER (rain / snow post-process) ================= */
// Cesium 공식 샘플 셰이더 패턴 기반 (Apache-2.0)

const RAIN_FS = `
uniform sampler2D colorTexture;
uniform float intensity;
in vec2 v_textureCoordinates;

float hash(float x) { return fract(sin(x * 133.3) * 13.13); }

void main(void) {
  float time = czm_frameNumber / 60.0;
  vec2 resolution = czm_viewport.zw;
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  vec3 c = vec3(0.6, 0.7, 0.8);
  float a = -0.4;
  float si = sin(a), co = cos(a);
  uv *= mat2(co, -si, si, co);
  uv *= length(uv + vec2(0.0, 4.9)) * 0.3 + 1.0;
  float v = 1.0 - sin(hash(floor(uv.x * 100.0)) * 2.0);
  float b = clamp(abs(sin(20.0 * time * v + uv.y * (5.0 / (2.0 + v)))) - 0.95, 0.0, 1.0) * 20.0;
  c *= v * b;
  vec4 color = texture(colorTexture, v_textureCoordinates);
  out_FragColor = mix(color, vec4(c, 1.0), 0.4 * intensity);
}
`;

const SNOW_FS = `
uniform sampler2D colorTexture;
uniform float intensity;
in vec2 v_textureCoordinates;

float snow(vec2 uv, float scale) {
  float time = czm_frameNumber / 60.0;
  float w = smoothstep(1.0, 0.0, -uv.y * (scale / 10.0));
  if (w < 0.1) return 0.0;
  uv += time / scale;
  uv.y += time * 2.0 / scale;
  uv.x += sin(uv.y + time * 0.5) / scale;
  uv *= scale;
  vec2 s = floor(uv), f = fract(uv), p = vec2(0.0);
  float k = 3.0, d;
  p = 0.5 + 0.35 * sin(11.0 * fract(sin((s + p + scale) * mat2(7.0, 3.0, 6.0, 5.0)) * 5.0)) - f;
  d = length(p);
  k = min(d, k);
  k = smoothstep(0.0, k, sin(f.x + f.y) * 0.01);
  return k * w;
}

void main(void) {
  vec2 resolution = czm_viewport.zw;
  vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
  float c = 0.0;
  c += snow(uv, 30.0) * 0.3;
  c += snow(uv, 20.0) * 0.5;
  c += snow(uv, 15.0) * 0.8;
  c += snow(uv, 10.0);
  c += snow(uv, 8.0);
  c += snow(uv, 6.0);
  c += snow(uv, 5.0);
  vec4 color = texture(colorTexture, v_textureCoordinates);
  out_FragColor = mix(color, vec4(vec3(c), 1.0), 0.5 * intensity);
}
`;

const rainBtn = document.getElementById("rainToggle");
const snowBtn = document.getElementById("snowToggle");
let rainStage = null;
let snowStage = null;

function removeStage(stage) {
  if (stage) scene.postProcessStages.remove(stage);
}

rainBtn.addEventListener("click", () => {
  if (rainStage) {
    removeStage(rainStage);
    rainStage = null;
  } else {
    removeStage(snowStage);
    snowStage = null;
    snowBtn.classList.remove("active");
    rainStage = scene.postProcessStages.add(
      new Cesium.PostProcessStage({ fragmentShader: RAIN_FS, uniforms: { intensity: 1.0 } })
    );
  }
  rainBtn.classList.toggle("active", !!rainStage);
});

snowBtn.addEventListener("click", () => {
  if (snowStage) {
    removeStage(snowStage);
    snowStage = null;
  } else {
    removeStage(rainStage);
    rainStage = null;
    rainBtn.classList.remove("active");
    snowStage = scene.postProcessStages.add(
      new Cesium.PostProcessStage({ fragmentShader: SNOW_FS, uniforms: { intensity: 1.0 } })
    );
  }
  snowBtn.classList.toggle("active", !!snowStage);
});

// 고도별 날씨 강도: 카메라가 구름층(~3km)을 벗어나면 페이드, 12km 위(우주 뷰)에선 소멸
function weatherIntensity() {
  const h = scene.camera.positionCartographic.height;
  const t = Cesium.Math.clamp((h - 3000) / 9000, 0, 1);
  return 1 - t * t * (3 - 2 * t); // smoothstep 페이드아웃
}

scene.preRender.addEventListener(() => {
  const stage = rainStage || snowStage;
  if (!stage) return;
  const v = weatherIntensity();
  stage.uniforms.intensity = v;
  stage.enabled = v > 0.01; // 사실상 0이면 셰이더 패스 자체를 끈다
});

/* ================= STOP LIST ================= */

const stopList = document.getElementById("stopList");
STOPS.forEach((stop) => {
  const seg = segments.find((s) => s.type === "orbit" && s.name === stop.name);
  const el = document.createElement("button");
  el.className = "stop";
  el.innerHTML = `<strong>${stop.name}</strong><em>${stop.desc}</em>`;
  el.addEventListener("click", () => {
    if (mode !== "tour") return;
    clock.currentTime = Cesium.JulianDate.addSeconds(
      startJD,
      seg.t0,
      new Cesium.JulianDate()
    );
    if (!viewer.trackedEntity) setCamMode("chase");
  });
  el.dataset.name = stop.name;
  stopList.appendChild(el);
});

/* ================= HUD ================= */

const hudPhase = document.getElementById("hudPhase");
const hudAlt = document.getElementById("hudAlt");
const hudSpd = document.getElementById("hudSpd");
const hudPos = document.getElementById("hudPos");
const progressFill = document.getElementById("progressFill");
const scratch = new Cesium.Cartesian3();

clock.onTick.addEventListener(() => {
  const now = clock.currentTime;
  const elapsed = Cesium.JulianDate.secondsDifference(now, activeStart);
  progressFill.style.width = `${Cesium.Math.clamp((100 * elapsed) / activeTotal, 0, 100)}%`;

  const pos = activeProp.getValue(now, scratch);
  if (pos) {
    const carto = Cesium.Cartographic.fromCartesian(pos);
    lastCarto = carto;
    hudAlt.textContent = `${Math.round(carto.height).toLocaleString()} m`;
    hudPos.textContent = `${Cesium.Math.toDegrees(carto.latitude).toFixed(3)}, ${Cesium.Math
      .toDegrees(carto.longitude)
      .toFixed(3)}`;

    const later = Cesium.JulianDate.addSeconds(now, 1, new Cesium.JulianDate());
    const pos2 = activeProp.getValue(later);
    if (pos2) {
      const mps = Cesium.Cartesian3.distance(pos, pos2);
      hudSpd.textContent =
        mps > 3000
          ? `${(mps / 1000).toFixed(1)} km/s`
          : `${Math.round(mps * 3.6).toLocaleString()} km/h`;
    } else {
      hudSpd.textContent = "0 km/h";
    }
  }

  if (mode === "mission") {
    if (flying && elapsed >= activeTotal) {
      setFlightLock(false); // 도착 — 자동 잠금 해제, 드론은 종점에 유지
    }
    hudPhase.textContent = clock.shouldAnimate ? "MISSION" : flying ? "MISSION" : "PLANNING";
    return;
  }
  const seg = segments.find((s) => elapsed >= s.t0 && elapsed < s.t1);
  if (seg) {
    hudPhase.textContent = seg.type === "orbit" ? seg.name : `TRANSIT ${seg.name}`;
    document
      .querySelectorAll(".stop")
      .forEach((el) =>
        el.classList.toggle("active", seg.type === "orbit" && el.dataset.name === seg.name)
      );
  }
});

/* ================= START ================= */

enterTour();
