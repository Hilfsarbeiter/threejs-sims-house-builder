import type { FloorLayout, FloorPattern, FurnitureItem, RoomLayout, WallId, WallPattern } from './types';

/**
 * Material catalog for the moodboard (Etappe 2). A material is a named
 * colour plus the existing procedural floor/wall pattern it renders with,
 * so it needs no new textures: wood planks, tile, carpet, brick, … are the
 * same renderers the paint panel uses. Applying one is a pure layout
 * transform (like `applyTheme`), dispatched as a single `applyLayout`.
 */

export type MaterialCategory = 'wood' | 'stone' | 'fabric' | 'paint';

export type SurfaceKind = 'floor' | 'wall' | 'upholstery';

export interface MaterialDef {
  id: string;
  name: string;
  category: MaterialCategory;
  color: string;
  floorPattern: FloorPattern;
  wallPattern: WallPattern;
  /** Whether the material can cover sofa/chair cushions. */
  upholstery: boolean;
}

export const MATERIAL_CATEGORIES: ReadonlyArray<{ key: MaterialCategory; label: string }> = [
  { key: 'wood', label: 'Holz' },
  { key: 'stone', label: 'Stein' },
  { key: 'fabric', label: 'Stoff' },
  { key: 'paint', label: 'Farbe' },
];

const wood = (id: string, name: string, color: string): MaterialDef => ({
  id, name, category: 'wood', color, floorPattern: 'wood', wallPattern: 'panel', upholstery: false,
});
const stone = (id: string, name: string, color: string, floorPattern: FloorPattern, wallPattern: WallPattern): MaterialDef => ({
  id, name, category: 'stone', color, floorPattern, wallPattern, upholstery: false,
});
const fabric = (id: string, name: string, color: string): MaterialDef => ({
  id, name, category: 'fabric', color, floorPattern: 'carpet', wallPattern: 'wallpaper', upholstery: true,
});
const paint = (id: string, name: string, color: string): MaterialDef => ({
  id, name, category: 'paint', color, floorPattern: 'solid', wallPattern: 'solid', upholstery: true,
});

export const MATERIALS: readonly MaterialDef[] = [
  wood('oak-light', 'Eiche hell', '#d4b896'),
  wood('oak', 'Eiche', '#c9a57d'),
  wood('ash-grey', 'Esche grau', '#b4a898'),
  wood('cherry', 'Kirsche', '#8b5a3c'),
  wood('walnut', 'Nussbaum', '#6b4226'),
  stone('marble', 'Marmor', '#f0e8da', 'tile', 'plaster'),
  stone('travertine', 'Travertin', '#d8c4a0', 'tile', 'plaster'),
  stone('concrete', 'Sichtbeton', '#8a8580', 'concrete', 'plaster'),
  stone('slate', 'Schiefer', '#444448', 'tile', 'plaster'),
  stone('brick', 'Ziegel', '#a0522d', 'tile', 'brick'),
  stone('clinker', 'Klinker', '#7a4f2a', 'concrete', 'brick'),
  fabric('linen', 'Leinen', '#e5dcc8'),
  fabric('boucle', 'Bouclé', '#efe8dc'),
  fabric('wool-grey', 'Wolle grau', '#9a9a96'),
  fabric('velvet-green', 'Samt Grün', '#4f6b55'),
  fabric('corduroy-mustard', 'Cord Senf', '#c9963a'),
  fabric('terracotta', 'Terrakotta', '#b5603e'),
  fabric('denim', 'Denim', '#3e5a7a'),
  paint('off-white', 'Altweiß', '#f4f1ea'),
  paint('sand', 'Sand', '#e8dcc4'),
  paint('sage', 'Salbei', '#b8c8a8'),
  paint('dove-blue', 'Taubenblau', '#8fa5b8'),
  paint('old-rose', 'Altrosa', '#d9a8a0'),
  paint('ochre', 'Ocker', '#d4a04a'),
  paint('anthracite', 'Anthrazit', '#3a3a3c'),
];

export const FLOOR_PATTERN_NAMES: Record<FloorPattern, string> = {
  solid: 'Uni',
  wood: 'Dielen',
  tile: 'Fliesen',
  carpet: 'Teppich',
  concrete: 'Estrich',
};

export const WALL_PATTERN_NAMES: Record<WallPattern, string> = {
  solid: 'Uni',
  brick: 'Mauerwerk',
  wallpaper: 'Tapete',
  panel: 'Paneele',
  plaster: 'Putz',
  siding: 'Verschalung',
};

/** Seating whose builders paint the cushions with `item.color`. */
const UPHOLSTERED_TYPES: ReadonlySet<string> = new Set(['sofa', 'armchair', 'chair', 'dining-chair', 'bench']);

export function isUpholstered(item: Pick<FurnitureItem, 'type'>): boolean {
  return UPHOLSTERED_TYPES.has(item.type);
}

/** Unpainted exterior walls render in this colour (room-builder's default). */
export const DEFAULT_WALL_COLOR = '#e8dcc4';
export const EXTERIOR_WALLS: readonly WallId[] = ['north', 'east', 'south', 'west'];
export const WALL_LABELS: Record<WallId, string> = {
  north: 'Wand Nord',
  east: 'Wand Ost',
  south: 'Wand Süd',
  west: 'Wand West',
};

/** The surface a material is applied to. `all-walls` is the strip's "Alle Wände" option. */
export type MaterialTarget =
  | { kind: 'floor' }
  | { kind: 'wall'; wall: WallId }
  | { kind: 'all-walls' }
  | { kind: 'interior-wall'; id: string }
  | { kind: 'upholstery'; itemId: string };

export function surfaceKindOf(target: MaterialTarget): SurfaceKind {
  switch (target.kind) {
    case 'floor':
      return 'floor';
    case 'upholstery':
      return 'upholstery';
    default:
      return 'wall';
  }
}

export function materialFits(material: MaterialDef, surface: SurfaceKind): boolean {
  return surface !== 'upholstery' || material.upholstery;
}

const sameColor = (a: string | undefined, b: string): boolean => a?.toLowerCase() === b.toLowerCase();

function applyToFloor(floor: FloorLayout, target: MaterialTarget, material: MaterialDef): FloorLayout {
  switch (target.kind) {
    case 'floor':
      return { ...floor, floorColor: material.color, floorPattern: material.floorPattern };
    // The wall pattern is one per storey (FloorLayout.wallPattern), so a
    // single wall changes the pattern of all four; its colour stays its own.
    case 'wall':
      return {
        ...floor,
        wallPattern: material.wallPattern,
        wallColors: { ...floor.wallColors, [target.wall]: material.color },
      };
    case 'all-walls':
      return {
        ...floor,
        wallPattern: material.wallPattern,
        wallColors: Object.fromEntries(EXTERIOR_WALLS.map((wall) => [wall, material.color])),
      };
    // Interior walls carry a colour only.
    case 'interior-wall':
      return {
        ...floor,
        interiorWalls: (floor.interiorWalls ?? []).map((wall) =>
          wall.id === target.id ? { ...wall, color: material.color } : wall
        ),
      };
    case 'upholstery':
      return {
        ...floor,
        items: floor.items.map((item) =>
          item.id === target.itemId && isUpholstered(item) && !item.locked ? { ...item, color: material.color } : item
        ),
      };
  }
}

/**
 * Apply `material` to `target` on floor `floorIndex`. Returns the layout
 * unchanged when the material does not fit the surface.
 */
export function applyMaterial(
  layout: RoomLayout,
  floorIndex: number,
  target: MaterialTarget,
  material: MaterialDef
): RoomLayout {
  if (!materialFits(material, surfaceKindOf(target))) return layout;
  const floor = layout.floors[floorIndex];
  if (!floor) return layout;
  const floors = layout.floors.slice();
  floors[floorIndex] = applyToFloor(floor, target, material);
  return { ...layout, floors };
}

/** The catalog material a surface currently shows, if its finish matches one. */
export function findMaterial(surface: SurfaceKind, color: string, pattern?: FloorPattern | WallPattern): MaterialDef | undefined {
  return MATERIALS.find((material) => {
    if (!materialFits(material, surface) || !sameColor(color, material.color)) return false;
    if (surface === 'floor') return material.floorPattern === (pattern ?? 'solid');
    if (surface === 'wall') return material.wallPattern === (pattern ?? 'solid');
    return true;
  });
}

export interface MoodboardEntry {
  key: string;
  label: string;
  target: MaterialTarget;
  color: string;
  /** Catalog material, or undefined for a custom finish. */
  material: MaterialDef | undefined;
  /** Readable finish: the material name, else the pattern / "Eigene Farbe". */
  finish: string;
}

/** Current material per surface of a floor: floor, the four outer walls, then each upholstered item. */
export function moodboardEntries(floor: FloorLayout): MoodboardEntry[] {
  const floorPattern = floor.floorPattern ?? 'solid';
  const wallPattern = floor.wallPattern ?? 'solid';
  const custom = (patternLabel: string, pattern: string) =>
    pattern === 'solid' ? 'Eigene Farbe' : `${patternLabel}, eigene Farbe`;

  const entries: MoodboardEntry[] = [];
  const floorMaterial = findMaterial('floor', floor.floorColor, floorPattern);
  entries.push({
    key: 'floor',
    label: 'Boden',
    target: { kind: 'floor' },
    color: floor.floorColor,
    material: floorMaterial,
    finish: floorMaterial?.name ?? custom(FLOOR_PATTERN_NAMES[floorPattern], floorPattern),
  });
  for (const wall of EXTERIOR_WALLS) {
    const color = floor.wallColors?.[wall] ?? DEFAULT_WALL_COLOR;
    const material = findMaterial('wall', color, wallPattern);
    entries.push({
      key: `wall-${wall}`,
      label: WALL_LABELS[wall],
      target: { kind: 'wall', wall },
      color,
      material,
      finish: material?.name ?? custom(WALL_PATTERN_NAMES[wallPattern], wallPattern),
    });
  }
  for (const item of floor.items) {
    if (!isUpholstered(item)) continue;
    const material = findMaterial('upholstery', item.color);
    entries.push({
      key: `item-${item.id}`,
      label: item.name,
      target: { kind: 'upholstery', itemId: item.id },
      color: item.color,
      material,
      finish: material?.name ?? 'Eigene Farbe',
    });
  }
  return entries;
}

export function sameTarget(a: MaterialTarget | null, b: MaterialTarget | null): boolean {
  if (!a || !b || a.kind !== b.kind) return false;
  switch (a.kind) {
    case 'wall':
      return a.wall === (b as typeof a).wall;
    case 'interior-wall':
      return a.id === (b as typeof a).id;
    case 'upholstery':
      return a.itemId === (b as typeof a).itemId;
    default:
      return true;
  }
}
