import type { Kernel } from './types';

/**
 * The three example GHPR kernels from Katz & Tal, *"On the Visibility of Point
 * Clouds"* (ICCV 2015), §2.
 *
 * Each is positive and monotonically decreasing over its valid `γ` range, so
 * each is a legal inversion kernel for {@link computeGHPR}.
 */
export const Kernels: {
  /** Linear / "spherical-flipping" kernel `f(d) = γ − d`, valid for `γ ≥ max‖p−C‖`. */
  mirror: Kernel;
  /** Power kernel `f(d) = d^γ`, valid for `γ < 0`. */
  exponential: Kernel;
  /** Natural-exponential kernel `f(d) = e^(−γd)`, valid for `γ > 0`. */
  natural: Kernel;
} = {
  mirror: (d, gamma) => gamma - d,
  exponential: (d, gamma) => Math.pow(d, gamma),
  natural: (d, gamma) => Math.exp(-gamma * d),
};

/**
 * Suggest a sensible `γ` for a given kernel and point-cloud extent.
 *
 * @param kernel  One of {@link Kernels} (matched by reference). Unknown kernels
 *                fall back to the mirror heuristic.
 * @param maxDist The largest `‖p − C‖` in the (viewpoint-centered) point cloud.
 *
 * Heuristics:
 *  - **mirror**: `2·maxDist` — comfortably satisfies `γ ≥ maxDist` while keeping
 *    `f(d) > 0` strictly (this reproduces classic spherical-flipping HPR).
 *  - **exponential**: `−2` — a moderate inversion; `γ → 0⁻` flattens the kernel
 *    and makes more points visible, while more-negative `γ` is more selective.
 *  - **natural**: `1/maxDist` — scale-aware so the exponential decays by ~`e⁻¹`
 *    across the cloud's extent.
 */
export function suggestGamma(kernel: Kernel, maxDist: number): number {
  const safeMax = maxDist > 0 && Number.isFinite(maxDist) ? maxDist : 1;
  if (kernel === Kernels.exponential) return -2;
  if (kernel === Kernels.natural) return 1 / safeMax;
  // mirror and any unknown kernel
  return 2 * safeMax;
}
