"use client";

import { useEffect, useRef, Profiler } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";

const Globe = dynamic(() => import("react-globe.gl"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-[540px] h-[540px] rounded-full bg-slate-900/10 dark:bg-white/5">
      <div className="w-9 h-9 border-2 border-border border-t-accent rounded-full animate-spin" />
    </div>
  )
});

interface ThreeDGlobeProps {
  isDark: boolean;
  prefersReducedMotion: boolean;
}

// ─── Shared Constants ────────────────────────────────────────────────────────
const CITIES = [
  { lat: 35.68, lng: 139.69, name: 'Tokyo',            color: '#10b981' },
  { lat: 35.01, lng: 135.77, name: 'Kyoto',            color: '#3b82f6' },
  { lat: 48.85, lng: 2.35,   name: 'Paris',            color: '#10b981' },
  { lat: 37.77, lng: -122.41,name: 'SF',               color: '#f59e0b' },
  { lat: 34.05, lng: -118.24,name: 'LA',               color: '#a855f7' },
  { lat: 40.7128, lng: -74.0060, name: 'NYC 🍜',       color: '#ec4899' }, // Local, arc-free pin
];

const LABELS = [
  { lat: 36.88, lng: 139.69, name: 'Tokyo',            color: '#10b981' },
  { lat: 33.81, lng: 135.77, name: 'Kyoto',            color: '#3b82f6' },
  { lat: 50.05, lng: 2.35,   name: 'Paris',            color: '#10b981' },
  { lat: 38.97, lng: -122.41,name: 'SF',               color: '#f59e0b' },
  { lat: 32.85, lng: -118.24,name: 'LA',               color: '#a855f7' },
  { lat: 41.9128, lng: -74.0060, name: 'Local Crawl 🍜', color: '#ec4899' }, // offset label to prevent collision
];

const ROUTES = [
  {
    type: 'flight',
    start: { lat: 35.68, lng: 139.69 },
    end: { lat: 48.85, lng: 2.35 },
    altitude: 0.35,
    speed: 0.05,
    color: '#10b981'
  },
  {
    type: 'train',
    start: { lat: 35.68, lng: 139.69 },
    end: { lat: 35.01, lng: 135.77 },
    altitude: 0.12,
    speed: 0.12,
    color: '#3b82f6'
  },
  {
    type: 'car',
    start: { lat: 37.77, lng: -122.41 },
    end: { lat: 34.05, lng: -118.24 },
    altitude: 0.08,
    speed: 0.15,
    color: '#f59e0b'
  }
];

function createIconSprite(type: string, color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.clearRect(0, 0, 64, 64);

    // Dynamic icon glow ring
    ctx.fillStyle = `${color}25`;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = `${color}40`;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.translate(32, 32);

    if (type === "plane") {
      ctx.rotate(-Math.PI / 4); // rotate to direct forward direction
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(3, -6);
      ctx.lineTo(16, 2);
      ctx.lineTo(16, 5);
      ctx.lineTo(3, 1);
      ctx.lineTo(3, 10);
      ctx.lineTo(8, 14);
      ctx.lineTo(8, 16);
      ctx.lineTo(0, 14);
      ctx.lineTo(-8, 16);
      ctx.lineTo(-8, 14);
      ctx.lineTo(-3, 10);
      ctx.lineTo(-3, 1);
      ctx.lineTo(-16, 5);
      ctx.lineTo(-16, 2);
      ctx.lineTo(-3, -6);
      ctx.closePath();
      ctx.fill();
    } else if (type === "train") {
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(6, -4);
      ctx.quadraticCurveTo(14, -4, 14, 2);
      ctx.lineTo(14, 6);
      ctx.lineTo(-14, 6);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
      ctx.fillRect(-12, -1, 3, 2);
      ctx.fillRect(-7, -1, 3, 2);
      ctx.fillRect(-2, -1, 3, 2);
      ctx.fillRect(3, -1, 3, 2);
    } else if (type === "car") {
      ctx.beginPath();
      ctx.moveTo(-12, 1);
      ctx.bezierCurveTo(-12, -2, -8, -4, -4, -4);
      ctx.lineTo(2, -4);
      ctx.bezierCurveTo(5, -4, 7, -2, 8, 1);
      ctx.lineTo(12, 1);
      ctx.quadraticCurveTo(14, 1, 14, 3);
      ctx.lineTo(14, 5);
      ctx.lineTo(-14, 5);
      ctx.lineTo(-14, 3);
      ctx.quadraticCurveTo(-14, 1, -12, 1);
      ctx.closePath();
      ctx.fill();

      // Wheels
      ctx.fillStyle = "#000000";
      ctx.beginPath();
      ctx.arc(-7, 5, 2.5, 0, 2 * Math.PI);
      ctx.arc(7, 5, 2.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(15, 15, 1); // Exact dimension size
  return sprite;
}

export default function ThreeDGlobe({ isDark, prefersReducedMotion }: ThreeDGlobeProps) {
  const globeRef = useRef<any>(null);

  // Static layers data
  const customLayerData = useRef(
    ROUTES.map(r => ({
      type: r.type,
      route: r,
      t: 0,
      lastTime: 0
    }))
  ).current;

  useEffect(() => {
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.8; // ~0.3 RPM
        controls.enableZoom = false;
        controls.enableRotate = false;
        controls.enablePan = false;
      }
    }
  }, [globeRef.current]);

  // Performance Benchmarking Loops
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let id: number;

    const measure = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = (frameCount * 1000) / (now - lastTime);
        console.log(`[PERF_FPS] FPS: ${fps.toFixed(1)}`);
        frameCount = 0;
        lastTime = now;
      }
      id = requestAnimationFrame(measure);
    };
    id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
  }, []);

  const onRender = (
    id: string,
    phase: "mount" | "update" | "nested-update",
    actualDuration: number
  ) => {
    console.log(`[PERF_REACT] phase: ${phase}, duration: ${actualDuration.toFixed(3)}ms`);
  };

  const globeImageUrl = isDark
    ? "//unpkg.com/three-globe/example/img/earth-night.jpg"
    : "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg";

  const atmosphereColor = isDark ? "#3b82f6" : "#10b981";

  const arcsData = ROUTES.map(r => ({
    startLat: r.start.lat,
    startLng: r.start.lng,
    endLat: r.end.lat,
    endLng: r.end.lng,
    color: r.color,
    altitude: r.altitude,
  }));

  // Update object positions smoothly inside ThreeJS render ticks
  const customThreeObjectUpdate = (obj: any, d: any) => {
    const now = performance.now();
    if (!d.lastTime) d.lastTime = now;
    const dt = (now - d.lastTime) / 1000;
    d.lastTime = now;

    if (!prefersReducedMotion) {
      d.t += d.route.speed * dt;
      if (d.t > 1) d.t = 0; // loop
    }

    const route = d.route;

    // Spherical Great-Circle Interpolation Math
    const rLat1 = (route.start.lat * Math.PI) / 180;
    const rLng1 = (route.start.lng * Math.PI) / 180;
    const rLat2 = (route.end.lat * Math.PI) / 180;
    const rLng2 = (route.end.lng * Math.PI) / 180;

    const x1 = Math.cos(rLat1) * Math.cos(rLng1);
    const y1 = Math.sin(rLat1);
    const z1 = Math.cos(rLat1) * Math.sin(rLng1);

    const x2 = Math.cos(rLat2) * Math.cos(rLng2);
    const y2 = Math.sin(rLat2);
    const z2 = Math.cos(rLat2) * Math.sin(rLng2);

    const x = x1 + d.t * (x2 - x1);
    const y = y1 + d.t * (y2 - y1);
    const z = z1 + d.t * (z2 - z1);
    const len = Math.sqrt(x * x + y * y + z * z);

    const lat = (Math.asin(y / len) * 180) / Math.PI;
    const lng = (Math.atan2(z / len, x / len) * 180) / Math.PI;
    const alt = Math.sin(d.t * Math.PI) * route.altitude;

    if (globeRef.current) {
      const coords = globeRef.current.getCoords(lat, lng, alt);
      if (coords) {
        Object.assign(obj.position, coords);
      }
    }
  };

  return (
    <div className="w-[540px] h-[540px] rounded-full overflow-hidden flex items-center justify-center relative z-0 pointer-events-none">
      <Profiler id="ThreeDGlobeRender" onRender={onRender}>
        <Globe
          ref={globeRef}
          width={540}
          height={540}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={globeImageUrl}
          showAtmosphere={true}
          atmosphereColor={atmosphereColor}
          atmosphereAltitude={0.15}

          // Arcs
          arcsData={arcsData}
          arcColor="color"
          arcAltitude="altitude"
          arcStroke={0.6}
          arcDashLength={0.45}
          arcDashGap={0.15}
          arcDashAnimateTime={1600}

          // Points (Pins)
          pointsData={CITIES}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointRadius={0.4}
          pointAltitude={0.02}

          // Labels
          labelsData={LABELS}
          labelLat="lat"
          labelLng="lng"
          labelText="name"
          labelColor="color"
          labelSize={1.4}
          labelDotRadius={0.3}
          labelAltitude={0.035}

          // HTML layer disabled, using Custom ThreeJS layer for dynamic vehicle positioning
          customLayerData={customLayerData}
          customThreeObject={(d: any) => createIconSprite(d.type, d.route.color)}
          customThreeObjectUpdate={customThreeObjectUpdate}
        />
      </Profiler>
    </div>
  );
}
