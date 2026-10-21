/*
 * Language picker Webview frontend.
 *
 * Boots with `acquireVsCodeApi()`, requests the initial state, renders
 * groups into the tree, and posts toggle / mode / reset messages back to the
 * extension on user interaction.
 *
 * Vanilla JS, no framework: the UI is a single list of rows and the state
 * is small enough that a framework's diffing would be pure overhead.
 */
// @ts-check

const vscode = /** @type {{ postMessage: (message: unknown) => void }} */ (
  /** @type {any} */ (globalThis).acquireVsCodeApi()
);

const state = {
  /** @type {Array<{main: any, children: any[]}>} */
  groups: [],
  search: '',
  /** @type {'main' | 'detailed'} */
  mode: 'detailed',
  /** @type {string} */
  iconBaseUrl: '',
  /** @type {boolean} */
  allowAll: true,
};

const treeEl = document.getElementById('tree');
const searchEl = /** @type {HTMLInputElement | null} */ (document.getElementById('search'));
const statusEl = document.getElementById('status');
const resetEl = document.getElementById('reset');

window.addEventListener('message', (event) => {
  const message = event.data;
  if (!message || typeof message !== 'object') {
    return;
  }
  if (message.type === 'init') {
    state.groups = Array.isArray(message.groups) ? message.groups : [];
    state.mode = message.mode === 'main' ? 'main' : 'detailed';
    state.allowAll = Boolean(message.allowAll);
    state.iconBaseUrl =
      typeof message.iconBaseUrl === 'string' ? message.iconBaseUrl : '';
    applyModeToRadios();
    render();
    updateStatus();
  } else if (message.type === 'saved') {
    state.allowAll = Boolean(message.allowAll);
    updateStatus(typeof message.enabledCount === 'number' ? message.enabledCount : undefined);
  }
});

if (searchEl) {
  searchEl.addEventListener('input', () => {
    state.search = searchEl.value.trim().toLowerCase();
    applySearchFilter();
  });
}

Array.from(document.querySelectorAll('input[name="mode"]')).forEach((radio) => {
  radio.addEventListener('change', (event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    if (!target.checked) {
      return;
    }
    state.mode = target.value === 'main' ? 'main' : 'detailed';
    vscode.postMessage({ type: 'setMode', mode: state.mode });
  });
});

if (resetEl) {
  resetEl.addEventListener('click', () => {
    // An empty enabled list means "show every language", so this also picks up
    // languages added by future releases.
    vscode.postMessage({ type: 'save', enabled: [] });
  });
}

function render() {
  if (!treeEl) {
    return;
  }
  treeEl.textContent = '';
  const fragment = document.createDocumentFragment();

  for (const group of state.groups) {
    const groupEl = document.createElement('div');
    groupEl.className = 'group';
    groupEl.setAttribute('role', 'group');

    groupEl.appendChild(renderRow(group.main, true));
    for (const child of group.children) {
      groupEl.appendChild(renderRow(child, false));
    }

    fragment.appendChild(groupEl);
  }

  treeEl.appendChild(fragment);
  applySearchFilter();
}

/**
 * @param {{icon: string, label: string, isMain: boolean, enabled: boolean}} row
 * @param {boolean} isMain
 */
function renderRow(row, isMain) {
  const wrapper = document.createElement('div');
  wrapper.className = isMain ? 'row main' : 'row child';
  wrapper.dataset.icon = row.icon;
  wrapper.dataset.label = row.label || '';
  wrapper.setAttribute('role', 'treeitem');

  const label = document.createElement('label');

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = Boolean(row.enabled);
  checkbox.addEventListener('change', () => {
    vscode.postMessage({ type: 'toggle', icon: row.icon, enabled: checkbox.checked });
  });

  const img = document.createElement('img');
  img.alt = '';
  img.loading = 'lazy';
  img.onerror = () => {
    img.style.visibility = 'hidden';
  };
  const url = iconUrl(row.icon);
  if (url) {
    img.src = url;
  } else {
    img.style.visibility = 'hidden';
  }

  const text = document.createElement('span');
  text.textContent = row.label || row.icon;

  label.appendChild(checkbox);
  label.appendChild(img);
  label.appendChild(text);
  wrapper.appendChild(label);

  return wrapper;
}

/**
 * @param {string} icon
 * @returns {string}
 */
function iconUrl(icon) {
  if (!state.iconBaseUrl) {
    return '';
  }
  return `${state.iconBaseUrl.replace(/\/+$/, '')}/languages/${icon}.png`;
}

function applyModeToRadios() {
  Array.from(document.querySelectorAll('input[name="mode"]')).forEach((radio) => {
    const input = /** @type {HTMLInputElement} */ (radio);
    input.checked = input.value === state.mode;
  });
}

function applySearchFilter() {
  if (!treeEl) {
    return;
  }
  const query = state.search;
  for (const groupEl of Array.from(treeEl.querySelectorAll('.group'))) {
    let anyVisible = false;
    const rows = /** @type {HTMLElement[]} */ (Array.from(groupEl.querySelectorAll('.row')));
    for (const rowEl of rows) {
      const haystack = `${rowEl.dataset.icon || ''} ${rowEl.dataset.label || ''}`.toLowerCase();
      const visible = query === '' || haystack.includes(query);
      rowEl.classList.toggle('hidden', !visible);
      if (visible) {
        anyVisible = true;
      }
    }
    groupEl.classList.toggle('hidden', !anyVisible);
  }
}

/**
 * @param {number} [explicitCount]
 */
function updateStatus(explicitCount) {
  if (!statusEl) {
    return;
  }
  if (typeof explicitCount === 'number') {
    statusEl.textContent =
      explicitCount === 0 ? 'No languages shown' : `${explicitCount} shown`;
    return;
  }

  let count = 0;
  let total = 0;
  for (const group of state.groups) {
    total++;
    if (group.main.enabled) {
      count++;
    }
    for (const child of group.children) {
      total++;
      if (child.enabled) {
        count++;
      }
    }
  }
  statusEl.textContent = state.allowAll ? 'All languages shown' : `${count} of ${total} shown`;
}

vscode.postMessage({ type: 'ready' });
