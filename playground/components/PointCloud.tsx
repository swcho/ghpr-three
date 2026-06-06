import { useEffect, useMemo } from 'react';
import {
  BufferAttribute,
  BufferGeometry,
  Color,
  type Vector3,
} from 'three';
import { computeGHPR, type Kernel } from 'ghpr-three';

export interface PointCloudProps {
  points: Vector3[];
  viewpoint: Vector3;
  kernel: Kernel;
  /** Explicit γ, or `undefined` to let the library auto-estimate it. */
  gamma?: number;
  pointSize: number;
}

/**
 * Renders the point cloud, coloring each point by its GHPR visibility:
 *  - visible points use an HSL ramp from red (low VS) → blue (high VS),
 *  - hidden points are a dim grey.
 *
 * The GHPR result (convex-hull computation) is memoized on its inputs.
 *
 * Performance note: a convex-hull recompute on every viewpoint nudge can be
 * costly for large clouds. For production you'd debounce these inputs or
 * offload `computeGHPR` to a web worker — see the stub in `useGHPRDeferred`
 * below. Here we keep it synchronous for clarity.
 */
export function PointCloud({ points, viewpoint, kernel, gamma, pointSize }: PointCloudProps) {
  const geometry = useMemo(() => {
    const result = computeGHPR(points, viewpoint, { kernel, gamma });

    // Normalize VS across the visible points for the color ramp.
    let min = Infinity;
    let max = -Infinity;
    for (const s of result.scores.values()) {
      if (s < min) min = s;
      if (s > max) max = s;
    }
    const range = max > min ? max - min : 1;

    const n = points.length;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const color = new Color();

    for (let i = 0; i < n; i++) {
      const p = points[i]!;
      positions[i * 3 + 0] = p.x;
      positions[i * 3 + 1] = p.y;
      positions[i * 3 + 2] = p.z;

      if (result.visibleSet.has(i)) {
        const s = result.scores.get(i);
        const t = s === undefined ? 0.5 : (s - min) / range;
        // hue 0 (red, low VS) → 0.66 (blue, high VS)
        color.setHSL(t * 0.66, 1.0, 0.5);
      } else {
        color.setRGB(0.15, 0.15, 0.17);
      }
      colors[i * 3 + 0] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(positions, 3));
    g.setAttribute('color', new BufferAttribute(colors, 3));
    return g;
  }, [points, viewpoint, kernel, gamma]);

  // Release the previous geometry's GPU buffers when inputs change/unmount.
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <points geometry={geometry}>
      <pointsMaterial vertexColors size={pointSize} sizeAttenuation />
    </points>
  );
}
