'use client';

import { useState } from 'react';
import { useRoomEditor } from '../contexts';
import {
  MATERIAL_CATEGORIES,
  MATERIALS,
  WALL_LABELS,
  applyMaterial,
  materialFits,
  surfaceKindOf,
  type MaterialCategory,
  type MaterialDef,
  type MaterialTarget,
} from '../lib/materials';
import { MaterialSwatch } from './material-swatch';

export interface MaterialStripProps {
  target: MaterialTarget | null;
}

function targetLabel(target: MaterialTarget, itemName: string | undefined): string {
  switch (target.kind) {
    case 'floor':
      return 'Boden';
    case 'wall':
      return WALL_LABELS[target.wall];
    case 'all-walls':
      return 'Alle Wände';
    case 'interior-wall':
      return 'Innenwand';
    case 'upholstery':
      return `Polster: ${itemName ?? 'Sitzmöbel'}`;
  }
}

/**
 * Bottom strip in material mode (Etappe 2): the catalog by category; a
 * click applies the material to the surface picked in the 3D view, as one
 * undo step. Replaces the furniture catalog strip while material mode is on.
 */
export function MaterialStrip({ target }: MaterialStripProps): JSX.Element {
  const { layout, activeFloor, activeFloorIndex, actions, playCue } = useRoomEditor();
  const [category, setCategory] = useState<MaterialCategory>('wood');
  const [allWalls, setAllWalls] = useState(false);

  const surface = target ? surfaceKindOf(target) : null;
  const isOuterWall = target?.kind === 'wall';
  const effectiveTarget: MaterialTarget | null = isOuterWall && allWalls ? { kind: 'all-walls' } : target;
  const item = target?.kind === 'upholstery' ? activeFloor.items.find((i) => i.id === target.itemId) : undefined;
  const materials = MATERIALS.filter((m) => m.category === category);

  const apply = (material: MaterialDef) => {
    if (!effectiveTarget) return;
    const next = applyMaterial(layout, activeFloorIndex, effectiveTarget, material);
    if (next === layout) return;
    actions.applyLayout(next);
    playCue('place');
  };

  const hint = !target
    ? 'Boden, Wand oder Polstermöbel im 3D-Raum anklicken'
    : item?.locked
      ? 'Möbel ist gesperrt'
      : isOuterWall
        ? 'Das Wandmuster gilt für alle Außenwände dieser Etage'
        : null;

  return (
    <div
      className="pointer-events-auto pc-glass pc-material-strip"
      style={{ width: 540, maxWidth: '100%', padding: '10px 14px 12px' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
        <span className="pc-hud-header" style={{ fontSize: 12 }}>
          Materialien
        </span>
        <span
          aria-live="polite"
          style={{ fontSize: 11, color: target ? 'var(--pc-cyan-glow)' : 'inherit', opacity: target ? 1 : 0.7 }}
        >
          {target ? `→ ${targetLabel(effectiveTarget ?? target, item?.name)}` : 'Keine Fläche gewählt'}
        </span>
        <div style={{ flex: 1 }} />
        {isOuterWall && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, cursor: 'pointer' }}>
            <input type="checkbox" checked={allWalls} onChange={(e) => setAllWalls(e.target.checked)} />
            Alle Wände
          </label>
        )}
      </div>

      <div role="tablist" aria-label="Materialkategorien" style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {MATERIAL_CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={category === c.key}
            onClick={() => setCategory(c.key)}
            className={`pc-tile${category === c.key ? ' pc-tile--active' : ''}`}
            style={{
              flex: 1,
              height: 26,
              borderRadius: 7,
              fontFamily: 'var(--pc-font-display)',
              fontWeight: 700,
              fontSize: 10,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div
        role="tabpanel"
        style={{
          background: 'rgba(0, 0, 0, 0.20)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 14,
          padding: 8,
          boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.35)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))',
          gap: 6,
        }}
      >
        {materials.map((material) => {
          const fits = surface ? materialFits(material, surface) : true;
          const disabled = !target || !fits || item?.locked === true;
          const pattern = surface === 'wall' ? material.wallPattern : material.floorPattern;
          return (
            <button
              key={material.id}
              type="button"
              onClick={() => apply(material)}
              disabled={disabled}
              title={fits ? material.name : `${material.name} passt nicht auf Polster`}
              className="pc-tile"
              style={{
                height: 60,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                padding: 4,
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
              }}
            >
              <MaterialSwatch color={material.color} pattern={pattern} size={28} />
              <span style={{ fontSize: 9, fontWeight: 700, lineHeight: 1.1, textAlign: 'center' }}>{material.name}</span>
            </button>
          );
        })}
      </div>

      {hint && <div style={{ fontSize: 10, opacity: 0.7, marginTop: 6 }}>{hint}</div>}
    </div>
  );
}
