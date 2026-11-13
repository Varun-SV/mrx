// MRX — "The Split". One prompt enters as a beam, the orchestrator refracts it into
// three role colours, and the same particles re-form for every chapter of the page.
// Visual explanation only: this file never talks to a model provider.
import * as THREE from 'three';
import { EffectComposer } from './assets/vendor/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './assets/vendor/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from './assets/vendor/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from './assets/vendor/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from './assets/vendor/jsm/postprocessing/OutputPass.js';

const TAU = Math.PI * 2;
const CHAPTERS = 7; // split, roles, relay, providers, config, converge, wordmark
const ROLE_INDEX = { reasoner: 0, executor: 1, tool_caller: 2 };
// group ids: 0 user/prompt (blue), 1 reasoner (cyan), 2 executor (green), 3 tool caller (amber), 4 neutral
const GROUP_HEX = ['#6BA5F5', '#45C8DB', '#5BD68A', '#E5B567', '#DCEBFF'];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const fract = (v) => v - Math.floor(v);
const ease = (t) => t * t * (3 - 2 * t);
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function initScene({ canvas, paused: startPaused = false, lite = false }) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = innerWidth < 900 || coarse;
  const N = lite ? 8000 : small ? 14000 : 30000;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    throw new Error('WebGL unavailable: ' + error.message);
  }
  if (!renderer.getContext()) throw new Error('WebGL unavailable');
  renderer.setClearColor(0x000000, 1); // the brand background is added in linear space by the lens pass
  renderer.toneMapping = THREE.NoToneMapping;
  let pixelRatio = Math.min(devicePixelRatio || 1, small ? 1.5 : 1.75);
  renderer.setPixelRatio(pixelRatio);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 200);
  const CAMZ = 16;
  camera.position.set(0, 0, CAMZ);
  const world = new THREE.Group();
  scene.add(world);

  /* ---------------- particles: fixed identity per particle ---------------- */
  let seed = 20261113;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const G = new Uint8Array(N); // group
  const K = new Float32Array(N); // rank within group 0..1
  const R1 = new Float32Array(N),
    R2 = new Float32Array(N),
    R3 = new Float32Array(N);
  const R4 = new Float32Array(N),
    R5 = new Float32Array(N),
    D = new Float32Array(N);
  const counts = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) {
    const r = rnd();
    G[i] = r < 0.13 ? 0 : r < 0.41 ? 1 : r < 0.68 ? 2 : r < 0.9 ? 3 : 4;
    counts[G[i]]++;
    R1[i] = rnd();
    R2[i] = rnd();
    R3[i] = rnd();
    R4[i] = rnd();
    R5[i] = rnd();
    D[i] = rnd() * 0.38; // morph stagger
  }
  const seen = [0, 0, 0, 0, 0];
  for (let i = 0; i < N; i++) K[i] = (seen[G[i]]++ + 0.5) / counts[G[i]];
  // gaussian-ish offsets derived from the fixed randoms
  const gx = (i) => (R1[i] + R2[i] + R3[i] - 1.5) * 0.8;
  const gy = (i) => (R2[i] + R4[i] + R5[i] - 1.5) * 0.8;
  const gz = (i) => (R3[i] + R5[i] + R1[i] - 1.5) * 0.8;

  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3);
  const bri = new Float32Array(N);
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const briAttr = new THREE.BufferAttribute(bri, 1).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aBri', briAttr);
  const aGroup = new Float32Array(N),
    aSize = new Float32Array(N),
    aSeed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    aGroup[i] = G[i];
    aSize[i] = 0.55 + Math.pow(R4[i], 6) * 2.6 + (G[i] === 4 ? -0.1 : 0);
    aSeed[i] = R5[i] * 100;
  }
  geo.setAttribute('aGroup', new THREE.BufferAttribute(aGroup, 1));
  geo.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 400);

  const U = {
    uTime: { value: 0 },
    uPR: { value: renderer.getPixelRatio() },
    uScale: { value: 1 },
    uMouse: { value: new THREE.Vector2(9, 9) },
    uAspect: { value: 1 },
    uWave: { value: new THREE.Vector3(0, 0, -99) },
    uCols: { value: GROUP_HEX.map((h) => new THREE.Color(h)) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms: U,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute float aBri, aGroup, aSize, aSeed;
      uniform float uTime, uPR, uScale, uAspect;
      uniform vec2 uMouse; uniform vec3 uWave; uniform vec3 uCols[5];
      varying vec3 vCol; varying float vA;
      void main(){
        vec4 mv = modelViewMatrix * vec4(position, 1.);
        vec4 cp = projectionMatrix * mv;
        vec2 ndc = cp.xy / cp.w;
        vec2 d = (ndc - uMouse) * vec2(uAspect, 1.);
        float dm = length(d);
        float hov = smoothstep(.24, 0., dm);
        cp.xy += normalize(d + 1e-5) / vec2(uAspect, 1.) * hov * .055 * cp.w;
        float wt = uTime - uWave.z;
        vec2 dw = (ndc - uWave.xy) * vec2(uAspect, 1.);
        float wr = length(dw);
        float ring = exp(-pow((wr - wt * 1.5) * 9., 2.)) * smoothstep(1.6, 0., wt) * step(0., wt);
        cp.xy += normalize(dw + 1e-5) / vec2(uAspect, 1.) * ring * .06 * cp.w;
        gl_Position = cp;
        float tw = .78 + .22 * sin(uTime * (1.3 + fract(aSeed) * 2.) + aSeed);
        int gi = int(aGroup + .5);
        vec3 c = uCols[4];
        if (gi == 0) c = uCols[0]; else if (gi == 1) c = uCols[1]; else if (gi == 2) c = uCols[2]; else if (gi == 3) c = uCols[3];
        float b = aBri * tw + hov * .9 + ring * 1.4;
        vCol = mix(c, vec3(1.), clamp((b - 1.25) * .45, 0., .6)) * b;
        vA = smoothstep(.6, 3.5, -mv.z);
        gl_PointSize = clamp(aSize * uPR * uScale * (1. + hov * 1.2) * (34. / -mv.z), 0., 48. * uPR);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vCol; varying float vA;
      void main(){
        float d = length(gl_PointCoord - .5);
        if (d > .5) discard;
        float soft = smoothstep(.5, 0., d);
        float a = pow(soft, 2.6) * 1.5 + soft * .12;
        gl_FragColor = vec4(vCol * a * vA, 1.);
      }`,
  });
  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  world.add(points);

  /* ---------------- text sampling (code sheet + wordmark) ---------------- */
  try {
    await Promise.race([
      Promise.all([document.fonts.load('700 40px Jet'), document.fonts.load('600 32px Jet')]),
      new Promise((r) => setTimeout(r, 1200)),
    ]);
  } catch {
    /* system monospace is fine */
  }
  function sampleCanvas(w, h, draw, unit, step = 2) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    draw(ctx);
    const data = ctx.getImageData(0, 0, w, h).data;
    const out = [[], [], [], [], []];
    for (let y = 0; y < h; y += step)
      for (let x = 0; x < w; x += step) {
        const o = (y * w + x) * 4;
        if (data[o + 3] < 140) continue;
        const g = Math.round((data[o] - 20) / 40);
        if (g >= 0 && g < 5) out[g].push((x - w / 2) / unit, -(y - h / 2) / unit);
      }
    return out.map((a) => (a.length ? Float32Array.from(a) : Float32Array.from([0, 0])));
  }
  const fill = (ctx, g) => (ctx.fillStyle = `rgb(${g * 40 + 20},0,0)`);
  const CODE = [
    [4, '# mrx.config.yaml'],
    [0, 'default_mode: think_then_answer'],
    [0, 'session_memory: true'],
    [4, 'models:'],
    [1, '  reasoner:'],
    [1, '    provider: ollama'],
    [1, '    model: qwen3:14b'],
    [1, '    temperature: 0.6'],
    [2, '  executor:'],
    [2, '    provider: openai'],
    [2, '    model: gpt-4o-mini'],
    [2, '    temperature: 0.7'],
    [3, '  tool_caller:'],
    [3, '    provider: openrouter'],
    [3, '    model: gemini-flash-1.5'],
    [4, 'tools:'],
    [0, '  file_system: true'],
    [0, '  web_fetch: true'],
  ];
  const codePix = sampleCanvas(
    760,
    CODE.length * 44 + 30,
    (ctx) => {
      ctx.font = '600 31px Jet, ui-monospace, monospace';
      ctx.textBaseline = 'top';
      CODE.forEach(([g, line], row) => {
        fill(ctx, g);
        ctx.fillText(line, 14, 16 + row * 44);
      });
    },
    74,
  );
  const wordPix = sampleCanvas(
    1100,
    420,
    (ctx) => {
      ctx.font = '800 330px Jet, ui-monospace, monospace';
      ctx.textBaseline = 'alphabetic';
      const letters = ['m', 'r', 'x'];
      const widths = letters.map((l) => ctx.measureText(l).width);
      const total = widths.reduce((a, b) => a + b, 0) + 40 + 120;
      let x = (1100 - total) / 2;
      letters.forEach((l, j) => {
        fill(ctx, j + 1);
        ctx.fillText(l, x, 330);
        x += widths[j];
      });
      fill(ctx, 0);
      ctx.fillRect(x + 40, 92, 120, 238);
    },
    100,
  );

  /* ---------------- shared sculptures (role identity) ---------------- */
  const o = { x: 0, y: 0, z: 0, b: 1 };
  function rotY(a) {
    const c = Math.cos(a),
      s = Math.sin(a),
      x = o.x;
    o.x = x * c + o.z * s;
    o.z = -x * s + o.z * c;
  }
  function rotX(a) {
    const c = Math.cos(a),
      s = Math.sin(a),
      y = o.y;
    o.y = y * c - o.z * s;
    o.z = y * s + o.z * c;
  }
  function rotZ(a) {
    const c = Math.cos(a),
      s = Math.sin(a),
      x = o.x;
    o.x = x * c - o.y * s;
    o.y = x * s + o.y * c;
  }
  // reasoner: a thinking lattice. executor: a stack of build layers. tool caller: a gyroscope.
  function sculpt(j, i, t) {
    const r1 = R1[i],
      r2 = R2[i],
      r3 = R3[i],
      r5 = R5[i];
    if (j === 0) {
      if (r5 < 0.55) {
        const z = 2 * r1 - 1,
          ph = r2 * TAU,
          rr = Math.sqrt(1 - z * z) * 1.35;
        o.x = Math.cos(ph) * rr;
        o.y = z * 1.35;
        o.z = Math.sin(ph) * rr;
        o.b = 0.62;
      } else if (r5 < 0.86) {
        const c = Math.floor(r1 * 4),
          a = r2 * TAU + t * 0.5 * (c % 2 ? 1 : -1);
        o.x = Math.cos(a) * 1.02;
        o.y = Math.sin(a) * 1.02;
        o.z = (r3 - 0.5) * 0.04;
        rotX(c * 0.85 + 0.4);
        rotY(c * 1.2);
        o.b = 1.05;
      } else {
        o.x = gx(i) * 0.32;
        o.y = gy(i) * 0.32;
        o.z = gz(i) * 0.32;
        o.b = 1.7;
      }
      rotY(t * 0.2);
      rotX(0.25);
    } else if (j === 1) {
      const s = Math.floor(r1 * 6);
      const y = (s - 2.5) * 0.33;
      if (r5 < 0.5) {
        const side = Math.floor(r2 * 4),
          q = (r3 - 0.5) * 1.7;
        o.x = side === 0 ? q : side === 1 ? 0.85 : side === 2 ? -q : -0.85;
        o.z = side === 0 ? 0.85 : side === 1 ? q : side === 2 ? -0.85 : -q;
        o.b = 0.95;
      } else {
        o.x = (Math.round(r2 * 7) / 7 - 0.5) * 1.7 + (r4f(i) - 0.5) * 0.03;
        o.z = (Math.round(r3 * 7) / 7 - 0.5) * 1.7;
        o.b = 0.5;
      }
      o.y = y + (r4f(i) - 0.5) * 0.025;
      rotY(s * 0.14 + t * 0.16 * (s % 2 ? 1 : -1));
      const scan = (fract(t * 0.35) * 2.6 - 1.3) * 1;
      o.b += Math.exp(-Math.pow((o.y - scan) * 7, 2)) * 1.3;
      rotX(0.32);
    } else {
      if (r5 < 0.8) {
        const c = Math.floor(r1 * 3),
          a = r2 * TAU,
          rr = 1.2 + c * 0.08;
        o.x = Math.cos(a) * rr;
        o.y = Math.sin(a) * rr;
        o.z = (r3 - 0.5) * 0.05;
        if (c === 0) {
          rotX(Math.PI / 2 + t * 0.55);
        } else if (c === 1) {
          rotY(t * 0.75 + 0.6);
          rotX(0.4);
        } else {
          rotY(Math.PI / 2);
          rotZ(t * 0.9);
          rotX(-0.5);
        }
        o.b = 0.95;
      } else {
        let x = r1 - 0.5,
          y = r2 - 0.5,
          z = r3 - 0.5;
        const l = (Math.abs(x) + Math.abs(y) + Math.abs(z)) / 0.5;
        x /= l;
        y /= l;
        z /= l;
        o.x = x;
        o.y = y;
        o.z = z;
        rotY(-t * 0.8);
        o.b = 1.6;
      }
    }
  }
  const r4f = (i) => R4[i];

  /* ---------------- layout ---------------- */
  let W = 1,
    H = 1,
    hh = 1,
    hw = 1,
    wide = true;
  const L = Array.from({ length: CHAPTERS }, () => ({ x: 0, y: 0, s: 1, dim: 1 }));
  const roleAnchors = [
    [-3, 0],
    [0, 0],
    [3, 0],
  ];
  let roleAnchorPx = null; // [{x,y,h}] in CSS px from the pinned roles stage
  let roleScale = 0;
  function computeLayout() {
    hh = Math.tan((camera.fov * Math.PI) / 360) * CAMZ;
    hw = hh * camera.aspect;
    wide = W >= 900 && camera.aspect >= 1.05;
    const k = Math.min(hh / 5.5, hw / 8.2);
    const kn = hw / 4.4;
    const set = (i, x, y, s, dim) => Object.assign(L[i], { x, y, s, dim });
    if (wide) {
      set(0, hw * 0.15, -hh * 0.02, k, 1);
      set(1, 0, hh * 0.08, k * 0.82, 1);
      set(2, hw * 0.29, hh * 0.12, k * 0.74, 0.95);
      set(3, hw * 0.33, -hh * 0.04, k * 0.82, 1);
      set(4, hw * 0.47, hh * 0.02, k * 1.05, 0.7);
      set(5, 0, -hh * 0.05, k * 1.1, 0.62);
      set(6, 0, hh * 0.2, k * 0.78, 1.05);
    } else {
      set(0, -1.75 * kn * 0.92, hh * 0.42, kn * 0.92, 0.95);
      set(1, 0, hh * 0.5, kn * 0.5, 0.85);
      set(2, 0, hh * 0.5, kn * 0.5, 0.55);
      set(3, 0, hh * 0.46, kn * 0.5, 0.7);
      set(4, 0, hh * 0.05, kn * 0.55, 0.32);
      set(5, 0, 0, kn * 0.62, 0.42);
      set(6, 0, hh * 0.3, kn * 0.78, 1);
    }
    if (wide && roleAnchorPx) {
      roleAnchorPx.forEach((p, j) => {
        roleAnchors[j][0] = ((p.x / W) * 2 - 1) * hw;
        roleAnchors[j][1] = -((p.y / H) * 2 - 1) * hh;
      });
      // sculpture (radius ~1.4, up to 1.12x when selected) plus its plinth must fit the stage
      const stageWorld = (roleAnchorPx[0].h / H) * 2 * hh;
      L[1].s = Math.min(L[1].s, stageWorld / 3.9);
    } else {
      const sp = wide ? hw * 0.6 : hw * 0.64;
      roleAnchors.forEach((a, j) => {
        a[0] = (j - 1) * sp;
        a[1] = L[1].y;
      });
    }
  }

  /* ---------------- runtime state ---------------- */
  const state = {
    t: 0,
    sc: 0,
    target: 0,
    intro: 1,
    hold: false,
    selected: 0,
    roleW: [1, 0.35, 0.35],
    mode: 'think_then_answer',
    manual: 0,
    flash: [0, 0, 0, 0],
    pulse: -99,
    vel: 0,
    ca: 0,
  };

  /* ---------------- formations ---------------- */
  const V0 = [
    [3.0, 2.35, 0.7],
    [4.25, -0.1, 1.5],
    [2.95, -2.55, 0.5],
  ];
  const C0 = [
    [1.1, 1.9, 1.4],
    [1.6, 0.0, 1.9],
    [1.1, -1.9, 1.4],
  ];
  const BEAM = [0.9, 9.5, -30];
  // F0 — THE SPLIT
  function f0(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y,
      pt = (t - state.pulse) * 0.55;
    const prismRot = t * 0.22;
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g === 0) {
        if (R4[i] < 0.12) {
          x = gx(i) * 0.5;
          y = gy(i) * 0.5;
          z = gz(i) * 0.5;
          b = 0.9;
        } else {
          const u = fract(R1[i] + t * 0.13),
            e = Math.pow(u, 0.85);
          const a = R2[i] * TAU + e * 16 + t * 0.7;
          const rad = (0.04 + 0.42 * (1 - e) * (1 - e)) * (0.35 + R3[i]);
          x = BEAM[0] * (1 - e) + Math.cos(a) * rad;
          y = BEAM[1] * (1 - e) + Math.sin(a) * rad;
          z = BEAM[2] * (1 - e) + Math.cos(a) * rad * 0.6;
          b = 0.45 + e * 0.95;
          b += Math.exp(-Math.pow((u - pt) * 14, 2)) * 2.4;
        }
      } else if (g === 4) {
        if (R4[i] < 0.62) {
          const r = 1.3,
            hz = 0.95;
          if (R5[i] < 0.72) {
            const e = Math.floor(R1[i] * 9),
              q = R2[i];
            const a0 = Math.PI / 2 + (e % 3) * (TAU / 3),
              a1 = a0 + TAU / 3;
            const ax = Math.cos(a0) * r,
              ay = Math.sin(a0) * r;
            let az, bx, by, bz;
            if (e < 3) {
              az = hz;
              bx = Math.cos(a1) * r;
              by = Math.sin(a1) * r;
              bz = hz;
            } else if (e < 6) {
              az = -hz;
              bx = Math.cos(a1) * r;
              by = Math.sin(a1) * r;
              bz = -hz;
            } else {
              az = hz;
              bx = ax;
              by = ay;
              bz = -hz;
            }
            o.x = ax + (bx - ax) * q;
            o.y = ay + (by - ay) * q;
            o.z = az + (bz - az) * q;
            b = 1.35;
          } else {
            // faint glass faces: random point inside the front or back triangle
            let p = R1[i],
              q = R2[i];
            if (p + q > 1) {
              p = 1 - p;
              q = 1 - q;
            }
            const A = Math.PI / 2;
            const x0 = Math.cos(A) * r,
              y0 = Math.sin(A) * r;
            const x1 = Math.cos(A + TAU / 3) * r,
              y1 = Math.sin(A + TAU / 3) * r;
            const x2 = Math.cos(A + (2 * TAU) / 3) * r,
              y2 = Math.sin(A + (2 * TAU) / 3) * r;
            o.x = x0 + (x1 - x0) * p + (x2 - x0) * q;
            o.y = y0 + (y1 - y0) * p + (y2 - y0) * q;
            o.z = R3[i] < 0.5 ? hz : -hz;
            b = 0.32;
          }
          rotY(Math.sin(t * 0.35) * 0.5 + 0.3);
          rotX(0.16 + Math.sin(t * 0.21) * 0.08);
          x = o.x;
          y = o.y;
          z = o.z;
          b += Math.exp(-Math.pow((pt - 1) * 6, 2)) * 1.6;
        } else {
          const th = R1[i] * TAU,
            ph = Math.acos(2 * R2[i] - 1),
            r = 16 + R3[i] * 30;
          x = r * Math.sin(ph) * Math.cos(th) - ox / s;
          y = r * Math.cos(ph) * 0.6;
          z = -12 - R5[i] * 30;
          b = 0.16 + R4[i] * 0.2;
        }
      } else {
        const j = g - 1,
          V = V0[j],
          C = C0[j];
        const w = 0.55 + state.roleW[j] * 0.6;
        if (R4[i] < 0.4) {
          const u = fract(R1[i] + t * 0.2 + j * 0.33),
            m = 1 - u;
          const sp = 0.03 + 0.28 * u;
          x = 2 * m * u * C[0] + u * u * V[0] + gx(i) * sp;
          y = 2 * m * u * C[1] + u * u * V[1] + gy(i) * sp;
          z = 2 * m * u * C[2] + u * u * V[2] + gz(i) * sp;
          b = (0.5 + u * 0.7) * w;
          b += Math.exp(-Math.pow((u - (pt - 1.15)) * 10, 2)) * 2.2;
        } else {
          sculpt(j, i, t);
          const sc = 0.58;
          x = V[0] + o.x * sc;
          y = V[1] + o.y * sc;
          z = V[2] + o.z * sc;
          b = o.b * w * 0.95 + Math.exp(-Math.pow((pt - 2.2) * 4, 2)) * 1.4;
        }
      }
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  // F1 — THE CAST
  function f1(P, B, t, Lc) {
    const s = Lc.s;
    const left = roleAnchors[0][0],
      right = roleAnchors[2][0],
      base = Math.min(...roleAnchors.map((a) => a[1]));
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g >= 1 && g <= 3) {
        const j = g - 1,
          w = state.roleW[j];
        sculpt(j, i, t);
        const sc = s * (0.86 + w * 0.26);
        x = roleAnchors[j][0] + o.x * sc;
        y = roleAnchors[j][1] + o.y * sc;
        z = o.z * sc;
        b = o.b * (0.42 + w * 0.85) * (1 + state.flash[g] * 1.5);
      } else if (g === 0) {
        const u = fract(R1[i] + t * 0.06);
        x = left - 2.2 * s + (right - left + 4.4 * s) * u;
        y = base - 2.05 * s + gy(i) * 0.05 * s + Math.sin(u * 40 + t) * 0.02;
        z = gz(i) * 0.08;
        b = 0.3 + Math.exp(-Math.pow((fract(u * 3 - t * 0.2) - 0.5) * 10, 2)) * 0.9;
      } else {
        if (R4[i] < 0.45) {
          const j = Math.floor(R1[i] * 3),
            a = R2[i] * TAU;
          x = roleAnchors[j][0] + Math.cos(a) * 1.25 * s;
          y = roleAnchors[j][1] - 1.75 * s + Math.sin(a) * 0.22 * s;
          z = Math.sin(a) * 0.9 * s;
          b = 0.32 + state.roleW[j] * 0.4;
        } else {
          x = (R1[i] - 0.5) * hw * 2.4;
          y = (R2[i] - 0.5) * hh * 2.4;
          z = -6 - R3[i] * 16;
          b = 0.14 + R5[i] * 0.16;
        }
      }
      P[i * 3] = x;
      P[i * 3 + 1] = y;
      P[i * 3 + 2] = z;
      B[i] = b;
    }
  }
  // F2 — THE RELAY
  const NODES = [
    [-3.4, 0.1, 0],
    [-1.15, 1.25, 0.3],
    [1.25, -0.25, 0.6],
    [-0.5, -1.75, 0.2],
    [3.5, 0.45, 0],
  ];
  function relayFlows() {
    if (state.mode === 'manual') {
      const target = state.manual + 1;
      return [
        [0, target, 0],
        [target, 4, target],
      ];
    }
    return [
      [0, 1, 0],
      [1, 2, 1],
      [2, 4, 2],
    ];
  }
  function f2(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y;
    const flows = relayFlows();
    const plan = state.mode === 'planner_executor';
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g === 4) {
        if (R4[i] < 0.35) {
          const a = R1[i] * TAU,
            n = NODES[4];
          x = n[0] + Math.cos(a) * 0.55;
          y = n[1] + Math.sin(a) * 0.55;
          z = n[2] + (R2[i] - 0.5) * 0.05;
          b = 0.9 + Math.max(state.flash[2], state.flash[3]) * 0.4;
        } else {
          x = ((R1[i] - 0.5) * hw * 2.6) / s - ox / s;
          y = ((R2[i] - 0.5) * hh * 2.6) / s;
          z = -6 - R3[i] * 18;
          b = 0.13 + R5[i] * 0.14;
        }
      } else {
        const flow = flows.find((f) => f[2] === g);
        const n = NODES[g];
        const fl = state.flash[g];
        if (!flow || R4[i] < 0.42) {
          // node ball
          const zz = 2 * R1[i] - 1,
            ph = R2[i] * TAU + t * 0.6,
            rr = Math.sqrt(1 - zz * zz);
          let rad = flow ? 0.38 : 0.55 + 0.25 * R3[i];
          let cx = n[0],
            cy = n[1],
            cz = n[2];
          if (plan && g === 2) {
            const w = Math.floor(R5[i] * 3);
            cx += (w - 1) * 0.55;
            cy += w === 1 ? 0.45 : -0.15;
            rad *= 0.6;
          }
          x = cx + Math.cos(ph) * rr * rad;
          y = cy + zz * rad;
          z = cz + Math.sin(ph) * rr * rad;
          b = (flow ? 1.25 : 0.13) * (1 + fl * 2.4);
        } else {
          const a = NODES[flow[0]],
            c = NODES[flow[1]];
          const lane = plan && g === 1 ? (Math.floor(R5[i] * 3) - 1) * 0.5 : 0;
          const u = fract(R1[i] + t * (0.22 + fl * 0.3)),
            m = 1 - u;
          const mx = (a[0] + c[0]) / 2,
            my = (a[1] + c[1]) / 2 + 0.9 + lane,
            mz = (a[2] + c[2]) / 2 + 0.6;
          const tx = plan && g === 1 ? c[0] + lane * 1.1 : c[0];
          x = m * m * a[0] + 2 * m * u * mx + u * u * tx + gx(i) * 0.07;
          y = m * m * a[1] + 2 * m * u * my + u * u * c[1] + gy(i) * 0.07;
          z = m * m * a[2] + 2 * m * u * mz + u * u * c[2] + gz(i) * 0.07;
          b = (0.55 + Math.sin(u * Math.PI) * 0.5) * (1 + fl * 1.8);
        }
      }
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  // F3 — PROVIDERS. Six nodes, one session in the middle.
  const PROV_GROUPS = [[3], [1, 5], [0, 4], [2]];
  const provPos = Array.from({ length: 6 }, () => [0, 0, 0]);
  function providerNodes(t) {
    for (let n = 0; n < 6; n++) {
      const a = (n / 6) * TAU + t * 0.09 - 0.6;
      o.x = Math.cos(a) * 3.7;
      o.y = 0;
      o.z = Math.sin(a) * 3.7;
      rotX(-0.58);
      rotZ(0.1);
      provPos[n][0] = o.x;
      provPos[n][1] = o.y;
      provPos[n][2] = o.z;
    }
  }
  function f3(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y;
    providerNodes(t);
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g === 4) {
        if (R4[i] < 0.45) {
          const zz = 2 * R1[i] - 1,
            ph = R2[i] * TAU - t * 0.3,
            rr = Math.sqrt(1 - zz * zz) * 0.72;
          x = Math.cos(ph) * rr;
          y = zz * 0.72;
          z = Math.sin(ph) * rr;
          b = 0.95;
        } else if (R4[i] < 0.8) {
          const a = R1[i] * TAU;
          o.x = Math.cos(a) * 3.7;
          o.y = 0;
          o.z = Math.sin(a) * 3.7;
          rotX(-0.58);
          rotZ(0.1);
          x = o.x;
          y = o.y;
          z = o.z;
          b = 0.3;
        } else {
          x = ((R1[i] - 0.5) * hw * 2.6) / s - ox / s;
          y = ((R2[i] - 0.5) * hh * 2.6) / s;
          z = -6 - R3[i] * 18;
          b = 0.13 + R5[i] * 0.14;
        }
      } else {
        const list = PROV_GROUPS[g],
          n = provPos[list[Math.floor(R3[i] * list.length)]];
        if (R5[i] < 0.55) {
          const zz = 2 * R1[i] - 1,
            ph = R2[i] * TAU + t,
            rr = Math.sqrt(1 - zz * zz) * 0.36;
          x = n[0] + Math.cos(ph) * rr;
          y = n[1] + zz * 0.36;
          z = n[2] + Math.sin(ph) * rr;
          b = 1.05;
        } else {
          const u = fract(R1[i] + t * 0.18),
            m = 1 - u;
          x = n[0] * m + gx(i) * 0.05;
          y = n[1] * m + Math.sin(u * Math.PI) * 0.35 + gy(i) * 0.05;
          z = n[2] * m;
          b = 0.35 + u * 0.75;
        }
      }
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  // F4 — CONFIG MADE OF LIGHT
  function f4(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y;
    const ca = Math.cos(-0.42),
      sa = Math.sin(-0.42),
      cb = Math.cos(0.2),
      sb = Math.sin(0.2);
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g === 4 && R4[i] > 0.5) {
        x = ((R1[i] - 0.5) * hw * 2.6) / s - ox / s;
        y = ((R2[i] - 0.5) * hh * 2.6) / s;
        z = -6 - R3[i] * 18;
        b = 0.13;
      } else {
        const arr = codePix[g],
          n = arr.length / 2,
          k = Math.floor(R1[i] * n) * 2;
        x = arr[k] + (R2[i] - 0.5) * 0.026;
        y = arr[k + 1] + (R3[i] - 0.5) * 0.026;
        z = Math.sin(x * 0.55 + t * 0.8) * 0.28 + Math.cos(y * 0.4 + t * 0.5) * 0.18;
        const xr = x * ca + z * sa,
          zr = -x * sa + z * ca;
        const yr = y * cb - zr * sb,
          zr2 = y * sb + zr * cb;
        x = xr;
        y = yr;
        z = zr2;
        const line = fract(-y * 0.12 - t * 0.12);
        b = (g === 4 ? 0.55 : 0.85) + Math.exp(-Math.pow((line - 0.5) * 14, 2)) * 0.9;
      }
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  // F5 — CONVERGENCE. Three arms, one session.
  function f5(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y;
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g >= 1 && g <= 3) {
        const j = g - 1,
          rr = 0.25 + Math.pow(R1[i], 0.75) * 5.4;
        const a = j * (TAU / 3) + rr * 0.9 + (t * 0.38) / (0.4 + rr * 0.35);
        const sp = 0.12 + rr * 0.07;
        o.x = Math.cos(a) * rr + gx(i) * sp;
        o.z = Math.sin(a) * rr + gz(i) * sp;
        o.y = gy(i) * (0.08 + 0.3 / (rr + 0.5));
        b = 0.4 + 1.2 / (rr + 0.6);
      } else if (g === 0) {
        o.x = gx(i) * 0.55;
        o.y = gy(i) * 0.4;
        o.z = gz(i) * 0.55;
        b = 1.5;
      } else {
        const th = R1[i] * TAU,
          ph = Math.acos(2 * R2[i] - 1),
          r = 7 + R3[i] * 12;
        o.x = r * Math.sin(ph) * Math.cos(th);
        o.y = r * Math.cos(ph) * 0.5;
        o.z = r * Math.sin(ph) * Math.sin(th);
        b = 0.12 + R5[i] * 0.16;
      }
      rotX(1.08);
      rotZ(0.25);
      x = o.x;
      y = o.y;
      z = o.z;
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  // F6 — WORDMARK
  function f6(P, B, t, Lc) {
    const s = Lc.s,
      ox = Lc.x,
      oy = Lc.y,
      blink = fract(t * 0.95) < 0.55 ? 1.45 : 0.25;
    for (let i = 0; i < N; i++) {
      const g = G[i];
      let x, y, z, b;
      if (g === 4) {
        const a = R1[i] * TAU,
          r = 5.5 + Math.pow(R2[i], 2) * 9;
        x = Math.cos(a) * r;
        y = Math.sin(a) * r * 0.5;
        z = -4 - R3[i] * 14;
        b = 0.12 + R5[i] * 0.2;
      } else {
        const arr = wordPix[g],
          n = arr.length / 2,
          k = Math.floor(R1[i] * n) * 2;
        x = arr[k] + (R2[i] - 0.5) * 0.035;
        y = arr[k + 1] + (R3[i] - 0.5) * 0.035;
        z = (R4[i] - 0.5) * 0.45 + Math.sin(x * 0.7 + t * 1.1) * 0.12;
        b =
          g === 0
            ? 0.9 * blink
            : 0.95 + Math.exp(-Math.pow((fract(t * 0.18) * 14 - 7 - x) * 1.2, 2)) * 0.9;
        const c = Math.cos(Math.sin(t * 0.35) * 0.18),
          sn = Math.sin(Math.sin(t * 0.35) * 0.18),
          xx = x;
        x = xx * c + z * sn;
        z = -xx * sn + z * c;
      }
      P[i * 3] = x * s + ox;
      P[i * 3 + 1] = y * s + oy;
      P[i * 3 + 2] = z * s;
      B[i] = b;
    }
  }
  const FORMS = [f0, f1, f2, f3, f4, f5, f6];

  /* ---------------- anchors for floating labels ---------------- */
  function anchor(ch, name, t, out) {
    const Lc = L[ch],
      s = Lc.s;
    let x = 0,
      y = 0,
      z = 0;
    if (ch === 0) {
      if (name === 'prism') {
        x = 0;
        y = -1.35;
      } else if (name === 'prompt') {
        x = BEAM[0] * 0.5 - 0.5;
        y = BEAM[1] * 0.5;
        z = BEAM[2] * 0.5;
      } else {
        const v = V0[ROLE_INDEX[name]];
        x = v[0];
        y = v[1] + 0.95;
        z = v[2];
      }
      out.set(x * s + Lc.x, y * s + Lc.y, z * s);
      return out;
    }
    if (ch === 1) {
      const j = ROLE_INDEX[name],
        a = roleAnchors[j];
      return out.set(a[0], a[1] + 1.75 * s * (0.86 + state.roleW[j] * 0.26), 0);
    }
    if (ch === 2) {
      const n = NODES[{ user: 0, reasoner: 1, executor: 2, tool_caller: 3, answer: 4 }[name]];
      return out.set(n[0] * s + Lc.x, (n[1] - 0.85) * s + Lc.y, n[2] * s);
    }
    if (ch === 3) {
      providerNodes(t);
      const n = provPos[+name.slice(1)];
      return out.set(n[0] * s + Lc.x, (n[1] + 0.62) * s + Lc.y, n[2] * s);
    }
    return out.set(0, 0, 0);
  }

  /* ---------------- buffers + post ---------------- */
  const PA = new Float32Array(N * 3),
    BA = new Float32Array(N),
    PB = new Float32Array(N * 3),
    BB = new Float32Array(N);
  const PI0 = new Float32Array(N * 3);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), small ? 0.7 : 0.95, 0.62, 0.08);
  composer.addPass(bloom);
  const lens = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAmt: { value: 0.0015 } },
    vertexShader:
      'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uAmt; varying vec2 vUv;
      void main(){
        vec2 d = vUv - .5; vec2 off = d * uAmt * (.6 + dot(d, d) * 5.);
        vec3 c = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);
        c *= mix(1., .55, smoothstep(.35, .95, length(d * vec2(1., 1.25)) * 1.25));
        c += vec3(.0015, .0024, .0037);
        gl_FragColor = vec4(c, 1.);
      }`,
  });
  composer.addPass(lens);
  composer.addPass(new OutputPass());

  /* ---------------- interaction ---------------- */
  const mouse = new THREE.Vector2(0, 0),
    mouseS = new THREE.Vector2(0, 0);
  let hasPointer = false;
  addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'touch') return;
      hasPointer = true;
      mouse.set((e.clientX / W) * 2 - 1, -(e.clientY / H) * 2 + 1);
    },
    { passive: true },
  );
  document.addEventListener('pointerleave', () => (hasPointer = false));

  function resize() {
    W = innerWidth;
    H = innerHeight;
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(W, H, false);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(W, H);
    bloom.resolution.set(W / 2, H / 2);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    U.uPR.value = renderer.getPixelRatio();
    U.uAspect.value = camera.aspect;
    U.uScale.value = H / 900;
    computeLayout();
    dirty = true;
  }

  /* ---------------- labels ---------------- */
  const labels = [...document.querySelectorAll('[data-anchor]')].map((el) => ({
    el,
    list: el.dataset.anchor.split(',').map((s) => {
      const [ch, name] = s.split(':');
      return { ch: +ch, name };
    }),
    shown: false,
    below: el.dataset.place === 'below',
  }));
  const v3 = new THREE.Vector3();
  function placeLabels() {
    const near = Math.round(state.sc);
    const away = Math.abs(state.sc - near);
    for (const L0 of labels) {
      const hit = L0.list.find((a) => a.ch === near);
      const vis =
        hit && away < 0.18 && state.intro > 0.92 && (wide || L0.el.dataset.mobile === 'true');
      if (!vis) {
        if (L0.shown) {
          L0.el.classList.remove('on');
          L0.shown = false;
        }
        continue;
      }
      anchor(hit.ch, hit.name, state.t, v3);
      v3.applyMatrix4(points.matrixWorld).project(camera);
      const x = (v3.x * 0.5 + 0.5) * W,
        y = (-v3.y * 0.5 + 0.5) * H;
      L0.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, ${L0.below ? '14px' : '-100%'})`;
      if (!L0.shown) {
        L0.el.classList.add('on');
        L0.shown = true;
      }
    }
  }

  /* ---------------- loop ---------------- */
  let paused = startPaused,
    dirty = true,
    last = 0,
    raf = 0,
    lost = false;
  let frames = 0,
    slow = 0,
    tier = 0,
    NA = N;
  const t0 = performance.now();
  function frame(now) {
    raf = 0;
    if (lost || document.hidden) return;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    // adaptive quality: keep the page smooth on modest hardware
    frames++;
    if (frames > 20 && frames < 200 && !paused) {
      if (dt > 0.03) slow++;
      if (frames === 199 || slow > 25) {
        if (slow > 25 && tier === 0) {
          tier = 1;
          bloom.enabled = false;
          pixelRatio = Math.min(pixelRatio, 1);
          resize();
        } else if (slow > 25 && tier === 1) {
          tier = 2;
          NA = Math.floor(N * 0.5);
          geo.setDrawRange(0, NA);
        }
        if (slow > 25 && tier < 2) {
          frames = 21;
          slow = 0;
        }
      }
    }
    const moving = !paused;
    if (moving) state.t += dt;
    const k = 1 - Math.exp(-dt * (paused ? 12 : 3.2));
    const prevSc = state.sc;
    state.sc += (state.target - state.sc) * k;
    if (Math.abs(state.target - state.sc) < 0.0005) state.sc = state.target;
    if (state.intro < 1 && !state.hold)
      state.intro = paused ? 1 : Math.min(1, state.intro + dt / 2.6);
    for (let j = 0; j < 3; j++)
      state.roleW[j] += ((j === state.selected ? 1 : 0.35) - state.roleW[j]) * Math.min(1, dt * 4);
    for (let j = 0; j < 4; j++) state.flash[j] = Math.max(0, state.flash[j] - dt * 1.4);
    mouseS.lerp(hasPointer && !paused ? mouse : new THREE.Vector2(0, 0), 1 - Math.exp(-dt * 3));
    U.uMouse.value.copy(hasPointer && !paused ? mouseS : new THREE.Vector2(9, 9));
    world.rotation.y = mouseS.x * 0.1;
    world.rotation.x = -mouseS.y * 0.05;
    state.ca += (Math.min(1, Math.abs(state.vel) / 2600) - state.ca) * Math.min(1, dt * 6);
    lens.uniforms.uAmt.value =
      0.0004 + state.ca * 0.011 + (state.intro < 1 ? (1 - state.intro) * 0.01 : 0);
    U.uTime.value = state.t;

    // the pointer only drives shader uniforms and the world tilt, so it never forces a recompute
    const needs = moving || dirty || prevSc !== state.sc;
    if (needs) {
      dirty = false;
      const t = state.t,
        sc = clamp(state.sc, 0, CHAPTERS - 1);
      const a = Math.floor(sc),
        b = Math.min(CHAPTERS - 1, a + 1),
        m = sc - a;
      FORMS[a](PA, BA, t, L[a]);
      const dimA = L[a].dim;
      if (m > 0.0005) {
        FORMS[b](PB, BB, t, L[b]);
        const dimB = L[b].dim,
          swirl = 2.4 * L[a].s;
        for (let i = 0; i < NA; i++) {
          const q = ease(clamp((m - D[i]) / 0.62, 0, 1)),
            sw = Math.sin(q * Math.PI) * swirl,
            i3 = i * 3;
          const ang = R2[i] * TAU + q * 3;
          pos[i3] = PA[i3] + (PB[i3] - PA[i3]) * q + Math.cos(ang) * sw;
          pos[i3 + 1] = PA[i3 + 1] + (PB[i3 + 1] - PA[i3 + 1]) * q + Math.sin(ang) * sw * 0.6;
          pos[i3 + 2] = PA[i3 + 2] + (PB[i3 + 2] - PA[i3 + 2]) * q + (R3[i] - 0.5) * sw * 2;
          bri[i] = BA[i] * dimA + (BB[i] * dimB - BA[i] * dimA) * q;
        }
      } else {
        for (let i = 0; i < NA * 3; i++) pos[i] = PA[i];
        for (let i = 0; i < NA; i++) bri[i] = BA[i] * dimA;
      }
      if (state.intro < 1) {
        // boot: every particle starts inside the prism and is released into the scene
        const ip = state.intro;
        for (let i = 0; i < NA; i++) {
          const q = easeIO(clamp((ip - D[i] * 0.9) / 0.65, 0, 1)),
            i3 = i * 3;
          const ang = R1[i] * TAU,
            sw = Math.sin(q * Math.PI) * 3.2 * L[0].s * (0.4 + R3[i]);
          pos[i3] = PI0[i3] + (pos[i3] - PI0[i3]) * q + Math.cos(ang) * sw;
          pos[i3 + 1] = PI0[i3 + 1] + (pos[i3 + 1] - PI0[i3 + 1]) * q + Math.sin(ang) * sw;
          pos[i3 + 2] = PI0[i3 + 2] + (pos[i3 + 2] - PI0[i3 + 2]) * q;
          bri[i] *= 0.35 + q * 0.65 + (1 - q) * (R4[i] > 0.7 ? 1.6 : 0);
        }
      }
      posAttr.needsUpdate = true;
      briAttr.needsUpdate = true;
    }
    world.updateMatrixWorld();
    composer.render(dt);
    placeLabels();
    if (
      !paused ||
      Math.abs(state.target - state.sc) > 0.0005 ||
      state.ca > 0.01 ||
      // while paused, only keep drawing until the parallax tilt has eased back to rest
      mouseS.lengthSq() > 1e-5 ||
      (state.intro < 1 && !state.hold)
    )
      raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && !lost && !document.hidden) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  function seedIntro() {
    const Lc = L[0];
    for (let i = 0; i < N; i++) {
      PI0[i * 3] = Lc.x + gx(i) * 0.3 * Lc.s;
      PI0[i * 3 + 1] = Lc.y + gy(i) * 0.3 * Lc.s;
      PI0[i * 3 + 2] = gz(i) * 0.3 * Lc.s;
    }
  }

  addEventListener('resize', () => {
    resize();
    seedIntro();
    kick();
  });
  document.addEventListener('visibilitychange', kick);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    dispatchEvent(new CustomEvent('mrx:gl', { detail: { ok: false } }));
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    dirty = true;
    dispatchEvent(new CustomEvent('mrx:gl', { detail: { ok: true } }));
    kick();
  });
  resize();
  seedIntro();
  kick();

  /* ---------------- public API ---------------- */
  return {
    count: N,
    get tier() {
      return tier;
    },
    setTarget(s) {
      state.target = clamp(s, 0, CHAPTERS - 1);
      kick();
    },
    jump(s) {
      state.target = state.sc = clamp(s, 0, CHAPTERS - 1);
      dirty = true;
      kick();
    },
    setVelocity(v) {
      state.vel = v;
      kick();
    },
    setRole(role) {
      if (role in ROLE_INDEX) state.selected = ROLE_INDEX[role];
      dirty = true;
      kick();
    },
    setMode(mode, manualRole) {
      state.mode = mode;
      if (manualRole in ROLE_INDEX) state.manual = ROLE_INDEX[manualRole];
      dirty = true;
      kick();
    },
    step(role) {
      const g = role === 'user' ? 0 : ROLE_INDEX[role] + 1;
      if (g >= 0) state.flash[g] = 1;
      dirty = true;
      kick();
    },
    setRoleAnchors(list) {
      roleAnchorPx = list;
      computeLayout();
      dirty = true;
      kick();
    },
    intro(skip) {
      state.hold = false;
      state.intro = skip ? 1 : 0;
      seedIntro();
      dirty = true;
      kick();
    },
    holdIntro() {
      state.hold = true;
      state.intro = 0;
      seedIntro();
      dirty = true;
      kick();
    },
    pulse() {
      state.pulse = state.t;
      kick();
    },
    wave(clientX, clientY) {
      U.uWave.value.set((clientX / W) * 2 - 1, -(clientY / H) * 2 + 1, state.t);
      if (paused) state.t += 0.0001;
      kick();
    },
    setPaused(p) {
      paused = p;
      dirty = true;
      kick();
    },
    get elapsed() {
      return (performance.now() - t0) / 1000;
    },
  };
}
