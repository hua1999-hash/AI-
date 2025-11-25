import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TetrahedronState, SolutionMode, COLORS } from '../types';

interface Scene3DProps {
  geometryState: TetrahedronState;
  hA: number;
  hasSolution: boolean;
  mode: SolutionMode;
  horizontalView: boolean;
}

interface MarkerData {
  sphere: THREE.Mesh;
  line: THREE.Line;
  ring: THREE.Mesh;
  div: HTMLDivElement;
}

const Scene3D: React.FC<Scene3DProps> = ({ 
  geometryState, 
  hA, 
  hasSolution, 
  mode, 
  horizontalView 
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  
  // Refs to hold Three.js instances to avoid recreation
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pivotRef = useRef<THREE.Group | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const linesRef = useRef<THREE.LineSegments | null>(null);
  const markersRef = useRef<{ [key: string]: MarkerData }>({});
  
  // Animation loop refs
  const requestRef = useRef<number>(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);
  const yaw = useRef(0);

  // Constants
  const defaultCamPos = new THREE.Vector3(25, 20, 25);

  // --- Initialization ---
  useEffect(() => {
    if (!mountRef.current) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x101015);
    scene.fog = new THREE.Fog(0x101015, 20, 150);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 500);
    camera.position.copy(defaultCamPos);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(10, 50, 20);
    dirLight.castShadow = true;
    scene.add(dirLight);

    // Grid
    const grid = new THREE.GridHelper(100, 50, 0x333333, 0x111111);
    scene.add(grid);

    // Pivot Group for the Tetrahedron
    const pivot = new THREE.Group();
    scene.add(pivot);
    pivotRef.current = pivot;

    // Initial Geometry Setup (will be updated by effects)
    // Make it transparent and double-sided to see internals easily
    const mat = new THREE.MeshStandardMaterial({ 
      color: 0xffcc00, 
      roughness: 0.2, 
      metalness: 0.5, 
      transparent: true, 
      opacity: 0.3, 
      side: THREE.DoubleSide,
      depthWrite: false // Helps with transparency sorting for internal lines
    });

    // Fix: Initialize with non-empty buffer to prevent EdgesGeometry error (undefined 'count')
    const geo = new THREE.BufferGeometry();
    const initialPositions = new Float32Array(12); // 4 vertices * 3
    geo.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));
    geo.setIndex([0,1,2, 0,1,3, 0,2,3, 1,2,3]);

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false; // Transparent objects often look better without casting complex shadows in simple scenes
    pivot.add(mesh);
    meshRef.current = mesh;

    const edges = new THREE.EdgesGeometry(geo);
    const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    const lines = new THREE.LineSegments(edges, lineMat);
    mesh.add(lines);
    linesRef.current = lines;

    // Create Markers (Visuals + DOM Labels)
    ['A', 'B', 'C', 'D'].forEach(key => {
      const colorHex = COLORS[key as keyof typeof COLORS];
      const color = new THREE.Color(colorHex);
      
      // Sphere
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({ color }));
      
      // Vertical Line - Increased opacity for better visibility inside transparent mesh
      const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.8 }));
      scene.add(line);
      
      // Height Ring - Increased opacity
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(15, 15.2, 64), 
        new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
      );
      ring.rotation.x = -Math.PI / 2;
      scene.add(ring);

      // DOM Label
      const div = document.createElement('div');
      div.className = 'absolute pointer-events-none select-none px-2 py-1 bg-black/70 text-white rounded font-mono text-sm border border-white/30 hidden z-10';
      div.style.borderLeftWidth = '4px';
      div.style.borderLeftColor = colorHex;
      div.innerHTML = `${key}: <span class="text-yellow-400 font-bold">0.00</span>`;
      mountRef.current?.appendChild(div);

      // Attach sphere to mesh
      mesh.add(sphere);

      markersRef.current[key] = { sphere, line, ring, div };
    });

    // Event Listeners for Interaction
    const onResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('#ui-panel')) return;
      isDragging.current = true;
      lastX.current = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (isDragging.current) {
        yaw.current -= (e.clientX - lastX.current) * 0.01;
        lastX.current = e.clientX;
      }
    };
    const onMouseUp = () => isDragging.current = false;
    
    const onTouchStart = (e: TouchEvent) => {
        if ((e.target as HTMLElement).closest('#ui-panel')) return;
        isDragging.current = true;
        lastX.current = e.touches[0].clientX;
    }
    const onTouchMove = (e: TouchEvent) => {
        if (isDragging.current) {
            yaw.current -= (e.touches[0].clientX - lastX.current) * 0.01;
            lastX.current = e.touches[0].clientX;
        }
    }
    const onTouchEnd = () => isDragging.current = false;

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Initial start
    animate();

    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(requestRef.current!);
      if (mountRef.current) {
        mountRef.current.innerHTML = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Animation Loop ---
  const animate = () => {
    requestRef.current = requestAnimationFrame(animate);
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    
    if (renderer && scene && camera) {
      updateLabels(camera);
      renderer.render(scene, camera);
    }
  };

  // --- Helper to update label positions ---
  const updateLabels = (camera: THREE.Camera) => {
    Object.keys(markersRef.current).forEach(key => {
      const { sphere, line, div } = markersRef.current[key];
      
      const worldPos = new THREE.Vector3();
      sphere.getWorldPosition(worldPos);
      
      const linePos = line.geometry.attributes.position.array as Float32Array;
      linePos[0] = worldPos.x; linePos[1] = worldPos.y; linePos[2] = worldPos.z;
      linePos[3] = worldPos.x; linePos[4] = 0;          linePos[5] = worldPos.z;
      line.geometry.attributes.position.needsUpdate = true;

      const tempV = worldPos.clone();
      tempV.project(camera);

      if (tempV.z < 1) {
        const x = (tempV.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(tempV.y * 0.5) + 0.5) * window.innerHeight;
        
        div.style.display = 'block';
        div.style.transform = `translate(-50%, -120%)`; 
        div.style.left = `${x}px`;
        div.style.top = `${y}px`;
        
        const span = div.querySelector('span');
        if (span) {
          span.innerText = worldPos.y.toFixed(2);
        }
      } else {
        div.style.display = 'none';
      }
    });
  };

  // --- Effect: Update Geometry (L change) ---
  useEffect(() => {
    if (!meshRef.current || !linesRef.current) return;

    const size = geometryState.edgeLength;
    
    const vA = new THREE.Vector3(0, 0, 0);
    const vB = new THREE.Vector3(size, 0, 0);
    const vC = new THREE.Vector3(size * 0.5, size * Math.sqrt(3) * 0.5, 0);
    const vD = new THREE.Vector3(size * 0.5, size * Math.sqrt(3) / 6, size * Math.sqrt(6) / 3);

    const positions = new Float32Array([
      vA.x, vA.y, vA.z,
      vB.x, vB.y, vB.z,
      vC.x, vC.y, vC.z,
      vD.x, vD.y, vD.z
    ]);

    const indices = [
      0, 2, 1, // ABC
      0, 1, 3, // ABD
      0, 3, 2, // ACD
      1, 2, 3  // BCD
    ];

    const geo = meshRef.current.geometry;
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    geo.attributes.position.needsUpdate = true;

    // Update edges
    linesRef.current.geometry.dispose();
    linesRef.current.geometry = new THREE.EdgesGeometry(geo);

    markersRef.current.A.sphere.position.copy(vA);
    markersRef.current.B.sphere.position.copy(vB);
    markersRef.current.C.sphere.position.copy(vC);
    markersRef.current.D.sphere.position.copy(vD);

    markersRef.current.A.ring.visible = false;

  }, [geometryState.edgeLength]);

  // Ref to hold latest state for the animation loop
  const latestState = useRef({ geometryState, hA, hasSolution });
  useEffect(() => { latestState.current = { geometryState, hA, hasSolution }; }, [geometryState, hA, hasSolution]);

  // Hooking the logic into the animation loop properly via an effect interval
  useEffect(() => {
    const interval = setInterval(() => {
        if (!pivotRef.current || !latestState.current.hasSolution) return;
        const { geometryState: gs, hA: ha } = latestState.current;
        
        const size = gs.edgeLength;
        const dyB = gs.hB - ha;
        const dyC = gs.hC - ha;
        const dyD = gs.hD - ha;
        
        const vB = new THREE.Vector3(size, 0, 0);
        const vC = new THREE.Vector3(size * 0.5, size * Math.sqrt(3) * 0.5, 0);
        const vD = new THREE.Vector3(size * 0.5, size * Math.sqrt(3) / 6, size * Math.sqrt(6) / 3);

        const M = new THREE.Matrix3().set(vB.x, vB.y, vB.z, vC.x, vC.y, vC.z, vD.x, vD.y, vD.z);
        const M_inv = new THREE.Matrix3().copy(M).invert();
        const targetUpLocal = new THREE.Vector3(dyB, dyC, dyD).applyMatrix3(M_inv).normalize();
        
        const qTilt = new THREE.Quaternion().setFromUnitVectors(targetUpLocal, new THREE.Vector3(0, 1, 0));
        const qYaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
        
        pivotRef.current.quaternion.copy(qYaw.multiply(qTilt));
    }, 16);
    return () => clearInterval(interval);
  }, []);

  // --- Effect: Update Physics/Orientation/Colors (Non-animation properties) ---
  useEffect(() => {
    if (!pivotRef.current || !meshRef.current) return;
    
    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    
    if (!hasSolution) {
      meshRef.current.visible = false;
      Object.values(markersRef.current).forEach((m: MarkerData) => {
        m.line.visible = false;
        m.div.style.display = 'none';
      });
      return;
    }

    meshRef.current.visible = true;
    Object.values(markersRef.current).forEach((m: MarkerData) => {
      m.line.visible = true;
      m.div.style.display = 'block';
    });

    mat.color.setHex(mode === 'min' ? 0xffcc00 : 0xffaa00);

    markersRef.current.B.ring.position.y = geometryState.hB;
    markersRef.current.C.ring.position.y = geometryState.hC;
    markersRef.current.D.ring.position.y = geometryState.hD;

    pivotRef.current.position.y = hA;

  }, [geometryState, hA, hasSolution, mode]);

  // --- Effect: Camera View ---
  useEffect(() => {
    if (!cameraRef.current) return;
    
    const cam = cameraRef.current;
    if (horizontalView) {
      const hCenter = (geometryState.hB + geometryState.hC + geometryState.hD) / 3;
      cam.position.set(0, hCenter, 40);
      cam.lookAt(0, hCenter, 0);
    } else {
      cam.position.copy(defaultCamPos);
      cam.lookAt(0, 10, 0);
    }
  }, [horizontalView, geometryState.hB, geometryState.hC, geometryState.hD]);

  return <div ref={mountRef} className="w-full h-full block" />;
};

export default Scene3D;