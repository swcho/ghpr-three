// Public API barrel for ghpr-three.
//
// The library core depends only on `three` (and its ConvexHull addon). It must
// remain free of any React / R3F / drei imports so it can run in Node, web
// workers, and other headless environments.

export { computeGHPR } from './ghpr';
export { Kernels, suggestGamma } from './kernels';
export type { Kernel, GHPROptions, GHPRResult } from './types';
