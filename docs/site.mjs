const $ = (selector) => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
const motionButton = $('#motion-toggle');
function setMotion(value) {
  paused = value;
  document.body.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Resume motion ▷' : 'Pause motion Ⅱ';
  window.dispatchEvent(new CustomEvent('mrx:motion', { detail: { paused } }));
}
motionButton.addEventListener('click', () => setMotion(!paused));
reduced.addEventListener('change', () => setMotion(reduced.matches));
setMotion(paused);
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
for (const card of document.querySelectorAll('[data-role], [data-core-role]'))
  card.addEventListener('click', () => {
    const selectedRole = card.dataset.role || card.dataset.coreRole;
    for (const label of document.querySelectorAll('[data-core-role]'))
      label.setAttribute('aria-pressed', String(label.dataset.coreRole === selectedRole));
    $('#scene-status').textContent = selectedRole.replace('_', ' ').toUpperCase() + ' / SELECTED';
    for (const button of document.querySelectorAll('[data-role]')) {
      const selected = button.dataset.role === selectedRole;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    }
    const [title, description] = descriptions[selectedRole];
    $('#role-description').replaceChildren(
      Object.assign(document.createElement('strong'), { textContent: title }),
      ' ' + description,
    );
    window.dispatchEvent(new CustomEvent('mrx:role', { detail: { role: selectedRole } }));
  });
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
  for (const tab of document.querySelectorAll('[data-mode]')) {
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
  window.dispatchEvent(new CustomEvent('mrx:mode', { detail: { mode } }));
}
const tabs = [...document.querySelectorAll('[data-mode]')];
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
    for (const node of document.querySelectorAll('[data-flow-role]'))
      node.classList.toggle('active', node.dataset.flowRole === role);
    $('#demo-progress').textContent = `STEP ${i + 1} / ${steps.length}`;
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
let toastTimer;
for (const button of document.querySelectorAll('[data-copy]'))
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
      for (const label of document.querySelectorAll('.copy-label')) label.textContent = 'COPY ⧉';
    }, 2500);
  });
if ('IntersectionObserver' in window && !reduced.matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
    },
    { threshold: 0.08 },
  );
  for (const element of document.querySelectorAll(
    '.section-heading, .role-grid, .provider-grid, .configure-copy, .install-grid',
  )) {
    element.classList.add('reveal-ready');
    observer.observe(element);
  }
}
selectMode(mode);
import('./scene.mjs')
  .then(({ initScene }) => initScene($('#scene'), { paused }))
  .catch(() => {
    $('#scene-status').textContent = 'STATIC VIEW / 3D UNAVAILABLE';
  });
