import type { FloorPattern, WallPattern } from '../lib/types';
import type { CSSProperties } from 'react';

const LINE = 'rgba(0, 0, 0, 0.28)';

/** A CSS hint of the procedural pattern, so swatches read as wood, tile, fabric… */
function patternOverlay(pattern: FloorPattern | WallPattern): string | undefined {
  switch (pattern) {
    case 'wood':
    case 'siding':
      return `repeating-linear-gradient(0deg, transparent 0 7px, ${LINE} 7px 8px)`;
    case 'panel':
      return `repeating-linear-gradient(90deg, transparent 0 9px, ${LINE} 9px 10px)`;
    case 'tile':
      return `linear-gradient(${LINE} 1px, transparent 1px) 0 0 / 12px 12px, linear-gradient(90deg, ${LINE} 1px, transparent 1px) 0 0 / 12px 12px`;
    case 'brick':
      return `repeating-linear-gradient(0deg, transparent 0 5px, ${LINE} 5px 6px)`;
    case 'carpet':
    case 'wallpaper':
      return `radial-gradient(${LINE} 0.8px, transparent 1px) 0 0 / 4px 4px`;
    case 'concrete':
    case 'plaster':
      return `radial-gradient(rgba(0, 0, 0, 0.12) 1px, transparent 1.4px) 0 0 / 6px 7px`;
    default:
      return undefined;
  }
}

export interface MaterialSwatchProps {
  color: string;
  pattern: FloorPattern | WallPattern;
  size?: number;
  style?: CSSProperties;
}

export function MaterialSwatch({ color, pattern, size = 18, style }: MaterialSwatchProps): JSX.Element {
  const overlay = patternOverlay(pattern);
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: 5,
        flexShrink: 0,
        border: '1px solid rgba(255, 255, 255, 0.35)',
        background: overlay ? `${overlay}, ${color}` : color,
        ...style,
      }}
    />
  );
}
