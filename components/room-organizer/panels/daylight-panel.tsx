'use client';

import { useState } from 'react';
import { useRoomEditor } from '../contexts';
import { Icon } from '../plotcraft/icon';
import {
  DAYLIGHT_MAX_HOUR,
  DAYLIGHT_MIN_HOUR,
  DAYLIGHT_PRESETS,
  clampDaylightHour,
  formatHour,
  summarizeDaylight,
} from '../three/daylight';
import { SliderRow } from './slider-row';

/**
 * Floating glass panel for the time of day: a 6–23 h slider, four presets,
 * and a readout of the sun's colour and strength and whether the lamps are
 * on. Drives the same `view.timeOfDay` as the sidebar's TimeOfDayPanel.
 */
export function DaylightPanel(): JSX.Element {
  const { view, setView } = useRoomEditor();
  const [collapsed, setCollapsed] = useState(false);
  const hour = clampDaylightHour(view.timeOfDay);
  const disabled = view.view2D;
  const light = summarizeDaylight(view.timeOfDay, view.weather);
  const setHour = (next: number) => setView((v) => ({ ...v, timeOfDay: next }));

  return (
    <div
      className="pointer-events-auto pc-glass pc-daylight"
      style={{ width: 232, padding: 'var(--pc-s-3)' }}
      title={disabled ? 'Tageslicht gibt es nur in der 3D-Ansicht' : undefined}
    >
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        aria-expanded={!collapsed}
        title={collapsed ? 'Tageslicht anzeigen' : 'Tageslicht ausblenden'}
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
          <Icon name="light" size={12} />
          Tageslicht
        </span>
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatHour(view.timeOfDay)} {collapsed ? '▸' : '▾'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SliderRow
            label="Uhr"
            min={DAYLIGHT_MIN_HOUR}
            max={DAYLIGHT_MAX_HOUR}
            step={0.25}
            value={hour}
            format={formatHour}
            onChange={setHour}
            labelWidth={28}
            disabled={disabled}
          />

          <div
            role="group"
            aria-label="Tageszeit-Presets"
            style={{
              background: 'rgba(0, 0, 0, 0.20)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 3,
              boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.30)',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 3,
              opacity: disabled ? 0.45 : 1,
            }}
          >
            {DAYLIGHT_PRESETS.map((preset) => {
              const isActive = view.timeOfDay === preset.hour;
              return (
                <button
                  key={preset.key}
                  type="button"
                  aria-pressed={isActive}
                  disabled={disabled}
                  onClick={() => setHour(preset.hour)}
                  title={`${preset.label} (${formatHour(preset.hour)})`}
                  className={`pc-tile${isActive ? ' pc-tile--active' : ''}`}
                  style={{
                    height: 30,
                    borderRadius: 7,
                    padding: '2px',
                    fontFamily: 'var(--pc-font-display)',
                    fontWeight: 700,
                    fontSize: 9,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, opacity: disabled ? 0.45 : 0.9 }}
            aria-live="polite"
          >
            <span
              aria-hidden
              title="Lichtfarbe der Sonne"
              style={{
                width: 14,
                height: 14,
                borderRadius: '50%',
                background: light.sunColor,
                border: '1px solid rgba(255, 255, 255, 0.5)',
                flexShrink: 0,
              }}
            />
            <span
              aria-label={`Sonnenstärke ${Math.round(light.sunShare * 100)} %`}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 3,
                background: 'rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  display: 'block',
                  height: '100%',
                  width: `${Math.round(light.sunShare * 100)}%`,
                  background: light.sunColor,
                }}
              />
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, whiteSpace: 'nowrap' }}>
              <Icon name="lamp" size={12} />
              {light.lampsOn ? 'Lampen an' : 'Lampen aus'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
