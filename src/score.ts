import { Vector3 } from 'three';
import type { ConvexHull } from 'three/addons/math/ConvexHull.js';

// Reusable scratch vectors so the per-vertex angle pass allocates nothing.
const _a = new Vector3();
const _b = new Vector3();

export interface VisibilityAccumulation {
  /** Original indices found on the convex hull (excludes the viewpoint). */
  visibleSet: Set<number>;
  /** Visible index → raw sum of incident interior angles (radians). */
  scores: Map<number, number>;
}

/**
 * Walk every face of the transformed-set convex hull and, for each incident
 * vertex, accumulate the interior angle of that face at the vertex.
 *
 * The traversal is generic over the face's edge loop, so it works whether the
 * hull is triangulated or has coplanar faces merged into larger polygons.
 *
 * @param hull          Convex hull of `transformed points ∪ { viewpoint }`.
 * @param indexOf       Maps each hull point (by reference) to its original
 *                      index, or to `viewpointSentinel` for the viewpoint.
 * @param viewpointSentinel The index reserved for the added viewpoint.
 * @param computeScores When false, only membership is collected (no angles).
 */
export function accumulateVisibility(
  hull: ConvexHull,
  indexOf: Map<Vector3, number>,
  viewpointSentinel: number,
  computeScores: boolean,
): VisibilityAccumulation {
  const visibleSet = new Set<number>();
  const scores = new Map<number, number>();

  for (const face of hull.faces) {
    const start = face.edge;
    let edge = start;
    do {
      const headVertex = edge.head();
      const idx = indexOf.get(headVertex.point);

      if (idx !== undefined && idx !== viewpointSentinel) {
        visibleSet.add(idx);

        if (computeScores) {
          const tailVertex = edge.tail();
          const nextVertex = edge.next.head();
          if (tailVertex) {
            const v = headVertex.point;
            _a.subVectors(tailVertex.point, v);
            _b.subVectors(nextVertex.point, v);
            const angle = _a.angleTo(_b);
            if (Number.isFinite(angle)) {
              scores.set(idx, (scores.get(idx) ?? 0) + angle);
            }
          }
        }
      }

      edge = edge.next;
    } while (edge !== start);
  }

  return { visibleSet, scores };
}
