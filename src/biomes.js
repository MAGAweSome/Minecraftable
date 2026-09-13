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

export function getBiomeColor(id) {
  return BIOMES[id] ? BIOMES[id].color : DEFAULT_COLOR;
}

export function getBiomeName(id) {
  return BIOMES[id] ? BIOMES[id].name : `Unknown (${id})`;
}