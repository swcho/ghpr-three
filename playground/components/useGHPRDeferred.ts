import { useEffect, useRef, useState } from 'react';
import type { Vector3 } from 'three';
import { computeGHPR, type GHPROptions, type GHPRResult } from 'ghpr-three';

/**
 * STUB — debounced / worker-offloaded GHPR.
 *
 * `computeGHPR` runs a convex hull, which is O(n log n) but still noticeable
 * for large clouds when the viewpoint is dragged continuously. Two strategies
 * keep the UI responsive; both are sketched here but intentionally left as
 * opt-in so the default playground path stays simple and synchronous.
 *
 * 1. Debounce — only recompute after the inputs stop changing for `delayMs`.
 *    Implemented below.
 *
 * 2. Web worker — move `computeGHPR` off the main thread entirely:
 *
 *    // ghpr.worker.ts
 *    // import { computeGHPR } from 'ghpr-three';
 *    // self.onmessage = (e) => {
 *    //   const { points, viewpoint, options } = e.data;
 *    //   const r = computeGHPR(rehydrate(points), rehydrate1(viewpoint), options);
 *    //   // post only transferable index arrays / typed VS back
 *    //   self.postMessage({ visible: r.visible, scores: [...r.scores] });
 *    // };
 *
 *    Vector3[] is not structured-cloneable cheaply, so serialize to a
 *    Float32Array (xyz triples), transfer it, and rehydrate inside the worker.
 */
export function useGHPRDeferred(
  points: Vector3[],
  viewpoint: Vector3,
  options: GHPROptions,
  delayMs = 80,
): GHPRResult | null {
  const [result, setResult] = useState<GHPRResult | null>(null);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const handle = setTimeout(() => {
      setResult(computeGHPR(points, viewpoint, optionsRef.current));
    }, delayMs);
    return () => clearTimeout(handle);
  }, [points, viewpoint, delayMs]);

  return result;
}
