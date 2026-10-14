import { describe, expect, it } from 'vitest';
import {
  DAYLIGHT_MAX_HOUR,
  DAYLIGHT_MIN_HOUR,
  DAYLIGHT_PRESETS,
  clampDaylightHour,
  formatHour,
  summarizeDaylight,
} from './daylight';

describe('daylight', () => {
  it('clamps hours into the slider range', () => {
    expect(clampDaylightHour(2)).toBe(DAYLIGHT_MIN_HOUR);
    expect(clampDaylightHour(23.75)).toBe(DAYLIGHT_MAX_HOUR);
    expect(clampDaylightHour(14.5)).toBe(14.5);
  });

  it('keeps every preset inside the slider range', () => {
    for (const preset of DAYLIGHT_PRESETS) {
      expect(clampDaylightHour(preset.hour)).toBe(preset.hour);
    }
  });

  it('formats hours as HH:MM', () => {
    expect(formatHour(6)).toBe('06:00');
    expect(formatHour(18.25)).toBe('18:15');
  });

  it('lights the lamps at night only', () => {
    expect(summarizeDaylight(12).lampsOn).toBe(false);
    expect(summarizeDaylight(22).lampsOn).toBe(true);
  });

  it('runs the sun brightest and whitest at noon, warmer in the morning', () => {
    const noon = summarizeDaylight(12);
    const morning = summarizeDaylight(8);
    expect(noon.sunShare).toBe(1);
    expect(morning.sunShare).toBeLessThan(1);
    expect(noon.sunColor).toBe('#ffffff');
    expect(morning.sunColor).not.toBe('#ffffff');
    expect(summarizeDaylight(22).sunShare).toBe(0);
  });
});
