import { describe, expect, it } from 'vitest';
import { makeItem } from './__testfixtures__/fixtures';
import { INITIAL_LAYOUT } from './initial-layout';
import {
  MATERIAL_CATEGORIES,
  MATERIALS,
  applyMaterial,
  findMaterial,
  moodboardEntries,
  sameTarget,
  type MaterialDef,
} from './materials';
import type { RoomLayout } from './types';

const byId = (id: string): MaterialDef => {
  const material = MATERIALS.find((m) => m.id === id);
  if (!material) throw new Error(`missing material ${id}`);
  return material;
};

function layoutWith(items = [makeItem({ id: 'sofa-1', type: 'sofa', name: 'Sofa', color: '#123456' })]): RoomLayout {
  return {
    ...INITIAL_LAYOUT,
    floors: [{ ...INITIAL_LAYOUT.floors[0]!, items, interiorWalls: [{ id: 'iw', x1: 0, z1: 0, x2: 1, z2: 0 }] }],
  };
}

describe('material catalog', () => {
  it('covers all four categories with unique ids', () => {
    for (const { key } of MATERIAL_CATEGORIES) {
      expect(MATERIALS.some((m) => m.category === key)).toBe(true);
    }
    expect(new Set(MATERIALS.map((m) => m.id)).size).toBe(MATERIALS.length);
  });
});

describe('applyMaterial', () => {
  it('sets floor colour and pattern', () => {
    const next = applyMaterial(layoutWith(), 0, { kind: 'floor' }, byId('marble'));
    expect(next.floors[0]).toMatchObject({ floorColor: '#f0e8da', floorPattern: 'tile' });
  });

  it('paints one wall and switches the storey wall pattern', () => {
    const next = applyMaterial(layoutWith(), 0, { kind: 'wall', wall: 'east' }, byId('brick'));
    expect(next.floors[0]!.wallColors).toEqual({ east: '#a0522d' });
    expect(next.floors[0]!.wallPattern).toBe('brick');
  });

  it('paints all four walls at once', () => {
    const next = applyMaterial(layoutWith(), 0, { kind: 'all-walls' }, byId('sage'));
    expect(next.floors[0]!.wallColors).toEqual({ north: '#b8c8a8', east: '#b8c8a8', south: '#b8c8a8', west: '#b8c8a8' });
  });

  it('colours an interior wall', () => {
    const next = applyMaterial(layoutWith(), 0, { kind: 'interior-wall', id: 'iw' }, byId('ochre'));
    expect(next.floors[0]!.interiorWalls![0]!.color).toBe('#d4a04a');
  });

  it('covers upholstery with fabric, refuses wood', () => {
    const layout = layoutWith();
    const target = { kind: 'upholstery', itemId: 'sofa-1' } as const;
    expect(applyMaterial(layout, 0, target, byId('linen')).floors[0]!.items[0]!.color).toBe('#e5dcc8');
    expect(applyMaterial(layout, 0, target, byId('walnut'))).toBe(layout);
  });

  it('leaves locked items alone', () => {
    const layout = layoutWith([makeItem({ id: 'sofa-1', type: 'sofa', color: '#123456', locked: true })]);
    const next = applyMaterial(layout, 0, { kind: 'upholstery', itemId: 'sofa-1' }, byId('linen'));
    expect(next.floors[0]!.items[0]!.color).toBe('#123456');
  });
});

describe('moodboardEntries', () => {
  it('lists floor, four walls and upholstered items with their materials', () => {
    const layout = applyMaterial(layoutWith([
      makeItem({ id: 'sofa-1', type: 'sofa', name: 'Sofa', color: '#E5DCC8' }),
      makeItem({ id: 'tv', type: 'tv', name: 'TV' }),
    ]), 0, { kind: 'wall', wall: 'north' }, byId('brick'));
    const entries = moodboardEntries(layout.floors[0]!);
    expect(entries.map((e) => e.key)).toEqual(['floor', 'wall-north', 'wall-east', 'wall-south', 'wall-west', 'item-sofa-1']);
    // Initial floor is #c9a57d wood → "Eiche".
    expect(entries[0]!.material?.id).toBe('oak');
    expect(entries[1]!.material?.id).toBe('brick');
    // Other walls got the brick pattern but kept the default colour.
    expect(entries[2]!.material).toBeUndefined();
    expect(entries[2]!.finish).toBe('Mauerwerk, eigene Farbe');
    expect(entries[5]!.finish).toBe('Leinen');
  });
});

describe('helpers', () => {
  it('findMaterial needs a matching pattern on floors', () => {
    expect(findMaterial('floor', '#c9a57d', 'wood')?.id).toBe('oak');
    expect(findMaterial('floor', '#c9a57d', 'tile')).toBeUndefined();
  });

  it('sameTarget compares kind and id', () => {
    expect(sameTarget({ kind: 'wall', wall: 'north' }, { kind: 'wall', wall: 'north' })).toBe(true);
    expect(sameTarget({ kind: 'wall', wall: 'north' }, { kind: 'wall', wall: 'south' })).toBe(false);
    expect(sameTarget({ kind: 'floor' }, null)).toBe(false);
  });
});
