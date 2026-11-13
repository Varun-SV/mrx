import * as THREE from './assets/vendor/three.module.min.js';

// This scene is a visual explanation only. It never connects to model providers.
export function initScene(container, options = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
  } catch {
    document.querySelector('#scene-status').textContent = 'STATIC VIEW / WEBGL UNAVAILABLE';
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  container.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.set(0, 2.6, 9.8);
  camera.lookAt(0, -0.15, 0);
  const world = new THREE.Group();
  scene.add(world);
  const colors = { reasoner: 0x45c8db, executor: 0x5bd68a, tool_caller: 0xe5b567 };
  const positions = {
    reasoner: new THREE.Vector3(0, 1.15, 0),
    executor: new THREE.Vector3(-1.55, -0.95, 0.5),
    tool_caller: new THREE.Vector3(1.55, -0.85, -0.1),
  };
  scene.add(new THREE.AmbientLight(0x749bad, 2.4));
  const key = new THREE.DirectionalLight(0xd7f7ff, 3);
  key.position.set(-3, 5, 6);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x45c8db, 2);
  rim.position.set(4, 1, -4);
  scene.add(rim);
  const cores = {};
  const material = (color, opacity = 0.75) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0.55,
      roughness: 0.28,
      transparent: true,
      opacity,
      emissive: color,
      emissiveIntensity: 0.12,
      side: THREE.DoubleSide,
    });
  const lineMaterial = (color, opacity = 0.65) =>
    new THREE.LineBasicMaterial({ color, transparent: true, opacity });
  function ring(radius, color, tube = 0.009) {
    return new THREE.Mesh(
      new THREE.TorusGeometry(radius, tube, 8, 96),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 }),
    );
  }
  function glowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,.5)');
    gradient.addColorStop(0.22, 'rgba(255,255,255,.15)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }
  const glowMap = glowTexture();
  for (const role of Object.keys(colors)) {
    const group = new THREE.Group();
    group.position.copy(positions[role]);
    world.add(group);
    const inner = new THREE.Group();
    group.add(inner);
    const color = colors[role];
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowMap,
        color,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
        opacity: 0.65,
      }),
    );
    glow.scale.set(3.5, 3.5, 1);
    group.add(glow);
    const light = new THREE.PointLight(color, 7, 4, 2);
    group.add(light);
    cores[role] = { group, inner, glow, light };
    // Each role gets a distinct silhouette: thought lattice, execution stack, action gyroscope.
    if (role === 'reasoner') {
      const shell = new THREE.IcosahedronGeometry(0.78, 1);
      inner.add(
        new THREE.LineSegments(new THREE.WireframeGeometry(shell), lineMaterial(color, 0.65)),
      );
      const nucleus = new THREE.Mesh(new THREE.IcosahedronGeometry(0.47, 0), material(color, 0.7));
      inner.add(nucleus);
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(nucleus.geometry),
        lineMaterial(0xb8f6fc, 0.95),
      );
      nucleus.add(edges);
      const orbit = ring(1.02, color, 0.008);
      orbit.rotation.set(0.6, 0.2, 0.25);
      group.add(orbit);
      const second = ring(0.94, color, 0.005);
      second.rotation.set(-0.8, 0.8, 0);
      group.add(second);
      const points = shell.attributes.position;
      for (let i = 0; i < points.count; i += 3) {
        const dot = new THREE.Mesh(
          new THREE.SphereGeometry(0.018, 5, 5),
          new THREE.MeshBasicMaterial({ color: 0xb3edf6 }),
        );
        dot.position.fromBufferAttribute(points, i);
        inner.add(dot);
      }
    } else if (role === 'executor') {
      for (let i = 0; i < 5; i++) {
        const cube = new THREE.Mesh(
          new THREE.BoxGeometry(0.95, 0.105, 0.95),
          material(color, 0.65),
        );
        cube.position.y = (i - 2) * 0.22;
        cube.rotation.y = i * 0.12;
        inner.add(cube);
        cube.add(
          new THREE.LineSegments(
            new THREE.EdgesGeometry(cube.geometry),
            lineMaterial(0xa3f3bc, 0.85),
          ),
        );
      }
      const core = new THREE.Mesh(new THREE.BoxGeometry(0.38, 1.1, 0.38), material(color, 0.35));
      inner.add(core);
      const orbit = ring(0.94, color, 0.007);
      orbit.rotation.x = Math.PI / 2;
      group.add(orbit);
      const orbit2 = ring(1.05, color, 0.004);
      orbit2.rotation.x = Math.PI / 2;
      orbit2.position.y = -0.55;
      group.add(orbit2);
    } else {
      for (let i = 0; i < 3; i++) {
        const orbit = ring(0.7 + i * 0.08, color, 0.025);
        orbit.rotation.set(i === 0 ? Math.PI / 2 : 0.2, i * 0.85, i * 0.6);
        inner.add(orbit);
      }
      const nucleus = new THREE.Mesh(new THREE.OctahedronGeometry(0.31), material(color, 0.9));
      inner.add(nucleus);
      nucleus.add(
        new THREE.LineSegments(new THREE.EdgesGeometry(nucleus.geometry), lineMaterial(0xffe2ab)),
      );
      const axis = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, 1.8, 8),
        material(color, 0.85),
      );
      axis.rotation.z = 0.45;
      inner.add(axis);
    }
    // Small platform under each core grounds the system in a common orchestration plane.
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 0.065, 64),
      material(0x25343d, 0.45),
    );
    plinth.position.y = -0.95;
    group.add(plinth);
    const edge = ring(0.91, color, 0.006);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = -0.91;
    group.add(edge);
  }
  const links = [];
  const connections = [
    ['reasoner', 'executor'],
    ['executor', 'tool_caller'],
    ['tool_caller', 'reasoner'],
  ];
  for (const [from, to] of connections) {
    const a = positions[from].clone(),
      b = positions[to].clone();
    const mid = a.clone().lerp(b, 0.5);
    mid.z += 0.5;
    mid.y -= 0.15;
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(70));
    world.add(new THREE.Line(geometry, lineMaterial(colors[from], 0.3)));
    const particles = [];
    for (let i = 0; i < 3; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(i === 0 ? 0.035 : 0.018, 8, 8),
        new THREE.MeshBasicMaterial({
          color: colors[from],
          transparent: true,
          opacity: 1 - i * 0.25,
        }),
      );
      world.add(particle);
      particles.push(particle);
    }
    links.push({ from, to, curve, particles });
  }
  const floor = new THREE.Group();
  floor.position.y = -2.1;
  for (let i = 0; i < 3; i++) {
    const circle = ring(2.7 + i * 0.4, 0x516f7b, 0.003);
    circle.rotation.x = Math.PI / 2;
    circle.material.opacity = 0.18;
    floor.add(circle);
  }
  for (let i = 0; i < 60; i++) {
    const angle = (i / 60) * Math.PI * 2;
    const pointA = new THREE.Vector3(Math.cos(angle) * 3.3, 0, Math.sin(angle) * 3.3);
    const pointB = pointA.clone().multiplyScalar(i % 5 === 0 ? 1.04 : 1.015);
    floor.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([pointA, pointB]),
        lineMaterial(0x7897a7, 0.35),
      ),
    );
  }
  world.add(floor);
  // Deterministic dust positions keep the composition stable on repeat visits.
  const dust = [];
  for (let i = 0; i < 140; i++) {
    dust.push(Math.sin(i * 12.989) * 4, Math.cos(i * 7.73) * 3, Math.sin(i * 2.37) * 3 - 2);
  }
  world.add(
    new THREE.Points(
      new THREE.BufferGeometry().setAttribute(
        'position',
        new THREE.Float32BufferAttribute(dust, 3),
      ),
      new THREE.PointsMaterial({ color: 0x7294a2, size: 0.012, transparent: true, opacity: 0.3 }),
    ),
  );
  let paused = options.paused ?? false,
    visible = true,
    lost = false,
    frame = 0,
    last = 0,
    time = 0,
    selected = 'reasoner';
  const pointer = new THREE.Vector2();
  const currentPointer = new THREE.Vector2();
  function draw(now = 0) {
    frame = 0;
    if (lost || document.hidden || !visible) return;
    const delta = last ? Math.min((now - last) / 1000, 0.06) : 0;
    last = now;
    if (!paused) time += delta;
    currentPointer.lerp(paused ? new THREE.Vector2() : pointer, 0.055);
    world.rotation.y = currentPointer.x * 0.18;
    world.rotation.x = currentPointer.y * 0.06;
    for (const [role, core] of Object.entries(cores)) {
      core.inner.rotation.y =
        time * (role === 'tool_caller' ? 0.25 : 0.12) + (role === 'executor' ? 0.35 : 0);
      core.inner.rotation.z =
        role === 'reasoner' ? time * 0.045 : role === 'tool_caller' ? time * 0.09 : 0;
      core.group.position.y =
        positions[role].y +
        (paused ? 0 : Math.sin(time * 0.7 + Object.keys(cores).indexOf(role) * 2) * 0.06);
      core.glow.material.opacity = role === selected ? 0.8 : 0.4;
      core.light.intensity = role === selected ? 9 : 5;
    }
    for (const link of links)
      link.particles.forEach((particle, i) => {
        particle.position.copy(link.curve.getPoint((time * 0.16 - i * 0.015 + 1) % 1));
      });
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(draw);
  }
  function requestDraw() {
    if (!frame && !lost && !document.hidden && visible) {
      last = 0;
      frame = requestAnimationFrame(draw);
    }
  }
  function resize() {
    const w = container.clientWidth,
      h = container.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    requestDraw();
  }
  new ResizeObserver(resize).observe(container);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else requestDraw();
    },
    { rootMargin: '80px' },
  ).observe(container);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestDraw();
  });
  container.parentElement.addEventListener('pointermove', (event) => {
    const rect = container.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      ((event.clientY - rect.top) / rect.height) * 2 - 1,
    );
  });
  container.parentElement.addEventListener('pointerleave', () => pointer.set(0, 0));
  window.addEventListener('mrx:motion', (event) => {
    paused = event.detail.paused;
    cancelAnimationFrame(frame);
    frame = 0;
    requestDraw();
  });
  for (const event of ['mrx:role', 'mrx:step'])
    window.addEventListener(event, (e) => {
      selected = e.detail.role in cores ? e.detail.role : 'reasoner';
      requestDraw();
    });
  window.addEventListener('mrx:mode', (event) => {
    selected = event.detail.mode === 'manual' ? 'tool_caller' : 'reasoner';
    requestDraw();
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    container.classList.remove('ready');
    document.querySelector('#scene-status').textContent = 'STATIC VIEW / WEBGL INTERRUPTED';
  });
  renderer.domElement.addEventListener('webglcontextrestored', () => {
    lost = false;
    container.classList.add('ready');
    document.querySelector('#scene-status').textContent = 'THREE ROLES. ONE SESSION.';
    requestDraw();
  });
  resize();
  container.classList.add('ready');
}
