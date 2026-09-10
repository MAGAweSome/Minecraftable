#include "cubiomes/generator.h"
#include "cubiomes/biomes.h"
#include <emscripten.h>
#include <stdint.h>
#include <stdlib.h>

static Generator g;

EMSCRIPTEN_KEEPALIVE
int get_latest_mc_version() {
    return MC_NEWEST;
}

EMSCRIPTEN_KEEPALIVE
void init_generator_split(int mc_version, uint32_t seed_low, uint32_t seed_high, int dimension, int flags) {
    uint64_t full_seed = ((uint64_t)seed_high << 32) | (uint64_t)seed_low;
    setupGenerator(&g, mc_version, flags);
    applySeed(&g, dimension, full_seed);
}

EMSCRIPTEN_KEEPALIVE
int* allocate_biome_buffer(int size) {
    return (int*)malloc(size * sizeof(int));
}

EMSCRIPTEN_KEEPALIVE
void free_biome_buffer(int* ptr) {
    free(ptr);
}

EMSCRIPTEN_KEEPALIVE
void get_biome_area(int* out_buffer, int quart_x, int quart_z, int w, int h, int scale, int y_coord) {
    Range r;
    r.scale = scale;
    r.x = quart_x;
    r.z = quart_z;
    r.sx = w;
    r.sz = h;
    // For 1.18+ multi-noise at scale 4, y is in quart units: 64 block height = 16 quart height
    r.y = (y_coord == 320 || y_coord == 64) ? 16 : (y_coord >> 2);
    r.sy = 1;

    genBiomes(&g, out_buffer, r);
}

EMSCRIPTEN_KEEPALIVE
int get_single_biome(int block_x, int block_z, int y_coord) {
    return getBiomeAt(&g, 4, block_x >> 2, (y_coord == 320 || y_coord == 64) ? 16 : (y_coord >> 2), block_z >> 2);
}