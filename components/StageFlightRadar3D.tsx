import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CustomerStage, CUSTOMER_STAGES } from '../types';

interface StageFlightRadar3DProps {
  currentStage?: CustomerStage;
  className?: string;
  interactive?: boolean;
}

export const StageFlightRadar3D: React.FC<StageFlightRadar3DProps> = ({
  currentStage = 'initiative',
  className = "w-full h-64 md:h-80 relative overflow-hidden rounded-md bg-black/40 border border-white/10",
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 5.2);
    camera.lookAt(0, 0, 0);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Globe wireframe sphere
    const globeRadius = 1.8;
    const globeGeo = new THREE.SphereGeometry(globeRadius, 24, 24);
    const globeWireMat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      wireframe: true,
      transparent: true,
      opacity: 0.12
    });
    const globeWire = new THREE.Mesh(globeGeo, globeWireMat);
    mainGroup.add(globeWire);

    // Inner dark core
    const coreGeo = new THREE.SphereGeometry(globeRadius * 0.98, 32, 32);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x050505,
      transparent: true,
      opacity: 0.85
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    mainGroup.add(coreMesh);

    // Atmospheric radar halo
    const haloGeo = new THREE.SphereGeometry(globeRadius * 1.05, 32, 32);
    const haloMat = new THREE.ShaderMaterial({
      uniforms: {
        c: { value: 0.3 },
        p: { value: 3.0 },
        glowColor: { value: new THREE.Color(0xD4AF37) },
        viewVector: { value: camera.position }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normalMatrix * normal);
          vec3 vNormel = normalize(normalMatrix * viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, intensity * 0.4);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    const haloMesh = new THREE.Mesh(haloGeo, haloMat);
    scene.add(haloMesh);

    // 2. Orbital Flight Rings
    const orbitRingGeo = new THREE.RingGeometry(globeRadius * 1.15, globeRadius * 1.17, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2.3;
    mainGroup.add(orbitRing);

    // 3. Stage Waypoints Coordinates in Spherical coordinates
    const stageIndex = CUSTOMER_STAGES.findIndex(s => s.id === currentStage);
    const safeStageIdx = stageIndex >= 0 ? stageIndex : 0;

    const waypointAngles = [
      { lat: 18.92, lon: 72.83 },   // Mumbai Hangar (Applicant Stage 00)
      { lat: 48.85, lon: 2.35 },    // Paris (Initiative)
      { lat: 51.5, lon: -0.12 },    // London (Core)
      { lat: 25.2, lon: 55.27 },    // Dubai (Inner)
      { lat: 35.67, lon: 139.65 },  // Tokyo (Ascent)
      { lat: 40.71, lon: -74.0 },   // New York (Black)
      { lat: 60.0, lon: 80.0 }      // Apex Orbit (Signature)
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -(radius * Math.sin(phi) * Math.cos(theta)),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const waypoints: THREE.Vector3[] = waypointAngles.map(coord => 
      latLonToVector3(coord.lat, coord.lon, globeRadius * 1.02)
    );

    // Draw waypoints
    const waypointGroup = new THREE.Group();
    mainGroup.add(waypointGroup);

    let activeWaypointMesh: THREE.Mesh | null = null;

    waypoints.forEach((wp, i) => {
      const isCompleted = i < safeStageIdx;
      const isActive = i === safeStageIdx;
      const isUpcoming = i > safeStageIdx;

      const markerGeo = new THREE.SphereGeometry(isActive ? 0.07 : 0.04, 16, 16);
      const markerMat = new THREE.MeshBasicMaterial({
        color: isActive ? 0xFFFFFF : (isCompleted ? 0xD4AF37 : 0x555555),
        transparent: true,
        opacity: isUpcoming ? 0.35 : 1
      });
      const marker = new THREE.Mesh(markerGeo, markerMat);
      marker.position.copy(wp);
      waypointGroup.add(marker);

      if (isActive) {
        activeWaypointMesh = marker;
        // Outer pulsing ring on active waypoint
        const pingGeo = new THREE.RingGeometry(0.09, 0.11, 32);
        const pingMat = new THREE.MeshBasicMaterial({
          color: 0xFDE047,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.8
        });
        const ping = new THREE.Mesh(pingGeo, pingMat);
        ping.position.copy(wp);
        ping.lookAt(0, 0, 0);
        waypointGroup.add(ping);
      }
    });

    // 4. Flight Path Curves (Arc between consecutive waypoints)
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const dist = p1.distanceTo(p2);
      mid.normalize().multiplyScalar(globeRadius * (1.05 + dist * 0.15));

      const curve = new THREE.QuadraticBezierCurve3(p1, mid, p2);
      const points = curve.getPoints(30);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      const isCompletedLeg = i < safeStageIdx;
      const isCurrentLeg = i === safeStageIdx - 1;
      const isUpcomingLeg = i >= safeStageIdx;

      const lineMat = new THREE.LineBasicMaterial({
        color: (isCompletedLeg || isCurrentLeg) ? 0xFDE047 : 0x444444,
        transparent: true,
        opacity: isUpcomingLeg ? 0.25 : 0.9,
        linewidth: 2
      });

      const line = new THREE.Line(curveGeo, lineMat);
      waypointGroup.add(line);
    }

    // 5. Stylized 3D Supersonic Jet Model on Current Waypoint / Flight Vector
    const jetGroup = new THREE.Group();
    mainGroup.add(jetGroup);

    // Craft Fuselage
    const fuselageGeo = new THREE.ConeGeometry(0.06, 0.28, 4);
    const fuselageMat = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.9,
      roughness: 0.2
    });
    const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
    fuselage.rotation.x = Math.PI / 2;
    jetGroup.add(fuselage);

    // Delta Wings
    const wingShape = new THREE.Shape();
    wingShape.moveTo(-0.16, -0.08);
    wingShape.lineTo(0.16, -0.08);
    wingShape.lineTo(0, 0.12);
    wingShape.closePath();

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wingMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A,
      side: THREE.DoubleSide,
      metalness: 0.8
    });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.rotation.x = Math.PI / 2;
    wing.position.z = -0.02;
    jetGroup.add(wing);

    // Engine Afterburner Glow
    const engineGlowGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const engineGlowMat = new THREE.MeshBasicMaterial({ color: 0x60A5FA });
    const engineGlow = new THREE.Mesh(engineGlowGeo, engineGlowMat);
    engineGlow.position.z = -0.14;
    jetGroup.add(engineGlow);

    // Position Jet along the active waypoint
    const activeTarget = waypoints[safeStageIdx];
    const prevTarget = safeStageIdx > 0 ? waypoints[safeStageIdx - 1] : new THREE.Vector3(activeTarget.x + 0.5, activeTarget.y, activeTarget.z);
    
    jetGroup.position.copy(activeTarget).multiplyScalar(1.04);
    jetGroup.lookAt(prevTarget);

    // 6. Ambient & Radar Lighting
    const ambient = new THREE.AmbientLight(0x221a05, 1.2);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xFDE047, 2.5);
    dirLight.position.set(5, 3, 5);
    scene.add(dirLight);

    // Interactive Drag & Rotate
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const onMouseDown = (e: MouseEvent) => {
      if (!interactive) return;
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !interactive) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      mainGroup.rotation.y += deltaX * 0.006;
      mainGroup.rotation.x += deltaY * 0.006;

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Gentle continuous rotation if not dragging
      if (!isDragging) {
        mainGroup.rotation.y += 0.003;
      }

      // Jet hover bobbing
      const hoverOffset = Math.sin(elapsed * 3) * 0.02;
      jetGroup.position.copy(activeTarget).multiplyScalar(1.04 + hoverOffset);

      // Radar scan rotation
      orbitRing.rotation.z = elapsed * 0.4;

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      dom.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);

      globeGeo.dispose();
      globeWireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      orbitRingGeo.dispose();
      orbitRingMat.dispose();
      fuselageGeo.dispose();
      fuselageMat.dispose();
      wingGeo.dispose();
      wingMat.dispose();
      engineGlowGeo.dispose();
      engineGlowMat.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [currentStage, interactive]);

  const currentStageMeta = CUSTOMER_STAGES.find(s => s.id === currentStage) || CUSTOMER_STAGES[0];

  return (
    <div className={className} ref={containerRef}>
      {/* 3D Aeronautical Telemetry Overlay */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-emerald-400 font-bold">
            FLIGHT RADAR // ACTIVE
          </span>
        </div>
        <p className="text-[10px] font-mono text-white/70">
          VECTOR: <span className="text-gold-400">{currentStageMeta.callsign}</span>
        </p>
      </div>

      <div className="absolute bottom-3 right-3 z-10 pointer-events-none text-right">
        <p className="text-[9px] font-mono text-white/50 tracking-wider">ALTITUDE // MACH</p>
        <p className="text-[11px] font-mono text-gold-400 font-semibold">
          {currentStageMeta.altitude} • {currentStageMeta.machSpeed}
        </p>
      </div>
    </div>
  );
};
