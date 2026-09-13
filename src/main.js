import { getBiomeColor, getBiomeName, BIOME_COLOR_LUT } from './biomes.js';
import { loadPoiImages, drawPoiMarker, PANEL_SPRITES } from './poi-sprites.js';
import { STRUCTURE_DEFS, getVisibleStructures, ensureStructuresLoaded, initStructureWorker } from './structures.js';

let cubiomesModule = null;
let sharedBufferPtr = 0;
let currentSeed = -7537587231326715432n;
let currentDim = 0;
let selectedVersion = 'be_26_30';
let selectedY = 319;

// Structure & Feature State
const enabledStructures = {
  '-1': new Set((STRUCTURE_DEFS['-1'] || []).filter(d => d.defaultEnabled).map(d => d.id)),
  '0':  new Set((STRUCTURE_DEFS['0'] || []).filter(d => d.defaultEnabled).map(d => d.id)),
  '1':  new Set((STRUCTURE_DEFS['1'] || []).filter(d => d.defaultEnabled).map(d => d.id))
};

const STORAGE_KEY = 'minecraftable_completed_locations';
let completedLocations = new Set();
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    completedLocations = new Set(JSON.parse(saved));
  }
} catch (_) {}

function saveCompletedLocations() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(completedLocations)));
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
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

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
      iconDiv.style.backgroundPosition = `-${spr.x}px -${spr.y}px`;
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
      updateFeaturesBadge();
      renderView();
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
    renderFeaturesPanel();
    renderView();
  });
}

if (deselectAllBtn) {
  deselectAllBtn.addEventListener('click', () => {
    const dimStr = String(currentDim);
    const enabledSet = enabledStructures[dimStr] || new Set();
    enabledSet.clear();
    renderFeaturesPanel();
    renderView();
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

function requestRender() {
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

  requestRender();
  scheduleTileGeneration(true);
}
window.addEventListener('resize', resizeCanvas);

function setInitial3000BlockView() {
  cssWidth = canvas.parentElement.clientWidth;
  if (!cssWidth) return;
  const { minZoom, maxZoom } = getZoomLimits();
  const targetZoom = (4 * cssWidth) / 3000;
  camera.zoom = Math.min(Math.max(targetZoom, minZoom), maxZoom);
  requestRender();
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

    if (heap32) {
      const offset = sharedBufferPtr >> 2;
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = heap32[offset + i];
        buf32[i] = (biomeId >= 0 && biomeId < 256) ? BIOME_COLOR_LUT[biomeId] : 0xff404040;
      }
    } else {
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = cubiomesModule.getValue(sharedBufferPtr + (i * 4), 'i32');
        buf32[i] = (biomeId >= 0 && biomeId < 256) ? BIOME_COLOR_LUT[biomeId] : 0xff404040;
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    tileCache.set(key, {
      canvas: offscreen,
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

    if (heap32) {
      const offset = sharedBufferPtr >> 2;
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = heap32[offset + i];
        buf32[i] = (biomeId >= 0 && biomeId < 256) ? BIOME_COLOR_LUT[biomeId] : 0xff404040;
      }
    } else {
      for (let i = 0; i < totalPixels; i++) {
        const biomeId = cubiomesModule.getValue(sharedBufferPtr + (i * 4), 'i32');
        buf32[i] = (biomeId >= 0 && biomeId < 256) ? BIOME_COLOR_LUT[biomeId] : 0xff404040;
      }
    }

    offCtx.putImageData(imgData, 0, 0);

    if (tileCache.size > 2000) {
      const oldestKey = tileCache.keys().next().value;
      tileCache.delete(oldestKey);
    }

    tileCache.set(key, {
      canvas: offscreen,
      isHiRes: true,
      loadedAt: performance.now()
    });
  } catch (err) {
    console.error(`Hi-res tile error [LOD ${lod}, ${tx}, ${tz}]:`, err);
  }
}

function processTileQueue() {
  if (!cubiomesModule || !sharedBufferPtr) {
    isQueueProcessing = false;
    return;
  }

  if (pendingTiles.length === 0) {
    isQueueProcessing = false;
    return;
  }

  isQueueProcessing = true;
  const startTime = performance.now();

  while (pendingTiles.length > 0) {
    const nextJob = pendingTiles[0];
    if (nextJob.type === 'preview') {
      const job = pendingTiles.shift();
      generatePreviewTile(job.tx, job.tz, job.lodLevel);
      if (performance.now() - startTime >= 16) break;
    } else {
      const job = pendingTiles.shift();
      generateHiResTile(job.tx, job.tz, job.lodLevel);
      if (performance.now() - startTime >= 16) break;
    }
  }

  requestRender();

  if (pendingTiles.length > 0) {
    setTimeout(processTileQueue, 0);
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
    // 150ms debounce after user stops scrolling/dragging
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      collectAndStartTileQueue();
    }, 150);
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

  // 1-tile buffer padding around the viewport for smooth panning
  const BUFFER_TILES = 1;
  const minTileX = Math.floor(minBlockX / activeLOD.blocksPerTile) - BUFFER_TILES;
  const maxTileX = Math.ceil(maxBlockX / activeLOD.blocksPerTile) + BUFFER_TILES;
  const minTileZ = Math.floor(minBlockZ / activeLOD.blocksPerTile) - BUFFER_TILES;
  const maxTileZ = Math.ceil(maxBlockZ / activeLOD.blocksPerTile) + BUFFER_TILES;

  const previewMissing = [];
  const hiresMissing = [];

  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let tz = minTileZ; tz <= maxTileZ; tz++) {
      const key = `${activeLOD.lod},${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
      const entry = tileCache.get(key);
      if (!entry) {
        if (activeLOD.lod === 0) {
          previewMissing.push({ tx, tz, lodLevel: activeLOD, type: 'preview' });
        }
        hiresMissing.push({ tx, tz, lodLevel: activeLOD, type: 'hires' });
      } else if (!entry.isHiRes) {
        hiresMissing.push({ tx, tz, lodLevel: activeLOD, type: 'hires' });
      }
    }
  }

  // Sort missing tiles in concentric square rings (Chebyshev distance)
  // so the entire center fills in first
  const centerTx = camera.x / activeLOD.blocksPerTile;
  const centerTz = camera.z / activeLOD.blocksPerTile;
  const sortFn = (a, b) => {
    const ringA = Math.max(Math.abs(a.tx - centerTx), Math.abs(a.tz - centerTz));
    const ringB = Math.max(Math.abs(b.tx - centerTx), Math.abs(b.tz - centerTz));
    if (Math.abs(ringA - ringB) > 0.001) return ringA - ringB;
    const distA = (a.tx - centerTx) ** 2 + (a.tz - centerTz) ** 2;
    const distB = (b.tx - centerTx) ** 2 + (b.tz - centerTz) ** 2;
    return distA - distB;
  };

  previewMissing.sort(sortFn);
  hiresMissing.sort(sortFn);

  pendingTiles = [...previewMissing, ...hiresMissing];

  if (!isQueueProcessing && pendingTiles.length > 0) {
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

  if (targetPin) {
    drawTargetPin(halfW, halfH, pxPerBlock);
  }

  drawRulers(halfW, halfH, pxPerBlock);
  ctx.restore();
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

  // Zoom threshold: hide all features when zoomed out to extreme overview (below ~0.02 px/block)
  if (pxPerBlock < 0.02) return;

  // Request background structure load via Chunkbase Wasm engine for the visible area
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
      renderView();
    }
  });

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

function updatePointerInfo(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = clientX - rect.left;
  const mouseY = clientY - rect.top;
  const pxPerBlock = camera.zoom / 4;

  const currentBlockX = Math.round(camera.x + (mouseX - cssWidth / 2) / pxPerBlock);
  const currentBlockZ = Math.round(camera.z + (mouseY - cssHeight / 2) / pxPerBlock);

  coordsDisplay.textContent = `X: ${currentBlockX} | Z: ${currentBlockZ}`;
  biomeTag.textContent = getBiomeAt(currentBlockX, currentBlockZ);
}

let mouseDownPos = { x: 0, y: 0 };
let touchStartPos = { x: 0, y: 0 };
let lastTouchX = 0;
let lastTouchY = 0;

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  camera.isDragging = true;
  camera.lastMouseX = e.clientX;
  camera.lastMouseY = e.clientY;
  mouseDownPos = { x: e.clientX, y: e.clientY };
});

canvas.addEventListener('click', (e) => {
  if (e.button !== 0) return;
  const dist = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);
  if (dist > 6) return; // Was a drag, not a click

  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

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
    scheduleTileGeneration(true);
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

    requestRender();
    scheduleTileGeneration(false); // Debounced while dragging
  } else {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    if (mouseX >= 0 && mouseX <= cssWidth && mouseY >= 0 && mouseY <= cssHeight) {
      let hitItem = null;
      let minDist = 16;
      for (const item of currentVisibleMarkers) {
        const d = Math.hypot(mouseX - item.screenX, mouseY - item.screenY);
        if (d <= minDist) {
          minDist = d;
          hitItem = item;
        }
      }

      if (hitItem) {
        canvas.style.cursor = 'pointer';
        if (!hoveredMarker || hoveredMarker.id !== hitItem.marker.id) {
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
    camera.isDragging = true;
    camera.lastMouseX = e.touches[0].clientX;
    camera.lastMouseY = e.touches[0].clientY;
    touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    lastTouchX = e.touches[0].clientX;
    lastTouchY = e.touches[0].clientY;
    updatePointerInfo(e.touches[0].clientX, e.touches[0].clientY);
  } else if (e.touches.length === 2) {
    camera.isDragging = false;
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

    updatePointerInfo(e.touches[0].clientX, e.touches[0].clientY);
    requestRender();
    scheduleTileGeneration(false);
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = currentDistance / lastTouchDistance;
    const { minZoom, maxZoom } = getZoomLimits();
    camera.zoom = Math.min(Math.max(camera.zoom * factor, minZoom), maxZoom);
    lastTouchDistance = currentDistance;
    requestRender();
    scheduleTileGeneration(false);
  }
}, { passive: true });

canvas.addEventListener('touchend', () => {
  if (camera.isDragging) {
    camera.isDragging = false;
    scheduleTileGeneration(true);
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
  const { minZoom, maxZoom } = getZoomLimits();
  const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
  const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, minZoom), maxZoom);

  if (newZoom !== camera.zoom) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const halfW = cssWidth / 2;
    const halfH = cssHeight / 2;
    const oldPxPerBlock = camera.zoom / 4;
    const newPxPerBlock = newZoom / 4;

    const worldX = camera.x + (mouseX - halfW) / oldPxPerBlock;
    const worldZ = camera.z + (mouseY - halfH) / oldPxPerBlock;

    camera.zoom = newZoom;
    camera.x = worldX - (mouseX - halfW) / newPxPerBlock;
    camera.z = worldZ - (mouseY - halfH) / newPxPerBlock;

    requestRender();
    scheduleTileGeneration(false); // Debounced: scales existing view smoothly, renders on scroll finish
  }
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
    const dimChanged = (newDim !== currentDim);
    currentSeed = newSeed;
    currentDim = newDim;
    selectedY = newY;
    selectedVersion = newVer;
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

loadWasm();