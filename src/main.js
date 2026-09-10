import { getBiomeColor, getBiomeName } from './biomes.js';

let cubiomesModule = null;
let sharedBufferPtr = 0;
let currentSeed = -7537587231326715432n;
let currentDim = 0;
let selectedVersion = '1_21';
let selectedY = 320;

// Exact enum indexes directly verified against cubiomes/biomes.h
const VERSION_MAP = {
  '1_21': 28, // MC_1_21 / MC_NEWEST
  '1_20': 25, // MC_1_20_6
  '1_19': 24, // MC_1_19_4
  '1_18': 22  // MC_1_18_2
};

const TILE_PIXELS = 256; 
const BLOCKS_PER_TILE = 1024; 
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

let dpr = window.devicePixelRatio || 1;
let cssWidth = 0;
let cssHeight = 0;

function resizeCanvas() {
  dpr = window.devicePixelRatio || 1;
  cssWidth = canvas.parentElement.clientWidth;
  cssHeight = canvas.parentElement.clientHeight;

  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);

  renderView();
}
window.addEventListener('resize', resizeCanvas);

function setInitial3000BlockView() {
  cssWidth = canvas.parentElement.clientWidth;
  if (!cssWidth) return;
  camera.zoom = (4 * (cssWidth / 2)) / 3000;
  renderView();
}

function getTile(tx, tz) {
  const key = `${tx},${tz},${currentSeed},${currentDim},${selectedVersion},${selectedY}`;
  if (tileCache.has(key)) {
    return tileCache.get(key);
  }

  const offscreen = document.createElement('canvas');
  offscreen.width = TILE_PIXELS;
  offscreen.height = TILE_PIXELS;
  const offCtx = offscreen.getContext('2d');
  const imgData = offCtx.createImageData(TILE_PIXELS, TILE_PIXELS);
  const buf32 = new Uint32Array(imgData.data.buffer);

  if (!cubiomesModule || !sharedBufferPtr) return offscreen;

  const quartX = tx * TILE_PIXELS;
  const quartZ = tz * TILE_PIXELS;

  try {
    cubiomesModule._get_biome_area(sharedBufferPtr, quartX, quartZ, TILE_PIXELS, TILE_PIXELS, 4, selectedY);

    for (let i = 0; i < TILE_PIXELS * TILE_PIXELS; i++) {
      const biomeId = cubiomesModule.getValue(sharedBufferPtr + (i * 4), 'i32');
      buf32[i] = getBiomeColor(biomeId);
    }

    offCtx.putImageData(imgData, 0, 0);

    if (tileCache.size > 1500) {
      const oldestKey = tileCache.keys().next().value;
      tileCache.delete(oldestKey);
    }

    tileCache.set(key, offscreen);
  } catch (err) {
    console.error(`Tile error [${tx}, ${tz}]:`, err);
  }

  return offscreen;
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

  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, cssWidth, cssHeight);
  ctx.imageSmoothingEnabled = camera.zoom < 1.0;

  const halfW = cssWidth / 2;
  const halfH = cssHeight / 2;
  const pxPerBlock = camera.zoom / 4;
  const tileScreenSize = BLOCKS_PER_TILE * pxPerBlock;

  const minBlockX = camera.x - halfW / pxPerBlock;
  const maxBlockX = camera.x + halfW / pxPerBlock;
  const minBlockZ = camera.z - halfH / pxPerBlock;
  const maxBlockZ = camera.z + halfH / pxPerBlock;

  const minTileX = Math.floor(minBlockX / BLOCKS_PER_TILE);
  const maxTileX = Math.ceil(maxBlockX / BLOCKS_PER_TILE);
  const minTileZ = Math.floor(minBlockZ / BLOCKS_PER_TILE);
  const maxTileZ = Math.ceil(maxBlockZ / BLOCKS_PER_TILE);

  const totalTiles = (maxTileX - minTileX + 1) * (maxTileZ - minTileZ + 1);
  if (totalTiles > 800) {
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('Zoomed too far out. Scroll in to view.', halfW - 140, halfH);
    drawRulers(halfW, halfH, pxPerBlock);
    ctx.restore();
    return;
  }

  for (let tx = minTileX; tx <= maxTileX; tx++) {
    for (let tz = minTileZ; tz <= maxTileZ; tz++) {
      const tileCanvas = getTile(tx, tz);
      const blockX = tx * BLOCKS_PER_TILE;
      const blockZ = tz * BLOCKS_PER_TILE;

      const screenX = halfW + (blockX - camera.x) * pxPerBlock;
      const screenY = halfH + (blockZ - camera.z) * pxPerBlock;

      ctx.drawImage(tileCanvas, screenX, screenY, tileScreenSize + 0.5, tileScreenSize + 0.5);
    }
  }

  if (targetPin) {
    drawTargetPin(halfW, halfH, pxPerBlock);
  }

  drawRulers(halfW, halfH, pxPerBlock);
  ctx.restore();
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
  const interval = Math.max(64, power);

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

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  camera.isDragging = true;
  camera.lastMouseX = e.clientX;
  camera.lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  camera.isDragging = false;
});

window.addEventListener('mousemove', (e) => {
  updatePointerInfo(e.clientX, e.clientY);

  if (camera.isDragging) {
    const pxPerBlock = camera.zoom / 4;
    const dx = e.clientX - camera.lastMouseX;
    const dy = e.clientY - camera.lastMouseY;

    camera.x -= dx / pxPerBlock;
    camera.z -= dy / pxPerBlock;

    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;

    renderView();
  }
});

let lastTouchDistance = 0;

canvas.addEventListener('touchstart', (e) => {
  if (e.touches.length === 1) {
    camera.isDragging = true;
    camera.lastMouseX = e.touches[0].clientX;
    camera.lastMouseY = e.touches[0].clientY;
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

    updatePointerInfo(e.touches[0].clientX, e.touches[0].clientY);
    renderView();
  } else if (e.touches.length === 2) {
    const currentDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    );
    const factor = currentDistance / lastTouchDistance;
    camera.zoom = Math.min(Math.max(camera.zoom * factor, 0.02), 4.0);
    lastTouchDistance = currentDistance;
    renderView();
  }
}, { passive: true });

canvas.addEventListener('touchend', () => {
  camera.isDragging = false;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
  const newZoom = Math.min(Math.max(camera.zoom * zoomFactor, 0.02), 4.0);

  if (newZoom !== camera.zoom) {
    camera.zoom = newZoom;
    renderView();
  }
}, { passive: false });

function updateGenerator() {
  if (!cubiomesModule) return;

  tileCache.clear();

  const versionEnum = VERSION_MAP[selectedVersion] || 28;
  const u64Seed = BigInt.asUintN(64, currentSeed);
  const low = Number(u64Seed & 0xffffffffn);
  const high = Number((u64Seed >> 32n) & 0xffffffffn);

  console.log(`Setting generator -> Version: ${versionEnum}, Seed: ${currentSeed}, Dim: ${currentDim}`);

  cubiomesModule.ccall(
    'init_generator_split',
    null,
    ['number', 'number', 'number', 'number', 'number'],
    [versionEnum, low, high, currentDim, 0] // flags = 0 to prevent Large Biomes
  );

  renderView();
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

    resizeCanvas();
    setInitial3000BlockView();
    updateGenerator();
  } catch (err) {
    console.error('Failed to load WASM:', err);
  }
}

document.getElementById('gotoBtn').addEventListener('click', () => {
  const xVal = document.getElementById('gotoX').value.trim();
  const zVal = document.getElementById('gotoZ').value.trim();

  if (xVal === '' || zVal === '') return;
  const targetX = parseInt(xVal, 10);
  const targetZ = parseInt(zVal, 10);
  if (isNaN(targetX) || isNaN(targetZ)) return;

  targetPin = { x: targetX, z: targetZ };
  camera.x = targetX;
  camera.z = targetZ;

  renderView();
});

document.getElementById('clearPinBtn').addEventListener('click', () => {
  targetPin = null;
  document.getElementById('gotoX').value = '';
  document.getElementById('gotoZ').value = '';
  renderView();
});

document.getElementById('renderBtn').addEventListener('click', () => {
  const rawInput = document.getElementById('seedInput').value.trim();
  try {
    currentSeed = BigInt(rawInput);
    currentDim = parseInt(document.getElementById('dimensionSelect').value, 10);
    selectedY = parseInt(document.getElementById('heightSelect').value, 10);
    updateGenerator();
  } catch (e) {
    alert('Invalid numeric seed.');
  }
});

loadWasm();