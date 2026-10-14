'use client';

import { useEffect, useState } from 'react';
import { useRoomEditor } from '../contexts';
import { notify } from '../lib/editor-notices';
import {
  MAX_MOOD_NAME_LENGTH,
  MOOD_PRESETS,
  applyMoodFinish,
  captureMood,
  deleteMood,
  listSavedMoods,
  matchesPreset,
  saveMood,
  type MoodState,
  type SavedMood,
} from '../lib/moods';
import { Icon } from '../plotcraft/icon';
import { formatHour } from '../three/daylight';
import { MaterialSwatch } from './material-swatch';

const insetBox = {
  background: 'rgba(0, 0, 0, 0.20)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 10,
  padding: 3,
  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.30)',
} as const;

const tileText = {
  fontFamily: 'var(--pc-font-display)',
  fontWeight: 700,
  fontSize: 9,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
} as const;

/**
 * Glass panel for moods (Etappe 3): the Cozy / Bright / Moody presets set
 * floor, walls, upholstery and the time of day in one go; the current look
 * can be saved under a name and loaded back later.
 */
export function MoodPanel(): JSX.Element {
  const { layout, activeFloor, activeFloorIndex, actions, view, setView, playCue } = useRoomEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [name, setName] = useState('');
  // Read after mount: localStorage is not there during the server render.
  const [saved, setSaved] = useState<SavedMood[]>([]);
  useEffect(() => setSaved(listSavedMoods()), []);

  const applyMood = (mood: MoodState) => {
    actions.applyLayout(applyMoodFinish(layout, activeFloorIndex, mood.finish));
    setView((v) => ({ ...v, timeOfDay: mood.hour }));
    playCue('place');
  };

  const save = () => {
    const next = saveMood(name, captureMood(activeFloor, view.timeOfDay));
    if (!next) {
      notify('Stimmung konnte nicht gespeichert werden (Speicher voll oder gesperrt).', 'error');
      return;
    }
    setSaved(next);
    setName('');
    notify(`Stimmung „${next[0]!.name}“ gespeichert.`, 'success');
  };

  const remove = (mood: SavedMood) => {
    const next = deleteMood(mood.id);
    if (next) setSaved(next);
  };

  return (
    <div className="pointer-events-auto pc-glass pc-moods" style={{ width: 232, padding: 'var(--pc-s-3)' }}>
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Stimmungen anzeigen' : 'Stimmungen ausblenden'}
        className="pc-hud-header"
        style={{
          fontSize: 11,
          marginBottom: collapsed ? 0 : 8,
          paddingLeft: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Icon name="sparkle" size={12} />
          Stimmungen
        </span>
        <span>{collapsed ? '▸' : '▾'}</span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div role="group" aria-label="Stimmungs-Presets" style={{ ...insetBox, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {MOOD_PRESETS.map((preset) => {
              const isActive = matchesPreset(preset, activeFloor, view.timeOfDay);
              return (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => applyMood(preset)}
                  title={`${preset.description} (${formatHour(preset.hour)})`}
                  className={`pc-tile${isActive ? ' pc-tile--active' : ''}`}
                  style={{
                    height: 44,
                    borderRadius: 7,
                    padding: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    ...tileText,
                  }}
                >
                  <span style={{ display: 'flex', gap: 2 }}>
                    <MaterialSwatch color={preset.finish.floorColor} pattern={preset.finish.floorPattern} size={10} />
                    <MaterialSwatch color={preset.finish.wallColors.north} pattern={preset.finish.wallPattern} size={10} />
                    <MaterialSwatch color={preset.finish.upholsteryColor ?? '#888888'} pattern="carpet" size={10} />
                  </span>
                  {preset.label}
                </button>
              );
            })}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              save();
            }}
            style={{ display: 'flex', gap: 4 }}
          >
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={MAX_MOOD_NAME_LENGTH}
              placeholder="Name der Stimmung"
              aria-label="Name der Stimmung"
              style={{
                flex: 1,
                minWidth: 0,
                height: 26,
                padding: '0 8px',
                borderRadius: 7,
                fontSize: 11,
                color: 'inherit',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
              }}
            />
            <button
              type="submit"
              className="pc-tile"
              title="Materialien und Uhrzeit dieser Etage speichern"
              style={{ height: 26, borderRadius: 7, padding: '0 8px', ...tileText }}
            >
              Speichern
            </button>
          </form>

          {saved.length > 0 && (
            <ul
              aria-label="Gespeicherte Stimmungen"
              style={{
                ...insetBox,
                listStyle: 'none',
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                maxHeight: 150,
                overflowY: 'auto',
              }}
            >
              {saved.map((mood) => (
                <li key={mood.id} style={{ display: 'flex', gap: 2 }}>
                  <button
                    type="button"
                    onClick={() => applyMood(mood)}
                    title={`„${mood.name}“ laden`}
                    className="pc-tile"
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 6px',
                      borderRadius: 7,
                      textAlign: 'left',
                      fontSize: 11,
                    }}
                  >
                    <MaterialSwatch color={mood.finish.floorColor} pattern={mood.finish.floorPattern} size={14} />
                    <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mood.name}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.75, fontVariantNumeric: 'tabular-nums' }}>
                      {formatHour(mood.hour)}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(mood)}
                    aria-label={`„${mood.name}“ löschen`}
                    title="Löschen"
                    className="pc-tile"
                    style={{ width: 26, borderRadius: 7, padding: 0, fontSize: 12 }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
