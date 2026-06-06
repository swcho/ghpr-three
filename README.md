# ghpr-three

**Generalized Hidden Point Removal (GHPR)** for [three.js](https://threejs.org/) point clouds — plus an interactive [React Three Fiber](https://r3f.docs.pmnd.rs/) + [drei](https://github.com/pmndrs/drei) playground.

Given a point cloud and a viewpoint, GHPR decides which points are **visible** from that viewpoint — _without any surface reconstruction_. It does so with a beautifully simple trick from Katz & Tal, _"On the Visibility of Point Clouds"_ (ICCV 2015), generalizing the original Hidden Point Removal operator (Katz, Tal & Basri, 2007).

## How it works

1. **Translate** the cloud so the viewpoint `C` sits at the origin.
2. **Radially invert** every point: `F(p) = (p/‖p‖) · f(‖p‖)`, where `f` is a positive, monotonically decreasing _kernel_. This pushes near points outward and pulls far points inward.
3. **Convex hull** of the transformed points _together with the origin_.
4. A point is **visible** iff its transformed image lies on that convex hull.

The inversion turns "is this point occluded?" into "is this point extremal?", which the convex hull answers exactly. Different kernels `f` give the operator different sensitivity — that generalization is the "G" in GHPR.

The library core depends **only on `three`** (and its `ConvexHull` addon), so it runs unchanged in Node, web workers, and headless pipelines. React / R3F / drei live entirely in the `playground/`.

## Install

```bash
pnpm add ghpr-three three
# three is a peer dependency
```

## Usage

```ts
import * as THREE from 'three';
import { computeGHPR, Kernels } from 'ghpr-three';

const points: THREE.Vector3[] = /* your cloud */;
const viewpoint = new THREE.Vector3(0, 0, 3);

const { visible, visibleSet, scores, transformed } = computeGHPR(points, viewpoint, {
  kernel: Kernels.mirror, // default
  // gamma: 8,            // omit to auto-estimate from kernel + cloud extent
  // computeScores: true, // default
});

console.log(`${visible.length} of ${points.length} points are visible`);
```

## API

| Export | Signature | Notes |
| --- | --- | --- |
| `computeGHPR` | `(points: Vector3[], viewpoint: Vector3, options?: GHPROptions) => GHPRResult` | Main operator. |
| `Kernels` | `{ mirror, exponential, natural }` | The three example kernels from the paper. |
| `suggestGamma` | `(kernel: Kernel, maxDist: number) => number` | Heuristic γ for a kernel + cloud extent. |
| `Kernel` | `(d: number, gamma: number) => number` | Kernel function type. |
| `GHPROptions` | `{ kernel?, gamma?, computeScores? }` | See below. |
| `GHPRResult` | `{ visible, visibleSet, scores, transformed }` | See below. |

### `GHPROptions`

| Field | Default | Meaning |
| --- | --- | --- |
| `kernel` | `Kernels.mirror` | Inversion kernel `f`. |
| `gamma` | auto (`suggestGamma`) | Kernel shape parameter `γ`. |
| `computeScores` | `true` | Compute per-point visibility scores. |

### `GHPRResult`

| Field | Type | Meaning |
| --- | --- | --- |
| `visible` | `number[]` | Original indices of visible points, ascending. |
| `visibleSet` | `Set<number>` | The same, for O(1) membership tests. |
| `scores` | `Map<number, number>` | Visible index → **visibility score (VS)**: the raw sum (radians) of the incident convex-hull face interior angles. Not normalized; hidden points are absent. |
| `transformed` | `Vector3[]` | The transformed coordinates, aligned to input order. Points with `‖p−C‖ = 0` map to the origin and are always visible. |

## Kernels and their valid γ ranges

| Kernel | `f(d, γ)` | Valid γ | Behavior |
| --- | --- | --- | --- |
| `mirror` | `γ − d` | `γ ≥ max‖p−C‖` | Classic spherical-flipping HPR. Larger γ ⇒ a flatter sphere of inversion. The safe auto value is `2·max‖p−C‖`. |
| `exponential` | `d^γ` | `γ < 0` | Closer to `0⁻` flattens the kernel ⇒ **more** points visible; more negative ⇒ more selective. |
| `natural` | `e^(−γd)` | `γ > 0` | Scale-sensitive decay; auto value `1/max‖p−C‖` decays by ~`e⁻¹` across the cloud. |

`suggestGamma` returns: `mirror → 2·maxDist`, `exponential → −2`, `natural → 1/maxDist`.

## Playground

An R3F + drei app visualizes the operator in real time. A [leva](https://github.com/pmndrs/leva) panel controls the kernel, γ (with per-kernel range hints), the viewpoint `x/y/z`, the cloud shape (sphere / torus / box), and the point count.

- Visible points are colored by VS: **red = low → blue = high**.
- Hidden points are dim grey.
- The red sphere marks the viewpoint `C`.

```bash
pnpm install
pnpm dev          # opens the playground dev server
```

> Recomputing the hull on every viewpoint nudge can be costly for large clouds.
> `playground/components/useGHPRDeferred.ts` sketches a debounced hook and a
> web-worker offload strategy; the default path stays synchronous for clarity.

## Develop & build

```bash
pnpm install
pnpm test          # Vitest
pnpm typecheck     # tsc --noEmit
pnpm lint          # ESLint
pnpm format        # Prettier
pnpm build         # library → dist/ (ESM + CJS + .d.ts)
pnpm build:playground
pnpm preview
```

`pnpm build` emits, via Vite library mode and `vite-plugin-dts`:

```
dist/
├─ index.js     # ESM
├─ index.cjs    # CommonJS
└─ index.d.ts   # types
```

`three` and its addons are externalized — never bundled into the library.

## References

This library is a direct implementation of the Hidden Point Removal operator and
its generalization:

- Sagi Katz and Ayellet Tal. **"On the Visibility of Point Clouds."**
  _Proceedings of the IEEE International Conference on Computer Vision (ICCV)_,
  2015, pp. 1350–1358. [doi:10.1109/ICCV.2015.159](https://doi.org/10.1109/ICCV.2015.159)
  — introduces the _generalized_ HPR operator (the radial inversion kernels `f`
  implemented in [`src/kernels.ts`](src/kernels.ts)).
- Sagi Katz, Ayellet Tal, and Ronen Basri. **"Direct Visibility of Point Sets."**
  _ACM Transactions on Graphics (Proc. SIGGRAPH)_, 26(3), 2007, Article 24.
  [doi:10.1145/1276377.1276407](https://doi.org/10.1145/1276377.1276407)
  — the original Hidden Point Removal operator (the `mirror` / spherical-flipping
  kernel).

If you use this work in academic research, please cite the papers above.

> Note: this is an independent open-source reimplementation. It is not affiliated
> with or endorsed by the authors of the papers.

## License

[MIT](LICENSE)

The license covers this implementation only. The underlying algorithms are
described in the papers cited above; please honor their respective citation
requirements.
