import { useEffect, type MutableRefObject } from 'react';
import type * as ThreeNS from 'three';

export interface UseFloorHighlightOptions {
  enabled: boolean;
  isReady: boolean;
  invalidate: () => void;
  threeModuleRef: MutableRefObject<typeof import('three') | null>;
  sceneRef: MutableRefObject<ThreeNS.Scene | null>;
  width: number;
  depth: number;
  /** World Y of the active storey's floor. */
  floorY: number;
}

const HIGHLIGHT_COLOR = 0x7ff3ff;

/**
 * Outlines and faintly tints the active floor while it is the material
 * target (Etappe 2), in the same cyan as the selected-wall outline. Built
 * as its own overlay so the room meshes stay untouched.
 */
export function useFloorHighlight({
  enabled,
  isReady,
  invalidate,
  threeModuleRef,
  sceneRef,
  width,
  depth,
  floorY,
}: UseFloorHighlightOptions): void {
  useEffect(() => {
    const THREE = threeModuleRef.current;
    const scene = sceneRef.current;
    if (!enabled || !isReady || !THREE || !scene) return undefined;

    const group = new THREE.Group();
    group.userData.type = 'floor-selection';
    group.position.y = floorY + 0.02;

    const fillGeometry = new THREE.PlaneGeometry(width, depth);
    const fillMaterial = new THREE.MeshBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: 0.12,
      depthWrite: false,
    });
    const fill = new THREE.Mesh(fillGeometry, fillMaterial);
    fill.rotation.x = -Math.PI / 2;
    fill.raycast = () => {};

    const edgeGeometry = new THREE.EdgesGeometry(fillGeometry);
    const edgeMaterial = new THREE.LineBasicMaterial({
      color: HIGHLIGHT_COLOR,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
    });
    const outline = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    outline.rotation.x = -Math.PI / 2;
    outline.renderOrder = 999;
    outline.raycast = () => {};

    group.add(fill, outline);
    scene.add(group);
    invalidate();

    return () => {
      scene.remove(group);
      fillGeometry.dispose();
      fillMaterial.dispose();
      edgeGeometry.dispose();
      edgeMaterial.dispose();
      invalidate();
    };
  }, [enabled, isReady, invalidate, threeModuleRef, sceneRef, width, depth, floorY]);
}
