"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { ActivityIcon, AlertIcon, SparklesIcon } from "./icons";

type IncidentUniverseProps = {
  active?: number;
  critical?: number;
  evidence?: number;
  compact?: boolean;
  className?: string;
};

const nodePositions = Array.from({ length: 18 }, (_, index) => {
  const y = 1 - (index / 17) * 2;
  const radius = Math.sqrt(1 - y * y);
  const theta = Math.PI * (3 - Math.sqrt(5)) * index;
  return new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius).multiplyScalar(2.05);
});

export default function IncidentUniverse({
  active = 0,
  critical = 0,
  evidence = 0,
  compact = false,
  className = "",
}: IncidentUniverseProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas || !window.WebGL2RenderingContext) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070b0f, 0.065);

    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0.05, compact ? 8.6 : 7.3);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;

    const universe = new THREE.Group();
    universe.rotation.x = -0.12;
    scene.add(universe);

    const ambient = new THREE.AmbientLight(0x9bb7c9, 0.8);
    const emeraldLight = new THREE.PointLight(0x63f0bb, 22, 14, 2);
    emeraldLight.position.set(3.5, 2.2, 4.2);
    const blueLight = new THREE.PointLight(0x64a9ff, 18, 12, 2);
    blueLight.position.set(-3.2, -1.5, 3.1);
    const dangerLight = new THREE.PointLight(0xff6577, Math.min(critical, 4) * 3, 9, 2);
    dangerLight.position.set(0, 3.5, 2.4);
    scene.add(ambient, emeraldLight, blueLight, dangerLight);

    const coreGeometry = new THREE.IcosahedronGeometry(0.96, 4);
    const coreMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0d5f4d,
      emissive: 0x093d34,
      emissiveIntensity: 1.2,
      metalness: 0.25,
      roughness: 0.28,
      transparent: true,
      opacity: 0.88,
      clearcoat: 1,
      clearcoatRoughness: 0.16,
    });
    const core = new THREE.Mesh(coreGeometry, coreMaterial);
    universe.add(core);

    const cageGeometry = new THREE.IcosahedronGeometry(1.35, 2);
    const cageMaterial = new THREE.MeshBasicMaterial({
      color: 0x7cf6cb,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
    });
    const cage = new THREE.Mesh(cageGeometry, cageMaterial);
    universe.add(cage);

    const edgeGeometry = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.7, 1));
    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x5a8f84, transparent: true, opacity: 0.11 });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    universe.add(edges);

    const rings = [
      { radius: 1.72, tube: 0.009, color: 0x6ee7b7, rotation: [1.1, 0.2, 0.45] },
      { radius: 2.12, tube: 0.006, color: 0x60a5fa, rotation: [0.28, 1.2, -0.3] },
      { radius: 2.5, tube: 0.004, color: 0x8b5cf6, rotation: [1.45, -0.5, 0.1] },
    ].map((definition) => {
      const geometry = new THREE.TorusGeometry(definition.radius, definition.tube, 6, 180);
      const material = new THREE.MeshBasicMaterial({
        color: definition.color,
        transparent: true,
        opacity: 0.34,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.rotation.set(...definition.rotation as [number, number, number]);
      universe.add(ring);
      return ring;
    });

    const nodeGeometry = new THREE.SphereGeometry(0.055, 10, 10);
    const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
    const nodes = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, nodePositions.length);
    const transform = new THREE.Object3D();
    nodePositions.forEach((position, index) => {
      transform.position.copy(position);
      const scale = index < Math.max(1, critical) ? 1.55 : index < Math.max(4, active + 2) ? 1.15 : 0.75;
      transform.scale.setScalar(scale);
      transform.updateMatrix();
      nodes.setMatrixAt(index, transform.matrix);
      nodes.setColorAt(index, new THREE.Color(index < critical ? 0xff6378 : index < active + 2 ? 0x68e8bc : 0x548b99));
    });
    nodes.instanceMatrix.needsUpdate = true;
    if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
    universe.add(nodes);

    const connectionPoints: number[] = [];
    nodePositions.forEach((position, index) => {
      [index + 2, index + 5].forEach((targetIndex) => {
        const target = nodePositions[targetIndex % nodePositions.length];
        connectionPoints.push(position.x, position.y, position.z, target.x, target.y, target.z);
      });
    });
    const connectionGeometry = new THREE.BufferGeometry();
    connectionGeometry.setAttribute("position", new THREE.Float32BufferAttribute(connectionPoints, 3));
    const connectionMaterial = new THREE.LineBasicMaterial({
      color: 0x4fcda8,
      transparent: true,
      opacity: 0.13,
      blending: THREE.AdditiveBlending,
    });
    const connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
    universe.add(connections);

    const lightweight = compact || window.innerWidth < 768;
    const particleCount = lightweight ? 180 : 320;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const phi = Math.acos(1 - 2 * ((index + 0.5) / particleCount));
      const theta = Math.PI * (1 + Math.sqrt(5)) * index;
      const radius = 2.8 + ((index * 37) % 100) / 110;
      particlePositions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      particlePositions[index * 3 + 1] = radius * Math.cos(phi);
      particlePositions[index * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x78d8c1,
      size: 0.018,
      transparent: true,
      opacity: 0.34,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    universe.add(particles);

    const pulseGeometry = new THREE.SphereGeometry(0.032, 8, 8);
    const pulseMaterial = new THREE.MeshBasicMaterial({ color: 0xb9ffe7, toneMapped: false });
    const pulses = Array.from({ length: 8 }, (_, index) => {
      const mesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
      mesh.userData = { from: index, to: (index + 5) % nodePositions.length, offset: index / 8 };
      universe.add(mesh);
      return mesh;
    });

    let elapsed = 0;
    let previousTime = performance.now();
    const render = (time = performance.now()) => {
      const delta = Math.min((time - previousTime) / 1000, 0.04);
      previousTime = time;
      elapsed += delta;

      if (!reducedMotion) {
        universe.rotation.y += delta * 0.105;
        universe.rotation.x += (pointerRef.current.y * 0.16 - universe.rotation.x) * 0.025;
        universe.rotation.z += (pointerRef.current.x * -0.08 - universe.rotation.z) * 0.025;
        camera.position.x += (pointerRef.current.x * 0.32 - camera.position.x) * 0.025;
        camera.position.y += (pointerRef.current.y * -0.22 + 0.05 - camera.position.y) * 0.025;
        camera.lookAt(0, 0, 0);
        cage.rotation.x -= delta * 0.09;
        cage.rotation.y += delta * 0.14;
        edges.rotation.y -= delta * 0.045;
        rings[0].rotation.z += delta * 0.12;
        rings[1].rotation.x -= delta * 0.075;
        rings[2].rotation.y += delta * 0.055;
        particles.rotation.y -= delta * 0.018;
        const breath = 1 + Math.sin(elapsed * 1.8) * 0.035;
        core.scale.setScalar(breath);
        coreMaterial.emissiveIntensity = 1.05 + Math.sin(elapsed * 2.2) * 0.2;
        pulses.forEach((pulse) => {
          const progress = (elapsed * 0.18 + pulse.userData.offset) % 1;
          pulse.position.lerpVectors(nodePositions[pulse.userData.from], nodePositions[pulse.userData.to], progress);
          pulse.scale.setScalar(Math.sin(progress * Math.PI) * 1.4);
        });
      }
      renderer.render(scene, camera);
    };

    const resize = () => {
      const { width, height } = host.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lightweight ? 1.25 : 1.5));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      render();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();

    const setLoopForVisibility = () => {
      renderer.setAnimationLoop(document.hidden || reducedMotion ? null : render);
      if (reducedMotion && !document.hidden) render();
    };
    document.addEventListener("visibilitychange", setLoopForVisibility);
    setLoopForVisibility();

    return () => {
      document.removeEventListener("visibilitychange", setLoopForVisibility);
      observer.disconnect();
      renderer.setAnimationLoop(null);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry?.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [active, compact, critical]);

  return (
    <div
      ref={hostRef}
      className={`universe-shell ${compact ? "universe-shell-compact" : ""} ${className}`}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
        };
      }}
      onPointerLeave={() => { pointerRef.current = { x: 0, y: 0 }; }}
    >
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="universe-grid" aria-hidden="true" />
      <div className="universe-vignette" aria-hidden="true" />
      <div className="universe-scan" aria-hidden="true" />
      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/[.08] bg-black/25 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[.16em] text-slate-400 backdrop-blur-md sm:left-5 sm:top-5">
        <span className="signal-dot h-1.5 w-1.5 rounded-full bg-emerald-300" /> Causal topology / live
      </div>
      <div className="absolute right-4 top-4 hidden font-mono text-[8px] uppercase leading-4 tracking-[.12em] text-slate-700 sm:block sm:right-5 sm:top-5">
        <p>graph 07-A</p><p>confidence mesh</p>
      </div>
      {!compact && <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 sm:inset-x-5 sm:bottom-5">
        <div className="universe-stat"><ActivityIcon className="h-3 w-3 text-emerald-300" /><span><strong>{active}</strong> active</span></div>
        <div className="universe-stat"><AlertIcon className="h-3 w-3 text-red-300" /><span><strong>{critical}</strong> critical</span></div>
        <div className="universe-stat"><SparklesIcon className="h-3 w-3 text-sky-300" /><span><strong>{evidence}</strong> signals</span></div>
      </div>}
      <span className="universe-corner universe-corner-tl" aria-hidden="true" />
      <span className="universe-corner universe-corner-tr" aria-hidden="true" />
      <span className="universe-corner universe-corner-bl" aria-hidden="true" />
      <span className="universe-corner universe-corner-br" aria-hidden="true" />
    </div>
  );
}
