import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Vector3 } from 'three';
import { PointCloud } from './PointCloud';
import { useGHPRControls, kernelFromName } from './ControlsPanel';
import { makePointCloud } from '../scenes/SpherePoints';

/**
 * The 3D scene: an OrbitControls-driven camera, the GHPR-colored point cloud,
 * and a red marker sphere at the viewpoint `C`.
 */
export function GHPRViewer() {
  const s = useGHPRControls();

  const points = useMemo(() => makePointCloud(s.shape, s.count), [s.shape, s.count]);
  const viewpoint = useMemo(() => new Vector3(s.vx, s.vy, s.vz), [s.vx, s.vy, s.vz]);
  const kernel = useMemo(() => kernelFromName(s.kernelName), [s.kernelName]);
  const gamma = s.autoGamma ? undefined : s.gamma;

  return (
    <Canvas camera={{ position: [4, 3, 5], fov: 50 }}>
      <color attach="background" args={['#101014']} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />

      <PointCloud
        points={points}
        viewpoint={viewpoint}
        kernel={kernel}
        gamma={gamma}
        pointSize={s.pointSize}
      />

      {/* Viewpoint marker */}
      <mesh position={[s.vx, s.vy, s.vz]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="red" />
      </mesh>

      <axesHelper args={[2]} />
      <OrbitControls makeDefault />
    </Canvas>
  );
}
