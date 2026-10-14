'use client';

import { useState } from 'react';
import { useRoomEditor } from '../contexts';
import { moodboardEntries, sameTarget, type MaterialTarget } from '../lib/materials';
import { Icon } from '../plotcraft/icon';
import { MaterialSwatch } from './material-swatch';

export interface MoodboardPanelProps {
  /** Material mode: the bottom strip shows materials and the floor is clickable. */
  active: boolean;
  onActiveChange(active: boolean): void;
  target: MaterialTarget | null;
  /** Row click: select that surface, as if it was clicked in 3D. */
  onSelectTarget(target: MaterialTarget): void;
}

/**
 * Glass panel listing the material of every surface on the active floor —
 * floor, the four outer walls and each upholstered seat — and the switch
 * into material mode (Etappe 2).
 */
export function MoodboardPanel({ active, onActiveChange, target, onSelectTarget }: MoodboardPanelProps): JSX.Element {
  const { activeFloor } = useRoomEditor();
  const [collapsed, setCollapsed] = useState(false);
  const entries = moodboardEntries(activeFloor);
  const wallPattern = activeFloor.wallPattern ?? 'solid';
  const floorPattern = activeFloor.floorPattern ?? 'solid';

  return (
    <div className="pointer-events-auto pc-glass pc-moodboard" style={{ width: 232, padding: 'var(--pc-s-3)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: collapsed ? 0 : 8 }}>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
          title={collapsed ? 'Moodboard anzeigen' : 'Moodboard ausblenden'}
          className="pc-hud-header"
          style={{
            fontSize: 11,
            paddingLeft: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flex: 1,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'inherit',
          }}
        >
          <Icon name="sparkle" size={12} />
          Moodboard
          <span style={{ marginLeft: 'auto' }}>{collapsed ? '▸' : '▾'}</span>
        </button>
        <button
          type="button"
          aria-pressed={active}
          onClick={() => onActiveChange(!active)}
          title={active ? 'Materialmodus beenden' : 'Flächen anklicken und Materialien zuweisen'}
          className={`pc-tile${active ? ' pc-tile--active' : ''}`}
          style={{
            height: 24,
            borderRadius: 6,
            padding: '0 8px',
            fontFamily: 'var(--pc-font-display)',
            fontWeight: 700,
            fontSize: 9,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          {active ? 'Fertig' : 'Bearbeiten'}
        </button>
      </div>

      {!collapsed && (
        <ul
          aria-label="Materialzuordnung"
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            maxHeight: 220,
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.20)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 10,
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.30)',
          }}
        >
          {entries.map((entry) => {
            const selected = sameTarget(entry.target, target);
            const pattern = entry.target.kind === 'floor'
              ? floorPattern
              : entry.target.kind === 'wall'
                ? wallPattern
                : 'carpet';
            return (
              <li key={entry.key}>
                <button
                  type="button"
                  onClick={() => {
                    if (!active) onActiveChange(true);
                    onSelectTarget(entry.target);
                  }}
                  aria-pressed={selected}
                  className={`pc-tile${selected ? ' pc-tile--active' : ''}`}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 6px',
                    borderRadius: 7,
                    textAlign: 'left',
                    fontSize: 11,
                  }}
                >
                  <MaterialSwatch color={entry.color} pattern={pattern} />
                  <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      opacity: entry.material ? 0.95 : 0.6,
                      fontStyle: entry.material ? 'normal' : 'italic',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: 100,
                    }}
                    title={entry.finish}
                  >
                    {entry.finish}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
