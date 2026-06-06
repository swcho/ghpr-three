import { useControls } from 'leva';
import { Kernels, type Kernel } from 'ghpr-three';
import type { ShapeKind } from '../scenes/SpherePoints';

export type KernelName = 'mirror' | 'exponential' | 'natural';

export interface GHPRSettings {
  shape: ShapeKind;
  count: number;
  pointSize: number;
  kernelName: KernelName;
  autoGamma: boolean;
  gamma: number;
  vx: number;
  vy: number;
  vz: number;
}

/** Map a leva kernel selection to the actual library kernel function. */
export function kernelFromName(name: KernelName): Kernel {
  switch (name) {
    case 'mirror':
      return Kernels.mirror;
    case 'exponential':
      return Kernels.exponential;
    case 'natural':
      return Kernels.natural;
  }
}

// Per-kernel γ slider schema. The valid-range guidance from the paper is baked
// into the control label (leva's `hint` tooltip is avoided — it requires a
// Radix TooltipProvider that the panel doesn't always mount).
function gammaSchema(name: KernelName, autoGamma: boolean) {
  const disabled = autoGamma;
  switch (name) {
    case 'mirror':
      return { value: 5, min: 0.1, max: 15, step: 0.1, label: 'γ (≥ max‖p−C‖)', disabled };
    case 'exponential':
      return { value: -2, min: -10, max: -0.05, step: 0.05, label: 'γ (< 0, →0 shows more)', disabled };
    case 'natural':
      return { value: 1, min: 0.05, max: 10, step: 0.05, label: 'γ (> 0)', disabled };
  }
}

/**
 * leva-backed control panel for the playground. Returns the live settings so
 * the viewer can recompute GHPR whenever the user tweaks a control.
 */
export function useGHPRControls(): GHPRSettings {
  const cloud = useControls('Point cloud', {
    shape: { value: 'sphere' as ShapeKind, options: ['sphere', 'torus', 'box'] as ShapeKind[] },
    count: { value: 2000, min: 100, max: 20000, step: 100 },
    pointSize: { value: 0.04, min: 0.005, max: 0.2, step: 0.005 },
  });

  const kernel = useControls('Kernel', {
    kernelName: {
      value: 'mirror' as KernelName,
      label: 'kernel',
      options: ['mirror', 'exponential', 'natural'] as KernelName[],
    },
    autoGamma: { value: true, label: 'auto γ' },
  });

  // Rebuild the γ slider whenever the kernel or auto-mode changes so the range
  // and default match the selected kernel.
  // The function form returns a loosely-typed object; we know it exposes a
  // numeric `gamma`, so narrow it.
  const gammaCtl = useControls(
    'Kernel',
    () => ({ gamma: gammaSchema(kernel.kernelName, kernel.autoGamma) }),
    [kernel.kernelName, kernel.autoGamma],
  ) as unknown as { gamma: number };

  const vp = useControls('Viewpoint (C)', {
    vx: { value: 0, min: -6, max: 6, step: 0.1, label: 'x' },
    vy: { value: 0, min: -6, max: 6, step: 0.1, label: 'y' },
    vz: { value: 3, min: -6, max: 6, step: 0.1, label: 'z' },
  });

  return {
    shape: cloud.shape,
    count: cloud.count,
    pointSize: cloud.pointSize,
    kernelName: kernel.kernelName,
    autoGamma: kernel.autoGamma,
    gamma: gammaCtl.gamma,
    vx: vp.vx,
    vy: vp.vy,
    vz: vp.vz,
  };
}
