import { Vector3 } from 'three';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { Kernels, suggestGamma } from './kernels';
import { accumulateVisibility } from './score';
import type { GHPROptions, GHPRResult } from './types';

// Index reserved for the viewpoint we inject into the hull input. Negative so
// it can never collide with a real (>= 0) point index.
const VIEWPOINT_SENTINEL = -1;

/**
 * Generalized Hidden Point Removal (Katz & Tal, ICCV 2015).
 *
 * Determines which points of a cloud are visible from `viewpoint`, without any
 * surface reconstruction, by:
 *  1. translating the cloud so the viewpoint is the origin,
 *  2. applying a radial inversion `F(p) = (p/‖p‖)·f(‖p‖)` with a monotonically
 *     decreasing, positive kernel `f`,
 *  3. computing the convex hull of the transformed points together with the
 *     viewpoint (origin), and
 *  4. reporting the points that landed on that hull as visible.
 *
 * @param points    The point cloud.
 * @param viewpoint The camera / observer position `C`.
 * @param options   Kernel, `γ`, and scoring options. See {@link GHPROptions}.
 */
export function computeGHPR(
  points: Vector3[],
  viewpoint: Vector3,
  options: GHPROptions = {},
): GHPRResult {
  const kernel = options.kernel ?? Kernels.mirror;
  const computeScores = options.computeScores ?? true;
  const n = points.length;

  // Step 0 — translate so the viewpoint sits at the origin; track extent.
  const centered: Vector3[] = new Array(n);
  const distances: number[] = new Array(n);
  let maxDist = 0;
  for (let i = 0; i < n; i++) {
    const q = new Vector3().subVectors(points[i]!, viewpoint);
    const d = q.length();
    centered[i] = q;
    distances[i] = d;
    if (d > maxDist) maxDist = d;
  }

  const gamma = options.gamma ?? suggestGamma(kernel, maxDist);

  // Step 1 — radial transform. Points coincident with the viewpoint (‖q‖ = 0)
  // cannot be inverted; per the paper they are always visible.
  const transformed: Vector3[] = new Array(n);
  const indexOf = new Map<Vector3, number>();
  const forcedVisible: number[] = [];
  const hullInput: Vector3[] = [];

  for (let i = 0; i < n; i++) {
    const q = centered[i]!;
    const d = distances[i]!;
    if (d === 0) {
      transformed[i] = new Vector3(0, 0, 0);
      forcedVisible.push(i);
      continue;
    }
    const radius = kernel(d, gamma);
    const t = q.clone().multiplyScalar(radius / d);
    transformed[i] = t;
    indexOf.set(t, i);
    hullInput.push(t);
  }

  // Step 1 (cont.) — add the viewpoint itself to the transformed set.
  const origin = new Vector3(0, 0, 0);
  indexOf.set(origin, VIEWPOINT_SENTINEL);
  hullInput.push(origin);

  const visibleSet = new Set<number>(forcedVisible);
  let scores = new Map<number, number>();

  if (hullInput.length >= 4) {
    // Steps 2–3 — convex hull, then read off visible points and their VS.
    const hull = new ConvexHull().setFromPoints(hullInput);
    const acc = accumulateVisibility(hull, indexOf, VIEWPOINT_SENTINEL, computeScores);
    for (const idx of acc.visibleSet) visibleSet.add(idx);
    scores = acc.scores;
  } else {
    // Fewer than 4 points: a hull is undefined, so everything is visible.
    for (let i = 0; i < n; i++) visibleSet.add(i);
  }

  const visible = Array.from(visibleSet).sort((a, b) => a - b);
  return { visible, visibleSet, scores, transformed };
}
