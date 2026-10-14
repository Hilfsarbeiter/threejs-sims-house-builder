import { describe, expect, it } from 'vitest';
import { makeItem } from './__testfixtures__/fixtures';
import { INITIAL_LAYOUT } from './initial-layout';
import {
  MAX_SAVED_MOODS,
  MOOD_PRESETS,
  SAVED_MOODS_KEY,
  applyMoodFinish,
  captureMood,
  deleteMood,
  listSavedMoods,
  matchesPreset,
  parseSavedMoods,
  saveMood,
} from './moods';
import type { RoomLayout } from './types';

function memoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    get length() {
      return data.size;
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  };
}

function layout(): RoomLayout {
  return {
    ...INITIAL_LAYOUT,
    floors: [
      {
        ...INITIAL_LAYOUT.floors[0]!,
        items: [
          makeItem({ id: 'sofa', type: 'sofa', color: '#123456' }),
          makeItem({ id: 'chair', type: 'chair', color: '#654321', locked: true }),
          makeItem({ id: 'tv', type: 'tv', color: '#000000' }),
        ],
      },
    ],
  };
}

const cozy = MOOD_PRESETS.find((p) => p.key === 'cozy')!;

describe('mood presets', () => {
  it('offers Cozy, Bright and Moody with an hour each', () => {
    expect(MOOD_PRESETS.map((p) => p.key)).toEqual(['cozy', 'bright', 'moody']);
    for (const p of MOOD_PRESETS) expect(p.hour).toBeGreaterThanOrEqual(6);
  });

  it('sets floor, walls and unlocked upholstery in one layout', () => {
    const next = applyMoodFinish(layout(), 0, cozy.finish);
    const floor = next.floors[0]!;
    expect(floor).toMatchObject({ floorColor: '#c9a57d', floorPattern: 'wood', wallPattern: 'solid' });
    expect(floor.wallColors).toEqual({ north: '#d4a04a', east: '#d4a04a', south: '#d4a04a', west: '#d4a04a' });
    expect(floor.items.map((i) => i.color)).toEqual(['#c9963a', '#654321', '#000000']);
    expect(matchesPreset(cozy, floor, cozy.hour)).toBe(true);
    expect(matchesPreset(cozy, floor, 12)).toBe(false);
  });
});

describe('saved moods', () => {
  it('captures, saves and loads a look round-trip', () => {
    const storage = memoryStorage();
    const styled = applyMoodFinish(layout(), 0, cozy.finish);
    const saved = saveMood('Abends', captureMood(styled.floors[0]!, 19.5), storage, 1000);
    expect(saved).not.toBeNull();
    const [mood] = listSavedMoods(storage);
    expect(mood).toMatchObject({ name: 'Abends', hour: 19.5, savedAt: 1000 });
    expect(mood!.finish.upholsteryById).toEqual({ sofa: '#c9963a', chair: '#654321' });

    // Restyle, then load the saved mood back.
    const restyled = applyMoodFinish(styled, 0, MOOD_PRESETS[2]!.finish);
    const loaded = applyMoodFinish(restyled, 0, mood!.finish).floors[0]!;
    expect(loaded.floorColor).toBe('#c9a57d');
    expect(loaded.items[0]!.color).toBe('#c9963a');
  });

  it('overwrites by name, deletes, and caps the list', () => {
    const storage = memoryStorage();
    const state = captureMood(layout().floors[0]!, 12);
    saveMood('A', state, storage, 1);
    saveMood('a', { ...state, hour: 8 }, storage, 2);
    expect(listSavedMoods(storage)).toHaveLength(1);
    expect(listSavedMoods(storage)[0]!.hour).toBe(8);
    deleteMood(listSavedMoods(storage)[0]!.id, storage);
    expect(listSavedMoods(storage)).toEqual([]);
    for (let i = 0; i < MAX_SAVED_MOODS + 3; i++) saveMood(`M${i}`, state, storage, 10 + i);
    expect(listSavedMoods(storage)).toHaveLength(MAX_SAVED_MOODS);
    expect(storage.getItem(SAVED_MOODS_KEY)).toContain('M22');
  });

  it('drops malformed stored entries', () => {
    expect(parseSavedMoods('not json')).toEqual([]);
    expect(parseSavedMoods('{"a":1}')).toEqual([]);
    const good = captureMood(layout().floors[0]!, 10);
    const raw = JSON.stringify([
      { id: 'ok', name: 'Ok', savedAt: 1, ...good },
      { id: 'bad', name: 'Bad', savedAt: 2, hour: 30, finish: good.finish },
      { id: 'bad2', name: 'Bad', savedAt: 3, hour: 9, finish: { ...good.finish, floorPattern: 'lava' } },
    ]);
    expect(parseSavedMoods(raw).map((m) => m.id)).toEqual(['ok']);
  });
});
