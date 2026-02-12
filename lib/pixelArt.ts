// Pixel art assets for Island Survival Simulator
// All sprites defined as 16x16 color arrays

/**
 * Color palettes for different terrain and elements
 */
export const PALETTES = {
  water: ['#4A90D9', '#5BA3F0', '#3D7CC9', '#2E5C8A'],
  grass: ['#7CB342', '#8BC34A', '#689F38', '#558B2F'],
  forest: ['#2E7D32', '#388E3C', '#1B5E20', '#4CAF50'],
  beach: ['#FDD835', '#FFF59D', '#FBC02D', '#F9A825'],
  rocky: ['#78909C', '#90A4AE', '#607D8B', '#455A64'],
  agent: ['#FF7043', '#FF8A65', '#FF5722', '#E64A19'], // Skin tones
  agent_child: ['#FFAB91', '#FFCCBC', '#FF8A65', '#E64A19'],
  ui_highlight: ['#FFD700', '#FFC107', '#FFB300'],
  ui_danger: ['#EF5350', '#F44336', '#E53935'],
  ui_success: ['#66BB6A', '#4CAF50', '#43A047'],
} as const;

type Sprite16x16 = readonly (readonly (string | null)[])[];
type Sprite8x8 = readonly (readonly (string | null)[])[];

/**
 * 16x16 sprite for adult agent
 * Simple humanoid figure with high-contrast outline for visibility
 */
export const AGENT_SPRITE: Sprite16x16 = [
  [null, null, null, null, '#1a1a1a', '#FF7043', '#FF7043', '#1a1a1a', '#1a1a1a', '#FF7043', '#FF7043', '#1a1a1a', null, null, null, null],
  [null, null, null, null, '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#1a1a1a', null, null, null],
  [null, null, null, '#1a1a1a', '#FF8A65', '#FF8A65', '#FF8A65', '#FF8A65', '#FF8A65', '#FF8A65', '#FF8A65', '#FF8A65', '#1a1a1a', null, null, null],
  [null, null, null, null, '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#FF7043', '#1a1a1a', null, null, null],
  [null, null, null, '#1a1a1a', '#1a1a1a', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#1a1a1a', null, null, null, null],
  [null, null, null, '#1a1a1a', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#1a1a1a', null, null, null],
  [null, null, '#1a1a1a', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#1a1a1a', null, null],
  [null, null, '#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a', null],
  [null, '#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  ['#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  ['#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  ['#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', null, null, '#5D4037', '#5D4037', null, null, '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
] as const;

/**
 * 8x8 sprite for child agent with high-contrast outline
 */
export const AGENT_CHILD_SPRITE: Sprite16x16 = [
  [null, null, null, null, null, '#1a1a1a', '#FFAB91', '#FFAB91', '#FFAB91', '#FFAB91', '#1a1a1a', null, null, null, null, null],
  [null, null, null, null, '#1a1a1a', '#FFAB91', '#FFAB91', '#FFAB91', '#FFAB91', '#FFAB91', '#FFAB91', '#FFAB91', '#1a1a1a', null, null, null],
  [null, null, null, '#1a1a1a', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#FFCCBC', '#1a1a1a', null, null, null],
  [null, null, null, '#1a1a1a', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#1a1a1a', null, null, null, null],
  [null, null, '#1a1a1a', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#8D6E63', '#1a1a1a', null],
  ['#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  ['#1a1a1a', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', null, null, null, null, '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#5D4037', '#1a1a1a'],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
] as const;

/**
 * Water tile with simplified wave pattern
 * Reduced visual noise with horizontal bands
 */
export const WATER_SPRITE: Sprite16x16 = [
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
  ['#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9'],
  ['#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9'],
  ['#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9'],
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#4A90D9', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
  ['#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#5BA3F0', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9', '#3D7CC9'],
] as const;

/**
 * Grass tile with simplified pattern
 * Mostly solid with minimal detail
 */
export const GRASS_SPRITE: Sprite16x16 = [
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
  ['#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342', '#7CB342'],
] as const;

/**
 * Forest tile with simple tree pattern
 * Dark green with minimal tree symbols
 */
export const FOREST_SPRITE: Sprite16x16 = [
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#1B5E20', '#2E7D32', '#2E7D32', '#2E7D32', '#1B5E20', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#1B5E20', '#4CAF50', '#1B5E20', '#1B5E20', '#2E7D32', '#2E7D32', '#2E7D32', '#1B5E20', '#4CAF50', '#1B5E20', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#1B5E20', '#4CAF50', '#4CAF50', '#1B5E20', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#1B5E20', '#1B5E20', '#4CAF50', '#1B5E20', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
  ['#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32', '#2E7D32'],
] as const;

/**
 * Beach/sand tile with simplified bands
 */
export const BEACH_SPRITE: Sprite16x16 = [
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835'],
  ['#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835'],
  ['#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FFF59D', '#FFF59D', '#FFF59D', '#FFF59D', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
  ['#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835', '#FDD835'],
] as const;

/**
 * Rocky/stone tile with simplified pattern
 */
export const ROCKY_SPRITE: Sprite16x16 = [
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#90A4AE', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#90A4AE', '#90A4AE', '#90A4AE', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#90A4AE', '#90A4AE', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C'],
  ['#90A4AE', '#90A4AE', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C'],
  ['#90A4AE', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#78909C', '#78909C'],
  ['#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#607D8B', '#607D8B', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#607D8B', '#607D8B', '#78909C', '#90A4AE', '#90A4AE', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C'],
  ['#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C', '#78909C'],
] as const;

/**
 * Growing crop sprite
 */
export const CROP_SPRITE: Sprite16x16 = [
  ['#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A'],
  ['#7CB342', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342'],
  ['#8BC34A', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#8BC34A'],
  ['#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342'],
  ['#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342'],
  ['#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342'],
  ['#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A'],
  ['#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342'],
  ['#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A', '#7CB342', '#7CB342', '#8BC34A', '#7CB342', '#8BC34A'],
] as const;

/**
 * Mature crop sprite (ready to harvest)
 */
export const CROP_MATURE_SPRITE: Sprite16x16 = [
  ['#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#8BC34A', '#FFD54F', '#FFC107', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#FFD54F', '#FFC107', '#FFD54F', '#8BC34A', '#FFD54F', '#FFD54F', '#FFC107', '#FFD54F', '#FFD54F', '#FFC107', '#FFD54F', '#8BC34A'],
  ['#8BC34A', '#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFC107', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F'],
  ['#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A'],
  ['#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F'],
  ['#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A'],
  ['#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F'],
  ['#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A'],
  ['#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F'],
  ['#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A', '#FFD54F', '#8BC34A', '#FFD54F', '#8BC34A', '#8BC34A'],
] as const;

/**
 * Resource icons (8x8)
 */
export const RESOURCE_ICONS: Record<string, Sprite8x8> = {
  wood: [
    ['#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F'],
    ['#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63'],
    ['#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F'],
    ['#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63'],
    ['#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F'],
    ['#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63'],
    ['#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F'],
    ['#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63', '#A1887F', '#8D6E63'],
  ] as const,
  stone: [
    ['#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD'],
    ['#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E'],
    ['#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD'],
    ['#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E'],
    ['#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD'],
    ['#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E'],
    ['#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD'],
    ['#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E', '#BDBDBD', '#9E9E9E'],
  ] as const,
  water: [
    ['#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6'],
    ['#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7'],
    ['#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6'],
    ['#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7'],
    ['#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6'],
    ['#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7'],
    ['#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6'],
    ['#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7', '#29B6F6', '#4FC3F7'],
  ] as const,
  food: [
    ['#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D'],
    ['#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80'],
    ['#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D'],
    ['#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80'],
    ['#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D'],
    ['#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80'],
    ['#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D'],
    ['#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80', '#FFB74D', '#FFCC80'],
  ] as const,
  tools: [
    ['#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC'],
    ['#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5'],
    ['#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC'],
    ['#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5'],
    ['#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC'],
    ['#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5'],
    ['#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC'],
    ['#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5', '#CFD8DC', '#B0BEC5'],
  ] as const,
};

/**
 * Get sprite for terrain type
 */
export function getTerrainSprite(terrain: string): Sprite16x16 {
  switch (terrain) {
    case 'water': return WATER_SPRITE;
    case 'grass': return GRASS_SPRITE;
    case 'forest': return FOREST_SPRITE;
    case 'beach': return BEACH_SPRITE;
    case 'rocky': return ROCKY_SPRITE;
    default: return GRASS_SPRITE;
  }
}

/**
 * Get resource icon
 */
export function getResourceIcon(resource: string): Sprite8x8 {
  return RESOURCE_ICONS[resource] || RESOURCE_ICONS.wood;
}

/**
 * Draw sprite to canvas context
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: Sprite16x16 | Sprite8x8,
  x: number,
  y: number,
  size: number
) {
  const spriteSize = sprite.length === 8 ? 8 : 16;
  const pixelSize = size / spriteSize;

  for (let row = 0; row < spriteSize; row++) {
    for (let col = 0; col < spriteSize; col++) {
      const color = sprite[row]?.[col];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + col * pixelSize, y + row * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}
