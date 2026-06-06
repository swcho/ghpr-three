import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { computeGHPR, Kernels } from '../src/index';

/** Deterministic, near-uniform sphere sampling with the pole on +z. */
function fibonacciSphere(n: number): Vector3[] {
  const pts: Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const z = 1 - (i / (n - 1)) * 2; // 1 → -1 (i=0 is the front pole)
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    const theta = golden * i;
    pts.push(new Vector3(Math.cos(theta) * r, Math.sin(theta) * r, z));
  }
  return pts;
}

describe('computeGHPR', () => {
  const N = 800;
  const sphere = fibonacciSphere(N);

  it('returns transformed coordinates aligned to the input order', () => {
    const r = computeGHPR(sphere, new Vector3(0, 0, 3));
    expect(r.transformed).toHaveLength(N);
  });

  describe('unit sphere, external viewpoint on +z axis', () => {
    const r = computeGHPR(sphere, new Vector3(0, 0, 3));

    it('sees only the hemisphere facing the viewpoint (roughly)', () => {
      const frac = r.visible.length / N;
      // True visible cap for d=3, R=1 is ~1/3 of the surface; allow slack.
      expect(frac).toBeGreaterThan(0.15);
      expect(frac).toBeLessThan(0.55);
    });

    it('marks the nearest (front) point visible and the farthest (back) hidden', () => {
      expect(r.visibleSet.has(0)).toBe(true); // z ≈ +1, closest to C
      expect(r.visibleSet.has(N - 1)).toBe(false); // z ≈ -1, occluded
    });

    it('does not leak deep back-hemisphere points into the visible set', () => {
      for (const i of r.visible) {
        expect(sphere[i]!.z).toBeGreaterThan(-0.3);
      }
    });
  });

  it('gives different results for an internal vs external viewpoint', () => {
    const external = computeGHPR(sphere, new Vector3(0, 0, 3));
    const internal = computeGHPR(sphere, new Vector3(0, 0, 0));

    // From the center every surface point is on the convex hull → (nearly) all visible.
    expect(internal.visible.length / N).toBeGreaterThan(0.9);
    // From outside, only a cap is visible — strictly fewer.
    expect(external.visible.length).toBeLessThan(internal.visible.length);
  });

  it('treats a point coincident with the viewpoint (‖p−C‖=0) as always visible', () => {
    const idx = 5;
    const viewpoint = sphere[idx]!.clone(); // exactly on a sample point
    const r = computeGHPR(sphere, viewpoint);
    expect(r.visibleSet.has(idx)).toBe(true);
    expect(r.transformed[idx]!.lengthSq()).toBe(0); // mapped to the origin
  });

  describe('visibility scores (VS)', () => {
    const r = computeGHPR(sphere, new Vector3(0, 0, 3));

    it('produces scores for visible points only', () => {
      expect(r.scores.size).toBeGreaterThan(0);
      for (const idx of r.scores.keys()) {
        expect(r.visibleSet.has(idx)).toBe(true);
      }
    });

    it('has no score for hidden points', () => {
      for (let i = 0; i < N; i++) {
        if (!r.visibleSet.has(i)) {
          expect(r.scores.has(i)).toBe(false);
        }
      }
    });

    it('reports strictly positive angle sums', () => {
      for (const v of r.scores.values()) {
        expect(v).toBeGreaterThan(0);
      }
    });
  });

  it('respects computeScores: false', () => {
    const r = computeGHPR(sphere, new Vector3(0, 0, 3), { computeScores: false });
    expect(r.visible.length).toBeGreaterThan(0);
    expect(r.scores.size).toBe(0);
  });

  it('works with the natural kernel', () => {
    const r = computeGHPR(sphere, new Vector3(0, 0, 3), { kernel: Kernels.natural });
    const frac = r.visible.length / N;
    expect(frac).toBeGreaterThan(0.05);
    expect(frac).toBeLessThan(0.8);
    expect(r.visibleSet.has(0)).toBe(true);
  });
});
