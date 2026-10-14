import { useCallback, useEffect, useState } from 'react';
import { isUpholstered, type MaterialTarget } from '../lib/materials';
import type { FurnitureItem, WallId } from '../lib/types';

export interface UseMaterialTargetOptions {
  /** Material mode on: the floor becomes clickable and targets follow the selection. */
  enabled: boolean;
  selectedWall: { id: string; kind: 'exterior' | 'interior' } | null;
  selectedItem: FurnitureItem | null;
  /** Floor switches drop the target, like the wall/item selections. */
  activeFloorId: string;
}

export interface UseMaterialTargetResult {
  target: MaterialTarget | null;
  /** Floor click in material mode. The caller clears the wall/item selection. */
  selectFloor(): void;
  clearTarget(): void;
}

/**
 * The surface the material strip paints (Etappe 2). Walls and seating reuse
 * the existing wall/item selections; whichever was picked last wins. Only
 * the floor needs its own flag, since a plain floor click selects nothing.
 */
export function useMaterialTarget({
  enabled,
  selectedWall,
  selectedItem,
  activeFloorId,
}: UseMaterialTargetOptions): UseMaterialTargetResult {
  const [target, setTarget] = useState<MaterialTarget | null>(null);

  useEffect(() => {
    if (!selectedWall) {
      setTarget((t) => (t?.kind === 'wall' || t?.kind === 'interior-wall' ? null : t));
      return;
    }
    setTarget(
      selectedWall.kind === 'interior'
        ? { kind: 'interior-wall', id: selectedWall.id }
        : { kind: 'wall', wall: selectedWall.id as WallId }
    );
  }, [selectedWall]);

  const upholsteredId = selectedItem && isUpholstered(selectedItem) ? selectedItem.id : null;
  useEffect(() => {
    if (!upholsteredId) {
      setTarget((t) => (t?.kind === 'upholstery' ? null : t));
      return;
    }
    setTarget({ kind: 'upholstery', itemId: upholsteredId });
  }, [upholsteredId]);

  useEffect(() => {
    if (!enabled) setTarget((t) => (t?.kind === 'floor' ? null : t));
  }, [enabled]);

  useEffect(() => {
    setTarget(null);
  }, [activeFloorId]);

  const selectFloor = useCallback(() => setTarget({ kind: 'floor' }), []);
  const clearTarget = useCallback(() => setTarget(null), []);

  return { target: enabled ? target : null, selectFloor, clearTarget };
}
