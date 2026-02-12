// Seeded random number generator for reproducible simulations
// Uses Mulberry32 algorithm - fast, simple, and good statistical properties

export class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  /**
   * Get the current seed
   */
  getSeed(): number {
    return this.seed;
  }

  /**
   * Set a new seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Generate a random number between 0 and 1
   * Uses Mulberry32 algorithm
   */
  random(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generate a random integer between min (inclusive) and max (exclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min)) + min;
  }

  /**
   * Generate a random float between min (inclusive) and max (exclusive)
   */
  randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }

  /**
   * Return true with probability p (0-1)
   */
  randomBoolean(p: number = 0.5): boolean {
    return this.random() < p;
  }

  /**
   * Pick a random element from an array
   */
  randomChoice<T>(array: T[]): T {
    return array[this.randomInt(0, array.length)];
  }

  /**
   * Shuffle an array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.randomInt(0, i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Create a seeded random generator
 */
export function createSeededRandom(seed: number): SeededRandom {
  return new SeededRandom(seed);
}

/**
 * Generate a random seed from current timestamp
 */
export function generateSeed(): number {
  return Date.now() ^ (Math.random() * 0xffffffff);
}
