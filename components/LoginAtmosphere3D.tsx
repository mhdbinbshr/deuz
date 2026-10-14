import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface LoginAtmosphere3DProps {
  intensity?: number;
  className?: string;
  showOrb?: boolean;
}

export const LoginAtmosphere3D: React.FC<LoginAtmosphere3DProps> = ({ 
  intensity = 1,
  className = "absolute inset-0 pointer-events-none",
  showOrb = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Dimensions
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050505, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 6.2;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true, 
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
    } catch {
      return; // Fallback gracefully if WebGL is unavailable
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Group for central interactive artifact
    const artifactGroup = new THREE.Group();
    scene.add(artifactGroup);

    // 1. Central Multifaceted Luxury Atelier Gem / Octahedron
    const gemGeo = new THREE.OctahedronGeometry(1.25, 0);
    const gemMat = new THREE.MeshPhysicalMaterial({
      color: 0xD4AF37,
      emissive: 0x382805,
      roughness: 0.18,
      metalness: 0.95,
      reflectivity: 0.95,
      clearcoat: 0.8,
      clearcoatRoughness: 0.1,
      wireframe: false,
    });
    const gemMesh = new THREE.Mesh(gemGeo, gemMat);
    if (showOrb) artifactGroup.add(gemMesh);

    // Gem wireframe halo overlay for luxury holographic edge
    const wireGeo = new THREE.OctahedronGeometry(1.28, 0);
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xFDE047,
      wireframe: true,
      transparent: true,
      opacity: 0.45 * intensity,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    if (showOrb) artifactGroup.add(wireMesh);

    // Inner glowing core
    const coreGeo = new THREE.SphereGeometry(0.65, 16, 16);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      wireframe: true,
      transparent: true,
      opacity: 0.6
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    if (showOrb) artifactGroup.add(coreMesh);

    // 2. Gyroscopic Orbit Gimbal Rings
    const ringGeo1 = new THREE.TorusGeometry(1.85, 0.02, 16, 100);
    const ringMat1 = new THREE.MeshStandardMaterial({
      color: 0xD4AF37,
      metalness: 0.92,
      roughness: 0.25,
      emissive: 0x4a3a0a
    });
    const ringMesh1 = new THREE.Mesh(ringGeo1, ringMat1);
    ringMesh1.rotation.x = Math.PI / 3;
    if (showOrb) artifactGroup.add(ringMesh1);

    const ringGeo2 = new THREE.TorusGeometry(2.15, 0.015, 16, 100);
    const ringMat2 = new THREE.MeshStandardMaterial({
      color: 0xE6C65A,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0x2e2405
    });
    const ringMesh2 = new THREE.Mesh(ringGeo2, ringMat2);
    ringMesh2.rotation.y = Math.PI / 4;
    if (showOrb) artifactGroup.add(ringMesh2);

    const ringGeo3 = new THREE.TorusGeometry(2.45, 0.01, 16, 100);
    const ringMat3 = new THREE.MeshStandardMaterial({
      color: 0xFDE047,
      metalness: 0.85,
      roughness: 0.3,
      transparent: true,
      opacity: 0.65
    });
    const ringMesh3 = new THREE.Mesh(ringGeo3, ringMat3);
    ringMesh3.rotation.z = Math.PI / 6;
    if (showOrb) artifactGroup.add(ringMesh3);

    // 3. Floating Gold Particulate Field (Stardust / Atelier Dust)
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 12;
      positions[i + 1] = (Math.random() - 0.5) * 12;
      positions[i + 2] = (Math.random() - 0.5) * 8;

      velocities[i] = (Math.random() - 0.5) * 0.003;
      velocities[i + 1] = Math.random() * 0.007 + 0.002; // Upward drift
      velocities[i + 2] = (Math.random() - 0.5) * 0.003;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 245, 200, 1)');
      gradient.addColorStop(0.3, 'rgba(212, 175, 55, 0.8)');
      gradient.addColorStop(0.8, 'rgba(180, 130, 20, 0.2)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const particleTexture = new THREE.CanvasTexture(canvas);

    const particleMat = new THREE.PointsMaterial({
      color: 0xFDE047,
      size: 0.14,
      map: particleTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.85 * intensity
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 4. Atmospheric Lights
    const ambientLight = new THREE.AmbientLight(0x2a2008, 1.4);
    scene.add(ambientLight);

    const goldPointLight = new THREE.PointLight(0xFDE047, 5 * intensity, 16);
    goldPointLight.position.set(2, 3, 3);
    scene.add(goldPointLight);

    const fillPointLight = new THREE.PointLight(0x3B82F6, 2 * intensity, 14);
    fillPointLight.position.set(-3, -2, 2);
    scene.add(fillPointLight);

    // Mouse & Touch Tracking with smooth interpolation
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const clientX = e.clientX - rect.left;
        const clientY = e.clientY - rect.top;
        mouseX = (clientX / rect.width) * 2 - 1;
        mouseY = -(clientY / rect.height) * 2 + 1;
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Touch support for mobile parallax
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = container.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const clientX = e.touches[0].clientX - rect.left;
          const clientY = e.touches[0].clientY - rect.top;
          mouseX = (clientX / rect.width) * 2 - 1;
          mouseY = -(clientY / rect.height) * 2 + 1;
        }
      }
    };
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Responsive Dimension & Camera Handler
    const updateDimensions = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      if (newW <= 0 || newH <= 0) return;

      const aspect = newW / newH;
      camera.aspect = aspect;

      // Adjust camera distance for wide mobile banners vs tall desktop columns
      if (aspect < 1) {
        camera.position.z = Math.max(5.8, 3.8 / aspect);
      } else if (newH < 260) {
        // Compact mobile banner
        camera.position.z = 5.2;
      } else {
        camera.position.z = 5.8;
      }

      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });
    resizeObserver.observe(container);

    window.addEventListener('resize', updateDimensions);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth mouse follow
      targetRotY += (mouseX * 0.45 - targetRotY) * 0.05;
      targetRotX += (-mouseY * 0.45 - targetRotX) * 0.05;

      artifactGroup.rotation.y = elapsed * 0.38 + targetRotY;
      artifactGroup.rotation.x = Math.sin(elapsed * 0.28) * 0.22 + targetRotX;
      artifactGroup.rotation.z = Math.cos(elapsed * 0.22) * 0.18;

      // Independent ring rotations
      ringMesh1.rotation.z += delta * 0.55;
      ringMesh2.rotation.x += delta * 0.45;
      ringMesh3.rotation.y += delta * 0.35;

      // Floating light orbital movement
      goldPointLight.position.x = Math.sin(elapsed * 0.9) * 3.5;
      goldPointLight.position.y = Math.cos(elapsed * 0.7) * 3;
      goldPointLight.position.z = Math.sin(elapsed * 0.5) * 2 + 2;

      // Update particle field
      const posAttr = particleGeo.attributes.position as THREE.BufferAttribute;
      const posArray = posAttr.array as Float32Array;

      for (let i = 0; i < particleCount * 3; i += 3) {
        posArray[i] += velocities[i];
        posArray[i + 1] += velocities[i + 1];
        posArray[i + 2] += velocities[i + 2];

        // Reset if drifted beyond top bounds
        if (posArray[i + 1] > 6) {
          posArray[i + 1] = -6;
          posArray[i] = (Math.random() - 0.5) * 12;
        }
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('resize', updateDimensions);
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);

      gemGeo.dispose();
      gemMat.dispose();
      wireGeo.dispose();
      wireMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      ringGeo1.dispose();
      ringMat1.dispose();
      ringGeo2.dispose();
      ringMat2.dispose();
      ringGeo3.dispose();
      ringMat3.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      particleTexture.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [intensity, showOrb]);

  return <div ref={containerRef} className={className} />;
};
