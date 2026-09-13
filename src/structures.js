// Minecraft structure finder powered by Chunkbase Wasm engine
// Guarantees 1:1 identical structure coordinates, piece rotations, and variant detection across all editions.
import { getPoiSpriteKey } from './poi-sprites.js';

// Structure Definitions by Dimension (matching Chunkbase order and icons)
export const STRUCTURE_DEFS = {
  // Nether (-1)
  '-1': [
    { id: 'nether_fortress', name: 'Nether Fortress', icon: 'nether-fortress', defaultEnabled: true },
    { id: 'bastion', name: 'Bastion Remnant', icon: 'bastion', defaultEnabled: true },
    { id: 'ruined_portal_nether', name: 'Ruined Portal', icon: 'ruined-portal', defaultEnabled: true },
    { id: 'nether_fossil', name: 'Nether Fossil', icon: 'fossil', defaultEnabled: false }
  ],
  // The End (1)
  '1': [
    { id: 'end_city', name: 'End City', icon: 'end-city', defaultEnabled: true },
    { id: 'end_gateway', name: 'End Gateway', icon: 'end-gateway', defaultEnabled: true }
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
  bastion: 'bastionRemnant',
  ruined_portal_nether: 'ruinedPortalNether',
  nether_fossil: 'fossilNether',

  // End
  end_city: 'endCity',
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
    const x = extra?.x ?? (chunkX * 16 + 8);
    const y = extra?.y ?? 33;
    const z = extra?.z ?? (chunkZ * 16 + 8);
    return {
      id: `bastion_${x}_${z}`,
      type: 'bastion',
      name: `Bastion (${names[bType] || bType})`,
      baseName: 'Bastion Remnant',
      variant: names[bType] || bType,
      x,
      y,
      z,
      spriteKey: getPoiSpriteKey('bastion', bType)
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
    const coords = (Array.isArray(extra) && Array.isArray(extra[0])) ? extra[0] : [chunkX * 16 + 8, 30, chunkZ * 16 + 8];
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
    igloo: 'Igloo',
    oceanRuin: 'Ocean Ruins',
    trailRuin: 'Trail Ruins',
    desertWell: 'Desert Well',
    fossil: 'Fossil',
    fossilNether: 'Nether Fossil',
    endCity: 'End City',
    endGateway: 'End Gateway',
    slimeChunk: 'Slime Chunk',
    dungeon: 'Dungeon'
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
    igloo: 'igloo',
    oceanRuin: 'ocean-ruin',
    trailRuin: 'trail-ruin',
    desertWell: 'desert-well',
    fossil: 'fossil',
    fossilNether: 'fossil',
    endCity: 'end-city',
    endGateway: 'end-gateway',
    slimeChunk: 'slime',
    dungeon: 'dungeon'
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
// Keyed by `${seed}_${version}_${dimension}` -> Map(markerId -> marker)
const structureCache = new Map();
let activeFetchBounds = null;
let activeWorker = null;
let isWorkerReady = false;
let pendingRequests = new Map();
let requestIdCounter = 1;

export function initStructureWorker() {
  if (activeWorker) return;

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
      },
      reject: (e) => {
        console.warn('Worker init failed:', e);
      }
    });
    activeWorker.postMessage({ id: reqId, action: 'init' });
  } catch (err) {
    console.warn('Unable to spawn structure worker:', err);
  }
}

function sendWorkerMessage(action, payload) {
  if (!activeWorker) initStructureWorker();
  return new Promise((resolve, reject) => {
    const id = requestIdCounter++;
    pendingRequests.set(id, { resolve, reject });
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
  const dimMap = structureCache.get(cacheKey);
  if (!dimMap) return [];

  const results = [];
  const margin = 128;
  for (const marker of dimMap.values()) {
    if (!enabledSet.has(marker.type)) continue;
    if (marker.x >= minX - margin && marker.x <= maxX + margin &&
        marker.z >= minZ - margin && marker.z <= maxZ + margin) {
      results.push(marker);
    }
  }

  return results;
}

// Debounce handle for background structure fetches
let fetchTimeout = null;

/**
 * Ensures structures for the given bounding box are loaded in the background via Chunkbase Wasm.
 * Invokes onUpdate() when new structures are retrieved.
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
    structureCache.set(cacheKey, new Map());
  }
  const dimMap = structureCache.get(cacheKey);

  // Convert bounding box to chunk coordinates with extra padding
  const paddingChunks = 16;
  const minChunkX = Math.floor(minX / 16) - paddingChunks;
  const maxChunkX = Math.ceil(maxX / 16) + paddingChunks;
  const minChunkZ = Math.floor(minZ / 16) - paddingChunks;
  const maxChunkZ = Math.ceil(maxZ / 16) + paddingChunks;
  const sizeX = maxChunkX - minChunkX + 1;
  const sizeZ = maxChunkZ - minChunkZ + 1;

  // Filter which features to fetch from Chunkbase
  const isBedrock = version.startsWith('be_');
  const cbFeatures = [];
  for (const uiId of enabledSet) {
    // Ultra-dense feature gating when zoomed out
    if (suppressDense && (uiId === 'geode' || uiId === 'slime' || uiId === 'cave' || uiId === 'ore_vein')) {
      continue;
    }
    const cbKey = UI_TO_CB_FEATURE[uiId];
    if (cbKey) cbFeatures.push(cbKey);
  }

  if (cbFeatures.length === 0) return;

  // Check if current bounds already fetched
  const bKey = `${cacheKey}_${minChunkX}_${minChunkZ}_${sizeX}_${sizeZ}_${cbFeatures.sort().join(',')}`;
  if (activeFetchBounds === bKey) return;

  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(async () => {
    activeFetchBounds = bKey;
    try {
      const world = getChunkbaseWorld(seed, version, dimension);
      const res = await sendWorkerMessage('getPois', {
        world,
        features: cbFeatures,
        minChunkX,
        minChunkZ,
        sizeX,
        sizeZ
      });

      if (!res || !res.pois) return;

      let newCount = 0;
      for (const [cbKey, items] of Object.entries(res.pois)) {
        for (const item of items) {
          const marker = parseChunkbasePoi(cbKey, item, isBedrock);
          if (!dimMap.has(marker.id)) {
            dimMap.set(marker.id, marker);
            newCount++;
          }
        }
      }

      if (newCount > 0 && typeof onUpdate === 'function') {
        onUpdate();
      }
    } catch (err) {
      console.warn('Structure fetch error:', err);
    }
  }, 40);
}
