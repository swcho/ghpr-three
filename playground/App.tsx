import { Leva } from 'leva';
import { GHPRViewer } from './components/GHPRViewer';

export default function App() {
  return (
    <div className="app">
      <Leva collapsed={false} titleBar={{ title: 'GHPR controls' }} />
      <GHPRViewer />

      <div className="legend">
        <h1>GHPR — Generalized Hidden Point Removal</h1>
        <p>
          Red sphere = viewpoint <code>C</code>. Visible points are colored by visibility score
          (VS): <span className="swatch low">red = low</span> →{' '}
          <span className="swatch high">blue = high</span>. Hidden points are dim grey.
        </p>
        <p className="hint">Drag to orbit · use the panel to change kernel, γ, viewpoint, and cloud.</p>
      </div>
    </div>
  );
}
