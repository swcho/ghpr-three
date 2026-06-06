import type * as THREE from 'three';

/**
 * A GHPR inversion kernel `f(d, γ)`.
 *
 * Given the distance `d = ‖p − C‖` of a point from the viewpoint `C` and a
 * shape parameter `γ`, it returns the (positive) radius the point is mapped to
 * during the radial transform `F(p) = (p/‖p‖)·f(‖p‖)`.
 *
 * To be a valid GHPR kernel a function must be:
 *  - **positive**: `f(d) > 0` for all `d` in the point cloud's range, and
 *  - **monotonically decreasing**: `f'(d) < 0`.
 *
 * These two properties guarantee that points near the viewpoint are pushed
 * out and far points are pulled in, so the convex hull of the transformed set
 * recovers exactly the visible points.
 */
export type Kernel = (d: number, gamma: number) => number;

export interface GHPROptions {
  /** Inversion kernel. Defaults to {@link Kernels.mirror}. */
  kernel?: Kernel;
  /**
   * Kernel shape parameter `γ`. When omitted it is auto-estimated from the
   * kernel and the point cloud extent via {@link suggestGamma}.
   */
  gamma?: number;
  /**
   * Whether to compute per-point visibility scores (VS). Defaults to `true`.
   * Set to `false` to skip the (cheap) angle accumulation pass.
   */
  computeScores?: boolean;
}

export interface GHPRResult {
  /** Original indices of the visible points, ascending. */
  visible: number[];
  /** The visible indices as a Set, for O(1) membership queries. */
  visibleSet: Set<number>;
  /**
   * Map of visible original index → visibility score (VS): the raw sum, in
   * radians, of the interior angles of the convex-hull faces incident to the
   * point. Not normalized. Hidden points are absent from the map.
   */
  scores: Map<number, number>;
  /**
   * The radially transformed coordinates, aligned to the original input order
   * (`transformed[i]` corresponds to `points[i]`). Points coincident with the
   * viewpoint (`‖p−C‖ = 0`) are mapped to the origin.
   */
  transformed: THREE.Vector3[];
}
