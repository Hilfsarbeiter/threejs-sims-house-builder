import { computeSkyProfile } from './lighting';
import type { Weather } from '../lib/types';

/** The daylight panel's slider range: early morning to late night. */
export const DAYLIGHT_MIN_HOUR = 6;
export const DAYLIGHT_MAX_HOUR = 23;

export type DaylightPresetKey = 'morning' | 'noon' | 'evening' | 'night';

export const DAYLIGHT_PRESETS: ReadonlyArray<{ key: DaylightPresetKey; label: string; hour: number }> = [
  { key: 'morning', label: 'Morgen', hour: 8 },
  { key: 'noon', label: 'Mittag', hour: 12 },
  { key: 'evening', label: 'Abend', hour: 18 },
  { key: 'night', label: 'Nacht', hour: 22 },
];

/** `hour` pulled into the slider range; the scene itself still runs 0–24. */
export function clampDaylightHour(hour: number): number {
  return Math.min(DAYLIGHT_MAX_HOUR, Math.max(DAYLIGHT_MIN_HOUR, hour));
}

/** "HH:MM" for an hour in [0, 24). */
export function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export interface DaylightSummary {
  /** Sun colour as a CSS hex string. */
  sunColor: string;
  /** Sun intensity as a 0..1 share of the brightest (noon) sun. */
  sunShare: number;
  /** Whether the lamps in the house are lit at this hour. */
  lampsOn: boolean;
}

const NOON_SUN = computeSkyProfile(12).sun.intensity;

/** What the scene's lighting does at `hour`, read off the same sky profile the scene uses. */
export function summarizeDaylight(hour: number, weather: Weather = 'clear'): DaylightSummary {
  const profile = computeSkyProfile(hour, weather);
  return {
    sunColor: `#${profile.sun.color.toString(16).padStart(6, '0')}`,
    sunShare: Math.min(1, profile.sun.intensity / NOON_SUN),
    lampsOn: profile.lamps > 0,
  };
}
