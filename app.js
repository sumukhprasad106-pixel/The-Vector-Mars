const DATA_FILE = "mars_multi_poi_routes.json";
const MAP_FILE = "mars_map.png";

// Exact Mars Trek / OBJ bounding box used by the backend.
const MAP_BOUNDS = {
  leftLon: 77.1599,
  rightLon: 77.5170,
  bottomLat: 18.3772,
  topLat: 18.6271
};


// ============================================================
// DESTINATION INFORMATION
// You only need to edit the text inside this section later.
// ============================================================

const DESTINATION_INFO = {

  "Perseverance Landing": {
    type: "Low-relief crater-floor terrain near the Máaz and Séítah geologic formations.",
    science: "Perseverance landed here at Octavia E. Butler Landing on February 18, 2021. The surrounding crater-floor rocks provided important evidence about Jezero's early geologic history and include igneous rocks later studied and sampled by the rover.",

    navigation: "Relatively low-relief crater-floor terrain. This location serves as the starting reference point for routes toward Jezero's western delta and crater rim.",
    source:  "NASA Mars 2020 Perseverance / Mars Reconnaissance Orbiter (MRO)"
  },

  "Western Delta": {
    type: "Ancient sedimentary river-delta deposit formed where a river entered Jezero's former lake.",
    science: "The western delta contains layered sediments deposited by ancient flowing water. Orbital observations show clay-bearing minerals, including Fe/Mg smectites. These sediments are scientifically important because they may preserve evidence of Mars' ancient environment and possible signs of past microbial life.",
    navigation: "The delta contains layered and elevated terrain compared with the crater floor. Terrain-aware routing can reduce exposure to steeper segments while approaching the delta.",

    source:  "NASA Mars 2020 Perseverance / MRO HiRISE and CRISM / Mars Trek"
  },

  "Western Breach": {
    type:"Western crater-rim inlet associated with Neretva Vallis, the ancient river valley that fed Jezero Crater.",
    science: "Neretva Vallis carried water and sediment through the western side of Jezero Crater and helped build the western delta. Studying this region helps scientists reconstruct how water entered the ancient lake, transported sediment, and changed Jezero's landscape.",

    navigation: "This location approaches the transition from the delta region toward the western crater rim and inlet valley. Elevation and slope therefore become increasingly important factors when selecting a route.",

    source: "NASA Mars 2020 Perseverance / MRO / Mars Trek"
  }

};


const startSelect = document.getElementById("startSelect");
const destinationSelect = document.getElementById("destinationSelect");
const modeSelect = document.getElementById("modeSelect");
const calculateBtn = document.getElementById("calculateBtn");
const compareBtn = document.getElementById("compareBtn");
const canvas = document.getElementById("routeCanvas");
const ctx = canvas.getContext("2d");

const dataStatus = document.getElementById("dataStatus");
const routeTitle = document.getElementById("routeTitle");
const canvasHint = document.getElementById("canvasHint");

let routeData = null;
let compareMode = false;
let marsMapImage = null;
let mapImageLoaded = false;


function routeKey(start, destination) {

  const slug = s =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  return `${slug(start)}_to_${slug(destination)}`;
}


function km(value) {

  return `${(value / 1000).toFixed(2)} km`;

}


function meters(value) {

  return `${value.toFixed(1)} m`;

}


function degrees(value) {

  return `${value.toFixed(2)}°`;

}


// ============================================================
// SELECTORS
// ============================================================

function populateSelectors() {

  const names = Object.keys(routeData.pois);

  for (const name of names) {

    startSelect.add(
      new Option(name, name)
    );

    destinationSelect.add(
      new Option(name, name)
    );

  }

  startSelect.value =
    "Perseverance Landing";

  destinationSelect.value =
    names.includes("Western Delta")
      ? "Western Delta"
      : names[1];

}


// ============================================================
// POI CARDS
// ============================================================

function renderPoiCards() {

  const wrap =
    document.getElementById("poiStrip");

  wrap.innerHTML = "";

  for (
    const [name, poi]
    of Object.entries(routeData.pois)
  ) {

    const card =
      document.createElement("div");

    card.className = "poi-card";

    card.innerHTML = `

      <strong>${name}</strong>

      <span>
        Lat ${poi.latitude.toFixed(5)}
      </span>

      <span>
        Lon ${poi.longitude.toFixed(5)}
      </span>

      <span>
        Grid node ${poi.node_id}
      </span>

    `;

    wrap.appendChild(card);

  }

}


// ============================================================
// MODEL SETTINGS
// ============================================================

function renderSettings() {

  const el =
    document.getElementById("modelSettings");

  const settings =
    routeData.metadata
      .terrain_aware_settings;

  el.innerHTML = `

    <div>
      Grid nodes:
      <strong>
        ${routeData.metadata.grid_nodes.toLocaleString()}
      </strong>
    </div>

    <div>
      Graph edges:
      <strong>
        ${routeData.metadata.directed_edges.toLocaleString()}
      </strong>
    </div>

    <div>
      Max prototype slope:
      <strong>
        ${settings.max_slope_deg}°
      </strong>
    </div>

    <div>
      Slope weight:
      <strong>
        ${settings.slope_weight}
      </strong>
    </div>

    <div>
      Uphill weight:
      <strong>
        ${settings.uphill_weight}
      </strong>
    </div>

  `;

}


// ============================================================
// CANVAS
// ============================================================

function sizeCanvas() {

  const rect =
    canvas.getBoundingClientRect();

  const ratio =
    window.devicePixelRatio || 1;

  canvas.width =
    Math.floor(rect.width * ratio);

  canvas.height =
    Math.floor(rect.height * ratio);

  ctx.setTransform(
    ratio,
    0,
    0,
    ratio,
    0,
    0
  );

}


// ============================================================
// GEOGRAPHIC PROJECTION
// ============================================================

// Longitude increases left -> right.
// Latitude increases bottom -> top.

function project(lat, lon) {

  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;


  const xFraction =

    (lon - MAP_BOUNDS.leftLon) /

    (
      MAP_BOUNDS.rightLon -
      MAP_BOUNDS.leftLon
    );


  const yFraction =

    (lat - MAP_BOUNDS.bottomLat) /

    (
      MAP_BOUNDS.topLat -
      MAP_BOUNDS.bottomLat
    );


  const x =
    xFraction * width;

  const y =
    height -
    yFraction * height;


  return [x, y];

}


// ============================================================
// BACKGROUND
// ============================================================

function drawBackground() {

  const width =
    canvas.clientWidth;

  const height =
    canvas.clientHeight;


  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  if (
    mapImageLoaded &&
    marsMapImage
  ) {

    ctx.drawImage(
      marsMapImage,
      0,
      0,
      width,
      height
    );


    // Slight dark overlay keeps
    // route lines readable.

    ctx.fillStyle =
      "rgba(0, 0, 0, 0.16)";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

  }

  else {

    ctx.fillStyle =
      "#090d12";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );


    ctx.save();

    ctx.strokeStyle =
      "rgba(255,255,255,0.05)";

    ctx.lineWidth = 1;


    for (
      let i = 0;
      i <= 10;
      i++
    ) {

      const x =
        (width * i) / 10;

      ctx.beginPath();

      ctx.moveTo(x, 0);

      ctx.lineTo(
        x,
        height
      );

      ctx.stroke();


      const y =
        (height * i) / 10;

      ctx.beginPath();

      ctx.moveTo(
        0,
        y
      );

      ctx.lineTo(
        width,
        y
      );

      ctx.stroke();

    }

    ctx.restore();

  }

}


// ============================================================
// ROUTE PATH
// ============================================================

function drawPath(
  path,
  color,
  width = 4
) {

  if (
    !path ||
    path.length < 2
  ) {

    return;

  }


  ctx.save();

  ctx.strokeStyle =
    color;

  ctx.lineWidth =
    width;

  ctx.lineJoin =
    "round";

  ctx.lineCap =
    "round";

  ctx.shadowColor =
    "rgba(0,0,0,.85)";

  ctx.shadowBlur =
    5;


  ctx.beginPath();


  path.forEach(
    (point, index) => {

      const [x, y] =
        project(
          point.latitude,
          point.longitude
        );


      if (
        index === 0
      ) {

        ctx.moveTo(
          x,
          y
        );

      }

      else {

        ctx.lineTo(
          x,
          y
        );

      }

    }
  );


  ctx.stroke();

  ctx.restore();

}


// ============================================================
// MARKERS
// ============================================================

function drawMarker(
  poi,
  color,
  label
) {

  const [x, y] =
    project(
      poi.latitude,
      poi.longitude
    );


  ctx.save();


  ctx.fillStyle =
    color;

  ctx.strokeStyle =
    "#081019";

  ctx.lineWidth =
    3;


  ctx.beginPath();

  ctx.arc(
    x,
    y,
    7,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.stroke();


  ctx.font =
    "700 12px system-ui";


  ctx.lineWidth =
    4;

  ctx.strokeStyle =
    "rgba(0,0,0,.85)";


  ctx.strokeText(
    label,
    x + 12,
    y - 10
  );


  ctx.fillStyle =
    "#ffffff";


  ctx.fillText(
    label,
    x + 12,
    y - 10
  );


  ctx.restore();

}


// ============================================================
// NEW DESTINATION INFORMATION FEATURE
// ============================================================

function updateDestinationInfo() {

  const destination =
    destinationSelect.value;


  const info =
    DESTINATION_INFO[destination];


  if (!info) {

    return;

  }


  const nameEl =
    document.getElementById(
      "destinationInfoName"
    );


  const typeEl =
    document.getElementById(
      "destinationType"
    );


  const scienceEl =
    document.getElementById(
      "destinationScience"
    );


  const navigationEl =
    document.getElementById(
      "destinationNavigation"
    );


  const sourceEl =
    document.getElementById(
      "destinationSource"
    );


  const coordinatesEl =
    document.getElementById(
      "destinationCoordinates"
    );


  if (nameEl) {

    nameEl.textContent =
      destination;

  }


  if (typeEl) {

    typeEl.textContent =
      info.type;

  }


  if (scienceEl) {

    scienceEl.textContent =
      info.science;

  }


  if (navigationEl) {

    navigationEl.textContent =
      info.navigation;

  }


  if (sourceEl) {

    sourceEl.textContent =
      info.source;

  }


  const poi =
    routeData?.pois?.[destination];


  if (
    coordinatesEl &&
    poi
  ) {

    coordinatesEl.textContent =

      `Coordinates: ${poi.latitude.toFixed(5)}°, ${poi.longitude.toFixed(5)}°`;

  }

}


// ============================================================
// ROUTE METRICS
// ============================================================

function updateMetrics(mode) {

  const start =
    startSelect.value;


  const destination =
    destinationSelect.value;


  const key =
    routeKey(
      start,
      destination
    );


  const route =
    routeData.routes[key];


  if (!route) {

    return;

  }


  const result =
    route.modes[mode];


  if (
    !result ||
    !result.found
  ) {

    return;

  }


  const stats =
    result.stats;


  document.getElementById(
    "distanceMetric"
  ).textContent =
    km(stats.distance_m);


  document.getElementById(
    "uphillMetric"
  ).textContent =
    meters(
      stats.total_uphill_m
    );


  document.getElementById(
    "downhillMetric"
  ).textContent =
    meters(
      stats.total_downhill_m
    );


  document.getElementById(
    "slopeMetric"
  ).textContent =
    degrees(
      stats.max_segment_slope_deg
    );


  if (
    route.mars_trek_profile_distance_m
      != null
  ) {

    document.getElementById(
      "referenceMetric"
    ).textContent =
      km(
        route.mars_trek_profile_distance_m
      );


    document.getElementById(
      "differenceMetric"
    ).textContent =

      `${result.reference_difference_percent >= 0 ? "+" : ""}${result.reference_difference_percent.toFixed(2)}%`;

  }

  else {

    document.getElementById(
      "referenceMetric"
    ).textContent =
      "—";


    document.getElementById(
      "differenceMetric"
    ).textContent =
      "—";

  }


  routeTitle.textContent =
    `${start} → ${destination}`;


  // Update science/location card.

  updateDestinationInfo();

}


// ============================================================
// DRAW ROUTE
// ============================================================

function drawRoute() {

  if (!routeData) {

    return;

  }


  const start =
    startSelect.value;


  const destination =
    destinationSelect.value;


  if (
    start === destination
  ) {

    routeTitle.textContent =
      "Choose two different locations";

    return;

  }


  const key =
    routeKey(
      start,
      destination
    );


  const route =
    routeData.routes[key];


  if (!route) {

    routeTitle.textContent =
      "Route not available";

    return;

  }


  sizeCanvas();

  drawBackground();


  if (compareMode) {

    drawPath(
      route.modes.shortest?.path || [],
      "#ff7043",
      4
    );


    drawPath(
      route.modes.terrain_aware?.path || [],
      "#54c7ff",
      4
    );

  }

  else {

    const mode =
      modeSelect.value;


    const color =

      mode === "terrain_aware"

        ? "#54c7ff"

        : "#ff7043";


    drawPath(
      route.modes[mode]?.path || [],
      color,
      5
    );

  }


  // ==========================================================
  // Actual names now appear directly on the Mars map.
  // ==========================================================

  drawMarker(
    routeData.pois[start],
    "#63e66f",
    start
  );


  drawMarker(
    routeData.pois[destination],
    "#ffd45a",
    destination
  );


  updateMetrics(
    modeSelect.value
  );

}


// ============================================================
// LOAD MARS IMAGE
// ============================================================

function loadMarsMap() {

  return new Promise(
    resolve => {

      const img =
        new Image();


      img.onload =
        () => {

          marsMapImage =
            img;


          mapImageLoaded =
            true;


          canvasHint.textContent =

            "Mars Trek map loaded. Route coordinates use the same geographic bounding box.";


          resolve();

        };


      img.onerror =
        () => {

          mapImageLoaded =
            false;


          canvasHint.textContent =

            "mars_map.png not found yet. Add the cropped Mars Trek map image to this folder.";


          resolve();

        };


      img.src =
        MAP_FILE;

    }
  );

}


// ============================================================
// BUTTONS
// ============================================================

calculateBtn.addEventListener(
  "click",
  () => {

    compareMode =
      false;

    drawRoute();

  }
);


compareBtn.addEventListener(
  "click",
  () => {

    compareMode =
      true;

    drawRoute();

  }
);


// ============================================================
// ROUTE MODE CHANGE
// ============================================================

modeSelect.addEventListener(
  "change",
  () => {

    compareMode =
      false;

    drawRoute();

  }
);


// ============================================================
// START LOCATION CHANGE
// ============================================================

startSelect.addEventListener(
  "change",
  () => {

    if (
      startSelect.value ===
      destinationSelect.value
    ) {

      const alternative =

        [...destinationSelect.options]

          .map(
            option =>
              option.value
          )

          .find(
            value =>
              value !==
              startSelect.value
          );


      destinationSelect.value =
        alternative;

    }


    drawRoute();

  }
);


// ============================================================
// DESTINATION LOCATION CHANGE
// ============================================================

destinationSelect.addEventListener(
  "change",
  () => {

    if (
      startSelect.value ===
      destinationSelect.value
    ) {

      const alternative =

        [...startSelect.options]

          .map(
            option =>
              option.value
          )

          .find(
            value =>
              value !==
              destinationSelect.value
          );


      startSelect.value =
        alternative;

    }


    drawRoute();

  }
);


// ============================================================
// WINDOW RESIZE
// ============================================================

window.addEventListener(
  "resize",
  () => {

    drawRoute();

  }
);


// ============================================================
// INITIALIZATION
// ============================================================

async function init() {

  try {

    const [response] =
      await Promise.all([

        fetch(DATA_FILE),

        loadMarsMap()

      ]);


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    routeData =
      await response.json();


    populateSelectors();

    renderPoiCards();

    renderSettings();


    dataStatus.textContent =
      "Route data loaded";


    dataStatus.style.color =
      "#63e66f";


    drawRoute();

  }

  catch (error) {

    console.error(error);


    dataStatus.textContent =
      "Could not load route data";


    dataStatus.style.color =
      "#ff5b65";


    routeTitle.textContent =
      "Route data missing";

  }

}


init();
