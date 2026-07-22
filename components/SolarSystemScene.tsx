"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Billboard, Float, Html, OrbitControls, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Location } from "@/src/domain/space-weather";
import type { SceneFocus } from "@/src/lib/celestial-focus";
import type { EphemerisBody, SolarSystemSnapshot } from "@/src/lib/providers/horizons";
import { earthYawForLocation, locationToCartesian } from "@/src/lib/geography";
import type { VisualState } from "@/src/lib/scenario";
import type { StoryAct } from "@/src/lib/story";
import { surfaceForTarget } from "@/src/lib/planet-surfaces";

type Instrument = "193" | "magnetogram";
type TextureLoadState = "loading" | "ready" | "error";
export type ExperienceScene = "system" | "sun" | "earth" | "spacecraft" | "planet";

const sunPosition = new THREE.Vector3(-4.25, 0, 0);
const overviewSunPosition = new THREE.Vector3(0, 0, 0);
const detailSunPosition = new THREE.Vector3(-5.2, 3.6, 5);
const overviewOpeningTarget = new THREE.Vector3(0, 0, 0);
const overviewOpeningCamera = new THREE.Vector3(0, 15.6, 26.5);
const overviewSystemFov = 48;

function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const ionVertexShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uTrace;
  uniform vec2 uPointer;
  attribute float aSeed;
  attribute float aSize;
  varying float vAlpha;

  void main() {
    vec3 p = position;
    float travel = fract(aSeed + uTime * (.095 + uIntensity * .13 + uTrace * .24));
    p.x = -3.28 + travel * 6.48;
    p.y += sin(travel * 11.0 + aSeed * 33.0 + uTime * .55) * (.035 + uIntensity * .17);
    p.z += cos(travel * 8.0 + aSeed * 21.0 + uTime * .38) * (.025 + uIntensity * .12);
    vec2 cursor = vec2(uPointer.x * 3.15, uPointer.y * 1.48);
    float cursorDistance = length(vec2(p.x, p.y) - cursor);
    float cursorField = 1.0 - smoothstep(.08, 1.06, cursorDistance);
    vec2 away = normalize(vec2(p.x, p.y) - cursor + vec2(.0001));
    p.y += away.y * cursorField * (.08 + uIntensity * .19);
    p.z += sin(aSeed * 48.0 + uTime * .8) * cursorField * (.05 + uIntensity * .13);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (.7 + aSize * 1.5 + uIntensity * 1.05) * (55.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = smoothstep(0.01, .14, travel) * (1.0 - smoothstep(.77, 1.0, travel));
  }
`;

const ionFragmentShader = `
  uniform float uIntensity;
  varying float vAlpha;

  void main() {
    float distanceFromCenter = distance(gl_PointCoord, vec2(.5));
    float core = 1.0 - smoothstep(0.0, .18, distanceFromCenter);
    float halo = 1.0 - smoothstep(.05, .5, distanceFromCenter);
    vec3 color = mix(vec3(1.0, .46, .08), vec3(1.0, .86, .48), core + uIntensity * .18);
    gl_FragColor = vec4(color, (core + halo * .22) * vAlpha * (.18 + uIntensity * .38));
  }
`;

const heliosphereVertexShader = `
  uniform float uTime;
  attribute float aAngle;
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aHeight;
  attribute float aSize;
  varying float vAlpha;

  void main() {
    float travel = fract(aPhase + uTime * aSpeed);
    float radius = 2.35 + travel * 12.35;
    float arc = aAngle + sin(uTime * .11 + aPhase * 9.0) * .015;
    vec3 p = vec3(cos(arc) * radius, aHeight + sin(radius * 1.25 + aPhase * 13.0) * .055, sin(arc) * radius * .82);
    vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.15 + aSize * 2.2) * (84.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = smoothstep(.02, .12, travel) * (1.0 - smoothstep(.78, 1.0, travel));
  }
`;

const heliosphereFragmentShader = `
  varying float vAlpha;
  void main() {
    float d = distance(gl_PointCoord, vec2(.5));
    float core = 1.0 - smoothstep(.0, .16, d);
    float halo = 1.0 - smoothstep(.04, .5, d);
    vec3 color = mix(vec3(1.0, .34, .045), vec3(1.0, .82, .36), core);
    gl_FragColor = vec4(color, (core + halo * .28) * vAlpha * .46);
  }
`;

const galacticDustVertexShader = `
  uniform float uTime;
  attribute float aSize;
  attribute float aAlpha;
  attribute float aWarmth;
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = .72 + sin(uTime * (.16 + aWarmth * .08) + aSize * 32.0) * .28;
    gl_PointSize = (1.15 + aSize * 4.2) * (145.0 / max(1.0, -mvPosition.z));
    gl_Position = projectionMatrix * mvPosition;
    vAlpha = aAlpha * twinkle;
    vWarmth = aWarmth;
  }
`;

const galacticDustFragmentShader = `
  varying float vAlpha;
  varying float vWarmth;
  void main() {
    float d = distance(gl_PointCoord, vec2(.5));
    float body = 1.0 - smoothstep(.04, .5, d);
    vec3 color = mix(vec3(.26, .45, .9), vec3(.95, .57, .28), vWarmth);
    gl_FragColor = vec4(color, body * vAlpha);
  }
`;

function SolarPhotonField({ paused }: { paused: boolean }) {
  const photons = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const geometry = useMemo(() => {
    const random = seededRandom(0x51a7e1);
    const count = 760;
    const data = new Float32Array(count * 3);
    const angle = new Float32Array(count);
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const height = new Float32Array(count);
    const size = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      angle[index] = random() * Math.PI * 2;
      phase[index] = random();
      speed[index] = .014 + random() * .022;
      height[index] = (random() - .5) * (.08 + random() * .22);
      size[index] = random();
    }
    return new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(data, 3))
      .setAttribute("aAngle", new THREE.BufferAttribute(angle, 1))
      .setAttribute("aPhase", new THREE.BufferAttribute(phase, 1))
      .setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1))
      .setAttribute("aHeight", new THREE.BufferAttribute(height, 1))
      .setAttribute("aSize", new THREE.BufferAttribute(size, 1));
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: heliosphereVertexShader,
    fragmentShader: heliosphereFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [uniforms]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame((scene) => { if (!paused) uniforms.uTime.value = scene.clock.getElapsedTime(); });
  return <points ref={photons} geometry={geometry} frustumCulled={false}><primitive object={material} attach="material" /></points>;
}

function SolarWavefronts({ paused }: { paused: boolean }) {
  const rings = useRef<THREE.Mesh[]>([]);
  useFrame((scene) => {
    const time = paused ? 0 : scene.clock.getElapsedTime();
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const phase = (time * .052 + index / 4) % 1;
      ring.scale.setScalar(2.45 + phase * 12.8);
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.sin(phase * Math.PI) * .16;
    });
  });
  return <group>
    {[0, 1, 2, 3].map((index) => <mesh key={index} ref={(ring) => { if (ring) rings.current[index] = ring; }} rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1, 1.012, 160]} />
      <meshBasicMaterial color="#ffc66d" transparent opacity={.1} side={THREE.DoubleSide} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>)}
  </group>;
}

function GalacticDustBand({ paused }: { paused: boolean }) {
  const dust = useRef<THREE.Points>(null);
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), []);
  const geometry = useMemo(() => {
    const random = seededRandom(0x5a17c0de);
    const count = 1800;
    const positions = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const alpha = new Float32Array(count);
    const warmth = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      const longitude = random() * Math.PI * 2;
      const latitude = (random() + random() + random() - 1.5) * .19;
      const radius = 96 + random() * 18;
      const cosLatitude = Math.cos(latitude);
      positions[index * 3] = Math.cos(longitude) * cosLatitude * radius;
      positions[index * 3 + 1] = Math.sin(latitude) * radius;
      positions[index * 3 + 2] = Math.sin(longitude) * cosLatitude * radius;
      size[index] = Math.pow(random(), 2.4);
      alpha[index] = .055 + Math.pow(random(), 1.9) * .2;
      warmth[index] = random();
    }
    return new THREE.BufferGeometry()
      .setAttribute("position", new THREE.BufferAttribute(positions, 3))
      .setAttribute("aSize", new THREE.BufferAttribute(size, 1))
      .setAttribute("aAlpha", new THREE.BufferAttribute(alpha, 1))
      .setAttribute("aWarmth", new THREE.BufferAttribute(warmth, 1));
  }, []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms,
    vertexShader: galacticDustVertexShader,
    fragmentShader: galacticDustFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }), [uniforms]);
  useEffect(() => () => { geometry.dispose(); material.dispose(); }, [geometry, material]);
  useFrame((scene, delta) => {
    if (!paused) uniforms.uTime.value = scene.clock.getElapsedTime();
    if (dust.current && !paused) dust.current.rotation.z += delta * .0018;
  });
  return <points ref={dust} geometry={geometry} rotation={[.72, .22, -.34]} frustumCulled={false}><primitive object={material} attach="material" /></points>;
}

function SolarWind({ state, tracing, paused }: { state: VisualState; tracing: boolean; paused: boolean }) {
  const ions = useRef<THREE.Points>(null);
  const filaments = useRef<THREE.Group>(null);
  const uniforms = useMemo(() => ({ uTime: { value: Math.random() * 6 }, uIntensity: { value: 0 }, uTrace: { value: 0 }, uPointer: { value: new THREE.Vector2(2, 2) } }), []);
  const [positions, seeds, sizes] = useMemo(() => {
    const count = 1280;
    const points = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const particleSizes = new Float32Array(count);
    for (let index = 0; index < count; index++) {
      const offset = index * 3;
      const spread = Math.pow(Math.random(), .64);
      points[offset] = 0;
      points[offset + 1] = (Math.random() - .5) * 3.82 * spread;
      points[offset + 2] = (Math.random() - .5) * 2.25 * spread;
      phases[index] = Math.random();
      particleSizes[index] = Math.random();
    }
    return [points, phases, particleSizes];
  }, []);
  const wavePaths = useMemo(() => Array.from({ length: 24 }, (_, index) => {
    const points: THREE.Vector3[] = [];
    const baseY = (Math.random() - .5) * 3.05;
    const baseZ = (Math.random() - .5) * 1.76;
    const amplitude = .035 + Math.random() * .14;
    const frequency = 1.5 + Math.random() * 3.5;
    const phase = Math.random() * Math.PI * 2;
    for (let step = 0; step <= 90; step++) {
      const progress = step / 90;
      const envelope = Math.sin(progress * Math.PI);
      points.push(new THREE.Vector3(-3.22 + progress * 6.28, baseY + Math.sin(progress * Math.PI * frequency + phase) * amplitude * envelope, baseZ + Math.cos(progress * Math.PI * (frequency * .78) + phase) * amplitude * .7 * envelope));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineDashedMaterial({ color: index % 5 === 0 ? "#8ddfff" : "#ffd786", dashSize: .04 + (index % 4) * .014, gapSize: .13 + (index % 3) * .03, scale: 1.1, transparent: true, opacity: .16, depthWrite: false, blending: THREE.AdditiveBlending });
    const line = new THREE.Line(geometry, material);
    line.computeLineDistances();
    return line;
  }), []);

  useFrame((scene, delta) => {
    uniforms.uIntensity.value = state.intensity;
    uniforms.uTrace.value = tracing ? 1 : 0;
    uniforms.uPointer.value.x += (scene.pointer.x - uniforms.uPointer.value.x) * Math.min(1, delta * 8);
    uniforms.uPointer.value.y += (scene.pointer.y - uniforms.uPointer.value.y) * Math.min(1, delta * 8);
    if (ions.current) ions.current.geometry.setDrawRange(0, Math.min(1280, state.particleCount + 170 + (tracing ? 180 : 0)));
    if (paused) return;
    uniforms.uTime.value += delta;
    if (!filaments.current) return;
    filaments.current.children.forEach((child, index) => {
      const material = (child as THREE.Line).material as THREE.LineDashedMaterial;
      child.position.x = -((uniforms.uTime.value * state.particleSpeed * (tracing ? 2.8 : .92) * (index % 3 === 0 ? 1.2 : .72) + index * .09) % .18);
      material.opacity = .08 + state.intensity * .2 + (tracing ? .14 : 0);
    });
  });

  return <group>
    <points ref={ions} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
      </bufferGeometry>
      <shaderMaterial uniforms={uniforms} vertexShader={ionVertexShader} fragmentShader={ionFragmentShader} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
    <group ref={filaments}>
      {wavePaths.map((wave, index) => <primitive key={index} object={wave} />)}
    </group>
  </group>;
}

function SolarCorona({ intensity, paused, instrument, position = sunPosition }: { intensity: number; paused: boolean; instrument: Instrument; position?: THREE.Vector3 }) {
  const corona = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const value = new Float32Array(420 * 3);
    for (let index = 0; index < 420; index++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 2.28 + Math.pow(Math.random(), 2) * .62;
      value.set([radius * Math.sin(phi) * Math.cos(theta), radius * Math.cos(phi), radius * Math.sin(phi) * Math.sin(theta)], index * 3);
    }
    return value;
  }, []);
  useFrame((_, delta) => { if (!paused && corona.current) corona.current.rotation.y += delta * (.018 + intensity * .065); });
  return <points ref={corona} position={position}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry><pointsMaterial color={instrument === "193" ? "#ffd77a" : "#9ab9ff"} size={.012 + intensity * .028} transparent opacity={.16 + intensity * .3} depthWrite={false} blending={THREE.AdditiveBlending} /></points>;
}

function SolarArcs({ intensity, paused, instrument, position = sunPosition }: { intensity: number; paused: boolean; instrument: Instrument; position?: THREE.Vector3 }) {
  const arcs = useMemo(() => Array.from({ length: 16 }, (_, index) => {
    const angle = (index / 16) * Math.PI * 2 + Math.random() * .24;
    const width = .18 + Math.random() * .32;
    const surface = 2.08 + Math.random() * .12;
    const side = Math.random() > .5 ? 1 : -1;
    const points = [
      new THREE.Vector3(Math.cos(angle - width) * surface, Math.sin(angle - width) * surface, .13 * side),
      new THREE.Vector3(Math.cos(angle - width * .38) * (surface + .25), Math.sin(angle - width * .38) * (surface + .25), .48 * side),
      new THREE.Vector3(Math.cos(angle + width * .38) * (surface + .25), Math.sin(angle + width * .38) * (surface + .25), .48 * side),
      new THREE.Vector3(Math.cos(angle + width) * surface, Math.sin(angle + width) * surface, .13 * side),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 20, .007 + Math.random() * .012, 6, false);
  }), []);
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => { if (!paused && group.current) group.current.rotation.z += delta * (.006 + intensity * .015); });
  return <group ref={group} position={position} rotation={[0, .16, 0]}>{arcs.map((geometry, index) => <mesh geometry={geometry} key={index}><meshBasicMaterial color={instrument === "193" ? "#ffe0a1" : "#9eb8ff"} transparent opacity={.11 + intensity * .16} blending={THREE.AdditiveBlending} /></mesh>)}</group>;
}

const solarSurfaceVertexShader = `
  varying vec3 vObjectNormal;
  varying vec3 vWorldPosition;
  void main() {
    vObjectNormal = normalize(normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const solarSurfaceFragmentShader = `
  uniform float uTime;
  uniform float uIntensity;
  uniform float uMagnetogram;
  varying vec3 vObjectNormal;
  varying vec3 vWorldPosition;

  float hash31(vec3 p) {
    p = fract(p * .1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i + vec3(0., 0., 0.)), hash31(i + vec3(1., 0., 0.)), f.x),
                   mix(hash31(i + vec3(0., 1., 0.)), hash31(i + vec3(1., 1., 0.)), f.x), f.y),
               mix(mix(hash31(i + vec3(0., 0., 1.)), hash31(i + vec3(1., 0., 1.)), f.x),
                   mix(hash31(i + vec3(0., 1., 1.)), hash31(i + vec3(1., 1., 1.)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = .5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise3(p) * amplitude;
      p = p * 2.03 + vec3(17.1, 9.2, 13.7);
      amplitude *= .5;
    }
    return value;
  }

  void main() {
    vec3 normal = normalize(vObjectNormal);
    float latitude = asin(clamp(normal.y, -1.0, 1.0));
    float longitude = atan(normal.z, normal.x);
    vec3 flowNormal = normalize(normal + vec3(
      sin(latitude * 8.0 + uTime * .045) * .055,
      sin(longitude * 5.0 - uTime * .03) * .032,
      cos(latitude * 6.0 + uTime * .038) * .05
    ));
    float convection = fbm(flowNormal * 4.0 + vec3(uTime * .018, 0.0, -uTime * .012));
    float granulation = fbm(flowNormal * 19.0 + vec3(-uTime * .055, uTime * .032, 0.0));
    float activeRegion = smoothstep(.64, .83, fbm(flowNormal * 8.0 + vec3(4.2, 12.7, 1.6)));
    float longitudinalFilament = pow(.5 + .5 * sin(longitude * 11.0 + latitude * 5.0 + convection * 10.0), 5.0);
    float cellCore = smoothstep(.31, .78, convection);
    float energy = clamp(.09 + cellCore * .73 + granulation * .28 + activeRegion * .42 + longitudinalFilament * .12, 0.0, 1.65);
    vec3 plasma = mix(vec3(.075, .002, .0005), vec3(1.0, .16, .003), energy);
    plasma = mix(plasma, vec3(1.0, .78, .21), smoothstep(.72, 1.22, energy));

    vec3 magnetic = mix(vec3(.012, .025, .11), vec3(.22, .78, 1.0), smoothstep(.38, .9, energy));
    plasma = mix(plasma, magnetic, uMagnetogram);
    float viewDot = max(dot(normalize(cameraPosition - vWorldPosition), normal), 0.0);
    float limb = .72 + .38 * pow(viewDot, .46);
    gl_FragColor = vec4(plasma * limb * (1.02 + uIntensity * .24), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const atmosphereVertexShader = `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const atmosphereFragmentShader = `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform vec3 uSunDirection;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    vec3 normal = normalize(vWorldNormal);
    float rim = pow(1.0 - max(0.0, dot(normal, viewDirection)), 2.25);
    float sunFacing = smoothstep(-.22, .42, dot(normal, normalize(uSunDirection)));
    float forwardScatter = pow(max(0.0, dot(viewDirection, normalize(uSunDirection))), 3.0);
    float density = rim * (.24 + sunFacing * .76) * (1.0 + forwardScatter * .22);
    gl_FragColor = vec4(uColor, density * uOpacity);
  }
`;

function SolarObservedSurface({ state, paused, magnetic }: { state: VisualState; paused: boolean; magnetic: boolean }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uTime: { value: Math.random() * 18 }, uIntensity: { value: state.intensity }, uMagnetogram: { value: magnetic ? 1 : 0 } },
    vertexShader: solarSurfaceVertexShader,
    fragmentShader: solarSurfaceFragmentShader,
  }), []);
  useEffect(() => () => material.dispose(), [material]);
  useFrame((_, delta) => {
    material.uniforms.uIntensity.value = state.intensity;
    material.uniforms.uMagnetogram.value = magnetic ? 1 : 0;
    if (!paused) material.uniforms.uTime.value += delta;
  });
  return <mesh><sphereGeometry args={[2.2, 96, 96]} /><primitive object={material} attach="material" /></mesh>;
}

const solarDiscVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const solarDiscFragmentShader = `
  uniform sampler2D uMap;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    vec2 centeredUv = vUv - .5;
    float radius = length(centeredUv);
    float edge = 1.0 - smoothstep(.455, .5, radius);
    vec3 observed = texture2D(uMap, vUv).rgb;
    float observedEnergy = pow(max(dot(observed, vec3(.2126, .7152, .0722)), 0.0), .8);
    observed = mix(vec3(.13, .004, .001), vec3(1.0, .78, .2), observedEnergy) * (1.08 + uIntensity * .16);
    float limb = .82 + .18 * (1.0 - smoothstep(.0, .48, radius));
    gl_FragColor = vec4(observed * limb, edge);
  }
`;

function SolarObservedDisc({ texture, intensity, position = overviewSunPosition }: { texture: THREE.Texture; intensity: number; position?: THREE.Vector3 }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uMap: { value: texture }, uIntensity: { value: intensity } },
    vertexShader: solarDiscVertexShader,
    fragmentShader: solarDiscFragmentShader,
    transparent: true,
    depthWrite: false,
  }), [texture]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => { material.uniforms.uIntensity.value = intensity; });
  return <group position={position}>
    <Billboard>
      <mesh renderOrder={2}><planeGeometry args={[4.4, 4.4]} /><primitive object={material} attach="material" /></mesh>
      <mesh position={[0, 0, -.01]} scale={1.035} renderOrder={1}><circleGeometry args={[2.2, 96]} /><meshBasicMaterial color="#ffb543" transparent opacity={.035} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </Billboard>
  </group>;
}

function PlanetAtmosphere({ color, radius, opacity, flatten = 1, sunAt = overviewSunPosition }: { color: THREE.ColorRepresentation; radius: number; opacity: number; flatten?: number; sunAt?: THREE.Vector3 }) {
  const shell = useRef<THREE.Mesh>(null);
  const planetPosition = useMemo(() => new THREE.Vector3(), []);
  const sunDirection = useMemo(() => new THREE.Vector3(), []);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uSunDirection: { value: new THREE.Vector3(1, 0, 0) } },
    vertexShader: atmosphereVertexShader,
    fragmentShader: atmosphereFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending,
  }), [color, opacity]);
  useEffect(() => () => material.dispose(), [material]);
  useFrame(() => {
    if (!shell.current) return;
    shell.current.getWorldPosition(planetPosition);
    sunDirection.copy(sunAt).sub(planetPosition).normalize();
    material.uniforms.uSunDirection.value.copy(sunDirection);
  });
  return <mesh ref={shell} scale={[1.035, 1.035 * flatten, 1.035]}><sphereGeometry args={[radius, 64, 64]} /><primitive object={material} attach="material" /></mesh>;
}

function Sun({ state, paused, instrument, sourceTexture = true, animated = true, flat = false, position = sunPosition }: { state: VisualState; paused: boolean; instrument: Instrument; sourceTexture?: boolean; animated?: boolean; flat?: boolean; position?: THREE.Vector3 }) {
  const [sdoTexture, setSdoTexture] = useState<THREE.Texture | null>(null);
  const fallbackTexture = useMemo(() => {
    const size = 256;
    const pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const turbulence = Math.sin(x * .15) * .17 + Math.sin(y * .12) * .14 + Math.sin((x + y) * .06) * .12 + Math.random() * .22;
      const energy = Math.max(0, Math.min(1, .48 + turbulence));
      pixels[index] = 220 + Math.floor(35 * energy);
      pixels[index + 1] = 54 + Math.floor(118 * energy);
      pixels[index + 2] = Math.floor(13 * energy);
      pixels[index + 3] = 255;
    }
    const texture = new THREE.DataTexture(pixels, size, size, THREE.RGBAFormat);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => {
    let cancelled = false;
    setSdoTexture(null);
    if (!sourceTexture) return () => { cancelled = true; };
    new THREE.TextureLoader().load(`/api/solar-image/${instrument}`, (loaded) => {
      if (cancelled) { loaded.dispose(); return; }
      loaded.colorSpace = THREE.SRGBColorSpace;
      setSdoTexture(loaded);
    }, undefined, () => undefined);
    return () => { cancelled = true; };
  }, [instrument, sourceTexture]);
  const magneticView = instrument === "magnetogram";
  const texture = sdoTexture ?? fallbackTexture;
  const solarIntensity = animated ? state.intensity : .3;
  const displayState = animated ? state : { ...state, intensity: solarIntensity };
  if (flat) return <SolarObservedDisc texture={texture} intensity={solarIntensity} position={position} />;
  return <Float speed={paused || !animated ? 0 : .62} rotationIntensity={paused || !animated ? 0 : .06} floatIntensity={paused || !animated ? 0 : .1}>
    <group position={position}>
      <mesh><sphereGeometry args={[2.17, 72, 72]} /><meshBasicMaterial color={magneticView ? "#536fdf" : "#ff5b08"} /></mesh>
      <SolarObservedSurface state={displayState} paused={paused || !animated} magnetic={magneticView} />
      <mesh scale={1.035 + solarIntensity * .025}><sphereGeometry args={[2.2, 72, 72]} /><meshBasicMaterial color={magneticView ? "#7598ff" : "#ff7b16"} transparent opacity={.12 + solarIntensity * .09} side={THREE.BackSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>
    </group>
  </Float>;
}

function hash(x: number, y: number) { const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123; return value - Math.floor(value); }
function smoothNoise(x: number, y: number) {
  const xi = Math.floor(x); const yi = Math.floor(y); const xf = x - xi; const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf); const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi); const b = hash(xi + 1, yi); const c = hash(xi, yi + 1); const d = hash(xi + 1, yi + 1);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}
function layeredNoise(x: number, y: number) { return smoothNoise(x, y) * .55 + smoothNoise(x * 2.1, y * 2.1) * .28 + smoothNoise(x * 4.2, y * 4.2) * .17; }

function Earth() {
  const surfaceSource = useSurfaceTexture("earth");
  const clouds = useMemo(() => {
    const size = 256;
    const cloudPixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const index = (y * size + x) * 4;
      const latitude = Math.abs(y / size - .5) * 2;
      const cloud = layeredNoise(x / 18 + 19, y / 18 + 11) > .64 && latitude < .88;
      cloudPixels[index] = 220; cloudPixels[index + 1] = 239; cloudPixels[index + 2] = 255; cloudPixels[index + 3] = cloud ? 130 : 0;
    }
    const cloudMap = new THREE.DataTexture(cloudPixels, size, size, THREE.RGBAFormat);
    cloudMap.colorSpace = THREE.SRGBColorSpace;
    cloudMap.needsUpdate = true;
    return cloudMap;
  }, []);
  if (!surfaceSource) return <Html center><span className="surface-loading">READING EARTH SURFACE</span></Html>;
  return <>
    <mesh><sphereGeometry args={[1.15, 96, 96]} /><PlanetSurfaceMaterial target="earth" texture={surfaceSource} fallbackColor="#1c70a6" sunAt={sunPosition} /></mesh>
    <mesh scale={1.018}><sphereGeometry args={[1.15, 72, 72]} /><meshLambertMaterial map={clouds} transparent depthWrite={false} opacity={.28} /></mesh>
    <PlanetAtmosphere color="#66b9ff" radius={1.15} opacity={.15} sunAt={sunPosition} />
  </>;
}

function MagneticShield({ state }: { state: VisualState }) {
  const fieldLines = useMemo(() => [-1, -.72, -.42, -.16, .16, .42, .72, 1].map((offset) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.06 * state.compression, offset * .33, 0),
      new THREE.Vector3(-1.78 * state.compression, offset * 1.06, offset * .23),
      new THREE.Vector3(.2, offset * 2.08, offset * .58),
      new THREE.Vector3(2.6, offset * 1.68, offset * .38),
      new THREE.Vector3(4.9, offset * .78, 0),
    ]);
    return new THREE.BufferGeometry().setFromPoints(curve.getPoints(68));
  }), [state.compression]);
  return <>{fieldLines.map((geometry, index) => <line key={index}><primitive object={geometry} attach="geometry" /><lineBasicMaterial color={index % 2 ? "#7e8dff" : "#5bcbff"} transparent opacity={.17 + state.intensity * .28} depthWrite={false} blending={THREE.AdditiveBlending} /></line>)}</>;
}

const auroraVertexShader = `
  uniform float uTime;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float radius = length(p.xz);
    float waveA = sin(uv.x * 18.0 + uTime * .46 + uv.y * 5.0);
    float waveB = sin(uv.x * 39.0 - uTime * .31 + uv.y * 9.0) * .42;
    float wave = (waveA + waveB) * (.035 + uStrength * .095) * sin(uv.y * 3.14159);
    p.xz *= (radius + wave) / max(radius, .001);
    p.y += sin(uv.x * 12.0 + uTime * .28) * (.016 + uStrength * .038) * sin(uv.y * 3.14159);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const auroraFragmentShader = `
  uniform float uTime;
  uniform float uStrength;
  uniform float uHue;
  varying vec2 vUv;

  void main() {
    float edge = smoothstep(0.0, .16, vUv.y) * (1.0 - smoothstep(.68, 1.0, vUv.y));
    float ripple = .5 + .5 * sin(vUv.x * 34.0 + sin(vUv.x * 7.0 + uTime * .23) * 2.4 - uTime * .4);
    float filament = pow(ripple, 3.2);
    float breath = .68 + .32 * sin(uTime * .58 + vUv.x * 5.0);
    vec3 emerald = vec3(.08, 1.0, .56);
    vec3 cyan = vec3(.12, .77, 1.0);
    vec3 violet = vec3(.63, .30, 1.0);
    vec3 color = mix(emerald, cyan, smoothstep(.16, .7, vUv.y + uHue * .2));
    color = mix(color, violet, smoothstep(.72, 1.0, vUv.y + uHue * .26));
    float alpha = edge * (.09 + uStrength * .44) * (.22 + filament * .78) * breath;
    gl_FragColor = vec4(color, alpha);
  }
`;

function createAuroraCurtain(hemisphere: 1 | -1, lane: number) {
  const segments = 120;
  const rows = 18;
  const positions = new Float32Array((segments + 1) * (rows + 1) * 3);
  const uvs = new Float32Array((segments + 1) * (rows + 1) * 2);
  const indices: number[] = [];
  let vertex = 0;
  for (let row = 0; row <= rows; row++) {
    const v = row / rows;
    const height = .55 + v * .5;
    const radius = Math.sqrt(Math.max(.16, 1.26 * 1.26 - height * height)) + .025 + lane * .045;
    for (let segment = 0; segment <= segments; segment++) {
      const u = segment / segments;
      const angle = u * Math.PI * 2;
      positions[vertex * 3] = Math.cos(angle) * radius;
      positions[vertex * 3 + 1] = hemisphere * height;
      positions[vertex * 3 + 2] = Math.sin(angle) * radius;
      uvs[vertex * 2] = u;
      uvs[vertex * 2 + 1] = v;
      vertex += 1;
    }
  }
  for (let row = 0; row < rows; row++) for (let segment = 0; segment < segments; segment++) {
    const a = row * (segments + 1) + segment;
    const b = a + segments + 1;
    indices.push(a, b, a + 1, b, b + 1, a + 1);
  }
  return new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(positions, 3)).setAttribute("uv", new THREE.BufferAttribute(uvs, 2)).setIndex(indices);
}

function AuroraCurtains({ state, probability, paused }: { state: VisualState; probability: number | null; paused: boolean }) {
  const group = useRef<THREE.Group>(null);
  const layers = useMemo(() => [
    { geometry: createAuroraCurtain(1, 0), hue: .1, rotation: 0 },
    { geometry: createAuroraCurtain(1, 1), hue: .64, rotation: .72 },
    { geometry: createAuroraCurtain(-1, 0), hue: .35, rotation: 1.38 },
  ].map((layer) => ({ ...layer, uniforms: { uTime: { value: Math.random() * 20 }, uStrength: { value: 0 }, uHue: { value: layer.hue } } })), []);
  useFrame((_, delta) => {
    if (group.current && !paused) group.current.rotation.y += delta * (.022 + state.intensity * .035);
    const sourceStrength = probability === null ? state.intensity : Math.min(.84, Math.max(.08, probability / 100));
    layers.forEach((layer, index) => {
      layer.uniforms.uStrength.value = sourceStrength * (index === 2 ? .78 : 1);
      if (!paused) layer.uniforms.uTime.value += delta;
    });
  });
  return <group ref={group} scale={state.auroraScale}>
    {layers.map((layer, index) => <mesh key={index} geometry={layer.geometry} rotation={[0, layer.rotation, 0]} renderOrder={3}>
      <shaderMaterial vertexShader={auroraVertexShader} fragmentShader={auroraFragmentShader} uniforms={layer.uniforms} transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
    </mesh>)}
  </group>;
}

function ImpactPulse({ state, tracing, paused }: { state: VisualState; tracing: boolean; paused: boolean }) {
  const rings = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (paused || !rings.current) return;
    rings.current.rotation.x += delta * .18;
    rings.current.children.forEach((child, index) => {
      const phase = performance.now() * .0012 + index * 1.9;
      const scale = 1 + Math.sin(phase) * (.04 + state.intensity * .08) + (tracing ? .09 : 0);
      child.scale.set(scale, scale, scale);
    });
  });
  const opacity = .07 + state.intensity * .18 + (tracing ? .16 : 0);
  return <group ref={rings} position={[-1.28 * state.compression, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
    {[1, 1.22, 1.5].map((size, index) => <mesh key={size} scale={[size, size, 1]}><torusGeometry args={[.35, .009 + index * .003, 6, 48]} /><meshBasicMaterial color={index === 1 ? "#b793ff" : "#77e8ff"} transparent opacity={opacity * (1 - index * .18)} blending={THREE.AdditiveBlending} /></mesh>)}
  </group>;
}

const sdoSpacecraftReference = "https://sdo.gsfc.nasa.gov/mission/spacecraft.php";

/**
 * A source-informed, procedural SDO assembly. The NASA reference shows the
 * sun-facing deck and primary instruments; the unseen rear bus is deliberately
 * simplified rather than fabricated as a scientific reconstruction.
 */
function SdoSpacecraftModel({ active }: { active: boolean }) {
  const root = useRef<THREE.Group>(null);
  const antenna = useRef<THREE.Group>(null);
  const solarWing = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-.58, -.16);
    shape.lineTo(.35, -.16);
    shape.lineTo(.53, 0);
    shape.lineTo(.35, .16);
    shape.lineTo(-.58, .16);
    shape.closePath();
    return shape;
  }, []);
  const arrayCells = useMemo(() => Array.from({ length: 14 }, (_, index) => ({
    x: -.39 + (index % 7) * .118,
    y: index < 7 ? -.063 : .063,
  })), []);
  const apertures = useMemo(() => [
    { position: [-.105, .09, .262] as [number, number, number], color: "#ef7d4d" },
    { position: [.105, .09, .262] as [number, number, number], color: "#75d9ff" },
    { position: [-.105, -.09, .262] as [number, number, number], color: "#b98fff" },
    { position: [.105, -.09, .262] as [number, number, number], color: "#e8c568" },
  ], []);
  useEffect(() => {
    if (root.current) root.current.userData = {
      ...root.current.userData,
      sourceUrl: sdoSpacecraftReference,
      modelScope: "Source-informed front / three-quarter instrument layout; rear bus simplified.",
    };
  }, []);
  useFrame((_, delta) => {
    if (!antenna.current) return;
    antenna.current.rotation.y += delta * (active ? .5 : .16);
  });
  return <group ref={root} name="sdo-source-informed-assembly">
    <group name="sdo-solar-arrays" position={[0, 0, -.035]}>
      {[-1, 1].map((side) => <group key={side} position={[side * .73, 0, 0]} scale={[side, 1, 1]}>
        <mesh name={side < 0 ? "sdo-port-solar-array" : "sdo-starboard-solar-array"}>
          <shapeGeometry args={[solarWing]} />
          <meshPhysicalMaterial color="#20336d" metalness={.68} roughness={.26} clearcoat={.2} clearcoatRoughness={.23} />
        </mesh>
        <mesh position={[-.02, 0, -.005]} scale={[1.045, 1.18, 1]}>
          <shapeGeometry args={[solarWing]} />
          <meshBasicMaterial color="#101a3b" transparent opacity={.74} side={THREE.DoubleSide} />
        </mesh>
        {arrayCells.map((cell, index) => <mesh key={index} position={[cell.x, cell.y, .008]}>
          <planeGeometry args={[.078, .075]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#5970b6" : "#314579"} transparent opacity={.6} />
        </mesh>)}
        <mesh position={[-.57, 0, .008]}><boxGeometry args={[.04, .34, .04]} /><meshStandardMaterial color="#8997a8" metalness={.78} roughness={.28} /></mesh>
      </group>)}
    </group>

    <group name="sdo-spacecraft-bus">
      <mesh><boxGeometry args={[.48, .36, .35]} /><meshPhysicalMaterial color="#252b36" metalness={.78} roughness={.31} clearcoat={.08} /></mesh>
      <mesh position={[0, .01, .205]} rotation={[Math.PI / 2, 0, Math.PI / 8]} name="sdo-gold-sun-facing-deck">
        <cylinderGeometry args={[.245, .245, .075, 8]} />
        <meshPhysicalMaterial color="#c99d52" metalness={.82} roughness={.27} clearcoat={.16} clearcoatRoughness={.22} />
      </mesh>
      <mesh position={[0, -.02, -.19]}><boxGeometry args={[.37, .2, .04]} /><meshStandardMaterial color="#10151e" metalness={.42} roughness={.45} /></mesh>
      {[-.18, .18].map((x) => <mesh key={x} position={[x, -.21, -.02]}><cylinderGeometry args={[.026, .026, .13, 8]} /><meshStandardMaterial color="#bdc9d7" metalness={.85} roughness={.22} /></mesh>)}
    </group>

    <group name="sdo-aia-four-telescope-cluster">
      {apertures.map((aperture, index) => <group key={index} position={aperture.position} rotation={[Math.PI / 2, 0, 0]}>
        <mesh><cylinderGeometry args={[.058, .058, .13, 16]} /><meshPhysicalMaterial color="#151b27" metalness={.74} roughness={.26} /></mesh>
        <mesh position={[0, .071, 0]}><torusGeometry args={[.047, .009, 8, 20]} /><meshBasicMaterial color={aperture.color} transparent opacity={.85} /></mesh>
        <mesh position={[0, .077, 0]} rotation={[Math.PI / 2, 0, 0]}><circleGeometry args={[.038, 20]} /><meshBasicMaterial color="#03060c" /></mesh>
      </group>)}
    </group>

    <group name="sdo-hmi-and-eve-instruments">
      <group position={[-.18, .16, .19]} rotation={[0, .22, 0]} name="sdo-hmi-imager">
        <mesh><boxGeometry args={[.12, .1, .12]} /><meshStandardMaterial color="#b9c4ce" metalness={.58} roughness={.33} /></mesh>
        <mesh position={[0, 0, .07]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.038, .038, .025, 16]} /><meshStandardMaterial color="#0a1018" metalness={.65} roughness={.18} /></mesh>
      </group>
      <group position={[.19, .15, .17]} name="sdo-eve-radiometer">
        <mesh><boxGeometry args={[.135, .09, .12]} /><meshStandardMaterial color="#d7dce2" metalness={.44} roughness={.35} /></mesh>
        {[-.035, 0, .035].map((x) => <mesh key={x} position={[x, .01, .066]}><boxGeometry args={[.014, .038, .012]} /><meshBasicMaterial color="#182335" /></mesh>)}
      </group>
    </group>

    <group ref={antenna} position={[.11, .27, -.04]} rotation={[.24, 0, -.2]} name="sdo-high-gain-antenna">
      <mesh position={[0, .13, 0]}><cylinderGeometry args={[.014, .014, .28, 10]} /><meshStandardMaterial color="#9ba9b8" metalness={.85} roughness={.22} /></mesh>
      <group position={[0, .28, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh><cylinderGeometry args={[.105, .03, .038, 24]} /><meshPhysicalMaterial color="#e7edf5" metalness={.78} roughness={.25} /></mesh>
        <mesh position={[0, 0, .025]}><torusGeometry args={[.095, .006, 8, 24]} /><meshStandardMaterial color="#6c7989" metalness={.8} roughness={.23} /></mesh>
      </group>
    </group>
  </group>;
}

function SdoObserver({ paused, active }: { paused: boolean; active: boolean }) {
  const satellite = useRef<THREE.Group>(null);
  const signal = useRef<THREE.Mesh>(null);
  useFrame((scene, delta) => {
    if (paused) return;
    if (satellite.current) {
      // The illustrative orbit stays on the camera-facing hemisphere in the
      // observer chapter so the SDO model reads as an observatory, not a speck
      // hidden behind Earth. It is explicitly not an orbital ephemeris.
      const phase = scene.clock.getElapsedTime() * .17;
      satellite.current.position.set(1.48 + Math.cos(phase) * .32, .66 + Math.sin(phase * 1.45) * .24, 1.08 + Math.cos(phase * .86) * .38);
      satellite.current.rotation.y += delta * (active ? .22 : .14);
      satellite.current.rotation.z = .18 + Math.sin(phase) * .12;
      const scale = active ? 1.18 + Math.sin(performance.now() * .0024) * .035 : 1;
      satellite.current.scale.setScalar(THREE.MathUtils.damp(satellite.current.scale.x, scale, 4, delta));
    }
    if (signal.current) signal.current.scale.setScalar(1 + Math.sin(performance.now() * .003) * (active ? .34 : .16));
  });
  return <group ref={satellite} position={[1.8, .66, 1.46]} rotation={[.18, -.5, -.2]}>
    <group scale={.45}><SdoSpacecraftModel active={active} /></group>
    <mesh ref={signal} position={[.03, .42, .04]} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[.12, .15, 24]} /><meshBasicMaterial color="#78d6ff" transparent opacity={active ? .9 : .55} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
    {active && <>
      <mesh position={[.03, .42, .04]} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[.27, .278, 36]} /><meshBasicMaterial color="#92e9ff" transparent opacity={.42} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
      <pointLight position={[.03, .3, .08]} color="#7ad9ff" intensity={1.5} distance={2.1} />
    </>}
  </group>;
}

function Moon({ paused }: { paused: boolean }) {
  const moon = useRef<THREE.Group>(null);
  const surfaceTexture = useSurfaceTexture("moon");
  useFrame((_, delta) => {
    if (paused || !moon.current) return;
    const phase = performance.now() * .00015;
    moon.current.position.set(Math.cos(phase) * 2.42, Math.sin(phase * 1.7) * .24, Math.sin(phase) * 2.42);
    moon.current.rotation.y += delta * .035;
  });
  return <>
    <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[2.4, 2.408, 96]} /><meshBasicMaterial color="#97b9e5" transparent opacity={.2} side={THREE.DoubleSide} /></mesh>
    <group ref={moon} position={[2.42, 0, 0]}><mesh><sphereGeometry args={[.28, 40, 40]} /><PlanetSurfaceMaterial target="moon" texture={surfaceTexture} fallbackColor="#b8bdc9" sunAt={sunPosition} /></mesh></group>
  </>;
}

function LocationBeacon({ location, paused }: { location: Location; paused: boolean }) {
  const pulse = useRef<THREE.Group>(null);
  const { position, quaternion } = useMemo(() => {
    const coordinates = locationToCartesian(location, 1.185);
    const vector = new THREE.Vector3(coordinates.x, coordinates.y, coordinates.z);
    const direction = vector.clone().normalize();
    return { position: vector, quaternion: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction) };
  }, [location.latitude, location.longitude]);
  useFrame(() => {
    if (paused || !pulse.current) return;
    const scale = 1 + Math.sin(performance.now() * .004) * .22;
    pulse.current.scale.setScalar(scale);
  });
  return <group position={position} quaternion={quaternion}>
    <group ref={pulse}>
      <mesh position={[0, .035, 0]}><sphereGeometry args={[.042, 16, 16]} /><meshBasicMaterial color="#dcfff4" /></mesh>
      <mesh position={[0, .17, 0]}><coneGeometry args={[.035, .29, 16, 1, true]} /><meshBasicMaterial color="#4ef3b2" transparent opacity={.19} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>
    </group>
  </group>;
}

function CinematicGrade({ state, tracing, reducedMotion }: { state: VisualState; tracing: boolean; reducedMotion: boolean }) {
  return <EffectComposer multisampling={0} enableNormalPass={false}>
    <Bloom intensity={.26 + state.intensity * .34 + (tracing ? .1 : 0)} luminanceThreshold={.76} luminanceSmoothing={.24} mipmapBlur />
    <Noise opacity={reducedMotion ? 0 : .018} />
    <Vignette offset={.16} darkness={.82} />
  </EffectComposer>;
}

type LightingProfile = "system" | "sun" | "detail" | "earth";

function SceneLighting({ profile, instrument, intensity = 0 }: { profile: LightingProfile; instrument: Instrument; intensity?: number }) {
  const solarColor = instrument === "193" ? "#ffd6a1" : "#a4b8ff";
  if (profile === "system") return <>
    <ambientLight intensity={.024} />
    <hemisphereLight args={["#315c92", "#02050a", .2]} />
    <directionalLight position={[8, -2, -6]} color="#5d85bd" intensity={.09} />
    <pointLight position={overviewSunPosition} color="#ffe2b4" intensity={1.5} distance={0} decay={0} />
  </>;
  if (profile === "sun") return <>
    <ambientLight intensity={.025} />
    <hemisphereLight args={[solarColor, "#020204", .14]} />
    <pointLight position={[-2.2, 1.6, 5.5]} color={solarColor} intensity={1.25} distance={16} decay={2} />
  </>;
  if (profile === "detail") return <>
    <ambientLight intensity={.022} />
    <hemisphereLight args={["#2b4d7a", "#020305", .26]} />
    <directionalLight position={[-5.2, 3.6, 5]} color="#ffe4bd" intensity={2.35} />
    <directionalLight position={[4, -1.2, -3]} color="#6f9bd6" intensity={.2} />
  </>;
  return <>
    <ambientLight intensity={.024} />
    <hemisphereLight args={["#1f3f65", "#020305", .24]} />
    <directionalLight position={[-6, 3.2, 4]} color={solarColor} intensity={1.5 + intensity * 1.1} />
    <pointLight position={sunPosition} color={solarColor} intensity={4.4 + intensity * 3} distance={15} decay={2} />
  </>;
}

const overviewDaysPerSecond = .34;
const overviewOrbitRadii: Record<EphemerisBody["id"], number> = {
  mercury: 4.2, venus: 5.3, earth: 6.5, mars: 7.8, jupiter: 10.2, saturn: 12.0, uranus: 13.8, neptune: 15.5, pluto: 17.0, moon: .7,
};
const overviewPlanetRadii: Record<EphemerisBody["id"], number> = {
  mercury: .34, venus: .50, earth: .54, mars: .42, jupiter: 1.25, saturn: .92, uranus: .72, neptune: .70, pluto: .30, moon: .13,
};

const overviewLabelOffsets: Partial<Record<SceneFocus, [number, number, number]>> = {
  sun: [3.65, .24, 0],
  mercury: [.38, .24, 0],
  venus: [.52, -.24, 0],
  earth: [.56, .28, 0],
  mars: [.46, -.24, 0],
  jupiter: [1.12, .34, 0],
  saturn: [1.12, -.32, 0],
  uranus: [.68, .28, 0],
  neptune: [.66, -.24, 0],
  pluto: [.35, -.24, 0],
  spacecraft: [.36, .16, 0],
};

function ephemerisPosition(body: EphemerisBody, elapsedSeconds: number) {
  const days = elapsedSeconds * overviewDaysPerSecond;
  const x = body.positionAu[0] + body.velocityAuPerDay[0] * days;
  const y = body.positionAu[1] + body.velocityAuPerDay[1] * days;
  const z = body.positionAu[2] + body.velocityAuPerDay[2] * days;
  const distance = Math.hypot(x, y) || 1;
  const visualRadius = overviewOrbitRadii[body.id];
  return new THREE.Vector3(x / distance * visualRadius, z * .55, -y / distance * visualRadius);
}

function SystemLabel({ body, selected, labelsVisible, onSelect }: { body: { id: SceneFocus; name: string }; selected: SceneFocus; labelsVisible: boolean; onSelect: (focus: SceneFocus) => void }) {
  const isSelected = selected === body.id;
  if (!labelsVisible && !isSelected) return null;
  return <Html center position={overviewLabelOffsets[body.id] ?? [.35, .2, 0]} distanceFactor={13} style={{ pointerEvents: "auto" }}>
    <button className={isSelected ? "system-label" : "system-label passive"} onClick={(event) => { event.stopPropagation(); onSelect(body.id); }} aria-label={`Explore ${body.name}`}>
      {isSelected && <span>SELECTED</span>}<b>{body.name.toUpperCase()}</b><i aria-hidden="true" />
    </button>
  </Html>;
}

function OrbitGuide({ radius }: { radius: number }) {
  const isPrimaryOrbit = radius >= 6.25;
  const thickness = isPrimaryOrbit ? .026 : .011;
  return <mesh rotation={[Math.PI / 2, 0, 0]}>
    <ringGeometry args={[radius - thickness, radius + thickness, 192]} />
    <meshBasicMaterial color={isPrimaryOrbit ? "#d69c49" : "#8094ae"} transparent opacity={isPrimaryOrbit ? .2 : .065} side={THREE.DoubleSide} depthWrite={false} />
  </mesh>;
}

function OrbitalDust({ paused }: { paused: boolean }) {
  const dust = useRef<THREE.Points>(null);
  const [positions, colors] = useMemo(() => {
    const random = seededRandom(0x0a71a5);
    const count = 1120;
    const pointPositions = new Float32Array(count * 3);
    const pointColors = new Float32Array(count * 3);
    const amber = new THREE.Color("#6b4935");
    const rose = new THREE.Color("#523743");
    const violet = new THREE.Color("#36435d");
    const tint = new THREE.Color();
    for (let index = 0; index < count; index++) {
      const angle = random() * Math.PI * 2;
      const radial = 1.82 + Math.pow(random(), .66) * 16.25;
      const broadBand = (random() - .5) * (.62 + radial * .032);
      const offset = index * 3;
      pointPositions[offset] = Math.cos(angle) * radial;
      pointPositions[offset + 1] = broadBand;
      pointPositions[offset + 2] = Math.sin(angle) * radial;
      tint.copy(random() > .76 ? violet : random() > .48 ? rose : amber).multiplyScalar(.4 + random() * .56);
      pointColors[offset] = tint.r;
      pointColors[offset + 1] = tint.g;
      pointColors[offset + 2] = tint.b;
    }
    return [pointPositions, pointColors];
  }, []);
  useFrame((_, delta) => { if (!paused && dust.current) dust.current.rotation.y += delta * .0014; });
  return <points ref={dust} rotation={[0, -.2, 0]}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /><bufferAttribute attach="attributes-color" args={[colors, 3]} /></bufferGeometry>
    <pointsMaterial size={.055} vertexColors transparent opacity={.16} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
  </points>;
}

const saturnRingVertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const saturnRingFragmentShader = `
  uniform float uInner;
  uniform float uOuter;
  varying vec3 vPosition;
  void main() {
    float radial = clamp((length(vPosition.xy) - uInner) / (uOuter - uInner), 0.0, 1.0);
    float fineBands = .50 + sin(radial * 142.0) * .17 + sin(radial * 49.0 + .7) * .12;
    float cassiniDivision = smoothstep(.40, .43, radial) * (1.0 - smoothstep(.46, .49, radial));
    float outerGap = smoothstep(.74, .77, radial) * (1.0 - smoothstep(.81, .84, radial));
    float edge = smoothstep(0.0, .035, radial) * (1.0 - smoothstep(.955, 1.0, radial));
    float alpha = max(0.0, (.62 + fineBands * .32 - cassiniDivision * .72 - outerGap * .36) * edge);
    vec3 color = mix(vec3(.35, .28, .15), vec3(1.0, .82, .45), fineBands + radial * .15);
    gl_FragColor = vec4(color, alpha * .52);
  }
`;

function SaturnRings({ radius }: { radius: number }) {
  const inner = radius * 1.23;
  const outer = radius * 2.12;
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: { uInner: { value: inner }, uOuter: { value: outer } },
    vertexShader: saturnRingVertexShader,
    fragmentShader: saturnRingFragmentShader,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.NormalBlending,
  }), [inner, outer]);
  useEffect(() => () => material.dispose(), [material]);
  return <mesh rotation={[1.12, 0, .3]}>
    <ringGeometry args={[inner, outer, 144]} />
    <primitive object={material} attach="material" />
  </mesh>;
}

function OverviewPlanet({ body, selected, labelsVisible, bodyRefs, onSelect, reducedMotion, visible, onTextureState }: { body: EphemerisBody; selected: SceneFocus; labelsVisible: boolean; bodyRefs: React.MutableRefObject<Record<string, THREE.Group | undefined>>; onSelect: (focus: SceneFocus) => void; reducedMotion: boolean; visible: boolean; onTextureState: (target: string, state: TextureLoadState) => void }) {
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const surfaceTexture = useSurfaceTexture(body.id, onTextureState);
  useEffect(() => { bodyRefs.current[body.id] = group.current ?? undefined; return () => { delete bodyRefs.current[body.id]; }; }, [body.id, bodyRefs]);
  useFrame((scene) => {
    if (!group.current) return;
    group.current.position.copy(ephemerisPosition(body, reducedMotion ? 0 : scene.clock.getElapsedTime()));
    group.current.rotation.y += reducedMotion ? 0 : .004;
    if (pulse.current) pulse.current.scale.setScalar(selected === body.id || hovered ? 1.32 + Math.sin(scene.clock.getElapsedTime() * 3) * .12 : 1);
  });
  const isSelected = selected === body.id;
  const isInteractive = isSelected || hovered;
  const displayRadius = overviewPlanetRadii[body.id] * (isSelected ? 1.18 : 1);
  const oblate = body.id === "jupiter" || body.id === "saturn";
  const restoreCursor = () => { if (typeof document !== "undefined") document.body.style.cursor = ""; };
  return <group ref={group} visible={visible} onClick={(event) => { event.stopPropagation(); onSelect(body.id); }} onPointerOver={(event) => { event.stopPropagation(); setHovered(true); if (typeof document !== "undefined") document.body.style.cursor = "pointer"; }} onPointerOut={() => { setHovered(false); restoreCursor(); }}>
    <mesh scale={oblate ? [1, .91, 1] : 1} onPointerDown={(event) => { event.stopPropagation(); onSelect(body.id); }}><sphereGeometry args={[displayRadius, 48, 48]} /><PlanetSurfaceMaterial target={body.id} texture={surfaceTexture} fallbackColor={body.color} selected={isSelected} overview /></mesh>
    <mesh scale={oblate ? [1, .91, 1] : 1} onPointerDown={(event) => { event.stopPropagation(); onSelect(body.id); }}><sphereGeometry args={[displayRadius * 1.42, 24, 24]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} /></mesh>
    <SurfaceAtmosphere target={body.id} color={body.color} radius={displayRadius} flatten={oblate ? .91 : 1} />
    {body.id === "saturn" && <SaturnRings radius={displayRadius} />}
    {isInteractive && <mesh ref={pulse} rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[displayRadius * 1.72, displayRadius * 1.92, 40]} /><meshBasicMaterial color={hovered ? "#ffd47b" : "#81f4c7"} transparent opacity={hovered ? .52 : .68} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>}
    <SystemLabel body={body} selected={selected} labelsVisible={labelsVisible} onSelect={onSelect} />
  </group>;
}

function OverviewSdo({ selected, labelsVisible, bodyRefs, onSelect, reducedMotion }: { selected: SceneFocus; labelsVisible: boolean; bodyRefs: React.MutableRefObject<Record<string, THREE.Group | undefined>>; onSelect: (focus: SceneFocus) => void; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  useEffect(() => { bodyRefs.current.spacecraft = group.current ?? undefined; return () => { delete bodyRefs.current.spacecraft; }; }, [bodyRefs]);
  useFrame((scene) => {
    const earth = bodyRefs.current.earth;
    if (!earth || !group.current) return;
    const earthPosition = new THREE.Vector3(); earth.getWorldPosition(earthPosition);
    const phase = reducedMotion ? 0 : scene.clock.getElapsedTime() * .48;
    group.current.position.copy(earthPosition).add(new THREE.Vector3(Math.cos(phase) * .32, .14 + Math.sin(phase * 1.7) * .06, Math.sin(phase) * .32));
    group.current.rotation.z += reducedMotion ? 0 : .01;
  });
  const isSelected = selected === "spacecraft";
  return <group ref={group} onClick={(event) => { event.stopPropagation(); onSelect("spacecraft"); }}>
    <mesh><boxGeometry args={[.12, .075, .075]} /><meshStandardMaterial color="#d3eaff" metalness={.8} roughness={.25} emissive="#4a79ad" emissiveIntensity={.6} /></mesh>
    <mesh position={[-.18, 0, 0]}><boxGeometry args={[.22, .04, .012]} /><meshBasicMaterial color="#477bc2" /></mesh><mesh position={[.18, 0, 0]}><boxGeometry args={[.22, .04, .012]} /><meshBasicMaterial color="#477bc2" /></mesh>
    {isSelected && <pointLight color="#8ee8ff" intensity={1.2} distance={1.4} />}
    <SystemLabel body={{ id: "spacecraft", name: "SDO" }} selected={selected} labelsVisible={labelsVisible} onSelect={onSelect} />
  </group>;
}

function OverviewCamera({ selected, bodyRefs, controls }: { selected: SceneFocus; bodyRefs: React.MutableRefObject<Record<string, THREE.Group | undefined>>; controls: React.MutableRefObject<OrbitControlsImpl | null> }) {
  const { camera } = useThree();
  const focusTime = useRef(1.1);
  const previous = useRef<SceneFocus>(selected);
  useFrame((_, delta) => {
    if (previous.current !== selected) { previous.current = selected; focusTime.current = 1.05; }
    if (focusTime.current <= 0) return;
    if (selected === "system") {
      camera.position.lerp(overviewOpeningCamera, Math.min(1, delta * 2.8));
      controls.current?.target.lerp(overviewOpeningTarget, Math.min(1, delta * 3.2));
      controls.current?.update();
      focusTime.current -= delta;
      return;
    }
    const focus = bodyRefs.current[selected];
    if (!focus) return;
    const target = new THREE.Vector3(); focus.getWorldPosition(target);
    const close = selected === "sun" ? 10.5 : selected === "jupiter" || selected === "saturn" ? 4.8 : 3.2;
    const desired = target.clone().add(new THREE.Vector3(close * .5, close * .28, close));
    camera.position.lerp(desired, Math.min(1, delta * 3.4));
    controls.current?.target.lerp(target, Math.min(1, delta * 4));
    controls.current?.update();
    focusTime.current -= delta;
  });
  return null;
}

function SystemMapLoading({ hasPositions, completed, hasError }: { hasPositions: boolean; completed: number; hasError: boolean }) {
  const label = hasError ? "SOURCE MAP UNAVAILABLE" : hasPositions ? `LOADING REAL SURFACES ${completed} / 9` : "READING JPL POSITIONS";
  return <Html fullscreen style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", background: "radial-gradient(circle at 50% 50%, rgba(33,53,89,.12), rgba(2,4,11,.9) 56%)" }}>
      <div style={{ display: "grid", justifyItems: "center", gap: 13, color: "#dceaff", fontFamily: "DM Mono, monospace", fontSize: 10, letterSpacing: ".18em" }}>
        <span style={{ width: 30, height: 30, border: "1px solid rgba(255,198,109,.75)", borderTopColor: "transparent", borderRadius: "50%", animation: "system-source-spin 1.1s linear infinite" }} />
        <span>{label}</span>
      </div>
    </div>
  </Html>;
}

function SystemOverview({ state, reducedMotion, instrument, snapshot, selected, labelsVisible, sdoEffectsEnabled, onSelect }: { state: VisualState; reducedMotion: boolean; instrument: Instrument; snapshot: SolarSystemSnapshot | null; selected: SceneFocus; labelsVisible: boolean; sdoEffectsEnabled: boolean; onSelect: (focus: SceneFocus) => void }) {
  const sun = useRef<THREE.Group>(null);
  const bodyRefs = useRef<Record<string, THREE.Group | undefined>>({});
  const controls = useRef<OrbitControlsImpl>(null);
  const [sunHovered, setSunHovered] = useState(false);
  const [textureStates, setTextureStates] = useState<Partial<Record<EphemerisBody["id"], TextureLoadState>>>({});
  const hasPositions = Boolean(snapshot && snapshot.status !== "unavailable");
  const planets = hasPositions ? snapshot!.bodies.filter((body) => body.kind !== "moon") : [];
  const updateTextureState = useCallback((target: string, nextState: TextureLoadState) => {
    const id = target as EphemerisBody["id"];
    setTextureStates((current) => current[id] === nextState ? current : { ...current, [id]: nextState });
  }, []);
  const completed = planets.filter((body) => textureStates[body.id] === "ready").length;
  const hasTextureError = planets.some((body) => textureStates[body.id] === "error");
  const sceneReady = hasPositions && planets.length === 9 && completed === planets.length;
  useEffect(() => {
    if (!sceneReady) return;
    bodyRefs.current.sun = sun.current ?? undefined;
    return () => { delete bodyRefs.current.sun; };
  }, [sceneReady]);
  return <>
    <color attach="background" args={["#02040b"]} /><fog attach="fog" args={["#02040b", 36, 98]} />
    <SceneLighting profile="system" instrument={instrument} />
    <GalacticDustBand paused={reducedMotion} />
    <Stars radius={130} depth={70} count={4200} factor={2.25} saturation={0} fade speed={reducedMotion ? 0 : .12} />
    {sceneReady && <>
      <OrbitalDust paused={reducedMotion} />
      <SolarWavefronts paused={reducedMotion} />
      {planets.map((body) => <OrbitGuide key={`orbit-${body.id}`} radius={overviewOrbitRadii[body.id]} />)}
      <group ref={sun} onClick={(event) => { event.stopPropagation(); onSelect("sun"); }} onPointerOver={(event) => { event.stopPropagation(); setSunHovered(true); if (typeof document !== "undefined") document.body.style.cursor = "pointer"; }} onPointerOut={() => { setSunHovered(false); if (typeof document !== "undefined") document.body.style.cursor = ""; }}>
        <group scale={1.55}>
          <Sun state={state} paused={reducedMotion} instrument={instrument} animated={sdoEffectsEnabled} flat position={overviewSunPosition} />
          {sdoEffectsEnabled && <><SolarCorona intensity={state.intensity} paused={reducedMotion} instrument={instrument} position={overviewSunPosition} /><SolarArcs intensity={state.intensity} paused={reducedMotion} instrument={instrument} position={overviewSunPosition} /></>}
        </group>
        <mesh onPointerDown={(event) => { event.stopPropagation(); onSelect("sun"); }}><sphereGeometry args={[3.45, 40, 40]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} /></mesh>
        {sunHovered && <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[3.48, 3.65, 64]} /><meshBasicMaterial color="#ffd47b" transparent opacity={.48} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} /></mesh>}
        <SystemLabel body={{ id: "sun", name: "Sun" }} selected={selected} labelsVisible={labelsVisible} onSelect={onSelect} />
      </group>
      <SolarPhotonField paused={reducedMotion} />
    </>}
    {planets.map((body) => <OverviewPlanet key={body.id} body={body} selected={selected} labelsVisible={labelsVisible} bodyRefs={bodyRefs} onSelect={onSelect} reducedMotion={reducedMotion} visible={sceneReady} onTextureState={updateTextureState} />)}
    {sceneReady && <><OverviewCamera selected={selected} bodyRefs={bodyRefs} controls={controls} /><OrbitControls ref={controls} enableDamping dampingFactor={.06} rotateSpeed={.32} zoomSpeed={.6} minDistance={4.5} maxDistance={50} maxPolarAngle={Math.PI * .86} /></>}
    {!sceneReady && <SystemMapLoading hasPositions={hasPositions} completed={completed} hasError={hasTextureError} />}
    <CinematicGrade state={state} tracing={false} reducedMotion={reducedMotion} />
  </>;
}

function SunObservatoryScene({ state, reducedMotion, instrument, sdoEffectsEnabled }: { state: VisualState; reducedMotion: boolean; instrument: Instrument; sdoEffectsEnabled: boolean }) {
  return <>
    <color attach="background" args={["#02040b"]} /><fog attach="fog" args={["#02040b", 7, 25]} />
    <SceneLighting profile="sun" instrument={instrument} />
    <Stars radius={48} depth={28} count={1900} factor={2.2} saturation={0} fade speed={reducedMotion ? 0 : .1} />
    <Sun state={state} paused={reducedMotion} instrument={instrument} animated={sdoEffectsEnabled} position={overviewSunPosition} />
    {sdoEffectsEnabled && <><SolarCorona intensity={state.intensity} paused={reducedMotion} instrument={instrument} position={overviewSunPosition} /><SolarArcs intensity={state.intensity} paused={reducedMotion} instrument={instrument} position={overviewSunPosition} /></>}
    <mesh scale={sdoEffectsEnabled ? 1.23 + state.intensity * .08 : 1.23}><sphereGeometry args={[2.2, 72, 72]} /><meshBasicMaterial color={instrument === "193" ? "#ff8d1b" : "#7596ff"} transparent opacity={sdoEffectsEnabled ? .09 : .045} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
    <OrbitControls enableDamping dampingFactor={.06} rotateSpeed={.24} zoomSpeed={.5} minDistance={4.5} maxDistance={14} />
    <CinematicGrade state={state} tracing={false} reducedMotion={reducedMotion} />
  </>;
}

const majorMoons: Partial<Record<EphemerisBody["id"], readonly string[]>> = {
  earth: ["Moon"],
  mars: ["Phobos", "Deimos"],
  jupiter: ["Io", "Europa", "Ganymede", "Callisto"],
  saturn: ["Mimas", "Enceladus", "Tethys", "Dione", "Rhea", "Titan"],
  uranus: ["Miranda", "Ariel", "Umbriel", "Titania", "Oberon"],
  neptune: ["Triton"],
  pluto: ["Charon"],
};

function useSurfaceTexture(target: string, onStateChange?: (target: string, state: TextureLoadState) => void) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const loader = useMemo(() => new THREE.TextureLoader(), []);
  useEffect(() => {
    let cancelled = false;
    let loadedTexture: THREE.Texture | null = null;
    setTexture(null);
    onStateChange?.(target, "loading");
    // Version the material request so a renderer-map correction cannot remain
    // pinned in a learner's browser by the long-lived source-image cache.
    const requestedTexture = loader.load(`/api/planet-surface/${target}?material=continuous-v2`, (loaded) => {
      loaded.colorSpace = THREE.SRGBColorSpace;
      loaded.anisotropy = 8;
      loaded.wrapS = THREE.RepeatWrapping;
      loaded.wrapT = THREE.ClampToEdgeWrapping;
      // Planet maps are sampled through sphericalMapUv(), where v=0 is the
      // north pole. Keep the source image's native top-to-bottom orientation;
      // TextureLoader's default WebGL flip would invert Earth (and every
      // north-up equirectangular globe) at the material level.
      loaded.flipY = false;
      loaded.needsUpdate = true;
      if (cancelled) { loaded.dispose(); return; }
      loadedTexture = loaded;
      setTexture(loaded);
      onStateChange?.(target, "ready");
    }, undefined, () => {
      onStateChange?.(target, "error");
    });
    return () => { cancelled = true; requestedTexture.dispose(); if (loadedTexture && loadedTexture !== requestedTexture) loadedTexture.dispose(); };
  }, [loader, onStateChange, target]);
  return texture;
}

const planetSurfaceVertexShader = `
  varying vec2 vUv;
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vObjectNormal = normalize(normal);
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const planetSurfaceFragmentShader = `
  uniform sampler2D uMap;
  uniform vec3 uTint;
  uniform vec3 uSunPosition;
  uniform float uStyle;
  uniform float uSourceMix;
  uniform float uSourceYaw;
  uniform float uOverview;
  varying vec2 vUv;
  varying vec3 vObjectNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  float hash31(vec3 p) {
    p = fract(p * .1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }

  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash31(i + vec3(0., 0., 0.)), hash31(i + vec3(1., 0., 0.)), f.x),
                   mix(hash31(i + vec3(0., 1., 0.)), hash31(i + vec3(1., 1., 0.)), f.x), f.y),
               mix(mix(hash31(i + vec3(0., 0., 1.)), hash31(i + vec3(1., 0., 1.)), f.x),
                   mix(hash31(i + vec3(0., 1., 1.)), hash31(i + vec3(1., 1., 1.)), f.x), f.y), f.z);
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = .5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise3(p) * amplitude;
      p = p * 2.02 + vec3(17.1, 9.2, 13.7);
      amplitude *= .5;
    }
    return value;
  }

  float craterField(vec3 normal) {
    float macro = fbm(normal * 5.5 + vec3(4.1, 2.7, 8.3));
    float micro = fbm(normal * 28.0 + vec3(1.2, 7.7, 3.1));
    return smoothstep(.28, .78, macro) * .28 + micro * .22;
  }

  vec2 sphericalMapUv(vec3 normal, float yaw) {
    float longitude = atan(normal.z, normal.x) / (2.0 * 3.14159265);
    float latitude = acos(clamp(normal.y, -1.0, 1.0)) / 3.14159265;
    return vec2(fract(longitude + .5 + yaw), clamp(latitude, .002, .998));
  }

  void main() {
    vec3 normal = normalize(vObjectNormal);
    float latitude = asin(clamp(normal.y, -1.0, 1.0));
    float longitude = atan(normal.z, normal.x);
    // Source maps vary enormously in coverage, illumination and processing.
    // Sample through one explicit spherical projection so their longitudinal
    // join cannot inherit the mesh UV seam. Bodies with incomplete imagery
    // intentionally set uSourceMix to zero and stay fully continuous.
    vec3 source = pow(max(texture2D(uMap, sphericalMapUv(normal, uSourceYaw)).rgb, vec3(0.0)), vec3(2.2));
    float macro = fbm(normal * 4.1 + vec3(3.7, 7.1, 1.3));
    float micro = fbm(normal * 22.0 + vec3(9.2, 2.8, 5.4));
    vec3 procedural = uTint;
    float proceduralRelief = macro * .68 + micro * .32;

    // 0 rock/moon, 1 Venus, 2 Earth, 3 Mars, 4 gas giant, 5 ice giant, 6 Pluto.
    if (uStyle < .5) {
      float crater = craterField(normal);
      procedural = mix(uTint * .33, uTint * 1.14, macro * .68 + micro * .32);
      procedural *= .76 + crater * .24;
      proceduralRelief += crater * .14;
    } else if (uStyle < 1.5) {
      float bands = .5 + .5 * sin(latitude * 13.0 + macro * 5.0);
      float clouds = fbm(vec3(cos(longitude) * 7.0, latitude * 11.0, sin(longitude) * 7.0) + vec3(7.0));
      procedural = mix(vec3(.33, .20, .09), vec3(.94, .72, .39), bands * .62 + clouds * .38);
      proceduralRelief += bands * .18;
    } else if (uStyle < 2.5) {
      float ice = smoothstep(.62, .94, abs(normal.y) + (macro - .5) * .24);
      float land = smoothstep(.52, .7, macro + sin(longitude * 2.2) * .12 - cos(latitude * 3.0) * .07);
      procedural = mix(vec3(.012, .07, .18), vec3(.10, .34, .13), land);
      procedural = mix(procedural, vec3(.72, .82, .84), ice);
      proceduralRelief += land * .16;
    } else if (uStyle < 3.5) {
      float polar = smoothstep(.72, .93, abs(normal.y) + micro * .08);
      float basin = smoothstep(.45, .75, macro);
      procedural = mix(vec3(.16, .035, .012), vec3(.76, .20, .055), basin);
      procedural = mix(procedural, vec3(.88, .75, .57), polar);
      proceduralRelief += basin * .18;
    } else if (uStyle < 4.5) {
      float warpedLatitude = latitude + (macro - .5) * .16;
      float bands = .5 + .5 * sin(warpedLatitude * 24.0 + micro * 3.0);
      float storm = smoothstep(.72, .9, fbm(vec3(cos(longitude * 1.8) * 8.0, latitude * 10.0, sin(longitude * 1.8) * 8.0) + vec3(4.0)));
      procedural = mix(vec3(.20, .11, .045), vec3(.92, .64, .29), bands);
      procedural = mix(procedural, vec3(.58, .20, .08), storm * .5);
      proceduralRelief += bands * .12 + storm * .36;
    } else if (uStyle < 5.5) {
      float haze = .5 + .5 * sin(latitude * 8.0 + macro * 4.0);
      procedural = mix(vec3(.025, .17, .27), vec3(.36, .72, .82), haze * .7 + micro * .3);
      proceduralRelief += haze * .1;
    } else {
      float ice = smoothstep(.54, .78, macro + normal.y * .12);
      float charcoal = smoothstep(.40, .7, fbm(normal * 8.0 + vec3(6.0)));
      procedural = mix(vec3(.11, .075, .055), vec3(.69, .58, .42), charcoal);
      procedural = mix(procedural, vec3(.78, .66, .51), ice);
      proceduralRelief += charcoal * .22;
    }

    // The source contributes calibrated colour where a global source exists;
    // procedural detail keeps material behaviour continuous at every longitude.
    // Equirectangular source images compress their first and last pixel rows
    // into the sphere poles. Fade them before that singularity so the polar
    // caps stay smooth instead of turning into stretched texture rings.
    float polarSourceFade = 1.0 - smoothstep(.80, .975, abs(normal.y));
    float sourceWeight = uSourceMix * polarSourceFade;
    vec3 sourceAnchored = mix(procedural, source, .78);
    vec3 albedo = mix(procedural, sourceAnchored, sourceWeight);
    vec3 lightDirection = normalize(uSunPosition - vWorldPosition);
    // Derive lighting relief solely from seamless analytic fields. Source
    // imagery is colour evidence, never treated as a terrain/elevation map.
    float relief = proceduralRelief;
    vec3 worldNormal = normalize(vWorldNormal);
    vec3 tangentX = normalize(dFdx(vWorldPosition));
    vec3 tangentY = normalize(dFdy(vWorldPosition));
    float reliefStrength = uStyle < .5 ? 6.0 : (uStyle < 3.5 ? 2.75 : 1.15);
    vec3 litNormal = normalize(worldNormal - (tangentX * dFdx(relief) + tangentY * dFdy(relief)) * reliefStrength);
    float direct = dot(litNormal, lightDirection);
    // This is illustrative lighting across a deliberately compressed scale.
    // Use a broad penumbra so an abrupt terminator never reads as a map seam.
    float wrappedLight = smoothstep(-.82, .72, direct);
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - max(dot(litNormal, viewDirection), 0.0), 2.5);
    float sourceLift = mix(.0, .055, uOverview);
    vec3 color = albedo * (.24 + wrappedLight * .82 + sourceLift);
    color += albedo * rim * (.018 + uOverview * .022);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

const planetShaderStyles: Record<string, number> = {
  moon: 0, mercury: 0, venus: 1, earth: 2, mars: 3,
  jupiter: 4, saturn: 4, uranus: 5, neptune: 5, pluto: 6,
};

const planetSourceMix: Record<string, number> = {
  // Renderer-grade maps are complete equirectangular visual references. The
  // official mission maps and imagery remain the attribution/galleries.
  moon: .62, mercury: .86, venus: .78, earth: .88, mars: .84,
  jupiter: .84, saturn: .82, uranus: .25, neptune: .76, pluto: .48,
};

const planetSourceYaw: Record<string, number> = {
  moon: .11, mercury: .18, venus: .08, earth: .17, mars: .14,
  jupiter: .06, saturn: .1, uranus: .22, neptune: .16, pluto: .04,
};

function PlanetSurfaceMaterial({ target, texture, fallbackColor, selected = false, overview = false, textureTint = "#ffffff", sunAt = overviewSunPosition }: { target: string; texture: THREE.Texture | null; fallbackColor: THREE.ColorRepresentation; selected?: boolean; overview?: boolean; textureTint?: THREE.ColorRepresentation; sunAt?: THREE.Vector3 }) {
  const neutralTexture = useMemo(() => {
    const color = new THREE.Color(fallbackColor);
    const pixels = new Uint8Array([Math.round(color.r * 255), Math.round(color.g * 255), Math.round(color.b * 255), 255]);
    const value = new THREE.DataTexture(pixels, 1, 1, THREE.RGBAFormat);
    value.colorSpace = THREE.SRGBColorSpace;
    value.needsUpdate = true;
    return value;
  }, [fallbackColor]);
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture ?? neutralTexture },
      uTint: { value: new THREE.Color(textureTint) },
      uSunPosition: { value: sunAt.clone() },
      uStyle: { value: planetShaderStyles[target] ?? 0 },
      uSourceMix: { value: texture ? (planetSourceMix[target] ?? .7) : 0 },
      uSourceYaw: { value: planetSourceYaw[target] ?? 0 },
      uOverview: { value: overview ? 1 : 0 },
    },
    vertexShader: planetSurfaceVertexShader,
    fragmentShader: planetSurfaceFragmentShader,
  }), [fallbackColor, neutralTexture, overview, sunAt, target, texture, textureTint]);
  useEffect(() => () => { material.dispose(); neutralTexture.dispose(); }, [material, neutralTexture]);
  useFrame(() => {
    material.uniforms.uSunPosition.value.copy(sunAt);
    material.uniforms.uOverview.value = overview ? 1 : 0;
    material.uniforms.uSourceMix.value = texture ? (planetSourceMix[target] ?? .7) + (selected ? .025 : 0) : 0;
  });
  return <primitive object={material} attach="material" />;
}

function SurfaceAtmosphere({ target, color, radius, flatten, sunAt = overviewSunPosition }: { target: string; color: THREE.ColorRepresentation; radius: number; flatten?: number; sunAt?: THREE.Vector3 }) {
  const opacity = surfaceForTarget(target)?.material.atmosphere ?? 0;
  return opacity > 0 ? <PlanetAtmosphere color={color} radius={radius} opacity={opacity} flatten={flatten} sunAt={sunAt} /> : null;
}

function PlanetDetailBody({ body, reducedMotion }: { body: EphemerisBody; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const surfaceTexture = useSurfaceTexture(body.id);
  useFrame((_, delta) => { if (!reducedMotion && group.current) group.current.rotation.y += delta * .075; });
  if (!surfaceTexture) return <Html center><span className="surface-loading">READING SOURCE SURFACE</span></Html>;
  const oblate = body.id === "jupiter" || body.id === "saturn";
  return <group ref={group}>
    <mesh scale={oblate ? [1, .9, 1] : 1}><sphereGeometry args={[1.72, 96, 96]} /><PlanetSurfaceMaterial target={body.id} texture={surfaceTexture} fallbackColor={body.color} sunAt={detailSunPosition} /></mesh>
    {body.id === "saturn" && <mesh rotation={[1.13, 0, .3]}><ringGeometry args={[2.14, 3.12, 160]} /><meshBasicMaterial color="#e9d8a8" transparent opacity={.72} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} /></mesh>}
    {body.id === "uranus" && <mesh rotation={[1.35, 0, .18]}><ringGeometry args={[2.02, 2.22, 96]} /><meshBasicMaterial color="#bdeef4" transparent opacity={.3} side={THREE.DoubleSide} /></mesh>}
    <SurfaceAtmosphere target={body.id} color={body.color} radius={1.72} flatten={oblate ? .9 : 1} sunAt={detailSunPosition} />
  </group>;
}

function MajorMoonLayer({ planetId, labelsVisible, reducedMotion }: { planetId: EphemerisBody["id"]; labelsVisible: boolean; reducedMotion: boolean }) {
  const group = useRef<THREE.Group>(null);
  const moons = majorMoons[planetId] ?? [];
  const moonTexture = useSurfaceTexture("moon");
  useFrame((_, delta) => { if (!reducedMotion && group.current) group.current.rotation.y += delta * .1; });
  if (!moons.length) return null;
  const moonTints = ["#d8dee7", "#cbd6e3", "#e6d4c3", "#c6d1c9", "#d9c9b4"];
  return <group ref={group}>{moons.map((name, index) => {
    const radius = 2.38 + index * .47;
    const angle = index / moons.length * Math.PI * 2 + .42;
    const position: [number, number, number] = [Math.cos(angle) * radius, Math.sin(index * 1.9) * .23, Math.sin(angle) * radius * .46];
    const offset = index % 2 ? 1 : -1;
    return <group key={name} position={position}>
      {moonTexture && <mesh><sphereGeometry args={[index === moons.length - 1 && name === "Titan" ? .14 : .085 + (index % 3) * .012, 20, 20]} /><PlanetSurfaceMaterial target="moon" texture={moonTexture} fallbackColor={moonTints[index % moonTints.length]} textureTint={moonTints[index % moonTints.length]} sunAt={detailSunPosition} /></mesh>}
      {labelsVisible && <Html center distanceFactor={17} position={[0, .18, 0]} style={{ transform: `translate(${offset * (18 + index * 3)}px, ${-12 - (index % 3) * 8}px)` }}><span className={`detail-moon-label ${offset > 0 ? "right" : "left"}`}><i /><b>{name.toUpperCase()}</b></span></Html>}
    </group>;
  })}</group>;
}

function PlanetDetailScene({ state, snapshot, focus, labelsVisible, reducedMotion }: { state: VisualState; snapshot: SolarSystemSnapshot | null; focus: Exclude<SceneFocus, "system">; labelsVisible: boolean; reducedMotion: boolean }) {
  const body = snapshot?.bodies.find((candidate) => candidate.id === focus && candidate.kind !== "moon");
  if (!body) return null;
  return <>
    <color attach="background" args={["#02040b"]} /><fog attach="fog" args={["#02040b", 8, 28]} />
    <SceneLighting profile="detail" instrument="193" />
    <Stars radius={45} depth={28} count={1600} factor={2.1} saturation={0} fade speed={reducedMotion ? 0 : .1} />
    <mesh rotation={[Math.PI / 2, 0, 0]}><ringGeometry args={[2.08, 2.09, 128]} /><meshBasicMaterial color="#6a9bda" transparent opacity={.16} side={THREE.DoubleSide} /></mesh>
    <PlanetDetailBody body={body} reducedMotion={reducedMotion} />
    <MajorMoonLayer planetId={body.id} labelsVisible={labelsVisible} reducedMotion={reducedMotion} />
    <OrbitControls enableDamping dampingFactor={.06} rotateSpeed={.35} zoomSpeed={.65} minDistance={3.6} maxDistance={12} />
    <CinematicGrade state={state} tracing={false} reducedMotion={reducedMotion} />
  </>;
}

function PlanetaryScene({ state, tracing, skipFlight, reducedMotion, instrument, location, auroraProbability, storyAct, sdoEffectsEnabled }: { state: VisualState; tracing: boolean; skipFlight: boolean; reducedMotion: boolean; instrument: Instrument; location: Location; auroraProbability: number | null; storyAct: StoryAct; sdoEffectsEnabled: boolean }) {
  const earthGroup = useRef<THREE.Group>(null);
  const earthSurface = useRef<THREE.Group>(null);
  const flight = useRef(0);
  const earthYaw = useMemo(() => earthYawForLocation(location), [location.latitude, location.longitude]);
  const locationVertical = location.latitude / 90 * .26;
  const observerMode = storyAct === "observer";
  useEffect(() => { if (!tracing || storyAct === "stream") flight.current = 0; }, [tracing, storyAct]);
  useFrame((scene, delta) => {
    if (earthSurface.current) earthSurface.current.rotation.y = THREE.MathUtils.damp(earthSurface.current.rotation.y, earthYaw, 3.4, delta);
    if (reducedMotion) {
      const direct = observerMode ? new THREE.Vector3(4.9, 2.15, 7.25) : tracing ? new THREE.Vector3(storyAct === "scenario" ? 3.1 : 2.2, .32, storyAct === "scenario" ? 5.85 : 6.45) : new THREE.Vector3(0, .7, 11);
      scene.camera.position.copy(direct);
      scene.camera.lookAt(observerMode ? 3.78 : tracing ? (storyAct === "scenario" ? 3 : 2.25) : 0, observerMode ? .28 : storyAct === "earth" ? locationVertical : 0, observerMode ? .42 : 0);
      return;
    }
    if (observerMode) {
      const observerPosition = new THREE.Vector3(4.9 + scene.pointer.x * .05, 2.15 + scene.pointer.y * .035, 7.25);
      scene.camera.position.lerp(observerPosition, Math.min(1, delta * 4.4));
      scene.camera.lookAt(3.78, .28, .42);
      return;
    }
    if (tracing) flight.current = skipFlight ? 1 : Math.min(1, flight.current + delta / 5.8);
    else flight.current = Math.max(0, flight.current - delta * .7);
    const t = flight.current * flight.current * (3 - 2 * flight.current);
    const parallaxStrength = tracing ? .055 : .18;
    const storyPush = storyAct === "scenario" ? .8 : storyAct === "replay" ? .32 : 0;
    const desired = new THREE.Vector3(t * (2.26 + storyPush) + scene.pointer.x * parallaxStrength, .72 - t * (.4 + storyPush * .15) + t * locationVertical * .7 + scene.pointer.y * parallaxStrength * .55, 11 - t * (4.72 + storyPush * .72));
    scene.camera.position.lerp(desired, Math.min(1, delta * 7));
    scene.camera.lookAt(t * (2.25 + storyPush) + scene.pointer.x * .08, t * locationVertical + scene.pointer.y * .04, 0);
  });
  return <>
    <color attach="background" args={["#02040b"]} /><fog attach="fog" args={["#02040b", 9, 23]} />
    <SceneLighting profile="earth" instrument={instrument} intensity={sdoEffectsEnabled ? state.intensity : 0} />
    <Stars radius={55} depth={30} count={1900} factor={2} saturation={0} fade speed={reducedMotion ? 0 : .18} />
    <Sun state={state} paused={reducedMotion} instrument={instrument} animated={sdoEffectsEnabled} />
    {sdoEffectsEnabled && <><SolarCorona intensity={state.intensity} paused={reducedMotion} instrument={instrument} /><SolarArcs intensity={state.intensity} paused={reducedMotion} instrument={instrument} /></>}
    <mesh position={sunPosition} scale={sdoEffectsEnabled ? 1.17 + state.intensity * .08 : 1.17}><sphereGeometry args={[2.2, 64, 64]} /><meshBasicMaterial color={instrument === "193" ? "#ff9f19" : "#779cff"} transparent opacity={sdoEffectsEnabled ? .08 : .04} side={THREE.BackSide} blending={THREE.AdditiveBlending} /></mesh>
    {sdoEffectsEnabled && <SolarWind state={state} tracing={tracing} paused={reducedMotion} />}
    <group ref={earthGroup} position={[3, 0, 0]}>
      <group ref={earthSurface}>
        <Earth />
        <LocationBeacon location={location} paused={reducedMotion} />
      </group>
      {sdoEffectsEnabled && <><MagneticShield state={state} /><AuroraCurtains state={state} probability={auroraProbability} paused={reducedMotion} /><ImpactPulse state={state} tracing={tracing} paused={reducedMotion} /></>}
      <Moon paused={reducedMotion} />
      {sdoEffectsEnabled && <SdoObserver paused={reducedMotion} active={storyAct === "observer"} />}
    </group>
    <CinematicGrade state={state} tracing={sdoEffectsEnabled && tracing} reducedMotion={reducedMotion} />
  </>;
}

export function SolarSystemScene({ state, tracing, skipFlight, reducedMotion = false, instrument = "193", location, auroraProbability = null, storyAct = "sun", view = "earth", solarSystem = null, selectedFocus = "sun", labelsVisible = false, sdoEffectsEnabled = true, onSelectFocus = () => undefined }: { state: VisualState; tracing: boolean; skipFlight: boolean; reducedMotion?: boolean; instrument?: Instrument; location: Location; auroraProbability?: number | null; storyAct?: StoryAct; view?: ExperienceScene; solarSystem?: SolarSystemSnapshot | null; selectedFocus?: SceneFocus; labelsVisible?: boolean; sdoEffectsEnabled?: boolean; onSelectFocus?: (focus: SceneFocus) => void }) {
  const [presented, setPresented] = useState({ view, selectedFocus });
  const [transitioning, setTransitioning] = useState(false);
  useEffect(() => {
    if (presented.view === view && presented.selectedFocus === selectedFocus) {
      if (!transitioning) return;
      const settle = window.setTimeout(() => setTransitioning(false), 160);
      return () => window.clearTimeout(settle);
    }
    if (reducedMotion) { setPresented({ view, selectedFocus }); setTransitioning(false); return; }
    setTransitioning(true);
    const swap = window.setTimeout(() => setPresented({ view, selectedFocus }), 220);
    const settle = window.setTimeout(() => setTransitioning(false), 560);
    return () => { window.clearTimeout(swap); window.clearTimeout(settle); };
  }, [view, selectedFocus, reducedMotion, presented]);
  const renderedView = presented.view;
  const renderedFocus = presented.selectedFocus;
  const isSystem = renderedView === "system";
  const isSolar = renderedView === "sun";
  const isPlanetDetail = renderedView === "planet";
  const isSpacecraft = renderedView === "spacecraft";
  const systemNote = solarSystem?.status === "live" ? "NASA/JPL POSITIONS · TIME ACCELERATED · VISUAL SIZES EXPANDED" : solarSystem?.status === "cached" ? "NASA/JPL POSITIONS · CACHED · VISUAL SIZES EXPANDED" : "";
  const renderedScene = isSystem
    ? <SystemOverview state={state} reducedMotion={reducedMotion} instrument={instrument} snapshot={solarSystem} selected={renderedFocus} labelsVisible={labelsVisible} sdoEffectsEnabled={sdoEffectsEnabled} onSelect={onSelectFocus} />
    : isSolar
      ? <SunObservatoryScene state={state} reducedMotion={reducedMotion} instrument={instrument} sdoEffectsEnabled={sdoEffectsEnabled} />
      : isPlanetDetail
        ? <PlanetDetailScene state={state} snapshot={solarSystem} focus={renderedFocus as Exclude<SceneFocus, "system">} labelsVisible={labelsVisible} reducedMotion={reducedMotion} />
        : <PlanetaryScene state={state} tracing={tracing} skipFlight={skipFlight} reducedMotion={reducedMotion} instrument={instrument} location={location} auroraProbability={auroraProbability} storyAct={isSpacecraft ? "observer" : storyAct} sdoEffectsEnabled={sdoEffectsEnabled} />;
  return <div className={transitioning ? "scene scene-transitioning" : "scene"} aria-label={isSystem ? "Interactive Solar System overview with current NASA JPL positions" : isSolar ? "Sun detail scene" : isPlanetDetail ? "Interactive planetary detail view with source-linked mission imagery and illustrative major moons" : isSpacecraft ? "NASA SDO observer scene" : "Earth magnetic shield scene with selected location"}>
    <Canvas key={`${renderedView}-${renderedFocus}`} dpr={[1, 1.6]} camera={{ position: isSystem ? [0, 15.6, 26.5] : isSolar ? [0, .15, 8.6] : isPlanetDetail ? [0, .35, 6.8] : [0, .7, 11], fov: isSystem ? overviewSystemFov : isSolar ? 41 : isPlanetDetail ? 43 : 42 }} gl={{ antialias: true }} onCreated={({ gl }) => { gl.outputColorSpace = THREE.SRGBColorSpace; gl.toneMapping = THREE.ACESFilmicToneMapping; gl.toneMappingExposure = 1.08; }}>
      {renderedScene}
    </Canvas>
    {transitioning && <div className="scene-warp" aria-hidden="true" />}
    {(isSystem ? systemNote : isPlanetDetail ? "SOURCE-LINKED MISSION IMAGE · ILLUSTRATIVE SCALE / MOON POSITIONS" : isSolar ? "SUN SURFACE · LIVE SDO IN CHAPTER 12" : isSpacecraft ? "SDO ORBIT · ILLUSTRATIVE CONTEXT" : "EARTH MAGNETIC RESPONSE · ILLUSTRATIVE SCALE") && <p className="scene-note">{isSystem ? systemNote : isPlanetDetail ? "SOURCE-LINKED MISSION IMAGE · ILLUSTRATIVE SCALE / MOON POSITIONS" : isSolar ? "SUN SURFACE · LIVE SDO IN CHAPTER 12" : isSpacecraft ? "SDO ORBIT · ILLUSTRATIVE CONTEXT" : "EARTH MAGNETIC RESPONSE · ILLUSTRATIVE SCALE"}</p>}
  </div>;
}
