import { getBiomeColor, getBiomeName, BIOME_COLOR_LUT, ACTIVE_COLOR_LUT, updateActiveColorLUT, BIOME_GROUPS, getBiomeCssColor, getDimensionBiomesList, findClosestBiome } from './biomes.js';
import { loadPoiImages, drawPoiMarker, PANEL_SPRITES, POI_SPRITES } from './poi-sprites.js';
import { STRUCTURE_DEFS, getVisibleStructures, ensureStructuresLoaded, initStructureWorker, resetStructureWorker, findClosestFeature } from './structures.js';


let cubiomesModule = null;
let sharedBufferPtr = 0;
let currentSeed = -7537587231326715432n;
let currentDim = 0;
let selectedVersion = 'be_26_30';
let selectedY = 319;

// Structure & Feature State & Persistence
const STORAGE_KEY_FEATURES = 'minecraftable_enabled_features';

function loadSavedEnabledFeatures() {
  const result = {
    '-1': new Set(),
    '0':  new Set(),
    '1':  new Set()
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FEATURES);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed['-1'])) result['-1'] = new Set(parsed['-1']);
        if (Array.isArray(parsed['0']))  result['0']  = new Set(parsed['0']);
        if (Array.isArray(parsed['1']))  result['1']  = new Set(parsed['1']);
      }
    }
    // If raw === null, it's the first time the user opens the application:
    // ALL features are disabled by default (empty set)!
  } catch (_) {}

  return result;
}

const enabledStructures = loadSavedEnabledFeatures();

function saveEnabledFeatures() {
  try {
    const toSave = {
      '-1': Array.from(enabledStructures['-1'] || []),
      '0':  Array.from(enabledStructures['0'] || []),
      '1':  Array.from(enabledStructures['1'] || [])
    };
    localStorage.setItem(STORAGE_KEY_FEATURES, JSON.stringify(toSave));
  } catch (_) {}
}

// Per-Seed Storage Management (Strictly isolated by seed)
function getCompletedStorageKey(seed) {
  return `minecraftable_completed_${seed}`;
}

function getPinsStorageKey(seed) {
  return `minecraftable_pins_${seed}`;
}

let completedLocations = new Set();
let customPins = [];

function loadSeedData(seed) {
  completedLocations.clear();
  try {
    const saved = localStorage.getItem(getCompletedStorageKey(seed));
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        completedLocations = new Set(arr);
      }
    }
  } catch (_) {}

  customPins = [];
  try {
    const savedPins = localStorage.getItem(getPinsStorageKey(seed));
    if (savedPins) {
      const arr = JSON.parse(savedPins);
      if (Array.isArray(arr)) {
        customPins = arr;
      }
    }
  } catch (_) {}

  if (typeof updatePinsUI === 'function') {
    try {
      updatePinsUI();
    } catch (_) {}
  }
}

function saveCompletedLocations() {
  try {
    localStorage.setItem(getCompletedStorageKey(currentSeed), JSON.stringify(Array.from(completedLocations)));
  } catch (_) {}
}

function saveCustomPins() {
  try {
    localStorage.setItem(getPinsStorageKey(currentSeed), JSON.stringify(customPins));
  } catch (_) {}
}

function getCompletionKey(marker) {
  return `${currentSeed}_${currentDim}_${marker.type}_${marker.x}_${marker.z}`;
}

let currentVisibleMarkers = [];
let hoveredMarker = null;
let activePopupMarker = null;

// Exact enum indexes and flags directly verified against cubiomes biomes.h & generator.c
const VERSION_MAP = {
  // Bedrock Edition (latest at top)
  'be_26_30':    { mc: 28, flags: 0, isBedrock: true },
  'be_26_0':     { mc: 28, flags: 0, isBedrock: true },
  'be_1_21_120': { mc: 28, flags: 0, isBedrock: true },
  'be_1_21_110': { mc: 28, flags: 0, isBedrock: true },
  'be_1_21_90':  { mc: 28, flags: 0, isBedrock: true },
  'be_1_21_60':  { mc: 28, flags: 0, isBedrock: true },
  'be_1_21_50':  { mc: 28, flags: 0, isBedrock: true },
  'be_1_21':     { mc: 26, flags: 0, isBedrock: true },
  'be_1_20_60':  { mc: 25, flags: 0, isBedrock: true },
  'be_1_20':     { mc: 25, flags: 0, isBedrock: true },
  'be_1_19':     { mc: 24, flags: 0, isBedrock: true },
  'be_1_18':     { mc: 22, flags: 0, isBedrock: true },
  'be_1_17':     { mc: 21, flags: 0, isBedrock: true },
  'be_1_16':     { mc: 20, flags: 0, isBedrock: true },
  'be_1_14':     { mc: 17, flags: 0, isBedrock: true },

  // Java Edition (latest at top)
  'java_26_2':    { mc: 28, flags: 0, isBedrock: false },
  'java_26_1':    { mc: 28, flags: 0, isBedrock: false },
  'java_1_21_9':   { mc: 28, flags: 0, isBedrock: false },
  'java_1_21_6':   { mc: 28, flags: 0, isBedrock: false },
  'java_1_21_5':   { mc: 28, flags: 0, isBedrock: false },
  'java_1_21_4':   { mc: 28, flags: 0, isBedrock: false },
  'java_1_21_2':   { mc: 27, flags: 0, isBedrock: false },
  'java_1_21':     { mc: 26, flags: 0, isBedrock: false },
  'java_1_20':     { mc: 25, flags: 0, isBedrock: false },
  'java_1_19_4':   { mc: 24, flags: 0, isBedrock: false },
  'java_1_19':     { mc: 23, flags: 0, isBedrock: false },
  'java_1_18':     { mc: 22, flags: 0, isBedrock: false },
  'java_1_17':     { mc: 21, flags: 0, isBedrock: false },
  'java_1_16':     { mc: 20, flags: 0, isBedrock: false },
  'java_1_15':     { mc: 18, flags: 0, isBedrock: false },
  'java_1_14':     { mc: 17, flags: 0, isBedrock: false },
  'java_1_13':     { mc: 16, flags: 0, isBedrock: false },
  'java_1_12':     { mc: 15, flags: 0, isBedrock: false },
  'java_1_11':     { mc: 14, flags: 0, isBedrock: false },
  'java_1_10':     { mc: 13, flags: 0, isBedrock: false },
  'java_1_9':      { mc: 12, flags: 0, isBedrock: false },
  'java_1_8':      { mc: 11, flags: 0, isBedrock: false },
  'java_1_7':      { mc: 10, flags: 0, isBedrock: false },
  'java_1_6':      { mc: 9,  flags: 0, isBedrock: false },
  'java_1_5':      { mc: 8,  flags: 0, isBedrock: false },
  'java_1_4':      { mc: 7,  flags: 0, isBedrock: false },
  'java_1_3':      { mc: 6,  flags: 0, isBedrock: false },
  'java_1_2':      { mc: 5,  flags: 0, isBedrock: false },
  'java_1_1':      { mc: 4,  flags: 0, isBedrock: false },
  'java_1_0':      { mc: 3,  flags: 0, isBedrock: false },
  'java_b1_8':     { mc: 2,  flags: 0, isBedrock: false },
  'java_b1_7':     { mc: 1,  flags: 0, isBedrock: false },

  // Java Edition - Large Biomes (flags: 1)
  'java_26_2_lb':    { mc: 28, flags: 1, isBedrock: false },
  'java_26_1_lb':    { mc: 28, flags: 1, isBedrock: false },
  'java_1_21_9_lb':   { mc: 28, flags: 1, isBedrock: false },
  'java_1_21_6_lb':   { mc: 28, flags: 1, isBedrock: false },
  'java_1_21_5_lb':   { mc: 28, flags: 1, isBedrock: false },
  'java_1_21_4_lb':   { mc: 28, flags: 1, isBedrock: false },
  'java_1_21_2_lb':   { mc: 27, flags: 1, isBedrock: false },
  'java_1_21_lb':     { mc: 26, flags: 1, isBedrock: false },
  'java_1_20_lb':     { mc: 25, flags: 1, isBedrock: false },
  'java_1_19_4_lb':   { mc: 24, flags: 1, isBedrock: false },
  'java_1_19_lb':     { mc: 23, flags: 1, isBedrock: false },
  'java_1_18_lb':     { mc: 22, flags: 1, isBedrock: false },
  'java_1_17_lb':     { mc: 21, flags: 1, isBedrock: false },
  'java_1_16_lb':     { mc: 20, flags: 1, isBedrock: false },
  'java_1_15_lb':     { mc: 18, flags: 1, isBedrock: false },
  'java_1_14_lb':     { mc: 17, flags: 1, isBedrock: false },
  'java_1_13_lb':     { mc: 16, flags: 1, isBedrock: false },
  'java_1_12_lb':     { mc: 15, flags: 1, isBedrock: false },
  'java_1_11_lb':     { mc: 14, flags: 1, isBedrock: false },
  'java_1_10_lb':     { mc: 13, flags: 1, isBedrock: false },
  'java_1_9_lb':      { mc: 12, flags: 1, isBedrock: false },
  'java_1_8_lb':      { mc: 11, flags: 1, isBedrock: false },
  'java_1_7_lb':      { mc: 10, flags: 1, isBedrock: false }
};

const TILE_PIXELS = 256; 
const PREVIEW_PIXELS = 64;

// Multi-Scale Level of Detail (LOD)
// At 256x256 pixels:
// - LOD 0: scale 4 (1 quart/px)   -> 1024 blocks/tile (highest detail)
// - LOD 1: scale 16 (4 quarts/px) -> 4096 blocks/tile
// - LOD 2: scale 64 (16 quarts/px)-> 16384 blocks/tile
// - LOD 3: scale 256 (64 quarts/px)-> 65536 blocks/tile (ultra-fast 100,000 block overview)
const LOD_LEVELS = [
  { lod: 0, scale: 4,   blocksPerTile: 1024,  minPxPerBlock: 0.2 },
  { lod: 1, scale: 16,  blocksPerTile: 4096,  minPxPerBlock: 0.05 },
  { lod: 2, scale: 64,  blocksPerTile: 16384, minPxPerBlock: 0.02 },
  { lod: 3, scale: 256, blocksPerTile: 65536, minPxPerBlock: 0 }
];

function getActiveLOD() {
  const pxPerBlock = camera.zoom / 4;
  for (const level of LOD_LEVELS) {
    if (pxPerBlock >= level.minPxPerBlock) return level;
  }
  return LOD_LEVELS[LOD_LEVELS.length - 1];
}

const tileCache = new Map();

let targetPin = null;

const camera = {
  x: 0,
  z: 0,
  zoom: 1.0,
  targetZoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};
window.minecraftableCamera = camera;

// 120Hz-Grade Animation Engine
let animRafId = null;
let isCoasting = false;
let coastVx = 0; // world blocks per ms
let coastVz = 0; // world blocks per ms
let lastCoastTime = 0;

// Drag velocity tracking for smooth momentum release
let dragVx = 0;
let dragVz = 0;
let lastDragTime = 0;
let lastDragClientX = 0;
let lastDragClientY = 0;
let dragStopTimeout = null;

// Cursor anchor for smooth zooming
let zoomAnchorWorldX = 0;
let zoomAnchorWorldZ = 0;
let zoomAnchorScreenX = 0;
let zoomAnchorScreenY = 0;
let isSmoothZooming = false;

// Smooth camera glide navigation (e.g. "Away We Go!")
let isGliding = false;
let glideStartX = 0;
let glideStartZ = 0;
let glideTargetX = 0;
let glideTargetZ = 0;
let glideStartTime = 0;
let glideDuration = 600;
let glideResolve = null;

export function glideCameraTo(targetX, targetZ, durationMs = 600) {
  return new Promise((resolve) => {
    isCoasting = false;
    coastVx = 0;
    coastVz = 0;
    camera.isDragging = false;
    isSmoothZooming = false;
    camera.zoom = camera.targetZoom;
    isGliding = true;
    glideStartX = camera.x;
    glideStartZ = camera.z;
    glideTargetX = targetX;
    glideTargetZ = targetZ;
    glideStartTime = performance.now();
    glideDuration = durationMs;
    glideResolve = resolve;
    startAnimationLoop();
  });
}
window.minecraftableGlideCameraTo = glideCameraTo;

const canvas = document.getElementById('viewport');
const ctx = canvas.getContext('2d');
const coordsDisplay = document.getElementById('coords-display');
const biomeTag = document.getElementById('biome-tag');

const markerPopup = document.getElementById('markerPopup');
const popupTitle = document.getElementById('popupTitle');
const popupCoords = document.getElementById('popupCoords');
const popupCopyBtn = document.getElementById('popupCopyBtn');
const popupShareBtn = document.getElementById('popupShareBtn');
const copyToast = document.getElementById('copyToast');
const popupCompleteBtn = document.getElementById('popupCompleteBtn');
const completeIcon = document.getElementById('completeIcon');
const completeText = document.getElementById('completeText');

const featuresPanel = document.getElementById('featuresPanel');
const featuresToggleBtn = document.getElementById('featuresToggleBtn');
const featuresCloseBtn = document.getElementById('featuresCloseBtn');
const featuresCountBadge = document.getElementById('featuresCountBadge');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const featuresList = document.getElementById('featuresList');

function updatePopupCompleteState(marker) {
  if (!marker || !popupCompleteBtn) return;
  if (marker.isCustomPin) {
    popupCompleteBtn.classList.remove('completed');
    if (completeIcon) completeIcon.textContent = '🗑';
    if (completeText) completeText.textContent = 'Delete Pin';
    return;
  }
  const compKey = getCompletionKey(marker);
  const isComp = completedLocations.has(compKey);
  if (isComp) {
    popupCompleteBtn.classList.add('completed');
    if (completeIcon) completeIcon.textContent = '✓';
    if (completeText) completeText.textContent = 'Completed';
  } else {
    popupCompleteBtn.classList.remove('completed');
    if (completeIcon) completeIcon.textContent = '☐';
    if (completeText) completeText.textContent = 'Completed';
  }
}

function openMarkerPopup(marker, screenX, screenY) {
  if (!markerPopup) return;
  activePopupMarker = marker;

  if (popupTitle) {
    popupTitle.textContent = marker.name || marker.baseName || 'Structure';
  }
  if (popupCoords) {
    const yStr = marker.y != null ? ` Y: ${marker.y}` : '';
    popupCoords.textContent = `X: ${marker.x}${yStr} Z: ${marker.z}`;
  }

  updatePopupCompleteState(marker);

  if (copyToast) copyToast.classList.add('hidden');

  positionMarkerPopup(screenX, screenY);
  markerPopup.classList.remove('hidden');
}

function positionMarkerPopup(screenX, screenY) {
  if (!markerPopup) return;
  const isFlipped = (screenY < 110);
  if (isFlipped) {
    markerPopup.classList.add('flipped');
    markerPopup.style.top = `${Math.round(screenY)}px`;
  } else {
    markerPopup.classList.remove('flipped');
    markerPopup.style.top = `${Math.round(screenY - 18)}px`;
  }
  markerPopup.style.left = `${Math.round(screenX)}px`;
}

function closeMarkerPopup() {
  activePopupMarker = null;
  if (markerPopup) markerPopup.classList.add('hidden');
  if (copyToast) copyToast.classList.add('hidden');
}

function updateFeaturesBadge() {
  if (!featuresCountBadge) return;
  const dimStr = String(currentDim);
  const set = enabledStructures[dimStr] || new Set();
  featuresCountBadge.textContent = String(set.size);
}

function renderFeaturesPanel() {
  if (!featuresList) return;
  featuresList.innerHTML = '';

  const dimStr = String(currentDim);
  const defs = STRUCTURE_DEFS[dimStr] || [];
  const enabledSet = enabledStructures[dimStr] || new Set();

  defs.forEach((def) => {
    const item = document.createElement('div');
    item.className = 'feature-item';

    const iconDiv = document.createElement('div');
    iconDiv.className = 'feature-icon-thumb';
    const spr = PANEL_SPRITES[def.icon];
    if (spr) {
      iconDiv.style.backgroundImage = "url('/chunk-finders-tn.webp')";
      iconDiv.style.backgroundPosition = `-${spr.x}px -${spr.y}px`;
    } else {
      const poiSpr = POI_SPRITES[def.icon];
      if (poiSpr) {
        iconDiv.style.backgroundImage = "url('/seed-map-pois.webp')";
        iconDiv.style.backgroundPosition = `-${poiSpr.x}px -${poiSpr.y}px`;
        iconDiv.style.width = '24px';
        iconDiv.style.height = '24px';
      }
    }

    const label = document.createElement('span');
    label.className = 'feature-label';
    label.textContent = def.name;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'feature-checkbox';
    checkbox.checked = enabledSet.has(def.id);

    const setEnabled = (enabled) => {
      if (enabled) {
        enabledSet.add(def.id);
        checkbox.checked = true;
      } else {
        enabledSet.delete(def.id);
        checkbox.checked = false;
      }
      saveEnabledFeatures();
      updateFeaturesBadge();
      renderView();
      triggerStructureLoad(true);
    };

    item.addEventListener('click', (e) => {
      if (e.target === checkbox) return;
      setEnabled(!enabledSet.has(def.id));
    });

    checkbox.addEventListener('click', (e) => {
      e.stopPropagation();
      setEnabled(checkbox.checked);
    });

    checkbox.addEventListener('change', (e) => {
      e.stopPropagation();
      setEnabled(checkbox.checked);
    });

    item.appendChild(iconDiv);
    item.appendChild(label);
    item.appendChild(checkbox);
    featuresList.appendChild(item);
  });

  updateFeaturesBadge();
}

if (featuresToggleBtn && featuresPanel) {
  featuresToggleBtn.addEventListener('click', () => {
    const pPanel = document.getElementById('pinsPanel');
    if (pPanel) pPanel.classList.remove('open');
    featuresPanel.classList.toggle('open');
  });
}

if (featuresCloseBtn && featuresPanel) {
  featuresCloseBtn.addEventListener('click', () => {
    featuresPanel.classList.remove('open');
  });
}

if (selectAllBtn) {
  selectAllBtn.addEventListener('click', () => {
    const dimStr = String(currentDim);
    const defs = STRUCTURE_DEFS[dimStr] || [];
    const enabledSet = enabledStructures[dimStr] || new Set();
    defs.forEach(d => enabledSet.add(d.id));
    saveEnabledFeatures();
    renderFeaturesPanel();
    renderView();
    triggerStructureLoad(true);
  });
}

if (deselectAllBtn) {
  deselectAllBtn.addEventListener('click', () => {
    const dimStr = String(currentDim);
    const enabledSet = enabledStructures[dimStr] || new Set();
    enabledSet.clear();
    saveEnabledFeatures();
    renderFeaturesPanel();
    renderView();
    triggerStructureLoad(true);
  });
}

if (markerPopup) {
  markerPopup.addEventListener('mousedown', (e) => e.stopPropagation());
  markerPopup.addEventListener('click', (e) => e.stopPropagation());
}

if (popupCopyBtn) {
  popupCopyBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (!activePopupMarker) return;
    const yStr = activePopupMarker.y != null ? ` Y: ${activePopupMarker.y}` : '';
    const text = `X: ${activePopupMarker.x}${yStr} Z: ${activePopupMarker.z}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (_) {}
    if (copyToast) {
      copyToast.textContent = 'Copied!';
      copyToast.classList.remove('hidden');
      setTimeout(() => {
        if (copyToast) copyToast.classList.add('hidden');
      }, 1500);
    }
  });
}

if (popupShareBtn) {
  popupShareBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!activePopupMarker) return;
    const yStr = activePopupMarker.y != null ? ` Y: ${activePopupMarker.y}` : '';
    const text = `${activePopupMarker.name || activePopupMarker.baseName} at X: ${activePopupMarker.x}${yStr} Z: ${activePopupMarker.z} (Seed: ${currentSeed})`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text);
    }
    if (copyToast) {
      copyToast.textContent = 'Link copied!';
      copyToast.classList.remove('hidden');
      setTimeout(() => {
        if (copyToast) {
          copyToast.textContent = 'Copied!';
          copyToast.classList.add('hidden');
        }
      }, 1500);
    }
  });
}

if (popupCompleteBtn) {
  popupCompleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!activePopupMarker) return;
    if (activePopupMarker.isCustomPin) {
      customPins = customPins.filter(p => p.id !== activePopupMarker.pinId);
      saveCustomPins();
      updatePinsUI();
      closeMarkerPopup();
      requestRender();
      return;
    }
    const compKey = getCompletionKey(activePopupMarker);
    if (completedLocations.has(compKey)) {
      completedLocations.delete(compKey);
    } else {
      completedLocations.add(compKey);
    }
    saveCompletedLocations();
    updatePopupCompleteState(activePopupMarker);
    requestRender();
  });
}


let dpr = window.devicePixelRatio || 1;
let cssWidth = 0;
let cssHeight = 0;

function getZoomLimits() {
  const w = cssWidth || (canvas && canvas.parentElement ? canvas.parentElement.clientWidth : 1600) || 1600;
  return {
    maxZoom: 4 * (w / 100),       // 100 blocks across X (~60 blocks in Z on 16:9)
    minZoom: 4 * (w / 100000)     // 100,000 blocks across X
  };
}

// Render-on-demand & progressive queue state
let renderRafId = null;
let debounceTimer = null;
let isQueueProcessing = false;
let pendingTiles = [];

function startAnimationLoop() {
  if (animRafId !== null) return;
  lastCoastTime = performance.now();
  animRafId = requestAnimationFrame(animTick);
}

function animTick(now) {
  animRafId = null;
  let keepGoing = false;

  // 1. Smooth Camera Gliding (e.g. "Away We Go!" navigation)
  if (isGliding) {
    const elapsed = now - glideStartTime;
    const progress = Math.min(1, elapsed / glideDuration);
    // Smooth ease-in-out cubic curve
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    camera.x = glideStartX + (glideTargetX - glideStartX) * ease;
    camera.z = glideStartZ + (glideTargetZ - glideStartZ) * ease;

    if (progress >= 1) {
      camera.x = glideTargetX;
      camera.z = glideTargetZ;
      isGliding = false;
      scheduleTileGeneration(true);
      triggerStructureLoad(true);
      if (glideResolve) {
        glideResolve();
        glideResolve = null;
      }
    } else {
      keepGoing = true;
    }
  }

  // 2. Smooth Continuous Zoom Interpolation (Target Lerp)
  const zoomDiff = camera.targetZoom - camera.zoom;
  if (Math.abs(zoomDiff) > 0.00002) {
    keepGoing = true;
    isSmoothZooming = true;
    const alpha = 0.28;
    camera.zoom += zoomDiff * alpha;

    // NEVER adjust camera coordinates from zoom anchor if dragging or gliding!
    if (!camera.isDragging && !isGliding) {
      const halfW = cssWidth / 2;
      const halfH = cssHeight / 2;
      const pxPerBlock = camera.zoom / 4;
      camera.x = zoomAnchorWorldX - (zoomAnchorScreenX - halfW) / pxPerBlock;
      camera.z = zoomAnchorWorldZ - (zoomAnchorScreenY - halfH) / pxPerBlock;
    }
  } else if (isSmoothZooming) {
    camera.zoom = camera.targetZoom;
    if (!camera.isDragging && !isGliding) {
      const halfW = cssWidth / 2;
      const halfH = cssHeight / 2;
      const pxPerBlock = camera.zoom / 4;
      camera.x = zoomAnchorWorldX - (zoomAnchorScreenX - halfW) / pxPerBlock;
      camera.z = zoomAnchorWorldZ - (zoomAnchorScreenY - halfH) / pxPerBlock;
    }
    isSmoothZooming = false;
    scheduleTileGeneration(true);
    triggerStructureLoad(true);
  }

  // 3. Smooth Inertia / Momentum Coasting
  if (isCoasting) {
    const dt = Math.min(now - lastCoastTime, 32);
    lastCoastTime = now;
    if (dt > 0) {
      camera.x += coastVx * dt;
      camera.z += coastVz * dt;

      const friction = Math.pow(0.92, dt / 16.67);
      coastVx *= friction;
      coastVz *= friction;

      if (Math.hypot(coastVx, coastVz) < 0.002) {
        isCoasting = false;
        coastVx = 0;
        coastVz = 0;
        scheduleTileGeneration(true);
        triggerStructureLoad(true);
      } else {
        keepGoing = true;
      }
    }
  }

  renderView();

  if (keepGoing) {
    animRafId = requestAnimationFrame(animTick);
  }
}
window.minecraftableIsGliding = () => isGliding;
window.minecraftableIsCoasting = () => isCoasting;
window.minecraftableCoastVx = () => coastVx;
window.minecraftableCoastVz = () => coastVz;
window.minecraftableStepAnim = (t) => animTick(t);

function requestRender() {
  if (animRafId !== null) return;
  if (renderRafId) return;
  renderRafId = requestAnimationFrame(() => {
    renderRafId = null;
    renderView();
  });
}

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  cssWidth = canvas.parentElement.clientWidth;
  cssHeight = canvas.parentElement.clientHeight;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  const { minZoom, maxZoom } = getZoomLimits();
  camera.zoom = Math.min(Math.max(camera.zoom, minZoom), maxZoom);
  camera.targetZoom = camera.zoom;

  requestRender();
  scheduleTileGeneration(true);
  triggerStructureLoad(true);
}
window.addEventListener('resize', resizeCanvas);

function setInitial3000BlockView() {
  cssWidth = canvas.parentElement.clientWidth;
  if (!cssWidth) return;
  const { minZoom, maxZoom } = getZoomLimits();
  const targetZoom = (4 * cssWidth) / 3000;
  camera.zoom = Math.min(Math.max(targetZoom, minZoom), maxZoom);
  camera.targetZoom = camera.zoom;
  requestRender();
  triggerStructureLoad(true);
}

function generatePreviewTile(tx, tz, lodLevel) {
  const { lod } = lodLevel;
  const key = `${lod},${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
  const existing = tileCache.get(key);
  if (existing) return;

  if (!cubiomesModule || !sharedBufferPtr) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = PREVIEW_PIXELS;
  offscreen.height = PREVIEW_PIXELS;
  const offCtx = offscreen.getContext('2d');
  const imgData = offCtx.createImageData(PREVIEW_PIXELS, PREVIEW_PIXELS);
  const buf32 = new Uint32Array(imgData.data.buffer);

  // At scale 16, 64x64 samples cover 1024 blocks (LOD 0 tile size)
  const cellX = tx * PREVIEW_PIXELS;
  const cellZ = tz * PREVIEW_PIXELS;

  try {
    cubiomesModule._get_biome_area(sharedBufferPtr, cellX, cellZ, PREVIEW_PIXELS, PREVIEW_PIXELS, 16, selectedY);

    const heap32 = cubiomesModule.HEAP32;
    const totalPixels = PREVIEW_PIXELS * PREVIEW_PIXELS;
    const biomeIds = new Uint8Array(totalPixels);

    if (heap32) {
      const offset = sharedBufferPtr >> 2;
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = heap32[offset + i];
        const validId = (biomeId >= 0 && biomeId < 256) ? biomeId : 0;
        biomeIds[i] = validId;
        buf32[i] = ACTIVE_COLOR_LUT[validId];
      }
    } else {
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = cubiomesModule.getValue(sharedBufferPtr + (i * 4), 'i32');
        const validId = (biomeId >= 0 && biomeId < 256) ? biomeId : 0;
        biomeIds[i] = validId;
        buf32[i] = ACTIVE_COLOR_LUT[validId];
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    tileCache.set(key, {
      canvas: offscreen,
      offCtx,
      imgData,
      buf32,
      biomeIds,
      isHiRes: false,
      loadedAt: performance.now()
    });
  } catch (err) {
    console.error(`Preview tile error [LOD ${lod}, ${tx}, ${tz}]:`, err);
  }
}

function generateHiResTile(tx, tz, lodLevel) {
  const { lod, scale } = lodLevel;
  const key = `${lod},${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
  const existing = tileCache.get(key);
  if (existing && existing.isHiRes) return;

  if (!cubiomesModule || !sharedBufferPtr) return;

  const offscreen = document.createElement('canvas');
  offscreen.width = TILE_PIXELS;
  offscreen.height = TILE_PIXELS;
  const offCtx = offscreen.getContext('2d');
  const imgData = offCtx.createImageData(TILE_PIXELS, TILE_PIXELS);
  const buf32 = new Uint32Array(imgData.data.buffer);

  const rX = tx * TILE_PIXELS;
  const rZ = tz * TILE_PIXELS;

  try {
    cubiomesModule._get_biome_area(sharedBufferPtr, rX, rZ, TILE_PIXELS, TILE_PIXELS, scale, selectedY);

    const heap32 = cubiomesModule.HEAP32;
    const totalPixels = TILE_PIXELS * TILE_PIXELS;
    const biomeIds = new Uint8Array(totalPixels);

    if (heap32) {
      const offset = sharedBufferPtr >> 2;
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = heap32[offset + i];
        const validId = (biomeId >= 0 && biomeId < 256) ? biomeId : 0;
        biomeIds[i] = validId;
        buf32[i] = ACTIVE_COLOR_LUT[validId];
      }
    } else {
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = cubiomesModule.getValue(sharedBufferPtr + (i * 4), 'i32');
        const validId = (biomeId >= 0 && biomeId < 256) ? biomeId : 0;
        biomeIds[i] = validId;
        buf32[i] = ACTIVE_COLOR_LUT[validId];
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    if (tileCache.size > 5000) {
      const oldestKey = tileCache.keys().next().value;
      tileCache.delete(oldestKey);
    }

    tileCache.set(key, {
      canvas: offscreen,
      offCtx,
      imgData,
      buf32,
      biomeIds,
      isHiRes: true,
      loadedAt: performance.now()
    });
  } catch (err) {
    console.error(`Hi-res tile error [LOD ${lod}, ${tx}, ${tz}]:`, err);
  }
}

// Instant In-Place Recolor for Highlight Biomes:
// Re-maps existing cached tile buffers with ACTIVE_COLOR_LUT in ~5ms without clearing tiles or re-running WASM
function refreshCachedTilesColors() {
  for (const entry of tileCache.values()) {
    if (!entry.biomeIds || !entry.buf32 || !entry.offCtx || !entry.imgData) continue;
    const { buf32, biomeIds, offCtx, imgData } = entry;
    const len = biomeIds.length;
    for (let i = 0; i < len; i++) {
      buf32[i] = ACTIVE_COLOR_LUT[biomeIds[i]];
    }
    offCtx.putImageData(imgData, 0, 0);
  }
  requestRender();
}

function processTileQueue() {
  if (!cubiomesModule || !sharedBufferPtr) {
    isQueueProcessing = false;
    return;
  }

  // Never process tile queue while user is dragging, coasting, smooth-zooming, or gliding
  // This leaves 100% of the CPU free for locked 120Hz smooth rendering
  if (camera.isDragging || isCoasting || isSmoothZooming || isGliding) {
    isQueueProcessing = false;
    return;
  }

  if (pendingTiles.length === 0) {
    isQueueProcessing = false;
    return;
  }

  isQueueProcessing = true;
  const startTime = performance.now();

  // Process tiles within a 4ms frame budget then yield to requestAnimationFrame
  while (pendingTiles.length > 0) {
    const job = pendingTiles.shift();
    generateHiResTile(job.tx, job.tz, job.lodLevel);
    if (performance.now() - startTime >= 4) break;
  }

  requestRender();

  if (pendingTiles.length > 0) {
    requestAnimationFrame(processTileQueue);
  } else {
    isQueueProcessing = false;
  }
}

function scheduleTileGeneration(immediate = false) {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  if (immediate) {
    collectAndStartTileQueue();
  } else {
    // 100ms debounce after user stops scrolling/dragging
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      collectAndStartTileQueue();
    }, 100);
  }
}

function collectAndStartTileQueue() {
  if (!cssWidth || !cssHeight) return;

  const activeLOD = getActiveLOD();
  const halfW = cssWidth / 2;
  const halfH = cssHeight / 2;
  const pxPerBlock = camera.zoom / 4;

  const minBlockX = camera.x - halfW / pxPerBlock;
  const maxBlockX = camera.x + halfW / pxPerBlock;
  const minBlockZ = camera.z - halfH / pxPerBlock;
  const maxBlockZ = camera.z + halfH / pxPerBlock;

  // Viewport tiles with 1-tile buffer margin
  const BUFFER_TILES = 1;
  const minTileX = Math.floor(minBlockX / activeLOD.blocksPerTile) - BUFFER_TILES;
  const maxTileX = Math.ceil(maxBlockX / activeLOD.blocksPerTile) + BUFFER_TILES;
  const minTileZ = Math.floor(minBlockZ / activeLOD.blocksPerTile) - BUFFER_TILES;
  const maxTileZ = Math.ceil(maxBlockZ / activeLOD.blocksPerTile) + BUFFER_TILES;

  const centerTx = camera.x / activeLOD.blocksPerTile;
  const centerTz = camera.z / activeLOD.blocksPerTile;

  // Euclidean radial sorting: Concentric circular ripples from camera center
  const sortEuclidean = (a, b) => {
    const distA = (a.tx - centerTx) ** 2 + (a.tz - centerTz) ** 2;
    const distB = (b.tx - centerTx) ** 2 + (b.tz - centerTz) ** 2;
    return distA - distB;
  };

  const viewportMissing = [];
  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let tz = minTileZ; tz <= maxTileZ; tz++) {
      const key = `${activeLOD.lod},${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
      const entry = tileCache.get(key);
      if (!entry || !entry.isHiRes) {
        viewportMissing.push({ tx, tz, lodLevel: activeLOD, type: 'hires' });
      }
    }
  }

  viewportMissing.sort(sortEuclidean);
  pendingTiles = viewportMissing;

  if (!isQueueProcessing && pendingTiles.length > 0 && !camera.isDragging && !isCoasting && !isSmoothZooming && !isGliding) {
    processTileQueue();
  }
}

function getBiomeAt(blockX, blockZ) {
  if (!cubiomesModule) return 'Loading...';
  try {
    const biomeId = cubiomesModule.ccall(
      'get_single_biome',
      'number',
      ['number', 'number', 'number'],
      [blockX, blockZ, selectedY]
    );
    return getBiomeName(biomeId);
  } catch (e) {
    return 'Unknown';
  }
}
window.minecraftableGetBiomeAt = getBiomeAt;
window.minecraftableGetBiomeIdAt = (x, z) => {
  if (!cubiomesModule) return -1;
  try {
    return cubiomesModule.ccall('get_single_biome', 'number', ['number', 'number', 'number'], [x, z, selectedY]);
  } catch (_) { return -1; }
};
window.minecraftableCubiomes = () => cubiomesModule;
window.minecraftableSharedBuffer = () => sharedBufferPtr;
window.minecraftableCustomPins = () => customPins;
window.minecraftableAddPin = (pin) => {
  customPins.push(pin);
  saveCustomPins();
  updatePinsUI();
};

function renderView() {
  if (!canvas.width || !canvas.height) return;

  ctx.save();
  ctx.scale(dpr, dpr);

  ctx.fillStyle = currentDim === 1 ? '#020128' : '#111';
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  const activeLOD = getActiveLOD();
  const halfW = cssWidth / 2;
  const halfH = cssHeight / 2;
  const pxPerBlock = camera.zoom / 4;
  const tileScreenSize = activeLOD.blocksPerTile * pxPerBlock;

  const minBlockX = camera.x - halfW / pxPerBlock;
  const maxBlockX = camera.x + halfW / pxPerBlock;
  const minBlockZ = camera.z - halfH / pxPerBlock;
  const maxBlockZ = camera.z + halfH / pxPerBlock;

  const minTileX = Math.floor(minBlockX / activeLOD.blocksPerTile);
  const maxTileX = Math.ceil(maxBlockX / activeLOD.blocksPerTile);
  const minTileZ = Math.floor(minBlockZ / activeLOD.blocksPerTile);
  const maxTileZ = Math.ceil(maxBlockZ / activeLOD.blocksPerTile);

  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let tz = minTileZ; tz <= maxTileZ; tz++) {
      const key = `${activeLOD.lod},${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
      const tileEntry = tileCache.get(key);
      const blockX = tx * activeLOD.blocksPerTile;
      const blockZ = tz * activeLOD.blocksPerTile;

      const screenX = halfW + (blockX - camera.x) * pxPerBlock;
      const screenY = halfH + (blockZ - camera.z) * pxPerBlock;

      if (tileEntry) {
        ctx.save();
        // Smooth bilinear filtering for preview tiles or zoomed-out views; crisp nearest when inspecting blocks
        ctx.imageSmoothingEnabled = !tileEntry.isHiRes || pxPerBlock < 1.0;
        ctx.drawImage(tileEntry.canvas, screenX, screenY, tileScreenSize + 0.5, tileScreenSize + 0.5);
        ctx.restore();
      } else {
        // Fallback 1: Check parent LOD tile (zooming in)
        let fallbackDrawn = false;
        if (activeLOD.lod < LOD_LEVELS.length - 1) {
          const parentLOD = LOD_LEVELS[activeLOD.lod + 1];
          const ratio = parentLOD.blocksPerTile / activeLOD.blocksPerTile;
          const parentTx = Math.floor(tx / ratio);
          const parentTz = Math.floor(tz / ratio);
          const parentKey = `${parentLOD.lod},${parentTx},${parentTz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
          const parentEntry = tileCache.get(parentKey);
          if (parentEntry) {
            const modX = ((tx % ratio) + ratio) % ratio;
            const modZ = ((tz % ratio) + ratio) % ratio;
            const subW = TILE_PIXELS / ratio;
            const subH = TILE_PIXELS / ratio;
            ctx.save();
            ctx.imageSmoothingEnabled = true;
            ctx.drawImage(
              parentEntry.canvas,
              modX * subW, modZ * subH, subW, subH,
              screenX, screenY, tileScreenSize + 0.5, tileScreenSize + 0.5
            );
            ctx.restore();
            fallbackDrawn = true;
          }
        }
        // Fallback 2: Check child LOD tiles (zooming out)
        if (!fallbackDrawn && activeLOD.lod > 0) {
          const childLOD = LOD_LEVELS[activeLOD.lod - 1];
          const ratio = activeLOD.blocksPerTile / childLOD.blocksPerTile;
          const cTileSize = tileScreenSize / ratio;
          for (let cx = 0; cx < ratio; cx++) {
            for (let cz = 0; cz < ratio; cz++) {
              const cTx = tx * ratio + cx;
              const cTz = tz * ratio + cz;
              const cKey = `${childLOD.lod},${cTx},${cTz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
              const cEntry = tileCache.get(cKey);
              if (cEntry) {
                const cScreenX = screenX + cx * cTileSize;
                const cScreenY = screenY + cz * cTileSize;
                ctx.drawImage(cEntry.canvas, cScreenX, cScreenY, cTileSize + 0.5, cTileSize + 0.5);
                fallbackDrawn = true;
              }
            }
          }
        }
        if (!fallbackDrawn) {
          ctx.fillStyle = currentDim === 1 ? '#020128' : '#141414';
          ctx.fillRect(screenX, screenY, tileScreenSize + 0.5, tileScreenSize + 0.5);
        }
      }
    }
  }

  // Draw Structure Markers
  drawStructureMarkers(halfW, halfH, pxPerBlock, minBlockX, maxBlockX, minBlockZ, maxBlockZ);

  // Draw Saved Custom Pins
  drawCustomPins(halfW, halfH, pxPerBlock);

  if (targetPin) {
    drawTargetPin(halfW, halfH, pxPerBlock);
  }

  drawRulers(halfW, halfH, pxPerBlock);
  ctx.restore();
}

let structureLoadDebounce = null;

function triggerStructureLoad(immediate = false) {
  if (structureLoadDebounce) {
    clearTimeout(structureLoadDebounce);
    structureLoadDebounce = null;
  }

  const runLoad = () => {
    if (!cssWidth || !cssHeight) return;
    const halfW = cssWidth / 2;
    const halfH = cssHeight / 2;
    const pxPerBlock = camera.zoom / 4;

    const minBlockX = camera.x - halfW / pxPerBlock;
    const maxBlockX = camera.x + halfW / pxPerBlock;
    const minBlockZ = camera.z - halfH / pxPerBlock;
    const maxBlockZ = camera.z + halfH / pxPerBlock;

    const dimStr = String(currentDim);
    const enabledSet = enabledStructures[dimStr] || new Set();

    const DENSE_TYPES = ['slime', 'geode', 'cave', 'ore_vein', 'lava_pool'];
    const hasDenseEnabled = DENSE_TYPES.some(f => enabledSet.has(f));
    const isDenseSuppressed = (pxPerBlock < 0.08);

    const zoomNoticeBadge = document.getElementById('zoomNoticeBadge');
    if (zoomNoticeBadge) {
      if (hasDenseEnabled && isDenseSuppressed) {
        zoomNoticeBadge.classList.remove('hidden');
      } else {
        zoomNoticeBadge.classList.add('hidden');
      }
    }

    ensureStructuresLoaded({
      seed: currentSeed,
      version: selectedVersion,
      dimension: currentDim,
      minX: minBlockX,
      maxX: maxBlockX,
      minZ: minBlockZ,
      maxZ: maxBlockZ,
      enabledSet,
      suppressDense: isDenseSuppressed,
      onUpdate: () => {
        requestRender();
      }
    });
  };

  if (immediate) {
    runLoad();
  } else {
    structureLoadDebounce = setTimeout(runLoad, 120);
  }
}

function drawStructureMarkers(halfW, halfH, pxPerBlock, minBlockX, maxBlockX, minBlockZ, maxBlockZ) {
  currentVisibleMarkers = [];
  window.__currentVisibleMarkers = currentVisibleMarkers;
  window.__renderView = renderView;
  const dimStr = String(currentDim);
  const enabledSet = enabledStructures[dimStr] || new Set();

  const zoomNoticeBadge = document.getElementById('zoomNoticeBadge');
  const DENSE_TYPES = ['slime', 'geode', 'cave', 'ore_vein', 'lava_pool'];
  const hasDenseEnabled = DENSE_TYPES.some(f => enabledSet.has(f));
  const isDenseSuppressed = (pxPerBlock < 0.08);

  if (zoomNoticeBadge) {
    if (hasDenseEnabled && isDenseSuppressed) {
      zoomNoticeBadge.classList.remove('hidden');
    } else {
      zoomNoticeBadge.classList.add('hidden');
    }
  }

  if (enabledSet.size === 0) return;

  const rawMarkers = getVisibleStructures({
    dimension: currentDim,
    minX: minBlockX,
    maxX: maxBlockX,
    minZ: minBlockZ,
    maxZ: maxBlockZ,
    seed: currentSeed,
    version: selectedVersion,
    enabledSet
  });

  for (const m of rawMarkers) {
    const screenX = halfW + (m.x - camera.x) * pxPerBlock;
    const screenY = halfH + (m.z - camera.z) * pxPerBlock;
    if (screenX < -30 || screenX > cssWidth + 30 || screenY < -30 || screenY > cssHeight + 30) continue;

    const compKey = getCompletionKey(m);
    const isCompleted = completedLocations.has(compKey);
    const isHovered = (hoveredMarker && hoveredMarker.id === m.id);

    drawPoiMarker(ctx, m.spriteKey, screenX, screenY, isCompleted, isHovered);

    currentVisibleMarkers.push({
      marker: m,
      screenX,
      screenY,
      isCompleted
    });
  }

  window.__currentVisibleMarkers = currentVisibleMarkers;

  // If a popup marker is currently active, update its anchored position on screen
  if (activePopupMarker && markerPopup) {
    const pScreenX = halfW + (activePopupMarker.x - camera.x) * pxPerBlock;
    const pScreenY = halfH + (activePopupMarker.z - camera.z) * pxPerBlock;
    if (pScreenX >= 0 && pScreenX <= cssWidth && pScreenY >= 0 && pScreenY <= cssHeight) {
      positionMarkerPopup(pScreenX, pScreenY);
      markerPopup.classList.remove('hidden');
    } else {
      markerPopup.classList.add('hidden');
    }
  }
}

let currentVisiblePins = [];

function drawCustomPins(halfW, halfH, pxPerBlock) {
  currentVisiblePins = [];
  const dimPins = customPins.filter(p => p.dim === currentDim);
  if (dimPins.length === 0) return;

  for (const pin of dimPins) {
    const screenX = halfW + (pin.x - camera.x) * pxPerBlock;
    const screenY = halfH + (pin.z - camera.z) * pxPerBlock;
    if (screenX < -100 || screenX > cssWidth + 100 || screenY < -100 || screenY > cssHeight + 100) continue;

    currentVisiblePins.push({
      pin,
      screenX,
      screenY
    });

    ctx.save();
    ctx.translate(screenX, screenY);

    // Drop shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;

    // Pin marker path
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-7, -10, -10, -16, -10, -22);
    ctx.arc(0, -22, 10, Math.PI, 0, false);
    ctx.bezierCurveTo(10, -16, 7, -10, 0, 0);
    ctx.closePath();

    ctx.fillStyle = pin.color || '#ff4757';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Name label pill
    const nameStr = pin.name || 'Pin';
    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const tw = ctx.measureText(nameStr).width;
    const pad = 6;
    const boxW = tw + pad * 2;
    const boxH = 18;
    const boxY = -44;

    ctx.fillStyle = 'rgba(20, 20, 20, 0.88)';
    ctx.fillRect(-boxW / 2, boxY, boxW, boxH);
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = pin.color || '#ff4757';
    ctx.strokeRect(-boxW / 2, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nameStr, 0, boxY + boxH / 2);

    ctx.restore();
  }
}

function drawTargetPin(halfW, halfH, pxPerBlock) {
  const pinScreenX = halfW + (targetPin.x - camera.x) * pxPerBlock;
  const pinScreenY = halfH + (targetPin.z - camera.z) * pxPerBlock;

  if (pinScreenX < -50 || pinScreenX > cssWidth + 50 || pinScreenY < -50 || pinScreenY > cssHeight + 50) {
    return;
  }

  ctx.save();
  ctx.translate(pinScreenX, pinScreenY);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-9, -12, -13, -20, -13, -28);
  ctx.arc(0, -28, 13, Math.PI, 0, false);
  ctx.bezierCurveTo(13, -20, 9, -12, 0, 0);
  ctx.closePath();

  ctx.fillStyle = '#e63946';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.arc(0, -28, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  const label = `X: ${targetPin.x}, Z: ${targetPin.z}`;
  ctx.font = 'bold 11px monospace';
  const tw = ctx.measureText(label).width;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(-tw / 2 - 5, -54, tw + 10, 18);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(-tw / 2 - 5, -54, tw + 10, 18);
  ctx.fillStyle = '#fff';
  ctx.fillText(label, -tw / 2, -41);

  ctx.restore();
}

function drawRulers(halfW, halfH, pxPerBlock) {
  const rulerHeight = 24;
  const rulerWidth = 62;

  ctx.fillStyle = 'rgba(18, 18, 18, 0.94)';
  ctx.fillRect(0, 0, cssWidth, rulerHeight);
  ctx.fillRect(0, 0, rulerWidth, cssHeight);

  ctx.fillStyle = '#141414';
  ctx.fillRect(0, 0, rulerWidth, rulerHeight);

  ctx.strokeStyle = '#383838';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, rulerHeight + 0.5);
  ctx.lineTo(cssWidth, rulerHeight + 0.5);
  ctx.moveTo(rulerWidth + 0.5, 0);
  ctx.lineTo(rulerWidth + 0.5, cssHeight);
  ctx.stroke();

  ctx.fillStyle = '#888';
  ctx.font = 'bold 11px monospace';
  ctx.fillText('X / Z', 14, 16);

  const targetPixels = 110;
  const rawInterval = targetPixels / pxPerBlock;
  const power = Math.pow(2, Math.round(Math.log2(rawInterval)));
  const interval = Math.max(8, power);

  ctx.fillStyle = '#ccc';
  ctx.font = '11px monospace';

  const minBlockX = camera.x - halfW / pxPerBlock;
  const maxBlockX = camera.x + halfW / pxPerBlock;
  const firstX = Math.floor(minBlockX / interval) * interval;

  for (let bx = firstX; bx <= maxBlockX; bx += interval) {
    const screenX = Math.round(halfW + (bx - camera.x) * pxPerBlock) + 0.5;
    if (screenX >= rulerWidth && screenX <= cssWidth) {
      ctx.fillStyle = '#444';
      ctx.fillRect(screenX, rulerHeight - 8, 1, 8);
      ctx.fillStyle = '#ccc';
      ctx.fillText(`${bx}`, screenX + 4, rulerHeight - 9);
    }
  }

  const minBlockZ = camera.z - halfH / pxPerBlock;
  const maxBlockZ = camera.z + halfH / pxPerBlock;
  const firstZ = Math.floor(minBlockZ / interval) * interval;

  for (let bz = firstZ; bz <= maxBlockZ; bz += interval) {
    const screenY = Math.round(halfH + (bz - camera.z) * pxPerBlock) + 0.5;
    if (screenY >= rulerHeight && screenY <= cssHeight) {
      ctx.fillStyle = '#444';
      ctx.fillRect(rulerWidth - 8, screenY, 8, 1);
      ctx.fillStyle = '#ccc';
      ctx.fillText(`${bz}`, 6, screenY - 4);
    }
  }
}

let biomeLookupTimer = null;
let lastBiomeX = null;
let lastBiomeZ = null;

function updatePointerInfo(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  const pxPerBlock = camera.zoom / 4;

  const currentBlockX = Math.round(camera.x + (mouseX - cssWidth / 2) / pxPerBlock);
  const currentBlockZ = Math.round(camera.z + (mouseY - cssHeight / 2) / pxPerBlock);

  if (coordsDisplay) {
    coordsDisplay.textContent = `X: ${currentBlockX} | Z: ${currentBlockZ}`;
  }

  // When dragging or coasting at 120Hz, avoid heavy synchronous WASM calls
  if (camera.isDragging || isCoasting) return;

  if (currentBlockX !== lastBiomeX || currentBlockZ !== lastBiomeZ) {
    lastBiomeX = currentBlockX;
    lastBiomeZ = currentBlockZ;
    if (!biomeLookupTimer) {
      biomeLookupTimer = setTimeout(() => {
        biomeLookupTimer = null;
        if (biomeTag) biomeTag.textContent = getBiomeAt(lastBiomeX, lastBiomeZ);
      }, 35);
    }
  }
}

let mouseDownPos = { x: 0, y: 0 };
let touchStartPos = { x: 0, y: 0 };
let lastTouchX = 0;
let lastTouchY = 0;

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  // Arrest coasting glide, camera glide, or zoom immediately
  isCoasting = false;
  coastVx = 0;
  coastVz = 0;
  isGliding = false;
  isSmoothZooming = false;
  camera.zoom = camera.targetZoom;

  camera.isDragging = true;
  camera.lastMouseX = e.clientX;
  camera.lastMouseY = e.clientY;
  lastDragClientX = e.clientX;
  lastDragClientY = e.clientY;
  lastDragTime = performance.now();
  dragVx = 0;
  dragVz = 0;
  mouseDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('click', (e) => {
  if (e.button !== 0) return;
  const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
  if (dist > 6) return; // Was a drag, not a click

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  // Check custom pins first
  let clickedPin = null;
  let minPinDist = 20;
  for (const item of currentVisiblePins) {
    const d = Math.hypot(mouseX - item.screenX, mouseY - (item.screenY - 18));
    if (d <= minPinDist) {
      minPinDist = d;
      clickedPin = item;
    }
  }

  if (clickedPin) {
    openMarkerPopup({
      name: clickedPin.pin.name,
      x: clickedPin.pin.x,
      y: clickedPin.pin.y,
      z: clickedPin.pin.z,
      isCustomPin: true,
      pinId: clickedPin.pin.id
    }, clickedPin.screenX, clickedPin.screenY);
    return;
  }

  let clickedItem = null;
  let minDist = 16;
  for (const item of currentVisibleMarkers) {
    const d = Math.hypot(mouseX - item.screenX, mouseY - item.screenY);
    if (d <= minDist) {
      minDist = d;
      clickedItem = item;
    }
  }

  if (clickedItem) {
    openMarkerPopup(clickedItem.marker, clickedItem.screenX, clickedItem.screenY);
  } else {
    closeMarkerPopup();
  }
});

window.addEventListener('mouseup', () => {
  if (camera.isDragging) {
    camera.isDragging = false;
    canvas.style.cursor = 'grab';

    if (dragStopTimeout) {
      clearTimeout(dragStopTimeout);
      dragStopTimeout = null;
    }

    const speed = Math.hypot(dragVx, dragVz);
    if (speed > 0.005) {
      // Natural inertia flick release
      const maxSpeed = 2.5;
      if (speed > maxSpeed) {
        dragVx = (dragVx / speed) * maxSpeed;
        dragVz = (dragVz / speed) * maxSpeed;
      }
      coastVx = dragVx;
      coastVz = dragVz;
      lastCoastTime = performance.now();
      isCoasting = true;
      startAnimationLoop();
    } else {
      isCoasting = false;
      coastVx = 0;
      coastVz = 0;
      scheduleTileGeneration(true);
      triggerStructureLoad(true);
    }
  }
});

window.addEventListener('mousemove', (e) => {
  updatePointerInfo(e.clientX, e.clientY);

  if (camera.isDragging) {
    canvas.style.cursor = 'grabbing';
    const pxPerBlock = camera.zoom / 4;
    const dx = e.clientX - camera.lastMouseX;
    const dy = e.clientY - camera.lastMouseY;

    camera.x -= dx / pxPerBlock;
    camera.z -= dy / pxPerBlock;

    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;

    const now = performance.now();
    const dt = now - lastDragTime;
    if (dt > 1 && dt < 250) {
      const stepDx = e.clientX - lastDragClientX;
      const stepDy = e.clientY - lastDragClientY;
      const instVx = -stepDx / pxPerBlock / dt;
      const instVz = -stepDy / pxPerBlock / dt;
      dragVx = dragVx * 0.35 + instVx * 0.65;
      dragVz = dragVz * 0.35 + instVz * 0.65;
      lastDragTime = now;
      lastDragClientX = e.clientX;
      lastDragClientY = e.clientY;
    }

    if (dragStopTimeout) clearTimeout(dragStopTimeout);
    dragStopTimeout = setTimeout(() => {
      dragVx = 0;
      dragVz = 0;
    }, 150);

    requestRender();
    scheduleTileGeneration(false);
    triggerStructureLoad(false);
  } else {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (mouseX >= 0 && mouseX <= cssWidth && mouseY >= 0 && mouseY <= cssHeight) {
      let hitPin = null;
      let minPinDist = 20;
      for (const item of currentVisiblePins) {
        const d = Math.hypot(mouseX - item.screenX, mouseY - (item.screenY - 18));
        if (d <= minPinDist) {
          minPinDist = d;
          hitPin = item;
        }
      }

      let hitItem = null;
      let minDist = 16;
      for (const item of currentVisibleMarkers) {
        const d = Math.hypot(mouseX - item.screenX, mouseY - item.screenY);
        if (d <= minDist) {
          minDist = d;
          hitItem = item;
        }
      }

      if (hitPin || hitItem) {
        canvas.style.cursor = 'pointer';
        if (hitItem && (!hoveredMarker || hoveredMarker.id !== hitItem.marker.id)) {
          hoveredMarker = hitItem.marker;
          requestRender();
        }
      } else {
        canvas.style.cursor = 'grab';
        if (hoveredMarker) {
          hoveredMarker = null;
          requestRender();
        }
      }
    }
  }
});

let lastTouchDistance = 0;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    isCoasting = false;
    coastVx = 0;
    coastVz = 0;
    camera.isDragging = true;
    camera.lastMouseX = e.touches[0].clientX;
    camera.lastMouseY = e.touches[0].clientY;
    lastDragClientX = e.touches[0].clientX;
    lastDragClientY = e.touches[0].clientY;
    lastDragTime = performance.now();
    dragVx = 0;
    dragVz = 0;
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    updatePointerInfo(e.touches[0].clientX, e.touches[0].clientY);
    startAnimationLoop();
  } else if (e.touches.length === 2) {
    camera.isDragging = false;
    isCoasting = false;
    lastTouchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
  }
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
  if (e.touches.length === 1 && camera.isDragging) {
    const pxPerBlock = camera.zoom / 4;
    const dx = e.touches[0].clientX - camera.lastMouseX;
    const dy = e.touches[0].clientY - camera.lastMouseY;

    camera.x -= dx / pxPerBlock;
    camera.z -= dy / pxPerBlock;

    camera.lastMouseX = e.touches[0].clientX;
    camera.lastMouseY = e.touches[0].clientY;
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;

    const now = performance.now();
    const dt = now - lastDragTime;
    if (dt > 4 && dt < 120) {
      const stepDx = e.touches[0].clientX - lastDragClientX;
      const stepDy = e.touches[0].clientY - lastDragClientY;
      const instVx = -stepDx / pxPerBlock / dt;
      const instVz = -stepDy / pxPerBlock / dt;
      dragVx = dragVx * 0.35 + instVx * 0.65;
      dragVz = dragVz * 0.35 + instVz * 0.65;
      lastDragTime = now;
      lastDragClientX = e.touches[0].clientX;
      lastDragClientY = e.touches[0].clientY;
    }

    startAnimationLoop();
    scheduleTileGeneration(false);
    triggerStructureLoad(false);
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = currentDistance / lastTouchDistance;
    const { minZoom, maxZoom } = getZoomLimits();
    camera.zoom = Math.min(Math.max(camera.zoom * factor, minZoom), maxZoom);
    camera.targetZoom = camera.zoom;
    lastTouchDistance = currentDistance;
    startAnimationLoop();
    scheduleTileGeneration(false);
    triggerStructureLoad(false);
  }
}, { passive: true });

canvas.addEventListener('touchend', () => {
  if (camera.isDragging) {
    camera.isDragging = false;
    const speed = Math.hypot(dragVx, dragVz);
    if (speed > 0.005) {
      const maxSpeed = 2.5;
      if (speed > maxSpeed) {
        dragVx = (dragVx / speed) * maxSpeed;
        dragVz = (dragVz / speed) * maxSpeed;
      }
      coastVx = dragVx;
      coastVz = dragVz;
      lastCoastTime = performance.now();
      isCoasting = true;
      startAnimationLoop();
    } else {
      scheduleTileGeneration(true);
      triggerStructureLoad(true);
    }
    const dist = Math.hypot(lastTouchX - touchStartPos.x, lastTouchY - touchStartPos.y);
    if (dist <= 8) {
      const rect = canvas.getBoundingClientRect();
      const touchX = lastTouchX - rect.left;
      const touchY = lastTouchY - rect.top;
      let clickedItem = null;
      let minDist = 20;
      for (const item of currentVisibleMarkers) {
        const d = Math.hypot(touchX - item.screenX, touchY - item.screenY);
        if (d <= minDist) {
          minDist = d;
          clickedItem = item;
        }
      }
      if (clickedItem) {
        openMarkerPopup(clickedItem.marker, clickedItem.screenX, clickedItem.screenY);
      } else {
        closeMarkerPopup();
      }
    }
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  zoomAnchorScreenX = e.clientX - rect.left;
  zoomAnchorScreenY = e.clientY - rect.top;

  const halfW = cssWidth / 2;
  const halfH = cssHeight / 2;
  const pxPerBlock = camera.zoom / 4;

  zoomAnchorWorldX = camera.x + (zoomAnchorScreenX - halfW) / pxPerBlock;
  zoomAnchorWorldZ = camera.z + (zoomAnchorScreenY - halfH) / pxPerBlock;

  let delta = e.deltaY;
  if (e.deltaMode === 1) delta *= 24;
  else if (e.deltaMode === 2) delta *= 300;
  delta = Math.max(-100, Math.min(100, delta));

  const factor = Math.pow(0.9985, delta);
  const { minZoom, maxZoom } = getZoomLimits();
  camera.targetZoom = Math.min(Math.max(camera.targetZoom * factor, minZoom), maxZoom);

  isSmoothZooming = true;
  startAnimationLoop();
  scheduleTileGeneration(false);
  triggerStructureLoad(false);
}, { passive: false });

function updateGenerator() {
  if (!cubiomesModule) return;

  tileCache.clear();
  pendingTiles = [];

  const vConfig = VERSION_MAP[selectedVersion] || { mc: 28, flags: 0, isBedrock: true };
  const mcEnum = vConfig.mc ?? 28;
  const flags = vConfig.flags ?? 0;
  const isBedrock = !!vConfig.isBedrock;

  // Bedrock pre-1.18 seeds were 32-bit
  let effectiveSeed = currentSeed;
  if (isBedrock && mcEnum <= 21) {
    effectiveSeed = BigInt.asUintN(32, currentSeed);
  }
  const u64Seed = BigInt.asUintN(64, effectiveSeed);
  const low = Number(u64Seed & 0xffffffffn);
  const high = Number((u64Seed >> 32n) & 0xffffffffn);

  console.log(`Setting generator -> Version: ${mcEnum}, Flags: ${flags}, Seed: ${effectiveSeed}, Dim: ${currentDim}`);

  cubiomesModule.ccall(
    'init_generator_split',
    null,
    ['number', 'number', 'number', 'number', 'number'],
    [mcEnum, low, high, currentDim, flags]
  );

  if (biomeTag) {
    biomeTag.textContent = getBiomeAt(Math.round(camera.x), Math.round(camera.z));
  }

  renderView();
  requestRender();
  scheduleTileGeneration(true);
  triggerStructureLoad(true);
}

async function loadWasm() {
  try {
    if (typeof window.createCubiomesModule !== 'function') {
      setTimeout(loadWasm, 100);
      return;
    }
    cubiomesModule = await window.createCubiomesModule({
      locateFile: (path) => `/${path}`
    });

    if (typeof cubiomesModule._allocate_biome_buffer === 'function') {
      sharedBufferPtr = cubiomesModule._allocate_biome_buffer(TILE_PIXELS * TILE_PIXELS);
    } else if (typeof cubiomesModule._malloc === 'function') {
      sharedBufferPtr = cubiomesModule._malloc(TILE_PIXELS * TILE_PIXELS * 4);
    }

    await loadPoiImages();
    initStructureWorker();
    renderFeaturesPanel();

    resizeCanvas();
    setInitial3000BlockView();
    syncSettings(true);
  } catch (err) {
    console.error('Failed to load WASM:', err);
  }
}

const seedInput = document.getElementById('seedInput');
const versionSelect = document.getElementById('versionSelect');
const dimensionSelect = document.getElementById('dimensionSelect');
const heightSelect = document.getElementById('heightSelect');
const heightContainer = document.getElementById('heightContainer');

function parseSeed(str) {
  const trimmed = (str || '').trim();
  if (/^-?\d+$/.test(trimmed)) {
    try {
      return BigInt(trimmed);
    } catch (_) {}
  }
  // Standard Minecraft Java hashCode for string/text seeds
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = (Math.imul(31, hash) + trimmed.charCodeAt(i)) | 0;
  }
  return BigInt(hash);
}

let seedDebounceTimer = null;

function syncSettings(immediate = false) {
  if (!seedInput || !dimensionSelect || !heightSelect || !versionSelect) return;

  const newSeed = parseSeed(seedInput.value);
  const newDim = parseInt(dimensionSelect.value, 10);
  const newY = parseInt(heightSelect.value, 10);
  const newVer = versionSelect.value || 'be_26_30';

  // Dynamic height visibility: show for Overworld (0), hide for Nether (-1) and End (1)
  if (heightContainer) {
    heightContainer.style.display = (newDim === 0) ? 'inline-flex' : 'none';
  }

  // Auto-remove waypoint, popup, and markers when switching dimensions
  if (newDim !== currentDim) {
    targetPin = null;
    closeMarkerPopup();
    currentVisibleMarkers = [];
    window.__currentVisibleMarkers = [];
    hoveredMarker = null;
    const gx = document.getElementById('gotoX');
    const gz = document.getElementById('gotoZ');
    if (gx) gx.value = '';
    if (gz) gz.value = '';
  }

  const changed = (newSeed !== currentSeed || newDim !== currentDim || newY !== selectedY || newVer !== selectedVersion);
  if (changed || immediate) {
    const seedChanged = (newSeed !== currentSeed);
    const dimChanged = (newDim !== currentDim);
    currentSeed = newSeed;
    currentDim = newDim;
    selectedY = newY;
    selectedVersion = newVer;
    if (seedChanged) {
      loadSeedData(currentSeed);
    }
    if (seedChanged || dimChanged) {
      resetStructureWorker();
    }
    if (dimChanged) {
      highlightedBiomes.clear();
      updateActiveColorLUT(highlightedBiomes);
      updateHighlightBadge();
      renderBiomeDropdown();
    }
    if (dimChanged || immediate) {
      renderFeaturesPanel();
    }
    updateGenerator();
  }
}

// Auto-update event listeners for seed, version, dimension, and height
if (seedInput) {
  seedInput.addEventListener('input', () => {
    if (seedDebounceTimer) clearTimeout(seedDebounceTimer);
    seedDebounceTimer = setTimeout(() => {
      seedDebounceTimer = null;
      syncSettings(false);
    }, 350);
  });

  seedInput.addEventListener('change', () => {
    if (seedDebounceTimer) {
      clearTimeout(seedDebounceTimer);
      seedDebounceTimer = null;
    }
    syncSettings(true);
  });
}

if (versionSelect) {
  versionSelect.addEventListener('change', () => syncSettings(true));
}

if (dimensionSelect) {
  dimensionSelect.addEventListener('change', () => syncSettings(true));
}

if (heightSelect) {
  heightSelect.addEventListener('change', () => syncSettings(true));
}

document.getElementById('gotoBtn')?.addEventListener('click', () => {
  const xVal = document.getElementById('gotoX')?.value.trim();
  const zVal = document.getElementById('gotoZ')?.value.trim();

  if (!xVal || !zVal) return;
  const targetX = parseInt(xVal, 10);
  const targetZ = parseInt(zVal, 10);
  if (isNaN(targetX) || isNaN(targetZ)) return;

  targetPin = { x: targetX, z: targetZ };
  camera.x = targetX;
  camera.z = targetZ;
  coordsDisplay.textContent = `X: ${targetX} | Z: ${targetZ}`;
  biomeTag.textContent = getBiomeAt(targetX, targetZ);

  requestRender();
  scheduleTileGeneration(true);
  triggerStructureLoad(true);
});

document.getElementById('clearPinBtn')?.addEventListener('click', () => {
  targetPin = null;
  const gx = document.getElementById('gotoX');
  const gz = document.getElementById('gotoZ');
  if (gx) gx.value = '';
  if (gz) gz.value = '';
  requestRender();
});

['gotoX', 'gotoZ'].forEach(id => {
  document.getElementById(id)?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('gotoBtn')?.click();
    }
  });
});

// Initial height dropdown visibility setup
if (heightContainer && dimensionSelect) {
  heightContainer.style.display = (dimensionSelect.value === '0') ? 'inline-flex' : 'none';
}

// ==========================================
// Highlight Biomes Feature (Chunkbase Style)
// ==========================================
const highlightedBiomes = new Set();
let currentBiomeTab = 'biomes'; // 'biomes' | 'groups'
let currentBiomeSearch = '';

const highlightBiomesBtn = document.getElementById('highlightBiomesBtn');
const highlightBadge = document.getElementById('highlightBadge');
const highlightClearBtn = document.getElementById('highlightClearBtn');
const highlightDropdown = document.getElementById('highlightDropdown');
const tabBiomesBtn = document.getElementById('tabBiomesBtn');
const tabGroupsBtn = document.getElementById('tabGroupsBtn');
const biomeSearchInput = document.getElementById('biomeSearchInput');
const clearSearchBtn = document.getElementById('clearSearchBtn');
const biomeDropdownList = document.getElementById('biomeDropdownList');

function updateHighlightBadge() {
  const count = highlightedBiomes.size;
  if (count > 0) {
    if (highlightBadge) {
      highlightBadge.textContent = String(count);
      highlightBadge.classList.remove('hidden');
    }
    if (highlightClearBtn) {
      highlightClearBtn.classList.remove('hidden');
    }
    if (highlightBiomesBtn) {
      highlightBiomesBtn.classList.add('active');
    }
  } else {
    if (highlightBadge) {
      highlightBadge.classList.add('hidden');
    }
    if (highlightClearBtn) {
      highlightClearBtn.classList.add('hidden');
    }
    if (highlightBiomesBtn) {
      highlightBiomesBtn.classList.remove('active');
    }
  }
}

function renderBiomeDropdown() {
  if (!biomeDropdownList) return;
  biomeDropdownList.innerHTML = '';

  const dimStr = String(currentDim);
  const groups = BIOME_GROUPS[dimStr] || [];
  const searchTerm = (currentBiomeSearch || '').toLowerCase().trim();

  if (currentBiomeTab === 'biomes') {
    let anyFound = false;

    groups.forEach((grp) => {
      const matchingBiomes = grp.biomes.filter(b => {
        if (!searchTerm) return true;
        return b.name.toLowerCase().includes(searchTerm);
      });

      if (matchingBiomes.length > 0) {
        anyFound = true;
        const catTitle = document.createElement('div');
        catTitle.className = 'dropdown-category-title';
        catTitle.textContent = grp.name;
        biomeDropdownList.appendChild(catTitle);

        matchingBiomes.forEach(b => {
          const item = document.createElement('div');
          item.className = 'biome-item';
          const isSelected = highlightedBiomes.has(b.id);
          if (isSelected) item.classList.add('selected');

          const swatch = document.createElement('span');
          swatch.className = 'biome-swatch';
          swatch.style.backgroundColor = getBiomeCssColor(b.id);

          const nameSpan = document.createElement('span');
          nameSpan.className = 'biome-name';
          nameSpan.textContent = b.name;

          const checkSpan = document.createElement('span');
          checkSpan.className = 'biome-check';
          checkSpan.textContent = '✓';

          item.appendChild(swatch);
          item.appendChild(nameSpan);
          item.appendChild(checkSpan);

          item.addEventListener('click', (e) => {
            e.stopPropagation();
            if (highlightedBiomes.has(b.id)) {
              highlightedBiomes.delete(b.id);
            } else {
              highlightedBiomes.add(b.id);
            }
            updateActiveColorLUT(highlightedBiomes);
            updateHighlightBadge();
            refreshCachedTilesColors();
            renderBiomeDropdown();
          });

          biomeDropdownList.appendChild(item);
        });
      }
    });

    if (!anyFound) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '24px 10px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = '#888';
      emptyDiv.style.fontSize = '12px';
      emptyDiv.textContent = `No biomes found matching "${currentBiomeSearch}"`;
      biomeDropdownList.appendChild(emptyDiv);
    }
  } else {
    // 'groups' tab
    let anyFound = false;

    groups.forEach(grp => {
      if (searchTerm && !grp.name.toLowerCase().includes(searchTerm) && !grp.biomes.some(b => b.name.toLowerCase().includes(searchTerm))) {
        return;
      }
      anyFound = true;

      const item = document.createElement('div');
      item.className = 'group-item';

      const allSelected = grp.biomes.length > 0 && grp.biomes.every(b => highlightedBiomes.has(b.id));
      const someSelected = !allSelected && grp.biomes.some(b => highlightedBiomes.has(b.id));

      if (allSelected) item.classList.add('selected');

      const infoDiv = document.createElement('div');
      const titleSpan = document.createElement('div');
      titleSpan.className = 'group-title';
      titleSpan.textContent = grp.name;
      const countSpan = document.createElement('div');
      countSpan.className = 'group-count';
      countSpan.textContent = `${grp.biomes.length} biomes`;
      infoDiv.appendChild(titleSpan);
      infoDiv.appendChild(countSpan);

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'group-checkbox';
      cb.checked = allSelected;
      cb.indeterminate = someSelected;

      item.appendChild(infoDiv);
      item.appendChild(cb);

      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (allSelected) {
          grp.biomes.forEach(b => highlightedBiomes.delete(b.id));
        } else {
          grp.biomes.forEach(b => highlightedBiomes.add(b.id));
        }
        updateActiveColorLUT(highlightedBiomes);
        updateHighlightBadge();
        refreshCachedTilesColors();
        renderBiomeDropdown();
      });

      biomeDropdownList.appendChild(item);
    });

    if (!anyFound) {
      const emptyDiv = document.createElement('div');
      emptyDiv.style.padding = '24px 10px';
      emptyDiv.style.textAlign = 'center';
      emptyDiv.style.color = '#888';
      emptyDiv.style.fontSize = '12px';
      emptyDiv.textContent = `No groups found matching "${currentBiomeSearch}"`;
      biomeDropdownList.appendChild(emptyDiv);
    }
  }
}

if (highlightBiomesBtn && highlightDropdown) {
  highlightBiomesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = highlightDropdown.classList.contains('hidden');
    if (isHidden) {
      renderBiomeDropdown();
      highlightDropdown.classList.remove('hidden');
      if (biomeSearchInput) {
        biomeSearchInput.focus();
      }
    } else {
      highlightDropdown.classList.add('hidden');
    }
  });
}

if (highlightClearBtn) {
  highlightClearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    highlightedBiomes.clear();
    updateActiveColorLUT(highlightedBiomes);
    updateHighlightBadge();
    refreshCachedTilesColors();
    renderBiomeDropdown();
  });
}

if (tabBiomesBtn && tabGroupsBtn) {
  tabBiomesBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBiomeTab = 'biomes';
    tabBiomesBtn.classList.add('active');
    tabGroupsBtn.classList.remove('active');
    renderBiomeDropdown();
  });

  tabGroupsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBiomeTab = 'groups';
    tabGroupsBtn.classList.add('active');
    tabBiomesBtn.classList.remove('active');
    renderBiomeDropdown();
  });
}

if (biomeSearchInput) {
  biomeSearchInput.addEventListener('input', (e) => {
    currentBiomeSearch = e.target.value;
    if (clearSearchBtn) {
      if (currentBiomeSearch) clearSearchBtn.classList.remove('hidden');
      else clearSearchBtn.classList.add('hidden');
    }
    renderBiomeDropdown();
  });

  biomeSearchInput.addEventListener('click', (e) => e.stopPropagation());
}

if (clearSearchBtn) {
  clearSearchBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    currentBiomeSearch = '';
    if (biomeSearchInput) {
      biomeSearchInput.value = '';
      biomeSearchInput.focus();
    }
    clearSearchBtn.classList.add('hidden');
    renderBiomeDropdown();
  });
}

document.addEventListener('click', (e) => {
  if (highlightDropdown && !highlightDropdown.classList.contains('hidden')) {
    if (!highlightDropdown.contains(e.target) && !highlightBiomesBtn.contains(e.target)) {
      highlightDropdown.classList.add('hidden');
    }
  }
});

// ==========================================
// Saved Custom Pins Feature (Per-Seed Storage)
// ==========================================
const pinsPanel = document.getElementById('pinsPanel');
const pinsToggleBtn = document.getElementById('pinsToggleBtn');
const pinsCloseBtn = document.getElementById('pinsCloseBtn');
const pinsCountBadge = document.getElementById('pinsCountBadge');
const pinsSeedNotice = document.getElementById('pinsSeedNotice');
const pinNameInput = document.getElementById('pinNameInput');
const pinXInput = document.getElementById('pinXInput');
const pinYInput = document.getElementById('pinYInput');
const pinZInput = document.getElementById('pinZInput');
const savePinBtn = document.getElementById('savePinBtn');
const pinsList = document.getElementById('pinsList');
const addPinBtn = document.getElementById('addPinBtn');

let selectedPinColor = '#ff4757';

document.querySelectorAll('.pin-color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.pin-color-dot').forEach(d => d.classList.remove('active'));
    dot.classList.add('active');
    selectedPinColor = dot.getAttribute('data-color') || '#ff4757';
  });
});

function updatePinsUI() {
  if (pinsSeedNotice) {
    pinsSeedNotice.textContent = `Seed: ${currentSeed}`;
  }
  if (pinsCountBadge) {
    pinsCountBadge.textContent = String(customPins.length);
  }

  if (!pinsList) return;
  pinsList.innerHTML = '';

  if (customPins.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'pin-empty-state';
    empty.innerHTML = 'No custom pins saved for this seed yet.<br><br>Add a pin using the form above or click <b>+ Pin</b> in the top bar!';
    pinsList.appendChild(empty);
    return;
  }

  [...customPins].reverse().forEach(pin => {
    const card = document.createElement('div');
    card.className = 'pin-card';
    card.style.borderLeftColor = pin.color || '#ff4757';

    const header = document.createElement('div');
    header.className = 'pin-card-header';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'pin-card-name';
    nameSpan.textContent = pin.name || 'Unnamed Pin';

    const dimSpan = document.createElement('span');
    dimSpan.className = 'pin-card-dim';
    dimSpan.textContent = pin.dim === -1 ? 'Nether' : (pin.dim === 1 ? 'The End' : 'Overworld');

    header.appendChild(nameSpan);
    header.appendChild(dimSpan);

    const coords = document.createElement('div');
    coords.className = 'pin-card-coords';
    const yStr = pin.y != null ? ` Y: ${pin.y}` : '';
    coords.textContent = `X: ${pin.x}${yStr} Z: ${pin.z}`;

    const actions = document.createElement('div');
    actions.className = 'pin-card-actions';

    const gotoBtn = document.createElement('button');
    gotoBtn.className = 'pin-action-btn';
    gotoBtn.textContent = 'Go To';
    gotoBtn.addEventListener('click', () => {
      if (currentDim !== pin.dim) {
        if (dimensionSelect) {
          dimensionSelect.value = String(pin.dim);
          syncSettings(true);
        }
      }
      camera.x = pin.x;
      camera.z = pin.z;
      targetPin = { x: pin.x, z: pin.z, active: true, dim: pin.dim };
      const gx = document.getElementById('gotoX');
      const gz = document.getElementById('gotoZ');
      if (gx) gx.value = pin.x;
      if (gz) gz.value = pin.z;
      coordsDisplay.textContent = `X: ${pin.x} | Z: ${pin.z}`;
      requestRender();
      scheduleTileGeneration(true);
    });

    const copyBtn = document.createElement('button');
    copyBtn.className = 'pin-action-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.addEventListener('click', () => {
      const yVal = pin.y != null ? pin.y : '~';
      const text = `/tp @s ${pin.x} ${yVal} ${pin.z}`;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          copyBtn.textContent = 'Copied!';
          setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
        });
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'pin-action-btn pin-delete-btn';
    deleteBtn.textContent = 'Delete 🗑';
    deleteBtn.addEventListener('click', () => {
      customPins = customPins.filter(p => p.id !== pin.id);
      saveCustomPins();
      updatePinsUI();
      requestRender();
    });

    actions.appendChild(gotoBtn);
    actions.appendChild(copyBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(header);
    card.appendChild(coords);
    card.appendChild(actions);

    pinsList.appendChild(card);
  });
}

function openPinsPanel() {
  if (featuresPanel) featuresPanel.classList.remove('open');
  if (pinsPanel) {
    pinsPanel.classList.add('open');
    updatePinsUI();
    if (pinNameInput) pinNameInput.focus();
  }
}

function closePinsPanel() {
  if (pinsPanel) pinsPanel.classList.remove('open');
}

if (pinsToggleBtn && pinsPanel) {
  pinsToggleBtn.addEventListener('click', () => {
    if (pinsPanel.classList.contains('open')) {
      closePinsPanel();
    } else {
      openPinsPanel();
    }
  });
}

if (pinsCloseBtn) {
  pinsCloseBtn.addEventListener('click', closePinsPanel);
}

if (addPinBtn) {
  addPinBtn.addEventListener('click', () => {
    const gx = document.getElementById('gotoX')?.value.trim();
    const gz = document.getElementById('gotoZ')?.value.trim();

    const posX = gx ? parseInt(gx, 10) : Math.round(camera.x);
    const posZ = gz ? parseInt(gz, 10) : Math.round(camera.z);

    if (pinXInput) pinXInput.value = isNaN(posX) ? 0 : posX;
    if (pinZInput) pinZInput.value = isNaN(posZ) ? 0 : posZ;
    if (pinYInput) pinYInput.value = '';

    openPinsPanel();
  });
}

if (savePinBtn) {
  savePinBtn.addEventListener('click', () => {
    const name = (pinNameInput?.value || '').trim() || 'Pin';
    const xVal = parseInt(pinXInput?.value, 10);
    const zVal = parseInt(pinZInput?.value, 10);
    const yText = (pinYInput?.value || '').trim();
    const yVal = yText ? parseInt(yText, 10) : null;

    if (isNaN(xVal) || isNaN(zVal)) {
      alert('Please enter valid numeric coordinates for X and Z.');
      return;
    }

    const newPin = {
      id: 'pin_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      seed: String(currentSeed),
      name,
      x: xVal,
      y: isNaN(yVal) ? null : yVal,
      z: zVal,
      dim: currentDim,
      color: selectedPinColor || '#ff4757',
      createdAt: Date.now()
    };

    customPins.push(newPin);
    saveCustomPins();
    updatePinsUI();
    if (pinNameInput) pinNameInput.value = '';

    requestRender();
  });
}

// ==========================================
// Find Closest Tool (Biome, Feature, Saved Place)
// ==========================================
const findToggleBtn = document.getElementById('findToggleBtn');
const findDropdown = document.getElementById('findDropdown');
const findCloseBtn = document.getElementById('findCloseBtn');
const findOriginX = document.getElementById('findOriginX');
const findOriginZ = document.getElementById('findOriginZ');
const findUseCurrentBtn = document.getElementById('findUseCurrentBtn');
const findUseSpawnBtn = document.getElementById('findUseSpawnBtn');
const findTabs = document.querySelectorAll('.find-tab-btn');
const findSearchInput = document.getElementById('findSearchInput');
const findClearSearchBtn = document.getElementById('findClearSearchBtn');
const findList = document.getElementById('findList');
const findLoading = document.getElementById('findLoading');
const findLoadingText = document.getElementById('findLoadingText');
const findResultCard = document.getElementById('findResultCard');
const findResultIcon = document.getElementById('findResultIcon');
const findResultTitle = document.getElementById('findResultTitle');
const findResultCoords = document.getElementById('findResultCoords');
const findResultMeta = document.getElementById('findResultMeta');
const findAwayWeGoBtn = document.getElementById('findAwayWeGoBtn');
const findCopyTpBtn = document.getElementById('findCopyTpBtn');
const findBackBtn = document.getElementById('findBackBtn');

let currentFindTab = 'biomes'; // 'biomes' | 'features' | 'pins'
let currentFindSearch = '';
let activeFindResult = null;

function getCardinalDirection(dx, dz) {
  const dist = Math.hypot(dx, dz);
  if (dist < 8) return 'Right here';
  const deg = (Math.atan2(dz, dx) * 180 / Math.PI + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return 'East ➡️';
  if (deg >= 22.5 && deg < 67.5) return 'Southeast ↘️';
  if (deg >= 67.5 && deg < 112.5) return 'South ⬇️';
  if (deg >= 112.5 && deg < 157.5) return 'Southwest ↙️';
  if (deg >= 157.5 && deg < 202.5) return 'West ⬅️';
  if (deg >= 202.5 && deg < 247.5) return 'Northwest ↖️';
  if (deg >= 247.5 && deg < 292.5) return 'North ⬆️';
  return 'Northeast ↗️';
}

function updateFindOriginInputs(useCenter = true) {
  if (useCenter) {
    if (findOriginX) findOriginX.value = Math.round(camera.x);
    if (findOriginZ) findOriginZ.value = Math.round(camera.z);
  } else {
    if (findOriginX) findOriginX.value = 0;
    if (findOriginZ) findOriginZ.value = 0;
  }
}

function getFindOrigin() {
  let ox = parseInt(findOriginX?.value, 10);
  let oz = parseInt(findOriginZ?.value, 10);
  if (isNaN(ox)) ox = Math.round(camera.x);
  if (isNaN(oz)) oz = Math.round(camera.z);
  return { x: ox, z: oz };
}

function renderFindList() {
  if (!findList) return;
  findList.innerHTML = '';
  findResultCard?.classList.add('hidden');
  findLoading?.classList.add('hidden');
  findList.classList.remove('hidden');

  const query = (currentFindSearch || '').trim().toLowerCase();

  if (currentFindTab === 'biomes') {
    const biomes = getDimensionBiomesList(currentDim);
    const filtered = biomes.filter(b => !query || b.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      findList.innerHTML = `<div class="find-empty">No biomes found matching "${currentFindSearch}"</div>`;
      return;
    }

    filtered.forEach(b => {
      const item = document.createElement('div');
      item.className = 'find-item';

      const swatch = document.createElement('span');
      swatch.className = 'find-item-swatch';
      swatch.style.backgroundColor = getBiomeCssColor(b.id);

      const nameSpan = document.createElement('span');
      nameSpan.className = 'find-item-name';
      nameSpan.textContent = b.name;

      const arrow = document.createElement('span');
      arrow.className = 'find-item-arrow';
      arrow.textContent = 'Find →';

      item.appendChild(swatch);
      item.appendChild(nameSpan);
      item.appendChild(arrow);

      item.addEventListener('click', () => {
        executeFindBiome(b);
      });

      findList.appendChild(item);
    });
  } else if (currentFindTab === 'features') {
    const dimStr = String(currentDim);
    const defs = STRUCTURE_DEFS[dimStr] || [];
    const filtered = defs.filter(d => !query || d.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      findList.innerHTML = `<div class="find-empty">No features found matching "${currentFindSearch}"</div>`;
      return;
    }

    filtered.forEach(d => {
      const item = document.createElement('div');
      item.className = 'find-item';

      const icon = document.createElement('div');
      icon.className = 'find-item-icon';
      const pos = PANEL_SPRITES[d.icon];
      if (pos) {
        icon.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
      }

      const nameSpan = document.createElement('span');
      nameSpan.className = 'find-item-name';
      nameSpan.textContent = d.name;

      const arrow = document.createElement('span');
      arrow.className = 'find-item-arrow';
      arrow.textContent = 'Find →';

      item.appendChild(icon);
      item.appendChild(nameSpan);
      item.appendChild(arrow);

      item.addEventListener('click', () => {
        executeFindFeature(d);
      });

      findList.appendChild(item);
    });
  } else if (currentFindTab === 'pins') {
    const origin = getFindOrigin();
    const dimPins = customPins.filter(p => p.dim === currentDim);

    // Sort pins ascending by distance from the 'From Coordinates' origin
    dimPins.sort((a, b) => {
      const da = Math.hypot(a.x - origin.x, a.z - origin.z);
      const db = Math.hypot(b.x - origin.x, b.z - origin.z);
      return da - db;
    });

    const filtered = dimPins.filter(p => !query || p.name.toLowerCase().includes(query));

    if (filtered.length === 0) {
      if (dimPins.length === 0) {
        findList.innerHTML = `<div class="find-empty">No saved pins in this dimension.<br>Use "+ Pin" on the toolbar to save custom pins!</div>`;
      } else {
        findList.innerHTML = `<div class="find-empty">No saved places found matching "${currentFindSearch}"</div>`;
      }
      return;
    }

    filtered.forEach(p => {
      const dist = Math.round(Math.hypot(p.x - origin.x, p.z - origin.z));
      const dir = getCardinalDirection(p.x - origin.x, p.z - origin.z);

      const item = document.createElement('div');
      item.className = 'find-item';

      const dot = document.createElement('span');
      dot.className = 'find-item-swatch';
      dot.style.borderRadius = '50%';
      dot.style.backgroundColor = p.color || '#ff4757';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'find-item-name';
      const yStr = p.y != null ? `, Y: ${p.y}` : '';
      nameSpan.innerHTML = `<strong>${p.name}</strong> <span style="font-size:11px; color:#888;">(X: ${p.x}${yStr}, Z: ${p.z})</span>`;

      const distBadge = document.createElement('span');
      distBadge.className = 'find-item-dist';
      distBadge.style.fontSize = '11px';
      distBadge.style.color = '#ffc83b';
      distBadge.style.marginRight = '8px';
      distBadge.style.whiteSpace = 'nowrap';
      distBadge.textContent = `${dist.toLocaleString()} blks ${dir}`;

      const arrow = document.createElement('span');
      arrow.className = 'find-item-arrow';
      arrow.textContent = 'Go →';

      item.appendChild(dot);
      item.appendChild(nameSpan);
      item.appendChild(distBadge);
      item.appendChild(arrow);

      item.addEventListener('click', () => {
        executeFindPin(p);
      });

      findList.appendChild(item);
    });
  }
}

async function executeFindBiome(biomeDef) {
  const origin = getFindOrigin();
  findList.classList.add('hidden');
  findLoading.classList.remove('hidden');
  if (findLoadingText) findLoadingText.textContent = `Searching for closest ${biomeDef.name}...`;

  await new Promise(r => setTimeout(r, 20));

  const result = findClosestBiome({
    targetBiomeId: biomeDef.id,
    fromX: origin.x,
    fromZ: origin.z,
    selectedY,
    cubiomesModule,
    sharedBufferPtr
  });

  findLoading.classList.add('hidden');

  if (!result) {
    alert(`Could not locate a ${biomeDef.name} within 28,000 blocks.`);
    findList.classList.remove('hidden');
    return;
  }

  showFindResult({
    title: biomeDef.name,
    iconColor: getBiomeCssColor(biomeDef.id),
    x: result.x,
    z: result.z,
    distance: result.distance,
    fromX: origin.x,
    fromZ: origin.z
  });
}

async function executeFindFeature(featureDef) {
  const origin = getFindOrigin();
  findList.classList.add('hidden');
  findLoading.classList.remove('hidden');
  if (findLoadingText) findLoadingText.textContent = `Searching for closest ${featureDef.name}...`;

  await new Promise(r => setTimeout(r, 20));

  const result = await findClosestFeature({
    seed: currentSeed,
    version: selectedVersion,
    dimension: currentDim,
    featureId: featureDef.id,
    fromX: origin.x,
    fromZ: origin.z
  });

  findLoading.classList.add('hidden');

  if (!result) {
    alert(`Could not locate a ${featureDef.name} within 25,000 blocks.`);
    findList.classList.remove('hidden');
    return;
  }

  showFindResult({
    title: featureDef.name,
    iconSprite: featureDef.icon,
    x: result.x,
    z: result.z,
    distance: result.distance,
    fromX: origin.x,
    fromZ: origin.z
  });
}

function executeFindPin(pinDef) {
  const origin = getFindOrigin();
  const dx = pinDef.x - origin.x;
  const dz = pinDef.z - origin.z;
  const dist = Math.round(Math.hypot(dx, dz));

  showFindResult({
    title: pinDef.name,
    iconColor: pinDef.color || '#ff4757',
    x: pinDef.x,
    y: pinDef.y,
    z: pinDef.z,
    distance: dist,
    fromX: origin.x,
    fromZ: origin.z
  });
}

function showFindResult({ title, iconColor, iconSprite, x, y, z, distance, fromX, fromZ }) {
  activeFindResult = { title, x, y, z, distance };

  if (findResultTitle) findResultTitle.textContent = title;
  if (findResultIcon) {
    if (iconColor) {
      findResultIcon.textContent = '●';
      findResultIcon.style.color = iconColor;
      findResultIcon.style.backgroundImage = 'none';
      findResultIcon.style.width = 'auto';
      findResultIcon.style.height = 'auto';
    } else if (iconSprite) {
      findResultIcon.textContent = '';
      findResultIcon.style.display = 'inline-block';
      findResultIcon.style.width = '20px';
      findResultIcon.style.height = '20px';
      findResultIcon.style.backgroundImage = "url('/chunk-finders-tn.webp')";
      const pos = PANEL_SPRITES[iconSprite];
      if (pos) {
        findResultIcon.style.backgroundPosition = `-${pos.x}px -${pos.y}px`;
      }
    }
  }

  const yPart = y != null ? ` | Y: ${y}` : '';
  if (findResultCoords) findResultCoords.textContent = `X: ${x}${yPart} | Z: ${z}`;

  const dx = x - fromX;
  const dz = z - fromZ;
  const dir = getCardinalDirection(dx, dz);
  if (findResultMeta) {
    findResultMeta.textContent = `${distance.toLocaleString()} blocks ${dir} from (X: ${fromX}, Z: ${fromZ})`;
  }

  findList?.classList.add('hidden');
  findResultCard?.classList.remove('hidden');
}

if (findAwayWeGoBtn) {
  findAwayWeGoBtn.addEventListener('click', async () => {
    if (!activeFindResult) return;
    const { x, z } = activeFindResult;

    // Set target pin
    targetPin = { x, z };
    const gx = document.getElementById('gotoX');
    const gz = document.getElementById('gotoZ');
    if (gx) gx.value = x;
    if (gz) gz.value = z;

    // Close find dropdown
    findDropdown?.classList.add('hidden');

    // Smoothly glide camera
    await glideCameraTo(x, z, 700);

    coordsDisplay.textContent = `X: ${x} | Z: ${z}`;
    biomeTag.textContent = getBiomeAt(x, z);
    requestRender();
    scheduleTileGeneration(true);
    triggerStructureLoad(true);
  });
}

if (findCopyTpBtn) {
  findCopyTpBtn.addEventListener('click', async () => {
    if (!activeFindResult) return;
    const yStr = activeFindResult.y != null ? activeFindResult.y : '~';
    const text = `/tp @s ${activeFindResult.x} ${yStr} ${activeFindResult.z}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      }
    } catch (_) {}
    if (copyToast) {
      copyToast.textContent = 'Command copied: ' + text;
      copyToast.classList.remove('hidden');
      setTimeout(() => {
        if (copyToast) copyToast.classList.add('hidden');
      }, 1800);
    }
  });
}

if (findBackBtn) {
  findBackBtn.addEventListener('click', () => {
    findResultCard?.classList.add('hidden');
    findList?.classList.remove('hidden');
  });
}

if (findToggleBtn && findDropdown) {
  findToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isHidden = findDropdown.classList.contains('hidden');
    if (isHidden) {
      updateFindOriginInputs(true);
      renderFindList();
      findDropdown.classList.remove('hidden');
      if (featuresPanel) featuresPanel.classList.remove('open');
      if (pinsPanel) pinsPanel.classList.remove('open');
      if (findSearchInput) findSearchInput.focus();
    } else {
      findDropdown.classList.add('hidden');
    }
  });
}

if (findCloseBtn) {
  findCloseBtn.addEventListener('click', () => {
    findDropdown?.classList.add('hidden');
  });
}

if (findUseCurrentBtn) {
  findUseCurrentBtn.addEventListener('click', () => {
    updateFindOriginInputs(true);
    renderFindList();
  });
}

if (findUseSpawnBtn) {
  findUseSpawnBtn.addEventListener('click', () => {
    updateFindOriginInputs(false);
    renderFindList();
  });
}

if (findOriginX) {
  findOriginX.addEventListener('input', () => {
    if (currentFindTab === 'pins') renderFindList();
  });
}

if (findOriginZ) {
  findOriginZ.addEventListener('input', () => {
    if (currentFindTab === 'pins') renderFindList();
  });
}

findTabs.forEach(tabBtn => {
  tabBtn.addEventListener('click', () => {
    findTabs.forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');
    currentFindTab = tabBtn.getAttribute('data-tab') || 'biomes';
    if (findSearchInput) {
      findSearchInput.value = '';
      if (currentFindTab === 'biomes') findSearchInput.placeholder = 'Search biomes (e.g. desert, plains)...';
      else if (currentFindTab === 'features') findSearchInput.placeholder = 'Search features (e.g. village, mansion)...';
      else if (currentFindTab === 'pins') findSearchInput.placeholder = 'Search saved places...';
    }
    currentFindSearch = '';
    findClearSearchBtn?.classList.add('hidden');
    renderFindList();
  });
});

if (findSearchInput) {
  findSearchInput.addEventListener('input', (e) => {
    currentFindSearch = e.target.value;
    if (findClearSearchBtn) {
      if (currentFindSearch) findClearSearchBtn.classList.remove('hidden');
      else findClearSearchBtn.classList.add('hidden');
    }
    renderFindList();
  });
  findSearchInput.addEventListener('click', (e) => e.stopPropagation());
}

if (findClearSearchBtn) {
  findClearSearchBtn.addEventListener('click', () => {
    currentFindSearch = '';
    if (findSearchInput) {
      findSearchInput.value = '';
      findSearchInput.focus();
    }
    findClearSearchBtn.classList.add('hidden');
    renderFindList();
  });
}

document.addEventListener('click', (e) => {
  if (findDropdown && !findDropdown.classList.contains('hidden')) {
    if (!findDropdown.contains(e.target) && !findToggleBtn?.contains(e.target)) {
      findDropdown.classList.add('hidden');
    }
  }
});

loadSeedData(currentSeed);
loadWasm();