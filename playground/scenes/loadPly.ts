import { Vector3 } from 'three';
import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';

/**
 * Optional helper: load a `.ply` file and return its vertices as Vector3[]
 * suitable for {@link computeGHPR}.
 *
 * In the playground you can wire this up with drei's `useLoader`:
 *
 * ```tsx
 * import { useLoader } from '@react-three/fiber';
 * import { PLYLoader } from 'three/addons/loaders/PLYLoader.js';
 *
 * const geometry = useLoader(PLYLoader, '/model.ply');
 * const points = geometryToPoints(geometry);
 * ```
 *
 * This standalone loader is handy outside the render loop (e.g. in a worker).
 */
export async function loadPlyPoints(url: string): Promise<Vector3[]> {
  const loader = new PLYLoader();
  const geometry = await loader.loadAsync(url);
  return geometryToPoints(geometry);
}

/** Extract a position attribute into a Vector3[] (one per vertex). */
export function geometryToPoints(geometry: {
  getAttribute: (name: string) => { count: number; getX: (i: number) => number; getY: (i: number) => number; getZ: (i: number) => number } | undefined;
}): Vector3[] {
  const pos = geometry.getAttribute('position');
  if (!pos) return [];
  const pts: Vector3[] = new Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    pts[i] = new Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
  }
  return pts;
}
