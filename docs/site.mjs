const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const fine = matchMedia('(hover: hover) and (pointer: fine)');
const root = document.documentElement;
let paused = reduced.matches;
let scene = null;
const sceneQueue = [];
const withScene = (fn) => (scene ? fn(scene) : sceneQueue.push(fn));

/* ───────────── motion ───────────── */
const motionButton = $('#motion-toggle');
function setMotion(value) {
  paused = value;
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
  withScene((s) => s.setPaused(paused));
  window.dispatchEvent(new CustomEvent('mrx:motion', { detail: { paused } }));
}
motionButton.addEventListener('click', () => setMotion(!paused));
reduced.addEventListener('change', () => setMotion(reduced.matches));
setMotion(paused);

/* ───────────── roles ───────────── */
const descriptions = {
  reasoner: [
    'Reasoner selected.',
    'In think_then_answer, the executor receives the reasoner’s conclusion as context. In planner_executor, it receives a numbered plan.',
  ],
  executor: [
    'Executor selected.',
    'Writes the final response, or executes planned steps in dependency-based waves and synthesizes their results. Tools are available to the executor in planner_executor.',
  ],
  tool_caller: [
    'Tool caller selected.',
    'Manual routing with @tool_caller selects this model (or the executor fallback). Currently, manual mode selects a model but does not dispatch tools; tool execution is wired to planner_executor.',
  ],
};
const roleColor = { reasoner: '--cyan', executor: '--green', tool_caller: '--amber' };
function selectRole(selectedRole) {
  for (const label of $$('[data-core-role]'))
    label.setAttribute('aria-pressed', String(label.dataset.coreRole === selectedRole));
  $('#scene-status').textContent = selectedRole.replace('_', ' ').toUpperCase() + ' / SELECTED';
  for (const button of $$('[data-role]')) {
    const selected = button.dataset.role === selectedRole;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  const [title, description] = descriptions[selectedRole];
  $('#role-description').replaceChildren(
    Object.assign(document.createElement('strong'), { textContent: title }),
    ' ' + description,
  );
  $('.detail-marker').style.cssText =
    `background: var(${roleColor[selectedRole]}); box-shadow: 0 0 12px var(${roleColor[selectedRole]})`;
  withScene((s) => s.setRole(selectedRole));
  window.dispatchEvent(new CustomEvent('mrx:role', { detail: { role: selectedRole } }));
}
let manualPick = -1e9;
for (const card of $$('[data-role], [data-core-role]'))
  card.addEventListener('click', () => {
    manualPick = performance.now();
    selectRole(card.dataset.role || card.dataset.coreRole);
  });

/* ───────────── playground ───────────── */
const modes = {
  think_then_answer: {
    title: ['Think deeply.', 'Answer clearly.'],
    description:
      'The reasoner works through the question. Its conclusion becomes context for the executor’s response.',
    command: 'mrx ask "design a REST API for a todo app"',
    flow: [
      ['user', 'PROMPT', ''],
      ['reasoner', 'REASONER', 'conclusion'],
      ['executor', 'EXECUTOR', 'final answer'],
    ],
    steps: [
      [
        'reasoner',
        'REASONER / CONCLUSION',
        'Use a todo resource with CRUD routes, consistent status codes, and input validation.',
        'Only the conclusion is handed to the executor.',
      ],
      [
        'executor',
        'EXECUTOR / RESPONSE',
        'GET /todos       → list todos\nPOST /todos      → create a todo\nGET /todos/:id   → fetch one\nPATCH /todos/:id → update one\nDELETE /todos/:id → remove one',
        'An illustrative answer produced from the handoff.',
      ],
    ],
  },
  planner_executor: {
    title: ['Break it down.', 'Bring it together.'],
    description:
      'The reasoner creates a numbered plan. The executor runs steps in dependency-based waves, then synthesizes the results. Independent steps can run together.',
    command: 'mrx ask "design a todo API" --mode planner_executor',
    flow: [
      ['user', 'PROMPT', ''],
      ['reasoner', 'REASONER', 'numbered plan'],
      ['executor', 'EXECUTOR', 'waves → synthesis'],
    ],
    steps: [
      [
        'reasoner',
        'REASONER / PLAN',
        '1. Define the todo resource.\n2. Define input validation.\n3. Build routes using step 1 and step 2.',
        'Steps 1 and 2 are independent. Step 3 references both.',
      ],
      [
        'executor',
        'EXECUTOR / WAVE 1',
        'Step 1 → Todo { id, title, completed }\nStep 2 → Require a non-empty title; validate completed as boolean.',
        'Independent steps share this execution wave.',
      ],
      [
        'executor',
        'EXECUTOR / WAVE 2',
        'Step 3 → Combine the resource and validation into CRUD route handlers.',
        'Prior completed results become context.',
      ],
      [
        'executor',
        'EXECUTOR / SYNTHESIS',
        'A todo API with CRUD routes, validation, and consistent responses.',
        'The executor combines step results into the final answer.',
      ],
    ],
  },
  manual: {
    title: ['Your session.', 'Your next move.'],
    description:
      'Prefix a message to choose its model. No prefix routes to the executor. Select a role below to see an example. Manual mode does not currently dispatch tools.',
    command: 'mrx chat --mode manual',
    flow: [
      ['reasoner', '@reasoner', 'select'],
      ['executor', '@executor', 'select'],
      ['tool_caller', '@tool_caller', 'select'],
    ],
  },
};
let mode = 'think_then_answer';
let manualRole = 'reasoner';
let timer;
let runId = 0;
const runButton = $('#run-demo');
const log = $('#demo-log');
function cancelRun() {
  runId += 1;
  clearTimeout(timer);
  runButton.disabled = false;
}
function renderFlow() {
  const flow = $('#flow');
  flow.replaceChildren();
  modes[mode].flow.forEach(([role, title, sub], i) => {
    if (i && mode !== 'manual')
      flow.append(Object.assign(document.createElement('i'), { textContent: '↓' }));
    const node = document.createElement(mode === 'manual' ? 'button' : 'span');
    node.className = 'flow-node ' + role;
    node.dataset.flowRole = role;
    node.textContent = title;
    node.append(Object.assign(document.createElement('small'), { textContent: sub }));
    if (mode === 'manual') {
      node.type = 'button';
      node.setAttribute('aria-pressed', String(role === manualRole));
      node.classList.toggle('active', role === manualRole);
      node.addEventListener('click', () => {
        manualRole = role;
        selectMode('manual');
      });
    }
    flow.append(node);
  });
}
function selectMode(next) {
  cancelRun();
  mode = next;
  for (const tab of $$('[data-mode]')) {
    const selected = tab.dataset.mode === mode;
    tab.setAttribute('aria-selected', String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected) $('#mode-panel').setAttribute('aria-labelledby', tab.id);
  }
  $('#mode-code').textContent = mode;
  const title = $('#mode-title');
  title.replaceChildren(modes[mode].title[0], document.createElement('br'), modes[mode].title[1]);
  $('#mode-description').textContent = modes[mode].description;
  $('#demo-command').textContent = modes[mode].command;
  log.replaceChildren();
  const placeholder = document.createElement('p');
  placeholder.className = 'terminal-placeholder';
  placeholder.textContent =
    mode === 'manual'
      ? `Next message routes to @${manualRole}. Run the simulation to trace this turn.`
      : 'Your prompt is the starting point. Run the simulation to trace a turn.';
  log.append(placeholder);
  runButton.textContent = 'Run simulation ▷';
  $('#demo-state').textContent = 'READY';
  $('#demo-progress').textContent = 'WAITING FOR INPUT';
  renderFlow();
  withScene((s) => s.setMode(mode, manualRole));
  window.dispatchEvent(new CustomEvent('mrx:mode', { detail: { mode } }));
}
const tabs = $$('[data-mode]');
for (const [index, tab] of tabs.entries()) {
  tab.addEventListener('click', () => selectMode(tab.dataset.mode));
  tab.addEventListener('keydown', (event) => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) {
      event.preventDefault();
      tabs[next].focus();
      selectMode(tabs[next].dataset.mode);
    }
  });
}
runButton.addEventListener('click', () => {
  cancelRun();
  const current = runId;
  const steps =
    mode === 'manual'
      ? [
          [
            'user',
            'USER / EXPLICIT ROUTING',
            `@${manualRole} summarize the benefits of role separation`,
            'The prefix determines which configured model gets this message.',
          ],
          [
            manualRole,
            `${manualRole.toUpperCase()} / RESPONSE`,
            'Assigning distinct roles lets you choose a model’s strengths for the job at hand.',
            manualRole === 'tool_caller'
              ? 'This selects the tool-caller model. No tools are executed in manual mode.'
              : 'No automatic handoff to a second model in manual mode.',
          ],
        ]
      : modes[mode].steps;
  log.replaceChildren();
  runButton.disabled = true;
  $('#demo-state').textContent = 'RUNNING';
  withScene((s) => s.step('user'));
  function advance(i) {
    if (current !== runId) return;
    const [role, label, content, note] = steps[i];
    const entry = document.createElement('div');
    entry.className = 'log-entry ' + role;
    entry.append(
      Object.assign(document.createElement('span'), { className: 'log-label', textContent: label }),
      Object.assign(document.createElement('p'), { textContent: content }),
      Object.assign(document.createElement('small'), { textContent: note }),
    );
    log.append(entry);
    for (const node of $$('[data-flow-role]'))
      node.classList.toggle('active', node.dataset.flowRole === role);
    $('#demo-progress').textContent = `STEP ${i + 1} / ${steps.length}`;
    withScene((s) => s.step(role));
    window.dispatchEvent(new CustomEvent('mrx:step', { detail: { role, step: i } }));
    if (i + 1 < steps.length) {
      if (reduced.matches || paused) advance(i + 1);
      else timer = setTimeout(() => advance(i + 1), 950);
    } else {
      runButton.disabled = false;
      runButton.textContent = 'Replay simulation ↻';
      $('#demo-state').textContent = 'COMPLETE';
      $('#demo-progress').textContent = 'TURN COMPLETE';
    }
  }
  advance(0);
});

/* ───────────── copy ───────────── */
let toastTimer;
for (const button of $$('[data-copy]'))
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.querySelector('.copy-label').textContent = 'COPIED ✓';
      $('#toast').textContent = 'Install command copied.';
    } catch {
      // Clipboard may be blocked by browser permissions or a non-secure preview.
      const range = document.createRange();
      range.selectNodeContents(button.firstElementChild);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      $('#toast').textContent = 'Select and copy: npm install -g mrx-ai';
    }
    clearTimeout(toastTimer);
    $('#toast').classList.add('visible');
    toastTimer = setTimeout(() => {
      $('#toast').classList.remove('visible');
      for (const label of $$('.copy-label')) label.textContent = 'COPY ⧉';
    }, 2500);
  });

/* ───────────── text effects ───────────── */
const GLYPHS = '▓▒░<>/\\_-=+*#01{}[]';
function decode(el, duration = 900) {
  if (reduced.matches || el.dataset.decoded) return;
  el.dataset.decoded = '1';
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) if (walker.currentNode.nodeValue.trim()) nodes.push(walker.currentNode);
  const finals = nodes.map((n) => n.nodeValue);
  const total = finals.reduce((a, s) => a + s.length, 0);
  const start = performance.now();
  el.classList.add('decoding');
  function tick(now) {
    const p = Math.min(1, (now - start) / duration);
    let offset = 0;
    nodes.forEach((n, k) => {
      const f = finals[k];
      let out = '';
      for (let i = 0; i < f.length; i++) {
        const g = (offset + i) / total;
        out +=
          f[i] === ' ' || g < p * 1.25 - 0.25
            ? f[i]
            : g < p * 1.25
              ? GLYPHS[(Math.random() * GLYPHS.length) | 0]
              : f[i] === f[i].toUpperCase()
                ? '·'
                : ' ';
      }
      n.nodeValue = out;
      offset += f.length;
    });
    if (p < 1) requestAnimationFrame(tick);
    else {
      nodes.forEach((n, k) => (n.nodeValue = finals[k]));
      el.classList.remove('decoding');
    }
  }
  requestAnimationFrame(tick);
}
function split(el) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  let i = 0;
  for (const n of nodes) {
    const frag = document.createDocumentFragment();
    n.nodeValue.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(part);
      const w = document.createElement('span');
      w.className = 'w';
      const inner = document.createElement('span');
      inner.textContent = part;
      inner.style.setProperty('--i', i++);
      w.append(inner);
      frag.append(w);
    });
    n.replaceWith(frag);
  }
  el.classList.add('split-ready');
}
$$('[data-split]').forEach(split);
let stagger = 0;
const io =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            const el = e.target;
            if (el.matches('[data-reveal]')) {
              el.style.setProperty('--d', (stagger++ % 4) * 0.08 + 's');
              setTimeout(() => (stagger = 0), 120);
            }
            el.classList.add('in');
            if (el.matches('[data-decode]')) decode(el);
            io.unobserve(el);
          }
        },
        { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
      )
    : null;
const heroDecode = $$('.hero [data-decode]');
for (const el of $$('[data-reveal], [data-split], [data-decode]')) {
  if (heroDecode.includes(el)) continue;
  if (io && !reduced.matches) io.observe(el);
  else el.classList.add('in');
}

/* magnetic buttons */
if (fine.matches && !reduced.matches)
  for (const el of $$('[data-magnetic]')) {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2),
        dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * 0.18}px, ${dy * 0.3}px)`;
    });
    el.addEventListener('pointerleave', () => (el.style.transform = ''));
  }

/* ───────────── chapters: scroll → scene ───────────── */
const NAMES = ['THE SPLIT', 'THE CAST', 'THE RELAY', 'PROVIDERS', 'CONFIG', 'INSTALL', 'MRX'];
const sections = $$('.ch');
const rails = $$('[data-rail]');
const nav = $('.nav');
const rolesSection = $('#roles');
const rolesOrder = ['reasoner', 'executor', 'tool_caller'];
let tops = [];
let vh = innerHeight;
let lastY = scrollY,
  lastT = performance.now(),
  chapter = -1,
  scrollRole = null;
function measure() {
  vh = innerHeight;
  tops = sections.map((s) => s.getBoundingClientRect().top + scrollY);
  // centre each sculpture over its card while the roles story is pinned
  const stage = $('#roles-stage'),
    pin = rolesSection.querySelector('.pin');
  const pr = pin.getBoundingClientRect(),
    sr = stage.getBoundingClientRect();
  const pinned = getComputedStyle(pin).position === 'sticky';
  const y = sr.top - pr.top + sr.height * 0.5;
  withScene((s) =>
    s.setRoleAnchors(
      pinned && sr.height > 120
        ? $$('.role-card').map((c) => {
            const r = c.getBoundingClientRect();
            return { x: r.left + r.width / 2, y, h: sr.height };
          })
        : null,
    ),
  );
}
function onScroll() {
  const y = scrollY,
    now = performance.now();
  const vel = ((y - lastY) / Math.max(1, now - lastT)) * 1000;
  lastY = y;
  lastT = now;
  const anchor = y + vh * 0.5;
  let k = 0;
  for (let i = 0; i < tops.length; i++) if (tops[i] <= anchor) k = i;
  let s = k;
  if (k + 1 < tops.length) {
    const w = vh * 0.45;
    s = k + Math.min(1, Math.max(0, (anchor - (tops[k + 1] - w)) / w));
  }
  withScene((sc) => {
    sc.setTarget(s);
    sc.setVelocity(vel);
  });
  const near = Math.round(s);
  if (near !== chapter) {
    chapter = near;
    $('#hud-ch').textContent = `0${near} / 06`;
    $('#hud-name').textContent = NAMES[near];
    rails.forEach((r, i) => r.classList.toggle('on', i === near));
  }
  nav.classList.toggle('solid', y > 40);
  const max = document.documentElement.scrollHeight - vh;
  nav.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  // pinned roles story: scrolling hands the spotlight from role to role
  const pin = rolesSection.querySelector('.pin');
  if (getComputedStyle(pin).position === 'sticky') {
    const p = (y - tops[1]) / (rolesSection.offsetHeight - vh);
    if (p > 0 && p < 1) {
      const idx = Math.min(2, Math.floor(p * 3));
      const role = rolesOrder[idx];
      // a click wins over the scroll story for a moment
      if (role !== scrollRole && now - manualPick > 1500) {
        scrollRole = role;
        selectRole(role);
      }
      $$('.role-card').forEach((c, i) =>
        c
          .querySelector('.card-bar i')
          .style.setProperty('--fill', i < idx ? 1 : i === idx ? ((p * 3) % 1).toFixed(3) : 0),
      );
    } else scrollRole = null;
  }
}
addEventListener('scroll', onScroll, { passive: true });
addEventListener('resize', () => {
  measure();
  onScroll();
});
addEventListener('load', () => {
  measure();
  onScroll();
});
measure();
onScroll();

/* click / tap anywhere on the stage sends a prompt through the scene */
document.addEventListener('pointerdown', (e) => {
  if (
    e.button !== 0 ||
    e.target.closest('a, button, input, pre, code, .terminal, .playground, [role=tab]')
  )
    return;
  withScene((s) => {
    s.wave(e.clientX, e.clientY);
    if (chapter === 0) s.pulse();
  });
});

/* ───────────── boot sequence ───────────── */
const boot = $('#boot');
const bootLines = [
  '<span class=d>mrx · multi-role model orchestration</span>',
  '<span class=p>$</span> mrx chat --mode think_then_answer',
  '<span class=r>▸ reasoner   </span> ollama/qwen3:14b          <span class=ok>ready</span>',
  '<span class=e>▸ executor   </span> openai/gpt-4o-mini        <span class=ok>ready</span>',
  '<span class=t>▸ tool_caller</span> openrouter/gemini-flash   <span class=ok>ready</span>',
  '<span class=d>session open · 3 roles · 1 prompt</span> <span class=cur>&nbsp;</span>',
];
let booted = false;
function finishBoot(skip) {
  if (booted) return;
  booted = true;
  boot.classList.add('out');
  setTimeout(() => boot.classList.remove('on'), 800);
  withScene((s) => {
    s.intro(skip);
    if (!skip) setTimeout(() => s.pulse(), 1900);
  });
  heroDecode.forEach((el, i) => setTimeout(() => decode(el, 1000), skip ? 0 : 160 + i * 120));
  $$('.hero [data-reveal]').forEach((el, i) => {
    el.style.setProperty('--d', 0.25 + i * 0.09 + 's');
    el.classList.add('in');
  });
}
if (reduced.matches || scrollY > 60 || location.hash) {
  finishBoot(true);
} else {
  boot.classList.add('on');
  const pre = $('#boot-log');
  let line = 0;
  const next = () => {
    if (booted) return;
    if (line >= bootLines.length) return setTimeout(() => finishBoot(false), 380);
    pre.insertAdjacentHTML('beforeend', (line ? '\n' : '') + bootLines[line++]);
    setTimeout(next, line === 2 ? 340 : 200);
  };
  setTimeout(next, 120);
  for (const ev of ['keydown', 'wheel', 'touchstart', 'pointerdown'])
    addEventListener(ev, () => finishBoot(false), { once: true, passive: true });
}

/* ───────────── periodic prompt in the hero ───────────── */
setInterval(() => {
  if (chapter === 0 && !paused && !document.hidden) withScene((s) => s.pulse());
}, 7000);

/* ───────────── scene ───────────── */
selectMode(mode);
selectRole('reasoner');
$('#scene-status').textContent = 'THREE ROLES. ONE SESSION.';
const lite = /[?&]fx=lite/.test(location.search);
import('./scene.mjs')
  .then(({ initScene }) => initScene({ canvas: $('#gl'), paused, lite }))
  .then((s) => {
    scene = s;
    window.__mrx = s; // exposed for the browser smoke test
    root.classList.add('gl-ready');
    $('#hud-pts').textContent = `PTS ${s.count.toLocaleString('en-US')}`;
    if (!booted) s.holdIntro();
    else if (!sceneQueue.length) s.intro(reduced.matches);
    sceneQueue.splice(0).forEach((fn) => fn(s));
    s.setMode(mode, manualRole);
    s.setPaused(paused);
    s.jump(chapterFloat());
    addEventListener('mrx:gl', (e) => {
      root.classList.toggle('no-gl', !e.detail.ok);
      $('#scene-status').textContent = e.detail.ok
        ? 'THREE ROLES. ONE SESSION.'
        : 'STATIC VIEW / WEBGL INTERRUPTED';
    });
    measure();
    onScroll();
  })
  .catch((error) => {
    root.classList.add('no-gl');
    $('#scene-status').textContent = 'STATIC VIEW / WEBGL UNAVAILABLE';
    $('#hud-pts').textContent = 'PTS 0';
    if (window.console) console.info('mrx: 3D scene unavailable,', error.message);
  });
function chapterFloat() {
  const anchor = scrollY + vh * 0.5;
  let k = 0;
  for (let i = 0; i < tops.length; i++) if (tops[i] <= anchor) k = i;
  return k;
}
