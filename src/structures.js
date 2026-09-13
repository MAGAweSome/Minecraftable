// Minecraft structure finder powered by Chunkbase Wasm engine
// Guarantees 1:1 identical structure coordinates, piece rotations, and variant detection across all editions.
import { getPoiSpriteKey } from './poi-sprites.js';

// Structure Definitions by Dimension (matching Chunkbase order and icons)
export const STRUCTURE_DEFS = {
  // Nether (-1)
  '-1': [
    { id: 'nether_fortress', name: 'Nether Fortress', icon: 'nether-fortress', defaultEnabled: true },
    { id: 'bastion_housing', name: 'Bastion (Housing)', icon: 'bastion-units', defaultEnabled: true },
    { id: 'bastion_stables', name: 'Bastion (Stables)', icon: 'bastion-stables', defaultEnabled: true },
    { id: 'bastion_treasure', name: 'Bastion (Treasure)', icon: 'bastion-treasure', defaultEnabled: true },
    { id: 'bastion_bridge', name: 'Bastion (Bridge)', icon: 'bastion-bridge', defaultEnabled: true },
    { id: 'ruined_portal_nether', name: 'Ruined Portal', icon: 'ruined-portal', defaultEnabled: true },
    { id: 'nether_fossil', name: 'Nether Fossil', icon: 'fossil', defaultEnabled: false }
  ],
  // The End (1)
  '1': [
    { id: 'end_city', name: 'End City', icon: 'end-city', defaultEnabled: true },
    { id: 'end_city_ship', name: 'End City (with Ship)', icon: 'end-city-ship', defaultEnabled: true },
    { id: 'end_gateway', name: 'End Gateway', icon: 'end-gateway', defaultEnabled: false }
  ],
  // Overworld (0) - Exactly 28 features matching Chunkbase
  '0': [
    { id: 'spawn', name: 'Spawn Point', icon: 'spawn', defaultEnabled: true },
    { id: 'slime', name: 'Slime Chunk', icon: 'slime', defaultEnabled: false },
    { id: 'village', name: 'Village', icon: 'village', defaultEnabled: true },
    { id: 'ancient_city', name: 'Ancient City', icon: 'ancient-city', defaultEnabled: true },
    { id: 'dungeon', name: 'Dungeon', icon: 'dungeon', defaultEnabled: false },
    { id: 'stronghold', name: 'Stronghold', icon: 'stronghold', defaultEnabled: true },
    { id: 'mansion', name: 'Woodland Mansion', icon: 'mansion', defaultEnabled: true },
    { id: 'monument', name: 'Ocean Monument', icon: 'ocean-monument', defaultEnabled: true },
    { id: 'outpost', name: 'Pillager Outpost', icon: 'pillager-outpost', defaultEnabled: true },
    { id: 'mineshaft', name: 'Mineshaft', icon: 'mineshaft', defaultEnabled: false },
    { id: 'ruined_portal', name: 'Ruined Portal', icon: 'ruined-portal', defaultEnabled: true },
    { id: 'jungle_temple', name: 'Jungle Temple', icon: 'jungle-temple', defaultEnabled: true },
    { id: 'desert_pyramid', name: 'Desert Temple', icon: 'desert-temple', defaultEnabled: true },
    { id: 'witch_hut', name: 'Witch Hut', icon: 'witch-hut', defaultEnabled: true },
    { id: 'buried_treasure', name: 'Buried Treasure', icon: 'buried-treasure', defaultEnabled: true },
    { id: 'shipwreck', name: 'Shipwreck', icon: 'shipwreck', defaultEnabled: true },
    { id: 'igloo', name: 'Igloo', icon: 'igloo', defaultEnabled: true },
    { id: 'ocean_ruin', name: 'Ocean Ruins', icon: 'ocean-ruin', defaultEnabled: true },
    { id: 'fossil', name: 'Fossil', icon: 'fossil', defaultEnabled: false },
    { id: 'cave', name: 'Cave', icon: 'cave', defaultEnabled: false },
    { id: 'ravine', name: 'Ravine', icon: 'ravine', defaultEnabled: false },
    { id: 'lava_pool', name: 'Lava Pool', icon: 'lava', defaultEnabled: false },
    { id: 'geode', name: 'Amethyst Geode', icon: 'amethyst', defaultEnabled: false },
    { id: 'golden_apple', name: 'Apple', icon: 'golden-apple', defaultEnabled: false },
    { id: 'ore_vein', name: 'Ore Veins', icon: 'ore-vein', defaultEnabled: false },
    { id: 'desert_well', name: 'Desert Well', icon: 'desert-well', defaultEnabled: false },
    { id: 'trail_ruins', name: 'Trail Ruins', icon: 'trail-ruin', defaultEnabled: true },
    { id: 'trial_chambers', name: 'Trial Chamber', icon: 'trial-chamber', defaultEnabled: true }
  ]
};

// Map Minecraftable UI feature IDs to Chunkbase engine keys
const UI_TO_CB_FEATURE = {
  // Overworld
  spawn: 'spawn',
  slime: 'slimeChunk',
  village: 'village',
  ancient_city: 'ancientCity',
  dungeon: 'dungeon',
  stronghold: 'stronghold',
  mansion: 'woodlandMansion',
  monument: 'oceanMonument',
  outpost: 'pillagerOutpost',
  mineshaft: 'mineshaft',
  ruined_portal: 'ruinedPortalOverworld',
  jungle_temple: 'jungleTemple',
  desert_pyramid: 'desertTemple',
  witch_hut: 'witchHut',
  buried_treasure: 'buriedTreasure',
  shipwreck: 'shipwreck',
  igloo: 'igloo',
  ocean_ruin: 'oceanRuin',
  fossil: 'fossil',
  cave: 'cave',
  ravine: 'ravine',
  lava_pool: 'lavaPool',
  geode: 'amethystGeode',
  golden_apple: 'itemOverworld',
  ore_vein: 'oreVein',
  desert_well: 'desertWell',
  trail_ruins: 'trailRuin',
  trial_chambers: 'trialChamber',

  // Nether
  nether_fortress: 'netherFortress',
  bastion_housing: 'bastionRemnant',
  bastion_stables: 'bastionRemnant',
  bastion_treasure: 'bastionRemnant',
  bastion_bridge: 'bastionRemnant',
  ruined_portal_nether: 'ruinedPortalNether',
  nether_fossil: 'fossilNether',

  // End
  end_city: 'endCity',
  end_city_ship: 'endCity',
  end_gateway: 'endGateway'
};

// Map Chunkbase engine key back to UI type
const CB_TO_UI_FEATURE = {};
for (const [uiKey, cbKey] of Object.entries(UI_TO_CB_FEATURE)) {
  CB_TO_UI_FEATURE[cbKey] = uiKey;
}

// Bedrock Version enum mapping
const BEDROCK_VERSIONS = {
  'be_26_50': 265000,
  'be_26_40': 264000,
  'be_26_30': 263000,
  'be_26_0':  263000,
  'be_1_21_120': 102112,
  'be_1_21_110': 102111,
  'be_1_21_90':  102109,
  'be_1_21_80':  102108,
  'be_1_21_70':  102107,
  'be_1_21_60':  102106,
  'be_1_21_50':  102105,
  'be_1_21_40':  102104,
  'be_1_21':     102100,
  'be_1_20_60':  102006,
  'be_1_20':     102000,
  'be_1_19':     101900,
  'be_1_18':     101800,
  'be_1_17':     101700,
  'be_1_16':     101600,
  'be_1_14':     101400
};

// Java Version enum mapping
const JAVA_VERSIONS = {
  'java_26_3': 260300,
  'java_26_2': 260200,
  'java_26_1': 260100,
  'java_1_21_9': 102109,
  'java_1_21_6': 102106,
  'java_1_21_5': 102105,
  'java_1_21_4': 102104,
  'java_1_21_2': 102102,
  'java_1_21':   102100,
  'java_1_20':   102000,
  'java_1_19_4': 101903,
  'java_1_19':   101900,
  'java_1_18':   101800,
  'java_1_17':   101700,
  'java_1_16':   101600,
  'java_1_15':   101500,
  'java_1_14':   101400,
  'java_1_13':   101300,
  'java_1_12':   101200,
  'java_1_11':   101100,
  'java_1_10':   101000,
  'java_1_9':    100900,
  'java_1_8':    100800,
  'java_1_7':    100700
};

export function getChunkbaseWorld(seed, selectedVersion, dimension) {
  const isBedrock = selectedVersion.startsWith('be_');
  const dimName = dimension === -1 ? 'nether' : (dimension === 1 ? 'end' : 'overworld');

  if (isBedrock) {
    const baseKey = selectedVersion.replace('_lb', '');
    const bv = BEDROCK_VERSIONS[baseKey] || 102106;
    return {
      edition: 'Bedrock',
      seed: String(seed),
      bedrockVersion: bv,
      dimension: dimName,
      config: {}
    };
  } else {
    const isLargeBiomes = selectedVersion.endsWith('_lb');
    const baseKey = selectedVersion.replace('_lb', '');
    const jv = JAVA_VERSIONS[baseKey] || 102106;
    return {
      edition: 'Java',
      seed: String(seed),
      javaVersion: jv,
      dimension: dimName,
      config: { largeBiomes: isLargeBiomes }
    };
  }
}

// Convert a Chunkbase raw POI item to our UI marker format
export function parseChunkbasePoi(cbType, item, isBedrock) {
  const [chunkX, chunkZ, extra] = item;
  const uiType = CB_TO_UI_FEATURE[cbType] || cbType;

  if (cbType === 'village') {
    const vType = extra?.type || 'plains';
    const isZombie = !!extra?.zombie;
    const blockX = isBedrock ? (chunkX * 16 + 8) : (chunkX * 16);
    const blockZ = isBedrock ? (chunkZ * 16 + 8) : (chunkZ * 16);
    const title = isZombie ? `Zombie (${vType.charAt(0).toUpperCase() + vType.slice(1)}) Village` : `${vType.charAt(0).toUpperCase() + vType.slice(1)} Village`;
    return {
      id: `village_${blockX}_${blockZ}`,
      type: 'village',
      name: title,
      baseName: 'Village',
      variant: isZombie ? 'zombie' : vType,
      x: blockX,
      y: 64,
      z: blockZ,
      spriteKey: getPoiSpriteKey('village', isZombie ? 'zombie' : vType)
    };
  }

  if (cbType === 'buriedTreasure') {
    const offset = isBedrock ? 8 : 9;
    const bx = chunkX * 16 + offset;
    const bz = chunkZ * 16 + offset;
    return {
      id: `buried_treasure_${bx}_${bz}`,
      type: 'buried_treasure',
      name: 'Buried Treasure',
      baseName: 'Buried Treasure',
      variant: null,
      x: bx,
      y: 50,
      z: bz,
      spriteKey: 'buried-treasure'
    };
  }

  if (cbType === 'mineshaft') {
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `mineshaft_${bx}_${bz}`,
      type: 'mineshaft',
      name: 'Mineshaft',
      baseName: 'Mineshaft',
      variant: null,
      x: bx,
      y: 30,
      z: bz,
      spriteKey: 'mineshaft'
    };
  }

  if (cbType === 'trialChamber') {
    const [x, y, z] = Array.isArray(extra) ? extra : [chunkX * 16 + 8, -20, chunkZ * 16 + 8];
    return {
      id: `trial_chamber_${x}_${z}`,
      type: 'trial_chambers',
      name: 'Trial Chamber',
      baseName: 'Trial Chamber',
      variant: null,
      x,
      y,
      z,
      spriteKey: 'trial-chamber'
    };
  }

  if (cbType === 'ancientCity') {
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `ancient_city_${bx}_${bz}`,
      type: 'ancient_city',
      name: 'Ancient City',
      baseName: 'Ancient City',
      variant: null,
      x: bx,
      y: -51,
      z: bz,
      spriteKey: 'ancient-city'
    };
  }

  if (cbType === 'bastionRemnant') {
    const bType = extra?.type || 'units';
    const names = {
      'units': 'Housing units',
      'hoglin_stable': 'Hoglin stables',
      'treasure': 'Treasure room',
      'bridge': 'Bridges'
    };
    const typeMap = {
      'units': 'bastion_housing',
      'hoglin_stable': 'bastion_stables',
      'treasure': 'bastion_treasure',
      'bridge': 'bastion_bridge'
    };
    const specificType = typeMap[bType] || 'bastion_housing';
    const x = extra?.x ?? (chunkX * 16 + 8);
    const y = extra?.y ?? 33;
    const z = extra?.z ?? (chunkZ * 16 + 8);
    return {
      id: `bastion_${x}_${z}`,
      type: specificType,
      name: `Bastion (${names[bType] || bType})`,
      baseName: 'Bastion Remnant',
      variant: names[bType] || bType,
      x,
      y,
      z,
      spriteKey: getPoiSpriteKey(specificType, bType)
    };
  }

  if (cbType === 'endCity') {
    const hasShip = !!extra?.hasShip;
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `end_city_${bx}_${bz}`,
      type: hasShip ? 'end_city_ship' : 'end_city',
      name: hasShip ? 'End City (with Ship)' : 'End City',
      baseName: 'End City',
      variant: hasShip ? 'ship' : null,
      x: bx,
      y: 60,
      z: bz,
      spriteKey: hasShip ? 'end-city-ship' : 'end-city'
    };
  }

  if (cbType === 'netherFortress') {
    const fx = chunkX * 16 + 11;
    const fz = chunkZ * 16 + 11;
    return {
      id: `fortress_${fx}_${fz}`,
      type: 'nether_fortress',
      name: 'Nether Fortress (Crossing)',
      baseName: 'Nether Fortress',
      variant: null,
      x: fx,
      y: 64,
      z: fz,
      spriteKey: 'nether-fortress'
    };
  }

  if (cbType === 'ruinedPortalOverworld' || cbType === 'ruinedPortalNether') {
    const isGiant = !!extra?.giant;
    const x = extra?.x ?? (chunkX * 16 + 8);
    const y = extra?.y ?? 64;
    const z = extra?.z ?? (chunkZ * 16 + 8);
    return {
      id: `ruined_portal_${x}_${z}`,
      type: cbType === 'ruinedPortalNether' ? 'ruined_portal_nether' : 'ruined_portal',
      name: isGiant ? 'Giant Ruined Portal' : 'Ruined Portal',
      baseName: 'Ruined Portal',
      variant: isGiant ? 'giant' : null,
      x,
      y,
      z,
      spriteKey: isGiant ? 'ruined-portal-giant' : 'ruined-portal'
    };
  }

  if (cbType === 'amethystGeode') {
    if (Array.isArray(extra)) {
      return extra.map(c => {
        const [x, y, z] = Array.isArray(c) ? c : [chunkX * 16 + 8, 30, chunkZ * 16 + 8];
        return {
          id: `geode_${x}_${z}`,
          type: 'geode',
          name: 'Amethyst Geode',
          baseName: 'Amethyst Geode',
          variant: null,
          x,
          y,
          z,
          spriteKey: 'amethyst'
        };
      });
    }
    const coords = [chunkX * 16 + 8, 30, chunkZ * 16 + 8];
    return {
      id: `geode_${coords[0]}_${coords[2]}`,
      type: 'geode',
      name: 'Amethyst Geode',
      baseName: 'Amethyst Geode',
      variant: null,
      x: coords[0],
      y: coords[1],
      z: coords[2],
      spriteKey: 'amethyst'
    };
  }

  if (cbType === 'endGateway') {
    if (Array.isArray(extra)) {
      return extra.map(g => {
        const gx = g.x ?? (chunkX * 16 + 8);
        const gz = g.z ?? (chunkZ * 16 + 8);
        return {
          id: `end_gateway_${gx}_${gz}`,
          type: 'end_gateway',
          name: 'End Gateway',
          baseName: 'End Gateway',
          variant: null,
          x: gx,
          y: 75,
          z: gz,
          spriteKey: 'end-gateway'
        };
      });
    }
    const gx = extra?.x ?? (chunkX * 16 + 8);
    const gz = extra?.z ?? (chunkZ * 16 + 8);
    return {
      id: `end_gateway_${gx}_${gz}`,
      type: 'end_gateway',
      name: 'End Gateway',
      baseName: 'End Gateway',
      variant: null,
      x: gx,
      y: 75,
      z: gz,
      spriteKey: 'end-gateway'
    };
  }

  if (cbType === 'desertWell') {
    const [wx, wy, wz] = Array.isArray(extra) ? extra : [chunkX * 16 + 8, 65, chunkZ * 16 + 8];
    return {
      id: `desert_well_${wx}_${wz}`,
      type: 'desert_well',
      name: 'Desert Well',
      baseName: 'Desert Well',
      variant: null,
      x: wx,
      y: wy,
      z: wz,
      spriteKey: 'desert-well'
    };
  }

  if (cbType === 'trailRuin') {
    const [tx, ty, tz] = Array.isArray(extra) ? extra : [chunkX * 16 + 8, 64, chunkZ * 16 + 8];
    return {
      id: `trail_ruin_${tx}_${tz}`,
      type: 'trail_ruins',
      name: 'Trail Ruins',
      baseName: 'Trail Ruins',
      variant: null,
      x: tx,
      y: ty,
      z: tz,
      spriteKey: 'trail-ruin'
    };
  }

  if (cbType === 'fossilNether') {
    if (Array.isArray(extra)) {
      return extra.map(f => {
        const [fx, fy, fz, opts] = Array.isArray(f) ? f : [chunkX * 16 + 8, 60, chunkZ * 16 + 8, {}];
        const isGhast = !!opts?.hasDriedGhast;
        return {
          id: `fossil_nether_${fx}_${fz}`,
          type: 'nether_fossil',
          name: isGhast ? 'Nether Fossil (Dried Ghast)' : 'Nether Fossil',
          baseName: 'Nether Fossil',
          variant: isGhast ? 'ghast' : null,
          x: fx,
          y: fy,
          z: fz,
          spriteKey: isGhast ? 'fossil-ghast' : 'fossil'
        };
      });
    }
  }

  if (cbType === 'dungeon') {
    if (Array.isArray(extra)) {
      return extra.map(d => {
        const [dx, dy, dz, mobId] = Array.isArray(d) ? d : [chunkX * 16 + 8, 30, chunkZ * 16 + 8, 0];
        const mob = mobId === 0 ? 'zombie' : (mobId === 1 ? 'spider' : 'skeleton');
        return {
          id: `dungeon_${dx}_${dz}`,
          type: 'dungeon',
          name: `${mob.charAt(0).toUpperCase() + mob.slice(1)} Dungeon`,
          baseName: 'Dungeon',
          variant: mob,
          x: dx,
          y: dy,
          z: dz,
          spriteKey: `dungeon-${mob}`
        };
      });
    }
  }

  if (cbType === 'cave') {
    if (Array.isArray(extra)) {
      return extra.map(c => {
        const p = c?.reference?.pos || c?.reference || [chunkX * 16 + 8, 20, chunkZ * 16 + 8];
        return {
          id: `cave_${p[0]}_${p[2]}`,
          type: 'cave',
          name: 'Cave',
          baseName: 'Cave',
          variant: null,
          x: p[0],
          y: p[1] ?? 20,
          z: p[2],
          spriteKey: 'cave'
        };
      });
    }
  }

  if (cbType === 'ravine') {
    if (Array.isArray(extra)) {
      return extra.map(r => {
        const rx = r.x ?? (chunkX * 16 + 8);
        const ry = r.y ?? 20;
        const rz = r.z ?? (chunkZ * 16 + 8);
        const isUw = !!r.isUnderwater;
        return {
          id: `ravine_${rx}_${rz}`,
          type: 'ravine',
          name: isUw ? 'Underwater Ravine' : 'Ravine',
          baseName: 'Ravine',
          variant: isUw ? 'underwater' : null,
          x: rx,
          y: ry,
          z: rz,
          spriteKey: isUw ? 'ravine-underwater' : 'ravine'
        };
      });
    }
  }

  if (cbType === 'lavaPool') {
    if (Array.isArray(extra)) {
      return extra.map(l => {
        const p = l?.pos || [chunkX * 16 + 8, 11, chunkZ * 16 + 8];
        const isCave = l?.type === 'cave';
        return {
          id: `lava_${p[0]}_${p[2]}`,
          type: 'lava_pool',
          name: isCave ? 'Lava Pool (Cave)' : 'Lava Pool',
          baseName: 'Lava Pool',
          variant: isCave ? 'cave' : null,
          x: p[0],
          y: p[1] ?? 11,
          z: p[2],
          spriteKey: isCave ? 'lava-cave' : 'lava'
        };
      });
    }
  }

  if (cbType === 'oreVein') {
    if (Array.isArray(extra)) {
      return extra.map(o => {
        const p = o?.reference || [chunkX * 16 + 8, -20, chunkZ * 16 + 8];
        const isCopper = o?.type === 'copper';
        return {
          id: `ore_vein_${p[0]}_${p[2]}`,
          type: 'ore_vein',
          name: isCopper ? 'Copper Ore Vein' : 'Iron Ore Vein',
          baseName: 'Ore Vein',
          variant: isCopper ? 'copper' : 'iron',
          x: p[0],
          y: p[1] ?? -20,
          z: p[2],
          spriteKey: isCopper ? 'raw-copper' : 'raw-iron'
        };
      });
    }
  }

  if (cbType === 'igloo') {
    const hasBasement = !!extra?.hasBasement;
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `igloo_${bx}_${bz}`,
      type: 'igloo',
      name: hasBasement ? 'Igloo (with Basement)' : 'Igloo',
      baseName: 'Igloo',
      variant: hasBasement ? 'basement' : null,
      x: bx,
      y: 64,
      z: bz,
      spriteKey: hasBasement ? 'igloo-basement' : 'igloo'
    };
  }

  if (cbType === 'oceanRuin') {
    const isLarge = !!extra?.isLarge;
    const rType = extra?.type || 'cold';
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `ocean_ruin_${bx}_${bz}`,
      type: 'ocean_ruin',
      name: `${isLarge ? 'Large ' : ''}${rType.charAt(0).toUpperCase() + rType.slice(1)} Ocean Ruins`,
      baseName: 'Ocean Ruins',
      variant: isLarge ? 'special' : rType,
      x: bx,
      y: 40,
      z: bz,
      spriteKey: isLarge ? 'ocean-ruin-special' : 'ocean-ruin'
    };
  }

  if (cbType === 'itemOverworld') {
    const bx = chunkX * 16 + 8;
    const bz = chunkZ * 16 + 8;
    return {
      id: `golden_apple_${bx}_${bz}`,
      type: 'golden_apple',
      name: 'Enchanted Golden Apple',
      baseName: 'Golden Apple',
      variant: null,
      x: bx,
      y: 30,
      z: bz,
      spriteKey: 'golden-apple'
    };
  }

  if (cbType === 'spawn') {
    const x = extra?.x ?? (chunkX * 16);
    const z = extra?.z ?? (chunkZ * 16);
    return {
      id: `spawn_${x}_${z}`,
      type: 'spawn',
      name: 'Spawn Point',
      baseName: 'Spawn Point',
      variant: null,
      x,
      y: 64,
      z,
      spriteKey: 'spawn'
    };
  }

  // Generic chunk structure
  const bx = chunkX * 16 + 8;
  const bz = chunkZ * 16 + 8;
  const genericNames = {
    pillagerOutpost: 'Pillager Outpost',
    desertTemple: 'Desert Temple',
    jungleTemple: 'Jungle Temple',
    witchHut: 'Witch Hut',
    stronghold: 'Stronghold',
    woodlandMansion: 'Woodland Mansion',
    oceanMonument: 'Ocean Monument',
    shipwreck: 'Shipwreck',
    fossil: 'Fossil',
    slimeChunk: 'Slime Chunk'
  };
  const genericSprites = {
    pillagerOutpost: 'pillager-outpost',
    desertTemple: 'desert-temple',
    jungleTemple: 'jungle-temple',
    witchHut: 'witch-hut',
    stronghold: 'stronghold',
    woodlandMansion: 'mansion',
    oceanMonument: 'ocean-monument',
    shipwreck: 'shipwreck',
    fossil: 'fossil',
    slimeChunk: 'slime'
  };

  return {
    id: `${uiType}_${bx}_${bz}`,
    type: uiType,
    name: genericNames[cbType] || uiType,
    baseName: genericNames[cbType] || uiType,
    variant: null,
    x: bx,
    y: 64,
    z: bz,
    spriteKey: genericSprites[cbType] || uiType
  };
}

// Global In-Memory Spatial Cache for loaded structures
// Keyed by `${seed}_${version}_${dimension}` -> {
//   markers: Map(markerId -> marker),
//   loadedFeatureRegions: Set<string>, // `${cbKey}:${rx},${rz}`
//   pendingFeatureRegions: Set<string>  // `${cbKey}:${rx},${rz}`
// }
const structureCache = new Map();
let activeWorker = null;
let isWorkerReady = false;
let workerReadyPromise = null;
let pendingRequests = new Map();
let requestIdCounter = 1;

export function initStructureWorker() {
  if (workerReadyPromise) return workerReadyPromise;

  workerReadyPromise = new Promise((readyResolve) => {
    try {
      activeWorker = new Worker('/cb_worker.js', { type: 'module' });
      activeWorker.onerror = (err) => {
        console.warn('Chunkbase structure worker error:', err);
      };

      activeWorker.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.id) return;
        const { id, success, pois, error } = data;

        if (pendingRequests.has(id)) {
          const { resolve, reject } = pendingRequests.get(id);
          pendingRequests.delete(id);
          if (error) reject(new Error(error));
          else resolve({ success, pois });
        }
      };

      // Initialize worker wasm
      const reqId = requestIdCounter++;
      pendingRequests.set(reqId, {
        resolve: () => {
          isWorkerReady = true;
          readyResolve();
        },
        reject: (e) => {
          console.warn('Worker init failed:', e);
          readyResolve();
        }
      });
      activeWorker.postMessage({ id: reqId, action: 'init' });
    } catch (err) {
      console.warn('Unable to spawn structure worker:', err);
      readyResolve();
    }
  });

  return workerReadyPromise;
}

async function sendWorkerMessage(action, payload, timeoutMs = 8000) {
  if (!workerReadyPromise) {
    initStructureWorker();
  }
  await workerReadyPromise;

  return new Promise((resolve, reject) => {
    const id = requestIdCounter++;
    const timer = setTimeout(() => {
      if (pendingRequests.has(id)) {
        pendingRequests.delete(id);
        reject(new Error(`Worker request timed out (${action})`));
      }
    }, timeoutMs);

    pendingRequests.set(id, {
      resolve: (val) => {
        clearTimeout(timer);
        resolve(val);
      },
      reject: (err) => {
        clearTimeout(timer);
        reject(err);
      }
    });
    activeWorker.postMessage({ id, action, payload });
  });
}

/**
 * Returns all structures currently loaded in the memory cache within the given bounding box.
 * Synchronous and O(1), ensuring zero UI stutter.
 */
export function getVisibleStructures({
  dimension,
  minX,
  maxX,
  minZ,
  maxZ,
  seed,
  version = 'be_26_30',
  enabledSet
}) {
  const cacheKey = `${seed}_${version}_${dimension}`;
  const entry = structureCache.get(cacheKey);
  if (!entry || !entry.markers) return [];

  const results = [];
  const margin = 128;
  for (const marker of entry.markers.values()) {
    if (!enabledSet.has(marker.type)) continue;
    if (marker.x >= minX - margin && marker.x <= maxX + margin &&
        marker.z >= minZ - margin && marker.z <= maxZ + margin) {
      results.push(marker);
    }
  }

  return results;
}

const REGION_BLOCKS = 1024;
const REGION_CHUNKS = 64; // 1024 / 16

export function resetStructureWorker() {
  if (activeWorker) {
    try {
      activeWorker.terminate();
    } catch (_) {}
    activeWorker = null;
    isWorkerReady = false;
    workerReadyPromise = null;
    for (const { reject } of pendingRequests.values()) {
      try { reject(new Error('Worker terminated')); } catch (_) {}
    }
    pendingRequests.clear();
  }
  activeStructureQueuePromise = Promise.resolve();
}

/**
 * Ensures structures for the given bounding box are loaded in the background via Chunkbase Wasm.
 * Uses a spatial grid cache (1024-block regions) to query missing areas on-demand and cache permanently.
 * Queries are batched into compact sub-grids and sorted radially from center so visible structures appear instantly.
 * Light structures and heavy features are decoupled so heavy noise calculations never block instant features like End City.
 */
const HEAVY_FEATURES = new Set(['endGateway', 'dungeon', 'cave', 'lavaPool', 'oreVein', 'slimeChunk']);
let activeStructureQueuePromise = Promise.resolve();

/**
 * Execute batches through the Chunkbase worker sequentially.
 */
function executeStructureBatches(batches, seed, version, dimension, entry, isBedrock, onUpdate) {
  if (batches.length === 0) return;

  activeStructureQueuePromise = activeStructureQueuePromise.then(async () => {
    const world = getChunkbaseWorld(seed, version, dimension);

    for (const batch of batches) {
      const minChunkX = batch.minRx * REGION_CHUNKS;
      const minChunkZ = batch.minRz * REGION_CHUNKS;
      const sizeX = (batch.maxRx - batch.minRx + 1) * REGION_CHUNKS;
      const sizeZ = (batch.maxRz - batch.minRz + 1) * REGION_CHUNKS;

      try {
        const res = await sendWorkerMessage('getPois', {
          world,
          features: batch.features,
          minChunkX,
          minChunkZ,
          sizeX,
          sizeZ
        });

        // Mark regions as loaded
        for (const cbKey of batch.features) {
          for (let rx = batch.minRx; rx <= batch.maxRx; rx++) {
            for (let rz = batch.minRz; rz <= batch.maxRz; rz++) {
              const regKey = `${cbKey}:${rx},${rz}`;
              entry.pendingFeatureRegions.delete(regKey);
              entry.loadedFeatureRegions.add(regKey);
            }
          }
        }

        if (!res || !res.pois) continue;

        let newCount = 0;
        for (const [cbKey, items] of Object.entries(res.pois)) {
          if (!Array.isArray(items)) continue;
          for (const item of items) {
            const parsed = parseChunkbasePoi(cbKey, item, isBedrock);
            const markers = Array.isArray(parsed) ? parsed : [parsed];
            for (const marker of markers) {
              if (marker && !entry.markers.has(marker.id)) {
                entry.markers.set(marker.id, marker);
                newCount++;
              }
            }
          }
        }

        if (newCount > 0 && typeof onUpdate === 'function') {
          onUpdate();
        }
      } catch (err) {
        console.warn('Batch structure fetch error:', err);
        for (const cbKey of batch.features) {
          for (let rx = batch.minRx; rx <= batch.maxRx; rx++) {
            for (let rz = batch.minRz; rz <= batch.maxRz; rz++) {
              entry.pendingFeatureRegions.delete(`${cbKey}:${rx},${rz}`);
            }
          }
        }
      }
    }
  }).catch((err) => {
    console.warn('Structure queue error:', err);
  });
}

/**
 * Builds spatial query batches sorted radially from center.
 */
function buildQueryBatches(featuresList, clusterSize, minRx, maxRx, minRz, maxRz, midRx, midRz, entry) {
  if (featuresList.length === 0) return [];
  const clusterMap = new Map();

  for (const cbKey of featuresList) {
    for (let rx = minRx; rx <= maxRx; rx++) {
      for (let rz = minRz; rz <= maxRz; rz++) {
        const regKey = `${cbKey}:${rx},${rz}`;
        if (!entry.loadedFeatureRegions.has(regKey) && !entry.pendingFeatureRegions.has(regKey)) {
          const cx = Math.floor(rx / clusterSize);
          const cz = Math.floor(rz / clusterSize);
          const clusterKey = `${cx},${cz}`;
          if (!clusterMap.has(clusterKey)) {
            clusterMap.set(clusterKey, {
              cx, cz,
              minRx: cx * clusterSize,
              maxRx: cx * clusterSize + clusterSize - 1,
              minRz: cz * clusterSize,
              maxRz: cz * clusterSize + clusterSize - 1,
              features: new Set()
            });
          }
          clusterMap.get(clusterKey).features.add(cbKey);
        }
      }
    }
  }

  const clusterArr = Array.from(clusterMap.values());
  clusterArr.sort((a, b) => {
    const distA = ((a.minRx + a.maxRx) / 2 - midRx) ** 2 + ((a.minRz + a.maxRz) / 2 - midRz) ** 2;
    const distB = ((b.minRx + b.maxRx) / 2 - midRx) ** 2 + ((b.minRz + b.maxRz) / 2 - midRz) ** 2;
    return distA - distB;
  });

  const batches = [];
  for (const c of clusterArr) {
    const feats = Array.from(c.features);
    for (const cbKey of feats) {
      for (let rx = c.minRx; rx <= c.maxRx; rx++) {
        for (let rz = c.minRz; rz <= c.maxRz; rz++) {
          entry.pendingFeatureRegions.add(`${cbKey}:${rx},${rz}`);
        }
      }
    }
    batches.push({
      minRx: c.minRx,
      maxRx: c.maxRx,
      minRz: c.minRz,
      maxRz: c.maxRz,
      features: feats
    });
  }

  return batches;
}

/**
 * Ensures structures for the given bounding box are loaded.
 * 1. High priority: Currently enabled features load first.
 * 2. Background pre-loader: Proactively streams ALL remaining dimension features into memory.
 * This guarantees that when a user toggles any feature (e.g. Mineshafts or Mansions), it displays INSTANTLY.
 */
export function ensureStructuresLoaded({
  seed,
  version = 'be_26_30',
  dimension,
  minX,
  maxX,
  minZ,
  maxZ,
  enabledSet,
  suppressDense = false,
  onUpdate
}) {
  if (!isWorkerReady && !activeWorker) {
    initStructureWorker();
  }

  const cacheKey = `${seed}_${version}_${dimension}`;
  if (!structureCache.has(cacheKey)) {
    structureCache.set(cacheKey, {
      markers: new Map(),
      loadedFeatureRegions: new Set(),
      pendingFeatureRegions: new Set()
    });
  }
  const entry = structureCache.get(cacheKey);
  const isBedrock = version.startsWith('be_');

  // Preload margin of 1 region around visible area
  const PRELOAD_MARGIN = 1;
  const rawMinRx = Math.floor(minX / REGION_BLOCKS) - PRELOAD_MARGIN;
  const rawMaxRx = Math.ceil(maxX / REGION_BLOCKS) + PRELOAD_MARGIN;
  const rawMinRz = Math.floor(minZ / REGION_BLOCKS) - PRELOAD_MARGIN;
  const rawMaxRz = Math.ceil(maxZ / REGION_BLOCKS) + PRELOAD_MARGIN;

  // Clamp viewport query span to at most 16 regions (16,384 blocks) in each axis
  const MAX_SPAN_REGIONS = 16;
  const midRx = Math.round((rawMinRx + rawMaxRx) / 2);
  const midRz = Math.round((rawMinRz + rawMaxRz) / 2);
  const minRx = Math.max(rawMinRx, midRx - Math.floor(MAX_SPAN_REGIONS / 2));
  const maxRx = Math.min(rawMaxRx, midRx + Math.floor(MAX_SPAN_REGIONS / 2));
  const minRz = Math.max(rawMinRz, midRz - Math.floor(MAX_SPAN_REGIONS / 2));
  const maxRz = Math.min(rawMaxRz, midRz + Math.floor(MAX_SPAN_REGIONS / 2));

  // Phase 1: Enabled features (Immediate / High Priority)
  const lightEnabled = new Set();
  const heavyEnabled = new Set();

  if (enabledSet && enabledSet.size > 0) {
    for (const uiId of enabledSet) {
      if (suppressDense && (uiId === 'geode' || uiId === 'slime' || uiId === 'cave' || uiId === 'ore_vein' || uiId === 'lava_pool')) {
        continue;
      }
      const cbKey = UI_TO_CB_FEATURE[uiId];
      if (cbKey) {
        if (HEAVY_FEATURES.has(cbKey)) {
          heavyEnabled.add(cbKey);
        } else {
          lightEnabled.add(cbKey);
        }
      }
    }
  }

  const enabledBatches = [
    ...buildQueryBatches(Array.from(lightEnabled), 2, minRx, maxRx, minRz, maxRz, midRx, midRz, entry),
    ...buildQueryBatches(Array.from(heavyEnabled), 1, minRx, maxRx, minRz, maxRz, midRx, midRz, entry)
  ];

  if (enabledBatches.length > 0) {
    executeStructureBatches(enabledBatches, seed, version, dimension, entry, isBedrock, onUpdate);
  }

  // Phase 2: Background pre-load of ALL remaining features in this dimension
  // Even if unselected, they are pre-calculated and cached in entry.markers.
  const dimStr = String(dimension);
  const allDefs = STRUCTURE_DEFS[dimStr] || [];
  const lightRemaining = new Set();
  const heavyRemaining = new Set();

  for (const def of allDefs) {
    const cbKey = UI_TO_CB_FEATURE[def.id];
    if (!cbKey) continue;
    if (lightEnabled.has(cbKey) || heavyEnabled.has(cbKey)) continue;

    if (HEAVY_FEATURES.has(cbKey)) {
      heavyRemaining.add(cbKey);
    } else {
      lightRemaining.add(cbKey);
    }
  }

  const backgroundBatches = [
    ...buildQueryBatches(Array.from(lightRemaining), 2, minRx, maxRx, minRz, maxRz, midRx, midRz, entry),
    ...buildQueryBatches(Array.from(heavyRemaining), 1, minRx, maxRx, minRz, maxRz, midRx, midRz, entry)
  ];

  if (backgroundBatches.length > 0) {
    // Background batches execute right after enabled batches
    executeStructureBatches(backgroundBatches, seed, version, dimension, entry, isBedrock, () => {
      // If user enabled any of these while the batch was in flight, update view
      if (typeof onUpdate === 'function') onUpdate();
    });
  }
}

/**
 * Preloads all features in the background for a specific dimension and coordinate area.
 */
export function preloadAllDimensionFeatures({
  seed,
  version = 'be_26_30',
  dimension,
  minX,
  maxX,
  minZ,
  maxZ,
  onUpdate
}) {
  ensureStructuresLoaded({
    seed,
    version,
    dimension,
    minX,
    maxX,
    minZ,
    maxZ,
    enabledSet: new Set(),
    suppressDense: false,
    onUpdate
  });
}

/**
 * Rapidly and accurately finds the closest feature of featureId from (fromX, fromZ)
 * using the Chunkbase Web Worker.
 * Queries concentric expanding chunk bounding boxes centered at (fromX, fromZ):
 * - Span 128 chunks (inscribed radius 2,048 blocks)
 * - Span 384 chunks (inscribed radius 6,144 blocks)
 * - Span 1024 chunks (inscribed radius 16,384 blocks)
 * - Span 2048 chunks (inscribed radius 32,768 blocks)
 * A candidate is returned only once fully contained within an inscribed circle,
 * mathematically guaranteeing no closer structure can exist.
 */
export async function findClosestFeature({
  seed,
  version = 'be_26_30',
  dimension,
  featureId,
  fromX,
  fromZ
}) {
  if (!isWorkerReady && !activeWorker) {
    initStructureWorker();
  }

  const cacheKey = `${seed}_${version}_${dimension}`;
  let entry = structureCache.get(cacheKey);
  if (!entry) {
    entry = {
      markers: new Map(),
      loadedFeatureRegions: new Set(),
      pendingFeatureRegions: new Set()
    };
    structureCache.set(cacheKey, entry);
  }

  const isBedrock = version.startsWith('be_');
  const cbKey = UI_TO_CB_FEATURE[featureId] || featureId;
  const world = getChunkbaseWorld(seed, version, dimension);

  let closestMarker = null;
  let minDistanceSq = Infinity;

  // Concentric expanding spans in chunks:
  // 128 chunks = 2,048 blocks radius
  // 384 chunks = 6,144 blocks radius
  // 1024 chunks = 16,384 blocks radius
  // 2048 chunks = 32,768 blocks radius
  const centerChunkX = Math.floor(fromX / 16);
  const centerChunkZ = Math.floor(fromZ / 16);
  const querySpans = [128, 384, 1024, 2048];

  for (const span of querySpans) {
    const minChunkX = centerChunkX - span;
    const minChunkZ = centerChunkZ - span;
    const sizeX = span * 2;
    const sizeZ = span * 2;

    try {
      const res = await sendWorkerMessage('getPois', {
        world,
        features: [cbKey],
        minChunkX,
        minChunkZ,
        sizeX,
        sizeZ
      });

      if (res && res.pois && Array.isArray(res.pois[cbKey])) {
        for (const item of res.pois[cbKey]) {
          const parsed = parseChunkbasePoi(cbKey, item, isBedrock);
          const markers = Array.isArray(parsed) ? parsed : [parsed];
          for (const m of markers) {
            if (m) {
              if (!entry.markers.has(m.id)) {
                entry.markers.set(m.id, m);
              }
              if (m.type === featureId) {
                const dSq = (m.x - fromX) ** 2 + (m.z - fromZ) ** 2;
                if (dSq < minDistanceSq) {
                  minDistanceSq = dSq;
                  closestMarker = m;
                }
              }
            }
          }
        }
      }

      // Check if closest candidate lies within the completely searched inscribed circle.
      // If it does, NO structure outside this span can possibly be closer!
      const inscribedRadius = span * 16;
      if (closestMarker && minDistanceSq <= (inscribedRadius * inscribedRadius)) {
        return {
          marker: closestMarker,
          x: closestMarker.x,
          z: closestMarker.z,
          distance: Math.round(Math.sqrt(minDistanceSq))
        };
      }
    } catch (err) {
      console.warn(`Error querying closest feature ${featureId}:`, err);
    }
  }

  return closestMarker ? {
    marker: closestMarker,
    x: closestMarker.x,
    z: closestMarker.z,
    distance: Math.round(Math.sqrt(minDistanceSq))
  } : null;
}
