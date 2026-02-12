// True 2D Perlin noise implementation for world generation
// Research-grade, fully documented
//
// Based on Ken Perlin's improved noise algorithm (2002)
// Reference: https://mrl.nyu.edu/~perlin/noise/

/**
 * Generate a seeded pseudo-random number generator using Mulberry32 algorithm
 * @param seed - Random seed value
 * @returns A function that generates random numbers in [0, 1)
 */
export function mulberry32(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ============================================================================
// PERLIN NOISE IMPLEMENTATION
// ============================================================================

/** Size of the permutation table (power of 2 for efficiency) */
const PERMUTATION_SIZE = 256;

/** Cached permutation table, initialized on first use */
let permutation: number[] = [];

/**
 * Eight gradient vectors for 2D Perlin noise
 * These provide directional coherence to the noise field
 * Each vector is a unit direction in 2D space
 */
const GRADIENTS: [number, number][] = [
  [1, 1], [-1, 1], [1, -1], [-1, -1],  // Diagonal gradients
  [1, 0], [-1, 0], [0, 1], [0, -1]     // Cardinal gradients
];

/**
 * Ken Perlin's improved fade function (smoothstep)
 * Transforms a value t in [0,1] using 6t⁵ - 15t⁴ + 10t³
 * This provides C² continuity (smooth second derivatives)
 * @param t - Interpolation factor in [0,1]
 * @returns Smoothed interpolation factor
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/**
 * Linear interpolation between two values
 * @param a - Start value
 * @param b - End value
 * @param t - Interpolation factor in [0,1]
 * @returns Interpolated value
 */
function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

/**
 * Initialize the permutation table with a given seed
 * Creates a shuffled array of values 0-255, then duplicates it
 * The duplication handles overflow when accessing permutation[p + 1]
 *
 * The permutation table is the key to Perlin noise's spatial coherence:
 * - Each grid point always maps to the same gradient
 * - Nearby grid points map to related gradients
 * - This creates smooth transitions between grid cells
 *
 * @param seed - Random seed for permutation
 */
function initPermutation(seed: number): void {
  const random = mulberry32(seed);

  // Initialize with values 0-255
  permutation = Array.from({ length: PERMUTATION_SIZE }, (_, i) => i);

  // Fisher-Yates shuffle for unbiased permutation
  for (let i = PERMUTATION_SIZE - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
  }

  // Duplicate the array to handle overflow when indexing
  // This allows permutation[xi + 1] to work without bounds checking
  permutation = [...permutation, ...permutation];
}

/**
 * Get a gradient vector for a given hash value
 * @param hash - Hash value (from permutation table)
 * @returns 2D gradient vector
 */
function getGradient(hash: number): [number, number] {
  return GRADIENTS[hash % GRADIENTS.length];
}

/**
 * Calculate dot product of gradient and distance vectors
 * This measures how much the gradient "points toward" the sample point
 * @param grad - Gradient vector
 * @param dx - X distance from grid corner
 * @param dy - Y distance from grid corner
 * @returns Dot product (influence value)
 */
function dot(grad: [number, number], dx: number, dy: number): number {
  return grad[0] * dx + grad[1] * dy;
}

/**
 * Main 2D Perlin noise function
 *
 * Algorithm overview:
 * 1. Find the 4 grid corners surrounding the sample point
 * 2. Get a random gradient vector for each corner (via permutation table)
 * 3. Calculate dot products of each gradient with distance to sample point
 * 4. Fade the fractional coordinates for smooth interpolation
 * 5. Bilinearly interpolate the 4 corner values
 *
 * The result has spatial coherence: nearby points have similar values
 *
 * @param x - X coordinate (any real number)
 * @param y - Y coordinate (any real number)
 * @param seed - Random seed (first call initializes permutation)
 * @returns Noise value in approximately [-1, 1]
 */
export function perlin2(x: number, y: number, seed: number): number {
  // Initialize permutation table on first call
  if (permutation.length === 0) {
    initPermutation(seed);
  }

  // Grid coordinates of the 4 corners
  const xi = Math.floor(x) & 255;  // Mask to [0,255] for permutation indexing
  const yi = Math.floor(y) & 255;

  // Fractional part (position within the grid cell)
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Apply fade function for smooth interpolation
  const u = fade(xf);
  const v = fade(yf);

  // Get gradient vectors for each of the 4 corners
  // The permutation table ensures each grid point always gets the same gradient
  const aa = getGradient(permutation[permutation[xi] + yi]);       // Top-left
  const ab = getGradient(permutation[permutation[xi] + yi + 1]);   // Bottom-left
  const ba = getGradient(permutation[permutation[xi + 1] + yi]);   // Top-right
  const bb = getGradient(permutation[permutation[xi + 1] + yi + 1]); // Bottom-right

  // Calculate dot products (gradient influence at each corner)
  const n00 = dot(aa, xf, yf);       // Top-left corner
  const n01 = dot(ab, xf, yf - 1);   // Bottom-left corner
  const n10 = dot(ba, xf - 1, yf);   // Top-right corner
  const n11 = dot(bb, xf - 1, yf - 1); // Bottom-right corner

  // Bilinear interpolation with fade-weighted blending
  const x1 = lerp(n00, n10, u);  // Interpolate top edge
  const x2 = lerp(n01, n11, u);  // Interpolate bottom edge
  const value = lerp(x1, x2, v); // Interpolate between top and bottom

  return value;
}
