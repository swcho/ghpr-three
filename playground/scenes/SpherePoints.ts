import { Vector3 } from 'three';

export type ShapeKind = 'sphere' | 'torus' | 'box';

/**
 * A small, deterministic PRNG (mulberry32) so a given (shape, count, seed)
 * always produces the same cloud — handy for stable visuals while tweaking
 * kernels in the leva panel.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Sample `count` points on a unit sphere surface (radius 1). */
export function sphereSurface(count: number, rng: () => number): Vector3[] {
  const pts: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    // Uniform on a sphere via inverse-CDF on z.
    const z = 2 * rng() - 1;
    const theta = 2 * Math.PI * rng();
    const r = Math.sqrt(Math.max(0, 1 - z * z));
    pts.push(new Vector3(r * Math.cos(theta), r * Math.sin(theta), z));
  }
  return pts;
}

/** Sample `count` points on a torus surface (major R = 1, minor r = 0.35). */
export function torusSurface(count: number, rng: () => number): Vector3[] {
  const R = 1;
  const r = 0.35;
  const pts: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const u = 2 * Math.PI * rng(); // around the tube
    const v = 2 * Math.PI * rng(); // around the center
    const x = (R + r * Math.cos(u)) * Math.cos(v);
    const y = (R + r * Math.cos(u)) * Math.sin(v);
    const z = r * Math.sin(u);
    pts.push(new Vector3(x, y, z));
  }
  return pts;
}

/** Sample `count` points on the surface of an axis-aligned cube (side 1.6). */
export function boxSurface(count: number, rng: () => number): Vector3[] {
  const half = 0.8;
  const pts: Vector3[] = [];
  for (let i = 0; i < count; i++) {
    // Pick a face, then a uniform point on it.
    const face = Math.floor(rng() * 6);
    const a = rng() * 2 - 1;
    const b = rng() * 2 - 1;
    let p: Vector3;
    switch (face) {
      case 0:
        p = new Vector3(half, a * half, b * half);
        break;
      case 1:
        p = new Vector3(-half, a * half, b * half);
        break;
      case 2:
        p = new Vector3(a * half, half, b * half);
        break;
      case 3:
        p = new Vector3(a * half, -half, b * half);
        break;
      case 4:
        p = new Vector3(a * half, b * half, half);
        break;
      default:
        p = new Vector3(a * half, b * half, -half);
        break;
    }
    pts.push(p);
  }
  return pts;
}

export function makePointCloud(shape: ShapeKind, count: number, seed = 1): Vector3[] {
  const rng = mulberry32(seed);
  switch (shape) {
    case 'sphere':
      return sphereSurface(count, rng);
    case 'torus':
      return torusSurface(count, rng);
    case 'box':
      return boxSurface(count, rng);
  }
}
