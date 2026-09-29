/**
 * grass-world.js
 * Fixed full-viewport WebGPU meadow behind the whole page (z-index 0).
 * Blade shaders come from the Blue Forest grass (TSL + compute wind and
 * pointer physics), re-coloured with the Berries & Mango palette: green
 * blades with mango / yolk / berry / violet / mint "flower" tips under a
 * dusk sky. The camera flies a scroll-driven path (horizon → bird's-eye
 * → back down into the grass at the contact section) and leans with
 * the pointer for a parallax feel.
 *
 * If WebGPU/WebGL2 can't start, <html> gets .no-webgl and the CSS/SVG
 * fallback meadow in parallax.js takes over.
 */
import * as THREE from 'three/webgpu';
import {
  Fn, uniform, float, vec3, instancedArray, instanceIndex, uv,
  positionGeometry, positionWorld, positionWorldDirection, sin, cos, pow,
  smoothstep, mix, sqrt, select, hash, time, deltaTime, PI,
  mx_noise_float, dot, normalize, max,
} from 'three/tsl';

const root = document.documentElement;
const isMobile = window.innerWidth < 768;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const FIELD_SIZE  = 46;
const BLADE_COUNT = isMobile ? 45000 : 120000;

// Palette (mirrors the tokens in index.css)
const SKY_TOP     = '#07040f';
const SKY_MID     = '#1c0d2e';
const HORIZON     = '#5c1f42';
const SUN         = '#fcad22';
const BERRY       = '#ec2e7c';

async function initGrassWorld() {
  // ── Scene ──────────────────────────────────────────────────────────
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(HORIZON, 0.042);

  // Dusk sky: vertical gradient + a low mango sun with a berry halo.
  const skyTop  = uniform(new THREE.Color(SKY_TOP));
  const skyMid  = uniform(new THREE.Color(SKY_MID));
  const skyHor  = uniform(new THREE.Color(HORIZON));
  const sunCol  = uniform(new THREE.Color(SUN));
  const haloCol = uniform(new THREE.Color(BERRY));
  const sunDir  = uniform(new THREE.Vector3(0.2, 0.075, -1).normalize());
  scene.backgroundNode = Fn(() => {
    const dir  = normalize(positionWorldDirection);
    const y    = dir.y;
    const low  = mix(skyHor, skyMid, smoothstep(float(-0.02), float(0.22), y));
    const sky  = mix(low, skyTop, smoothstep(float(0.2), float(0.75), y));
    const d    = max(dot(dir, sunDir), float(0));
    // Light fades into the haze at the horizon so the sky meets the
    // fogged ground without a seam — the sun sinks behind the meadow.
    const haze = smoothstep(float(-0.005), float(0.1), y);
    const disc = smoothstep(float(0.9985), float(0.9993), d);
    const glow = pow(d, float(28)).mul(0.5).mul(haze);
    const halo = pow(d, float(5)).mul(0.22).mul(haze);
    return sky.add(haloCol.mul(halo)).add(sunCol.mul(glow)).add(sunCol.mul(disc).mul(1.3).mul(haze));
  })();

  // ── Camera ─────────────────────────────────────────────────────────
  const camera = new THREE.PerspectiveCamera(
    isMobile ? 62 : 52, window.innerWidth / window.innerHeight, 0.1, 140
  );

  // ── Renderer ───────────────────────────────────────────────────────
  const renderer = new THREE.WebGPURenderer({ antialias: !isMobile });
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.75));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;

  const canvas = renderer.domElement;
  canvas.className = 'meadow__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  document.querySelector('.meadow').prepend(canvas);

  await renderer.init();

  // ── GPU buffers ────────────────────────────────────────────────────
  const bladeData  = instancedArray(BLADE_COUNT, 'vec4');
  const bendState  = instancedArray(BLADE_COUNT, 'vec4');
  const bladeBound = instancedArray(BLADE_COUNT, 'float');

  // ── Uniforms ───────────────────────────────────────────────────────
  const mouseWorld    = uniform(new THREE.Vector3(99999, 0, 99999));
  const mouseRadius   = uniform(isMobile ? 4.0 : 5.4);
  const mouseStrength = uniform(2.6);
  const outerRadius   = uniform(9.0);
  const outerStrength = uniform(0.9);

  const windSpeed            = uniform(reduceMotion ? 0.35 : 1.25);
  const windAmplitude        = uniform(reduceMotion ? 0.08 : 0.22);
  const bladeWidth           = uniform(4.0);
  const bladeTipWidth        = uniform(0.19);
  const bladeHeight          = uniform(1.55);
  const bladeHeightVariation = uniform(0.55);
  const bladeLean            = uniform(1.1);
  const noiseAmplitude       = uniform(1.85);
  const noiseFrequency       = uniform(0.3);
  const noise2Amplitude      = uniform(0.2);
  const noise2Frequency      = uniform(15);
  const bladeColorVariation  = uniform(0.9);

  const baseColor  = uniform(new THREE.Color('#0b0712'));
  const midColor   = uniform(new THREE.Color('#1a360d'));
  const greenTip   = uniform(new THREE.Color('#3f7f1c'));
  const fogColor   = uniform(new THREE.Color(HORIZON));
  const fogStart   = uniform(16.0);
  const fogEnd     = uniform(30.0);
  // Flower tips — the Visual Mixology palette.
  const tipMango  = uniform(new THREE.Color('#fcad22'));
  const tipYolk   = uniform(new THREE.Color('#fcc247'));
  const tipBerry  = uniform(new THREE.Color('#ec2e7c'));
  const tipCoral  = uniform(new THREE.Color('#ffafa9'));
  const tipViolet = uniform(new THREE.Color('#6776ff'));
  const tipMint   = uniform(new THREE.Color('#6ed6a8'));

  const noise2D = Fn(([x, z]) =>
    mx_noise_float(vec3(x, float(0), z)).mul(0.5).add(0.5)
  );

  // ── Compute: init ──────────────────────────────────────────────────
  const cols = Math.ceil(Math.sqrt(BLADE_COUNT * 1.1));
  const computeInit = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const col   = instanceIndex.mod(cols);
    const row   = instanceIndex.div(cols);
    const jx    = hash(instanceIndex).sub(0.5);
    const jz    = hash(instanceIndex.add(7919)).sub(0.5);
    const wx    = col.toFloat().add(jx).div(float(cols)).sub(0.5).mul(FIELD_SIZE);
    const wz    = row.toFloat().add(jz).div(float(cols)).sub(0.5).mul(FIELD_SIZE);

    blade.x.assign(wx);
    blade.y.assign(wz);
    blade.z.assign(hash(instanceIndex.add(1337)).mul(PI.mul(2)));

    const n1 = noise2D(wx.mul(noiseFrequency), wz.mul(noiseFrequency));
    const n2 = noise2D(
      wx.mul(noiseFrequency.mul(noise2Frequency)).add(50),
      wz.mul(noiseFrequency.mul(noise2Frequency)).add(50)
    );
    const clump = n1.mul(noiseAmplitude).sub(noise2Amplitude)
      .add(n2.mul(noise2Amplitude).mul(2)).max(0);
    blade.w.assign(clump);

    const dist      = sqrt(wx.mul(wx).add(wz.mul(wz)));
    const edgeNoise = noise2D(wx.mul(0.2).add(100), wz.mul(0.2).add(100));
    const maxR      = float(FIELD_SIZE * 0.46).add(edgeNoise.sub(0.5).mul(6.0));
    const boundary  = float(1).sub(smoothstep(maxR.sub(3.0), maxR, dist));
    bladeBound.element(instanceIndex).assign(
      select(boundary.lessThan(0.05), float(0), boundary)
    );
  })().compute(BLADE_COUNT);

  // ── Compute: wind + pointer physics ────────────────────────────────
  const computeUpdate = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const bend  = bendState.element(instanceIndex);
    const bx = blade.x, bz = blade.y;

    const w1    = sin(bx.mul(0.35).add(bz.mul(0.12)).add(time.mul(windSpeed)));
    const w2    = sin(bx.mul(0.18).add(bz.mul(0.28)).add(time.mul(windSpeed.mul(0.67))).add(1.7));
    const windX = w1.add(w2).mul(windAmplitude);
    const windZ = w1.sub(w2).mul(windAmplitude.mul(0.55));
    const lw    = deltaTime.mul(4.0).saturate();
    bend.x.assign(mix(bend.x, windX, lw));
    bend.y.assign(mix(bend.y, windZ, lw));

    const dx        = bx.sub(mouseWorld.x);
    const dz        = bz.sub(mouseWorld.z);
    const dist      = sqrt(dx.mul(dx).add(dz.mul(dz))).add(0.0001);
    const falloff   = float(1).sub(dist.div(mouseRadius).saturate());
    const influence = falloff.mul(falloff).mul(mouseStrength);
    const ofalloff  = float(1).sub(dist.div(outerRadius).saturate());
    const oinfl     = ofalloff.mul(ofalloff).mul(outerStrength);
    const pushX     = dx.div(dist).mul(influence.add(oinfl));
    const pushZ     = dz.div(dist).mul(influence.add(oinfl));

    const targetMag  = sqrt(pushX.mul(pushX).add(pushZ.mul(pushZ)));
    const currentMag = sqrt(bend.z.mul(bend.z).add(bend.w.mul(bend.w)));
    const lm = select(
      targetMag.greaterThan(currentMag), deltaTime.mul(12.0), deltaTime.mul(1)
    ).saturate();
    bend.z.assign(mix(bend.z, pushX, lm));
    bend.w.assign(mix(bend.w, pushZ, lm));
  })().compute(BLADE_COUNT);

  // ── Blade geometry ─────────────────────────────────────────────────
  function createBladeGeometry() {
    const segs = 5, BW = 0.055, BH = 1.0;
    const verts = [], norms = [], uvArr = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, y = t * BH, hw = BW * 0.5 * (1.0 - t * 0.82);
      verts.push(-hw, y, 0, hw, y, 0);
      norms.push(0, 0, 1, 0, 0, 1);
      uvArr.push(0, t, 1, t);
    }
    for (let i = 0; i < segs; i++) {
      const b = i * 2;
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('normal',   new THREE.Float32BufferAttribute(norms, 3));
    geo.setAttribute('uv',       new THREE.Float32BufferAttribute(uvArr, 2));
    geo.setIndex(idx);
    return geo;
  }

  // ── Grass material ─────────────────────────────────────────────────
  const grassMat = new THREE.MeshBasicNodeMaterial({ side: THREE.DoubleSide, fog: true });

  grassMat.positionNode = Fn(() => {
    const blade    = bladeData.element(instanceIndex);
    const bend     = bendState.element(instanceIndex);
    const worldX   = blade.x, worldZ = blade.y, rotY = blade.z;
    const boundary = bladeBound.element(instanceIndex);
    const hVar        = hash(instanceIndex.add(5555)).mul(bladeHeightVariation);
    const heightScale = float(0.35).add(blade.w).add(hVar).mul(boundary);
    const taper = float(1).sub(uv().y.mul(float(1).sub(bladeTipWidth)));
    const lx    = positionGeometry.x.mul(bladeWidth).mul(taper).mul(heightScale.sign());
    const ly    = positionGeometry.y.mul(heightScale).mul(bladeHeight);
    const cY = cos(rotY), sY = sin(rotY);
    const rx = lx.mul(cY), rz = lx.mul(sY);
    const bendFactor  = pow(uv().y, 1.8);
    const staticBendX = hash(instanceIndex.add(7777)).sub(0.5).mul(bladeLean);
    const staticBendZ = hash(instanceIndex.add(8888)).sub(0.5).mul(bladeLean);
    const bendX = staticBendX.add(bend.x).add(bend.z);
    const bendZ = staticBendZ.add(bend.y).add(bend.w);
    const relX  = rx.add(bendX.mul(bendFactor).mul(bladeHeight));
    const relY  = ly;
    const relZ  = rz.add(bendZ.mul(bendFactor).mul(bladeHeight));
    const origLen = sqrt(rx.mul(rx).add(ly.mul(ly)).add(rz.mul(rz)));
    const newLen  = sqrt(relX.mul(relX).add(relY.mul(relY)).add(relZ.mul(relZ)));
    const scale   = origLen.div(newLen.max(0.0001));
    return vec3(worldX.add(relX.mul(scale)), relY.mul(scale), worldZ.add(relZ.mul(scale)));
  })();

  grassMat.colorNode = Fn(() => {
    const t      = uv().y;
    const blade  = bladeData.element(instanceIndex);
    const clump  = blade.w.saturate();
    const h      = hash(instanceIndex.add(4242));
    // ~30% of blades carry a coloured "flower" tip, the rest stay green/gold.
    const flower = select(h.lessThan(0.06), tipBerry,
                   select(h.lessThan(0.12), tipMango,
                   select(h.lessThan(0.17), tipViolet,
                   select(h.lessThan(0.22), tipMint,
                   select(h.lessThan(0.26), tipCoral,
                   select(h.lessThan(0.36), tipYolk, greenTip))))));
    const tipMix   = float(1).sub(bladeColorVariation).add(clump.mul(bladeColorVariation));
    const tipFinal = mix(greenTip, flower, tipMix);
    const lower    = mix(baseColor, midColor, smoothstep(float(0.0), float(0.45), t));
    const grass    = mix(lower, tipFinal, smoothstep(float(0.62), float(0.97), t));
    const dist     = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
    return mix(grass, fogColor, smoothstep(fogStart, fogEnd, dist));
  })();

  grassMat.opacityNode = Fn(() => {
    const blade = bladeData.element(instanceIndex);
    const dist  = sqrt(blade.x.mul(blade.x).add(blade.y.mul(blade.y)));
    const fade  = float(1).sub(smoothstep(fogEnd.sub(3.0), fogEnd.add(2.0), dist));
    return smoothstep(float(0.0), float(0.1), uv().y).mul(fade);
  })();
  grassMat.transparent = true;

  const grass = new THREE.InstancedMesh(createBladeGeometry(), grassMat, BLADE_COUNT);
  grass.frustumCulled = false;
  const dummy = new THREE.Object3D();
  for (let i = 0; i < BLADE_COUNT; i++) grass.setMatrixAt(i, dummy.matrix);
  grass.instanceMatrix.needsUpdate = true;
  scene.add(grass);

  // ── Ground: dark soil that dissolves into the horizon haze ─────────
  const groundNear = uniform(new THREE.Color('#0a0710'));
  const groundMat  = new THREE.MeshBasicNodeMaterial({ fog: true });
  groundMat.colorNode = Fn(() => {
    const wx   = positionWorld.x, wz = positionWorld.z;
    const dist = sqrt(wx.mul(wx).add(wz.mul(wz)));
    return mix(groundNear, fogColor, smoothstep(float(FIELD_SIZE * 0.35), float(FIELD_SIZE * 1.2), dist));
  })();
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  // ── Pointer → ground plane ─────────────────────────────────────────
  const raycaster  = new THREE.Raycaster();
  const ndc        = new THREE.Vector2();
  const plane      = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit        = new THREE.Vector3();
  const pointer    = { x: 0, y: 0, active: false };
  const lean       = { x: 0, y: 0 };

  function updateMouseWorld() {
    if (!pointer.active) { mouseWorld.value.set(99999, 0, 99999); return; }
    ndc.set(pointer.x, pointer.y);
    raycaster.setFromCamera(ndc, camera);
    if (raycaster.ray.intersectPlane(plane, hit)) mouseWorld.value.copy(hit);
  }
  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointer.active = true;
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer.active = false; });

  // ── Scroll-driven camera path ──────────────────────────────────────
  // Keyframes: [progress, px, py, pz, lx, ly, lz]
  const PATH = [
    [0.00,  0.0,  6.4, 19.0,  0.0,  3.9,  -8.0],  // hero: horizon + sun
    [0.18,  0.0,  9.5, 13.0,  0.0,  0.8,   0.0],  // rising over the field
    [0.42,  2.5, 15.0,  4.0,  0.0,  0.0,  -1.0],  // bird's-eye
    [0.66, -3.0, 11.0,  7.0,  0.5,  0.0,  -1.0],  // drifting
    [0.84,  0.0,  8.0, 15.0,  0.0,  2.4,  -3.0],  // descending
    [1.00,  0.0,  6.4, 19.0,  0.0,  3.9,  -8.0],  // back to the hero sunset (never inside the grass)
  ];
  const ease = (t) => t * t * (3 - 2 * t);
  const cam  = { px: 0, py: 0, pz: 0, lx: 0, ly: 0, lz: 0 };
  const tgt  = { ...cam };
  function samplePath(p) {
    let i = 0;
    while (i < PATH.length - 2 && p > PATH[i + 1][0]) i++;
    const a = PATH[i], b = PATH[i + 1];
    const e = ease(Math.min(1, Math.max(0, (p - a[0]) / (b[0] - a[0]))));
    tgt.px = a[1] + (b[1] - a[1]) * e;
    tgt.py = a[2] + (b[2] - a[2]) * e;
    tgt.pz = a[3] + (b[3] - a[3]) * e;
    tgt.lx = a[4] + (b[4] - a[4]) * e;
    tgt.ly = a[5] + (b[5] - a[5]) * e;
    tgt.lz = a[6] + (b[6] - a[6]) * e;
  }
  function scrollProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }
  samplePath(scrollProgress());
  Object.assign(cam, tgt);

  const look = new THREE.Vector3();
  function applyCamera(dt) {
    samplePath(scrollProgress());
    const k = reduceMotion ? 1 : 1 - Math.exp(-dt * 4.5);
    for (const key in cam) cam[key] += (tgt[key] - cam[key]) * k;
    // Pointer parallax: the camera leans a little toward the cursor.
    const lk = 1 - Math.exp(-dt * 2.5);
    lean.x += ((pointer.active ? pointer.x : 0) - lean.x) * lk;
    lean.y += ((pointer.active ? pointer.y : 0) - lean.y) * lk;
    const amt = reduceMotion ? 0 : 1;
    camera.position.set(cam.px + lean.x * 0.9 * amt, cam.py + lean.y * 0.35 * amt, cam.pz);
    look.set(cam.lx + lean.x * 0.4 * amt, cam.ly, cam.lz);
    camera.lookAt(look);
  }

  // ── Resize ─────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }, { passive: true });

  // ── Boot ───────────────────────────────────────────────────────────
  await renderer.computeAsync(computeInit);
  applyCamera(1);
  for (let i = 0; i < 3; i++) {
    renderer.compute(computeUpdate);
    renderer.render(scene, camera);
    await new Promise((r) => requestAnimationFrame(r));
  }
  root.classList.add('meadow-ready');
  window.dispatchEvent(new CustomEvent('meadow:ready'));

  const timer = new THREE.Timer();
  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1);
    applyCamera(dt);
    updateMouseWorld();
    renderer.compute(computeUpdate);
    renderer.render(scene, camera);
  });
}

initGrassWorld().catch((err) => {
  console.warn('[meadow] 3D grass unavailable, using fallback:', err);
  root.classList.add('no-webgl');
  document.querySelector('.meadow__canvas')?.remove();
  window.dispatchEvent(new CustomEvent('meadow:fallback'));
});
