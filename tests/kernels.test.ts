import { describe, expect, it } from 'vitest';
import { Kernels, suggestGamma } from '../src/index';

// Numerical derivative for monotonicity checks.
function deriv(f: (d: number) => number, d: number, h = 1e-5): number {
  return (f(d + h) - f(d - h)) / (2 * h);
}

const SAMPLE_DS = [0.05, 0.2, 0.5, 1, 1.7, 2.5, 4, 6];

describe('Kernels — paper properties (Katz & Tal §2)', () => {
  describe('mirror f(d) = γ − d, γ ≥ max‖p−C‖', () => {
    const gamma = 8; // ≥ all sample distances
    it('is strictly positive over the valid range', () => {
      for (const d of SAMPLE_DS) {
        expect(Kernels.mirror(d, gamma)).toBeGreaterThan(0);
      }
    });
    it('is monotonically decreasing (f′ < 0)', () => {
      for (const d of SAMPLE_DS) {
        expect(deriv((x) => Kernels.mirror(x, gamma), d)).toBeLessThan(0);
      }
    });
    it('has the exact linear form γ − d', () => {
      expect(Kernels.mirror(3, 10)).toBeCloseTo(7, 12);
    });
  });

  describe('exponential f(d) = d^γ, γ < 0', () => {
    const gamma = -2;
    it('is strictly positive', () => {
      for (const d of SAMPLE_DS) {
        expect(Kernels.exponential(d, gamma)).toBeGreaterThan(0);
      }
    });
    it('is monotonically decreasing (f′ < 0)', () => {
      for (const d of SAMPLE_DS) {
        expect(deriv((x) => Kernels.exponential(x, gamma), d)).toBeLessThan(0);
      }
    });
    it('flattens toward 1 as γ → 0⁻ (more points pass)', () => {
      // Smaller |γ| ⇒ values closer to 1 ⇒ weaker inversion.
      const near0 = Kernels.exponential(4, -0.05);
      const strong = Kernels.exponential(4, -2);
      expect(Math.abs(near0 - 1)).toBeLessThan(Math.abs(strong - 1));
    });
  });

  describe('natural f(d) = e^(−γd), γ > 0', () => {
    const gamma = 1.5;
    it('is strictly positive', () => {
      for (const d of SAMPLE_DS) {
        expect(Kernels.natural(d, gamma)).toBeGreaterThan(0);
      }
    });
    it('is monotonically decreasing (f′ < 0)', () => {
      for (const d of SAMPLE_DS) {
        expect(deriv((x) => Kernels.natural(x, gamma), d)).toBeLessThan(0);
      }
    });
    it('decays by ~e⁻¹ across 1/γ', () => {
      expect(Kernels.natural(1 / gamma, gamma)).toBeCloseTo(Math.exp(-1), 12);
    });
  });
});

describe('suggestGamma', () => {
  const maxDist = 4;

  it('mirror suggestion satisfies γ ≥ maxDist (and keeps f > 0)', () => {
    const g = suggestGamma(Kernels.mirror, maxDist);
    expect(g).toBeGreaterThanOrEqual(maxDist);
    expect(Kernels.mirror(maxDist, g)).toBeGreaterThan(0);
  });

  it('exponential suggestion is negative', () => {
    expect(suggestGamma(Kernels.exponential, maxDist)).toBeLessThan(0);
  });

  it('natural suggestion is positive', () => {
    expect(suggestGamma(Kernels.natural, maxDist)).toBeGreaterThan(0);
  });

  it('falls back gracefully for a degenerate maxDist', () => {
    expect(Number.isFinite(suggestGamma(Kernels.mirror, 0))).toBe(true);
    expect(Number.isFinite(suggestGamma(Kernels.natural, 0))).toBe(true);
  });
});
