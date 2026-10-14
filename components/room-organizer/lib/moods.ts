import {
  DEFAULT_WALL_COLOR,
  EXTERIOR_WALLS,
  FLOOR_PATTERN_NAMES,
  MATERIALS,
  WALL_PATTERN_NAMES,
  isUpholstered,
} from './materials';
import { safeGetItem, safeSetItem } from './safe-storage';
import type { FloorLayout, FloorPattern, RoomLayout, WallId, WallPattern } from './types';

/**
 * Moods (Etappe 3): one click sets the floor, walls and upholstery of the
 * active storey plus the time of day. Presets are built from the material
 * catalog; the user can also save the current look under a name and load
 * it back later (localStorage, through safe-storage like other small keys).
 */

/** Everything a mood sets on a storey. */
export interface MoodFinish {
  floorColor: string;
  floorPattern: FloorPattern;
  wallPattern: WallPattern;
  wallColors: Record<WallId, string>;
  /** Presets: one colour for every upholstered seat. */
  upholsteryColor?: string;
  /** Saved moods: the colour of each seat by item id; seats since removed are skipped. */
  upholsteryById?: Record<string, string>;
}

export interface MoodState {
  hour: number;
  finish: MoodFinish;
}

export type MoodPresetKey = 'cozy' | 'bright' | 'moody';

export interface MoodPreset extends MoodState {
  key: MoodPresetKey;
  label: string;
  description: string;
}

function material(id: string) {
  const found = MATERIALS.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown material ${id}`);
  return found;
}

function preset(
  key: MoodPresetKey,
  label: string,
  description: string,
  hour: number,
  ids: { floor: string; walls: string; upholstery: string }
): MoodPreset {
  const floor = material(ids.floor);
  const walls = material(ids.walls);
  return {
    key,
    label,
    description,
    hour,
    finish: {
      floorColor: floor.color,
      floorPattern: floor.floorPattern,
      wallPattern: walls.wallPattern,
      wallColors: Object.fromEntries(EXTERIOR_WALLS.map((w) => [w, walls.color])) as Record<WallId, string>,
      upholsteryColor: material(ids.upholstery).color,
    },
  };
}

export const MOOD_PRESETS: readonly MoodPreset[] = [
  preset('cozy', 'Cozy', 'Eiche, Ocker, Cord Senf – Abendlicht', 19, {
    floor: 'oak',
    walls: 'ochre',
    upholstery: 'corduroy-mustard',
  }),
  preset('bright', 'Bright', 'Marmor, Altweiß, Leinen – Vormittagssonne', 11, {
    floor: 'marble',
    walls: 'off-white',
    upholstery: 'linen',
  }),
  preset('moody', 'Moody', 'Nussbaum, Anthrazit, Samt Grün – Nacht', 22, {
    floor: 'walnut',
    walls: 'anthracite',
    upholstery: 'velvet-green',
  }),
];

/** Apply a mood's finish to floor `floorIndex`; locked seats keep their colour. */
export function applyMoodFinish(layout: RoomLayout, floorIndex: number, finish: MoodFinish): RoomLayout {
  const floor = layout.floors[floorIndex];
  if (!floor) return layout;
  const items = floor.items.map((item) => {
    if (!isUpholstered(item) || item.locked) return item;
    const color = finish.upholsteryById?.[item.id] ?? finish.upholsteryColor;
    return color && color !== item.color ? { ...item, color } : item;
  });
  const floors = layout.floors.slice();
  floors[floorIndex] = {
    ...floor,
    floorColor: finish.floorColor,
    floorPattern: finish.floorPattern,
    wallPattern: finish.wallPattern,
    wallColors: { ...finish.wallColors },
    items,
  };
  return { ...layout, floors };
}

/** The current look of a storey, as a saved mood stores it. */
export function captureMood(floor: FloorLayout, hour: number): MoodState {
  const upholsteryById: Record<string, string> = {};
  for (const item of floor.items) {
    if (isUpholstered(item)) upholsteryById[item.id] = item.color;
  }
  return {
    hour,
    finish: {
      floorColor: floor.floorColor,
      floorPattern: floor.floorPattern ?? 'solid',
      wallPattern: floor.wallPattern ?? 'solid',
      wallColors: Object.fromEntries(
        EXTERIOR_WALLS.map((w) => [w, floor.wallColors?.[w] ?? DEFAULT_WALL_COLOR])
      ) as Record<WallId, string>,
      upholsteryById,
    },
  };
}

const sameColor = (a: string | undefined, b: string | undefined) => a?.toLowerCase() === b?.toLowerCase();

/** Whether the storey and hour currently show exactly this preset. */
export function matchesPreset(preset: MoodPreset, floor: FloorLayout, hour: number): boolean {
  const { finish } = preset;
  if (hour !== preset.hour) return false;
  if (!sameColor(floor.floorColor, finish.floorColor) || (floor.floorPattern ?? 'solid') !== finish.floorPattern) {
    return false;
  }
  if ((floor.wallPattern ?? 'solid') !== finish.wallPattern) return false;
  if (!EXTERIOR_WALLS.every((w) => sameColor(floor.wallColors?.[w] ?? DEFAULT_WALL_COLOR, finish.wallColors[w]))) {
    return false;
  }
  return floor.items.every((item) => !isUpholstered(item) || item.locked || sameColor(item.color, finish.upholsteryColor));
}

// ---------------------------------------------------------------------------
// Saved moods
// ---------------------------------------------------------------------------

export const SAVED_MOODS_KEY = 'standalone-room-organizer-moods';
export const MAX_SAVED_MOODS = 20;
export const MAX_MOOD_NAME_LENGTH = 40;

export interface SavedMood extends MoodState {
  id: string;
  name: string;
  savedAt: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const isHex = (v: unknown): v is string => typeof v === 'string' && HEX.test(v);
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

function parseFinish(value: unknown): MoodFinish | null {
  if (!isRecord(value)) return null;
  const { floorColor, floorPattern, wallPattern, wallColors, upholsteryById } = value;
  if (!isHex(floorColor)) return null;
  if (typeof floorPattern !== 'string' || !(floorPattern in FLOOR_PATTERN_NAMES)) return null;
  if (typeof wallPattern !== 'string' || !(wallPattern in WALL_PATTERN_NAMES)) return null;
  if (!isRecord(wallColors) || !EXTERIOR_WALLS.every((w) => isHex(wallColors[w]))) return null;
  const seats: Record<string, string> = {};
  if (isRecord(upholsteryById)) {
    for (const [id, color] of Object.entries(upholsteryById)) if (isHex(color)) seats[id] = color;
  }
  return {
    floorColor,
    floorPattern: floorPattern as FloorPattern,
    wallPattern: wallPattern as WallPattern,
    wallColors: Object.fromEntries(EXTERIOR_WALLS.map((w) => [w, wallColors[w]])) as Record<WallId, string>,
    upholsteryById: seats,
  };
}

/** Stored moods, newest first; malformed entries are dropped. Pure, for tests. */
export function parseSavedMoods(raw: string | null): SavedMood[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const moods: SavedMood[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) continue;
    const { id, name, savedAt, hour } = entry;
    const finish = parseFinish(entry.finish);
    if (typeof id !== 'string' || typeof name !== 'string' || !finish) continue;
    if (typeof savedAt !== 'number' || typeof hour !== 'number' || !(hour >= 0 && hour < 24)) continue;
    moods.push({ id, name: name.slice(0, MAX_MOOD_NAME_LENGTH), savedAt, hour, finish });
  }
  return moods.sort((a, b) => b.savedAt - a.savedAt);
}

export function listSavedMoods(storage?: Storage): SavedMood[] {
  return parseSavedMoods(safeGetItem(SAVED_MOODS_KEY, storage));
}

function writeMoods(moods: readonly SavedMood[], storage?: Storage): boolean {
  return safeSetItem(SAVED_MOODS_KEY, JSON.stringify(moods), storage);
}

/**
 * Save `state` under `name`; the same name (case-insensitive) overwrites.
 * Keeps the newest `MAX_SAVED_MOODS`. Returns the new list, or null when
 * storage refused the write.
 */
export function saveMood(
  name: string,
  state: MoodState,
  storage?: Storage,
  now: number = Date.now()
): SavedMood[] | null {
  const trimmed = name.trim().slice(0, MAX_MOOD_NAME_LENGTH) || 'Meine Stimmung';
  const existing = listSavedMoods(storage);
  const previous = existing.find((m) => m.name.toLowerCase() === trimmed.toLowerCase());
  const mood: SavedMood = {
    id: previous?.id ?? `mood-${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    savedAt: now,
    hour: state.hour,
    finish: state.finish,
  };
  const next = [mood, ...existing.filter((m) => m.id !== mood.id)].slice(0, MAX_SAVED_MOODS);
  return writeMoods(next, storage) ? next : null;
}

export function deleteMood(id: string, storage?: Storage): SavedMood[] | null {
  const next = listSavedMoods(storage).filter((m) => m.id !== id);
  return writeMoods(next, storage) ? next : null;
}
