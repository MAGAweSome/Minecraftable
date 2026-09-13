function hex(c) {
  const r = (c >> 16) & 0xff;
  const g = (c >> 8) & 0xff;
  const b = c & 0xff;
  return (0xff << 24) | (b << 16) | (g << 8) | r;
}

export const BIOMES = {
  // Overworld Biomes
  0:   { name: "Ocean", color: hex(0x000070) },
  1:   { name: "Plains", color: hex(0x8db360) },
  2:   { name: "Desert", color: hex(0xfa9418) },
  3:   { name: "Windswept Hills", color: hex(0x606060) },
  4:   { name: "Forest", color: hex(0x056621) },
  5:   { name: "Taiga", color: hex(0x0b6a5f) },
  6:   { name: "Swamp", color: hex(0x07f9b2) },
  7:   { name: "River", color: hex(0x0000ff) },

  // Nether & End Core Biomes
  8:   { name: "Nether Wastes", color: hex(0xa84540) }, // Chunkbase authentic: #a84540
  9:   { name: "The End", color: hex(0x8582f6) },        // Chunkbase authentic: #8582f6 (cubiomes: #8080ff)

  // Overworld Biomes continued
  10:  { name: "Frozen Ocean", color: hex(0x7070d6) },
  11:  { name: "Frozen River", color: hex(0xa0a0ff) },
  12:  { name: "Snowy Plains", color: hex(0xffffff) },
  13:  { name: "Snowy Mountains", color: hex(0xa0a0a0) },
  14:  { name: "Mushroom Fields", color: hex(0xff00ff) },
  15:  { name: "Mushroom Fields Shore", color: hex(0xa000ff) },
  16:  { name: "Beach", color: hex(0xfade55) },
  17:  { name: "Desert Hills", color: hex(0xd25f12) },
  18:  { name: "Wooded Hills", color: hex(0x22551c) },
  19:  { name: "Taiga Hills", color: hex(0x163933) },
  20:  { name: "Mountain Edge", color: hex(0x72789a) },
  21:  { name: "Jungle", color: hex(0x507b0a) },
  22:  { name: "Jungle Hills", color: hex(0x2c4205) },
  23:  { name: "Sparse Jungle", color: hex(0x60930f) },
  24:  { name: "Deep Ocean", color: hex(0x000030) },
  25:  { name: "Stony Shore", color: hex(0xa2a284) },
  26:  { name: "Snowy Beach", color: hex(0xfaf0c0) },
  27:  { name: "Birch Forest", color: hex(0x307444) },
  28:  { name: "Birch Forest Hills", color: hex(0x1f5f32) },
  29:  { name: "Dark Forest", color: hex(0x40511a) },
  30:  { name: "Snowy Taiga", color: hex(0x31554a) },
  31:  { name: "Snowy Taiga Hills", color: hex(0x243f36) },
  32:  { name: "Old Growth Pine Taiga", color: hex(0x596651) },
  33:  { name: "Giant Tree Taiga Hills", color: hex(0x454f3e) },
  34:  { name: "Windswept Forest", color: hex(0x5b7352) },
  35:  { name: "Savanna", color: hex(0xbdb25f) },
  36:  { name: "Savanna Plateau", color: hex(0xa79d64) },
  37:  { name: "Badlands", color: hex(0xd94515) },
  38:  { name: "Wooded Badlands", color: hex(0xb09765) },
  39:  { name: "Badlands Plateau", color: hex(0xca8c65) },

  // The End Outer Islands Biomes (1.13+) - Chunkbase authentic colors
  40:  { name: "Small End Islands", color: hex(0x020128) }, // Deep void space of The End
  41:  { name: "End Midlands", color: hex(0xc0bd8f) },      // Warm beige / sand ring
  42:  { name: "End Highlands", color: hex(0x8f9075) },     // Olive / khaki island core
  43:  { name: "End Barrens", color: hex(0xedf7be) },       // Pale lime outer rim

  // Aquatic Oceans (1.13+)
  44:  { name: "Warm Ocean", color: hex(0x0000ac) },
  45:  { name: "Lukewarm Ocean", color: hex(0x000090) },
  46:  { name: "Cold Ocean", color: hex(0x202070) },
  47:  { name: "Deep Warm Ocean", color: hex(0x000050) },
  48:  { name: "Deep Lukewarm Ocean", color: hex(0x000040) },
  49:  { name: "Deep Cold Ocean", color: hex(0x202038) },
  50:  { name: "Deep Frozen Ocean", color: hex(0x404090) },

  // Alpha / Beta legacy
  51:  { name: "Seasonal Forest", color: hex(0x2f560f) },
  52:  { name: "Rainforest", color: hex(0x47840e) },
  53:  { name: "Shrubland", color: hex(0x789e31) },
  127: { name: "The Void", color: hex(0x000000) },

  // Mutated Variants
  129: { name: "Sunflower Plains", color: hex(0xb5db88) },
  130: { name: "Desert Lakes", color: hex(0xffbc40) },
  131: { name: "Windswept Gravelly Hills", color: hex(0x888888) },
  132: { name: "Flower Forest", color: hex(0x2d8e49) },
  133: { name: "Taiga Mountains", color: hex(0x339287) },
  134: { name: "Swamp Hills", color: hex(0x2fffda) },
  140: { name: "Ice Spikes", color: hex(0xb4dcdc) },
  149: { name: "Modified Jungle", color: hex(0x78a332) },
  151: { name: "Modified Jungle Edge", color: hex(0x88bb37) },
  155: { name: "Old Growth Birch Forest", color: hex(0x589c6c) },
  156: { name: "Tall Birch Hills", color: hex(0x47875a) },
  157: { name: "Dark Forest Hills", color: hex(0x687942) },
  158: { name: "Snowy Taiga Mountains", color: hex(0x597d72) },
  160: { name: "Old Growth Spruce Taiga", color: hex(0x818e79) },
  161: { name: "Giant Spruce Taiga Hills", color: hex(0x6d7766) },
  162: { name: "Modified Gravelly Mountains", color: hex(0x839b7a) },
  163: { name: "Windswept Savanna", color: hex(0xe5da87) },
  164: { name: "Shattered Savanna Plateau", color: hex(0xcfc58c) },
  165: { name: "Eroded Badlands", color: hex(0xff6d3d) },
  166: { name: "Modified Wooded Badlands Plateau", color: hex(0xd8bf8d) },
  167: { name: "Modified Badlands Plateau", color: hex(0xf2b48d) },

  // 1.14 Bamboo
  168: { name: "Bamboo Jungle", color: hex(0x849500) },
  169: { name: "Bamboo Jungle Hills", color: hex(0x5c6c04) },

  // 1.16 Nether Biomes - Chunkbase authentic colors
  170: { name: "Soul Sand Valley", color: hex(0x563a32) }, // Chunkbase: #563a32
  171: { name: "Crimson Forest", color: hex(0xc12d21) },   // Chunkbase: #c12d21
  172: { name: "Warped Forest", color: hex(0x618e7c) },    // Chunkbase: #618e7c
  173: { name: "Basalt Deltas", color: hex(0x3d3636) },    // Chunkbase: #3d3636

  // 1.17 Caves
  174: { name: "Dripstone Caves", color: hex(0x4e3012) },
  175: { name: "Lush Caves", color: hex(0x283c00) },

  // 1.18 Mountain & Surface Biomes
  177: { name: "Meadow", color: hex(0x60a445) },
  178: { name: "Grove", color: hex(0x47726c) },
  179: { name: "Snowy Slopes", color: hex(0xc4c4c4) },
  180: { name: "Jagged Peaks", color: hex(0xdcdcc8) },
  181: { name: "Frozen Peaks", color: hex(0xb0b3ce) },
  182: { name: "Stony Peaks", color: hex(0x7b8f74) },

  // 1.19+ Deep Dark & Mangrove
  183: { name: "Deep Dark", color: hex(0x031f29) },
  184: { name: "Mangrove Swamp", color: hex(0x2ccc8e) },

  // 1.20 Cherry Grove
  185: { name: "Cherry Grove", color: hex(0xff91c8) },

  // 1.21 Pale Garden
  186: { name: "Pale Garden", color: hex(0x696d95) },
  187: { name: "Dappled Forest", color: hex(0x9a4439) },
  188: { name: "Sulfur Caves", color: hex(0xd1c932) }
};

export const BIOME_COLOR_LUT = new Uint32Array(256);
const DEFAULT_COLOR = hex(0x404040);
BIOME_COLOR_LUT.fill(DEFAULT_COLOR);
for (const [id, data] of Object.entries(BIOMES)) {
  const numId = Number(id);
  if (numId >= 0 && numId < 256) {
    BIOME_COLOR_LUT[numId] = data.color;
  }
}

// Active Color LUT for real-time biome highlighting
export const ACTIVE_COLOR_LUT = new Uint32Array(256);
ACTIVE_COLOR_LUT.set(BIOME_COLOR_LUT);

export function updateActiveColorLUT(highlightedSet) {
  if (!highlightedSet || highlightedSet.size === 0) {
    ACTIVE_COLOR_LUT.set(BIOME_COLOR_LUT);
    return;
  }

  for (let id = 0; id < 256; id++) {
    const orig = BIOME_COLOR_LUT[id];
    if (highlightedSet.has(id)) {
      ACTIVE_COLOR_LUT[id] = orig;
    } else {
      let r = orig & 0xff;
      let g = (orig >> 8) & 0xff;
      let b = (orig >> 16) & 0xff;

      // For water/ocean biomes where pure blue has little green component,
      // give a subtle cyan balance so the wash renders as crystal ice-blue matching Chunkbase
      if (b > r + 30 && b > g + 20) {
        g = Math.min(255, Math.round(g + (b - g) * 0.35));
      }

      // Chunkbase high-key wash: blend ~74% white and 26% tinted color
      // Everything else becomes almost white so the highlighted biomes stand out sharply
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const adjR = r * 0.85 + gray * 0.15;
      const adjG = g * 0.85 + gray * 0.15;
      const adjB = b * 0.85 + gray * 0.15;

      const whiteMix = 0.74;
      const whitePart = 255 * whiteMix;
      const colorPart = 1 - whiteMix;

      const dimR = Math.min(255, Math.round(adjR * colorPart + whitePart));
      const dimG = Math.min(255, Math.round(adjG * colorPart + whitePart));
      const dimB = Math.min(255, Math.round(adjB * colorPart + whitePart));
      const alpha = 0xff; // Fully opaque
      ACTIVE_COLOR_LUT[id] = (alpha << 24) | (dimB << 16) | (dimG << 8) | dimR;
    }
  }
}

export function getBiomeColor(id) {
  return BIOMES[id] ? BIOMES[id].color : DEFAULT_COLOR;
}

export function getBiomeCssColor(id) {
  const c = getBiomeColor(id);
  const r = c & 0xff;
  const g = (c >> 8) & 0xff;
  const b = (c >> 16) & 0xff;
  return `rgb(${r}, ${g}, ${b})`;
}

export function getBiomeName(id) {
  return BIOMES[id] ? BIOMES[id].name : `Unknown (${id})`;
}

// Grouped biomes by dimension for the Highlight Biomes UI
export const BIOME_GROUPS = {
  // Overworld (0)
  '0': [
    {
      name: "Plains",
      biomes: [
        { id: 1, name: "Plains" },
        { id: 12, name: "Snowy Plains" },
        { id: 14, name: "Mushroom Fields" },
        { id: 35, name: "Savanna" },
        { id: 129, name: "Sunflower Plains" },
        { id: 140, name: "Ice Spikes" }
      ]
    },
    {
      name: "Woodlands",
      biomes: [
        { id: 4, name: "Forest" },
        { id: 27, name: "Birch Forest" },
        { id: 29, name: "Dark Forest" },
        { id: 5, name: "Taiga" },
        { id: 30, name: "Snowy Taiga" },
        { id: 32, name: "Old Growth Pine Taiga" },
        { id: 160, name: "Old Growth Spruce Taiga" },
        { id: 132, name: "Flower Forest" },
        { id: 155, name: "Old Growth Birch Forest" },
        { id: 177, name: "Meadow" },
        { id: 178, name: "Grove" },
        { id: 185, name: "Cherry Grove" },
        { id: 186, name: "Pale Garden" }
      ]
    },
    {
      name: "Mountains",
      biomes: [
        { id: 3, name: "Windswept Hills" },
        { id: 34, name: "Windswept Forest" },
        { id: 131, name: "Windswept Gravelly Hills" },
        { id: 163, name: "Windswept Savanna" },
        { id: 179, name: "Snowy Slopes" },
        { id: 180, name: "Jagged Peaks" },
        { id: 181, name: "Frozen Peaks" },
        { id: 182, name: "Stony Peaks" }
      ]
    },
    {
      name: "Swamps",
      biomes: [
        { id: 6, name: "Swamp" },
        { id: 134, name: "Swamp Hills" },
        { id: 184, name: "Mangrove Swamp" }
      ]
    },
    {
      name: "Sandy & Badlands",
      biomes: [
        { id: 2, name: "Desert" },
        { id: 37, name: "Badlands" },
        { id: 38, name: "Wooded Badlands" },
        { id: 165, name: "Eroded Badlands" },
        { id: 16, name: "Beach" },
        { id: 26, name: "Snowy Beach" },
        { id: 25, name: "Stony Shore" }
      ]
    },
    {
      name: "Jungle",
      biomes: [
        { id: 21, name: "Jungle" },
        { id: 23, name: "Sparse Jungle" },
        { id: 168, name: "Bamboo Jungle" }
      ]
    },
    {
      name: "Water & Oceans",
      biomes: [
        { id: 0, name: "Ocean" },
        { id: 24, name: "Deep Ocean" },
        { id: 44, name: "Warm Ocean" },
        { id: 45, name: "Lukewarm Ocean" },
        { id: 48, name: "Deep Lukewarm Ocean" },
        { id: 46, name: "Cold Ocean" },
        { id: 49, name: "Deep Cold Ocean" },
        { id: 10, name: "Frozen Ocean" },
        { id: 50, name: "Deep Frozen Ocean" },
        { id: 7, name: "River" },
        { id: 11, name: "Frozen River" }
      ]
    },
    {
      name: "Caves & Underground",
      biomes: [
        { id: 174, name: "Dripstone Caves" },
        { id: 175, name: "Lush Caves" },
        { id: 183, name: "Deep Dark" }
      ]
    }
  ],

  // Nether (-1)
  '-1': [
    {
      name: "Nether Biomes",
      biomes: [
        { id: 8, name: "Nether Wastes" },
        { id: 170, name: "Soul Sand Valley" },
        { id: 171, name: "Crimson Forest" },
        { id: 172, name: "Warped Forest" },
        { id: 173, name: "Basalt Deltas" }
      ]
    }
  ],

  // The End (1)
  '1': [
    {
      name: "The End Biomes",
      biomes: [
        { id: 9, name: "The End" },
        { id: 40, name: "Small End Islands" },
        { id: 41, name: "End Midlands" },
        { id: 42, name: "End Highlands" },
        { id: 43, name: "End Barrens" }
      ]
    }
  ]
};

/**
 * Returns a sorted unique list of biomes available in the given dimension.
 */
export function getDimensionBiomesList(dimension) {
  const dimStr = String(dimension);
  const groups = BIOME_GROUPS[dimStr] || [];
  const list = [];
  const seen = new Set();
  for (const grp of groups) {
    for (const b of grp.biomes) {
      if (!seen.has(b.id)) {
        seen.add(b.id);
        const def = BIOMES[b.id];
        list.push({
          id: b.id,
          name: b.name,
          color: def ? def.color : 0xffffffff
        });
      }
    }
  }
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Refines a candidate biome coordinate to the exact closest boundary block using native 4-block Minecraft quart scale.
 */
function refineToClosestBiome(cand, targetBiomeId, fromX, fromZ, selectedY, cubiomesModule, scale = 16) {
  if (!cand || !cubiomesModule) return cand;

  let actualBest = null;
  let actualMinD = Infinity;

  // Search radius covers the coarse sample grid step
  const searchRadius = Math.min(128, Math.max(32, scale * 2));

  // Phase 1: if coarse scale was large (>= 32), take 8-block intermediate steps
  if (scale >= 32) {
    for (let dx = -searchRadius; dx <= searchRadius; dx += 8) {
      for (let dz = -searchRadius; dz <= searchRadius; dz += 8) {
        const bx = cand.x + dx;
        const bz = cand.z + dz;
        const bid = cubiomesModule.ccall('get_single_biome', 'number', ['number', 'number', 'number'], [bx, bz, selectedY]);
        if (bid === targetBiomeId) {
          const d = Math.hypot(bx - fromX, bz - fromZ);
          if (d < actualMinD) {
            actualMinD = d;
            actualBest = { x: bx, z: bz, distance: Math.round(d) };
          }
        }
      }
    }
  }

  // Phase 2: fine 4-block steps (native Minecraft quart scale) around the best candidate or cand
  const center = actualBest || cand;
  const fineRadius = Math.min(48, Math.max(24, scale));
  for (let dx = -fineRadius; dx <= fineRadius; dx += 4) {
    for (let dz = -fineRadius; dz <= fineRadius; dz += 4) {
      const bx = center.x + dx;
      const bz = center.z + dz;
      const bid = cubiomesModule.ccall('get_single_biome', 'number', ['number', 'number', 'number'], [bx, bz, selectedY]);
      if (bid === targetBiomeId) {
        const d = Math.hypot(bx - fromX, bz - fromZ);
        if (d < actualMinD) {
          actualMinD = d;
          actualBest = { x: bx, z: bz, distance: Math.round(d) };
        }
      }
    }
  }

  return actualBest || cand;
}

/**
 * Rapidly and accurately finds the closest point to targetBiomeId from (fromX, fromZ) using Cubiomes WASM.
 * Uses a multi-stage concentric hierarchical search:
 * - Stage 1: Scale 16, centered at (fromX, fromZ) covering 4,096 x 4,096 blocks (inscribed radius 2,048 blocks).
 *            Detects micro-patches (e.g. Cherry Grove, Pale Garden) without skipping.
 * - Stage 2: Scale 32, ring of 8 surrounding boxes covering 12,288 x 12,288 blocks (inscribed radius 6,144 blocks).
 * - Stage 3: Scale 64, ring of 16 outer boxes covering up to 24,000 blocks radius.
 * - Stage 4: Scale 128, ring of 24 boxes covering up to 48,000 blocks radius.
 * - Refinement: Pinpoints the exact closest edge using 4-block native Minecraft quart resolution.
 */
export function findClosestBiome({
  targetBiomeId,
  fromX,
  fromZ,
  selectedY = 319,
  cubiomesModule,
  sharedBufferPtr
}) {
  if (!cubiomesModule || !sharedBufferPtr) return null;

  // 1. Direct origin test
  try {
    const originBiome = cubiomesModule.ccall(
      'get_single_biome',
      'number',
      ['number', 'number', 'number'],
      [fromX, fromZ, selectedY]
    );
    if (originBiome === targetBiomeId) {
      return { x: fromX, z: fromZ, distance: 0 };
    }
  } catch (_) {}

  const heap32 = cubiomesModule.HEAP32;
  const offset = sharedBufferPtr >> 2;

  let bestCand = null;
  let minCandDist = Infinity;
  let bestScale = 16;

  // -----------------------------------------------------------------
  // Stage 1: Near-Field High Precision (0 to 2,048 blocks radius)
  // 256x256 samples at scale = 16 (4,096 x 4,096 blocks centered at fromX, fromZ)
  // Inscribed circle radius = 2,048 blocks
  // -----------------------------------------------------------------
  {
    const W = 256;
    const H = 256;
    const scale = 16;
    const halfSpan = (W / 2) * scale; // 2048 blocks
    const rX = Math.round((fromX - halfSpan) / scale);
    const rZ = Math.round((fromZ - halfSpan) / scale);

    try {
      cubiomesModule._get_biome_area(sharedBufferPtr, rX, rZ, W, H, scale, selectedY);

      for (let row = 0; row < H; row++) {
        const rowOffset = offset + row * W;
        for (let col = 0; col < W; col++) {
          const bId = heap32 ? heap32[rowOffset + col] : cubiomesModule.getValue(sharedBufferPtr + (row * W + col) * 4, 'i32');
          if (bId === targetBiomeId) {
            const bx = (rX + col) * scale;
            const bz = (rZ + row) * scale;
            const d = Math.hypot(bx - fromX, bz - fromZ);
            if (d < minCandDist) {
              minCandDist = d;
              bestCand = { x: bx, z: bz, distance: Math.round(d) };
              bestScale = scale;
            }
          }
        }
      }
    } catch (_) {}

    // If candidate found within the fully-searched 2,048-block inscribed circle,
    // no closer point can exist anywhere in the world!
    if (bestCand && bestCand.distance <= 2048) {
      return refineToClosestBiome(bestCand, targetBiomeId, fromX, fromZ, selectedY, cubiomesModule, bestScale);
    }
  }

  // -----------------------------------------------------------------
  // Stage 2: Mid-Range (2,048 to 6,144 blocks radius)
  // Ring of 8 surrounding boxes at scale = 32 (128x128 samples = 4,096 x 4,096 blocks each)
  // Covers 12,288 x 12,288 blocks centered at fromX, fromZ (inscribed radius 6,144 blocks)
  // -----------------------------------------------------------------
  {
    const W = 128;
    const H = 128;
    const scale = 32;
    const boxSize = W * scale; // 4096 blocks
    const ring1 = [
      [-1, -1], [0, -1], [1, -1],
      [-1,  0],          [1,  0],
      [-1,  1], [0,  1], [1,  1]
    ];

    for (const [gx, gz] of ring1) {
      const boxCenterX = fromX + gx * boxSize;
      const boxCenterZ = fromZ + gz * boxSize;
      const rX = Math.round((boxCenterX - boxSize / 2) / scale);
      const rZ = Math.round((boxCenterZ - boxSize / 2) / scale);

      try {
        cubiomesModule._get_biome_area(sharedBufferPtr, rX, rZ, W, H, scale, selectedY);

        for (let row = 0; row < H; row++) {
          const rowOffset = offset + row * W;
          for (let col = 0; col < W; col++) {
            const bId = heap32 ? heap32[rowOffset + col] : cubiomesModule.getValue(sharedBufferPtr + (row * W + col) * 4, 'i32');
            if (bId === targetBiomeId) {
              const bx = (rX + col) * scale;
              const bz = (rZ + row) * scale;
              const d = Math.hypot(bx - fromX, bz - fromZ);
              if (d < minCandDist) {
                minCandDist = d;
                bestCand = { x: bx, z: bz, distance: Math.round(d) };
                bestScale = scale;
              }
            }
          }
        }
      } catch (_) {}
    }

    if (bestCand && bestCand.distance <= 6144) {
      return refineToClosestBiome(bestCand, targetBiomeId, fromX, fromZ, selectedY, cubiomesModule, bestScale);
    }
  }

  // -----------------------------------------------------------------
  // Stage 3: Far-Range (6,144 to 20,480 blocks radius)
  // Ring of 16 outer boxes at scale = 64 (128x128 samples = 8,192 x 8,192 blocks each)
  // Inscribed radius = 20,480 blocks
  // -----------------------------------------------------------------
  {
    const W = 128;
    const H = 128;
    const scale = 64;
    const boxSize = W * scale; // 8192 blocks
    const ring2 = [
      [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
      [-2, -1],                             [2, -1],
      [-2,  0],                             [2,  0],
      [-2,  1],                             [2,  1],
      [-2,  2], [-1,  2], [0,  2], [1,  2], [2,  2]
    ];

    for (const [gx, gz] of ring2) {
      const boxCenterX = fromX + gx * boxSize;
      const boxCenterZ = fromZ + gz * boxSize;
      const rX = Math.round((boxCenterX - boxSize / 2) / scale);
      const rZ = Math.round((boxCenterZ - boxSize / 2) / scale);

      try {
        cubiomesModule._get_biome_area(sharedBufferPtr, rX, rZ, W, H, scale, selectedY);

        for (let row = 0; row < H; row++) {
          const rowOffset = offset + row * W;
          for (let col = 0; col < W; col++) {
            const bId = heap32 ? heap32[rowOffset + col] : cubiomesModule.getValue(sharedBufferPtr + (row * W + col) * 4, 'i32');
            if (bId === targetBiomeId) {
              const bx = (rX + col) * scale;
              const bz = (rZ + row) * scale;
              const d = Math.hypot(bx - fromX, bz - fromZ);
              if (d < minCandDist) {
                minCandDist = d;
                bestCand = { x: bx, z: bz, distance: Math.round(d) };
                bestScale = scale;
              }
            }
          }
        }
      } catch (_) {}
    }

    if (bestCand && bestCand.distance <= 20480) {
      return refineToClosestBiome(bestCand, targetBiomeId, fromX, fromZ, selectedY, cubiomesModule, bestScale);
    }
  }

  // -----------------------------------------------------------------
  // Stage 4: Extreme-Range (up to 48,000 blocks)
  // Ring of 24 boxes at scale = 128 (128x128 samples = 16,384 x 16,384 blocks each)
  // -----------------------------------------------------------------
  {
    const W = 128;
    const H = 128;
    const scale = 128;
    const boxSize = W * scale; // 16,384 blocks
    const ring3 = [
      [-2, -2], [-1, -2], [0, -2], [1, -2], [2, -2],
      [-2, -1],                             [2, -1],
      [-2,  0],                             [2,  0],
      [-2,  1],                             [2,  1],
      [-2,  2], [-1,  2], [0,  2], [1,  2], [2,  2]
    ];

    for (const [gx, gz] of ring3) {
      const boxCenterX = fromX + gx * boxSize;
      const boxCenterZ = fromZ + gz * boxSize;
      const rX = Math.round((boxCenterX - boxSize / 2) / scale);
      const rZ = Math.round((boxCenterZ - boxSize / 2) / scale);

      try {
        cubiomesModule._get_biome_area(sharedBufferPtr, rX, rZ, W, H, scale, selectedY);

        for (let row = 0; row < H; row++) {
          const rowOffset = offset + row * W;
          for (let col = 0; col < W; col++) {
            const bId = heap32 ? heap32[rowOffset + col] : cubiomesModule.getValue(sharedBufferPtr + (row * W + col) * 4, 'i32');
            if (bId === targetBiomeId) {
              const bx = (rX + col) * scale;
              const bz = (rZ + row) * scale;
              const d = Math.hypot(bx - fromX, bz - fromZ);
              if (d < minCandDist) {
                minCandDist = d;
                bestCand = { x: bx, z: bz, distance: Math.round(d) };
                bestScale = scale;
              }
            }
          }
        }
      } catch (_) {}
    }
  }

  if (bestCand) {
    return refineToClosestBiome(bestCand, targetBiomeId, fromX, fromZ, selectedY, cubiomesModule, bestScale);
  }

  return null;
}