# Zephyr Blueprint Starter

A tiny, fast starter that treats the **DOM as the source of truth**. No JSX. No virtual DOM. No template compiler. You write plain HTML + CSS and wire behavior with **attributes and events**. Components are **autonomous custom elements** (cross-browser) with optional resource budgets.

---

## Repo Structure
```
zephyr-blueprint-starter/
├─ package.json
├─ README.md
├─ public/
│  └─ index.html
├─ src/
│  ├─ core/
│  │  ├─ XBase.js
│  │  └─ budgets.js
│  ├─ elements/
│  │  ├─ XButton.js
│  │  └─ XVirtualList.js
│  └─ examples/
│     ├─ counter.html
│     └─ Counter.js
└─ test/
   └─ perf-harness.html
```

---

## package.json
```json
{
  "name": "zephyr-blueprint-starter",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "npx serve -l 5173 .",
    "test:perf": "npx serve -l 5174 ."
  },
  "devDependencies": {
    "serve": "^14.0.1"
  }
}
```

> Uses bare ES modules. Run `npm run dev` and open http://localhost:5173/public/.

---

## public/index.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Zephyr Blueprint Starter</title>
  <link rel="stylesheet" href="/public/styles.css">
  <script type="module">
    import "/src/core/XBase.js";
    import "/src/core/budgets.js";
    import "/src/elements/XButton.js";
    import "/src/elements/XVirtualList.js";
    import "/src/examples/Counter.js";
    // Nothing else required: elements auto-define on import.
  </script>
  <style>
    :root {
      --x-accent: #4f46e5;
      --x-radius: 10px;
      --x-gap: 8px;
      --font: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji";
    }
    body { font-family: var(--font); margin: 24px; }
    .row { display:flex; gap: var(--x-gap); align-items: center; }
    x-button[variant="primary"] { --bg: var(--x-accent); --fg: white; }
  </style>
</head>
<body>
  <h1>Zephyr Blueprint Starter</h1>

  <section>
    <h2>Buttons (autonomous custom element)</h2>
    <div class="row">
      <x-button label="Click me"></x-button>
      <x-button label="Primary" variant="primary"></x-button>
      <x-button label="Disabled" disabled></x-button>
    </div>
  </section>

  <section>
    <h2>Counter (DOM = state)</h2>
    <div id="counter-root" count="0" class="row">
      <span id="count">0</span>
      <x-button id="inc" label="+" aria-label="Increment"></x-button>
      <x-button id="dec" label="-" aria-label="Decrement"></x-button>
    </div>
  </section>

  <section>
    <h2>Virtual List (10,000 rows)</h2>
    <x-virtual-list id="vlist" item-count="10000" item-height="28" style="height: 300px; border:1px solid #e5e7eb; border-radius: var(--x-radius);"></x-virtual-list>
  </section>

  <script type="module">
    // Wire demo events
    document.querySelectorAll('x-button').forEach(b => {
      b.addEventListener('button-click', () => console.log('click:', b.getAttribute('label')));
    });

    // Counter demo init
    import Counter from '/src/examples/Counter.js';
    new Counter(document.getElementById('counter-root'));

    // Virtual list demo
    const vlist = document.getElementById('vlist');
    vlist.renderer = (el, i) => {
      el.textContent = `Row ${i}`;
      el.style.padding = '0 8px';
      if (i % 2) el.style.background = '#fafafa'; else el.style.background = 'white';
    };
  </script>
</body>
</html>
```

---

## src/core/XBase.js
```js
// Base class for autonomous custom elements where attributes drive rendering.
export default class XBase extends HTMLElement {
  static observedAttributes = [];
  #abort = new AbortController();

  connectedCallback() {
    this.onConnect?.(this.#abort.signal);
    this.render?.(); // paint based on attributes
  }
  disconnectedCallback() { this.#abort.abort(); }
  attributeChangedCallback() { this.render?.(); }

  // Convenience setter that respects DOM-as-state
  setAttr(name, v) { v == null ? this.removeAttribute(name) : this.setAttribute(name, String(v)); }
}

// Make available globally for quick sandboxing (optional)
customElements.XBase = XBase;
```

---

## src/core/budgets.js
```js
// Lightweight resource budget enforcement & metrics for a subtree.
export function enforceBudget(root, { nodes, listeners } = {}) {
  if (!(root instanceof Element)) return;
  if (nodes) {
    const count = root.querySelectorAll('*').length + 1; // include root
    if (count > nodes) throw new Error(`[Budget] Node budget exceeded: ${count} > ${nodes}`);
  }
  if (listeners) {
    let count = 0;
    const add = EventTarget.prototype.addEventListener;
    const patched = function(type, listener, options) {
      if (root.contains(this)) {
        count++; if (count > listeners) throw new Error(`[Budget] Listener budget exceeded`);
      }
      return add.call(this, type, listener, options);
    };
    // Patch only once per root
    if (!root.__listenerPatched) {
      EventTarget.prototype.addEventListener = patched;
      root.__listenerPatched = true;
    }
  }
}

export function metrics(root) {
  return {
    nodes: root.querySelectorAll('*').length + 1,
    // Listener count is not observable cross-browser without instrumentation; expose hook instead.
  };
}
```

---

## src/elements/XButton.js
```js
import XBase from '../core/XBase.js';

// Autonomous custom element (<x-button>) for widest browser support.
export default class XButton extends XBase {
  static get observedAttributes() { return ['label','disabled','variant']; }

  onConnect(signal) {
    // Render internal button for native semantics & keyboard
    if (!this._btn) {
      const btn = this._btn = document.createElement('button');
      btn.part = 'button'; // allows ::part styling
      btn.addEventListener('click', (e) => {
        if (this.hasAttribute('disabled')) { e.preventDefault(); return; }
        this.dispatchEvent(new CustomEvent('button-click', { bubbles: true, composed: true }));
      }, { signal });
      this.appendChild(btn);
      this._applyA11y();
    }
  }

  _applyA11y() {
    this.setAttribute('role', 'button');
    this.tabIndex = 0;
    this.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._btn?.click(); }
    }, { signal: new AbortController().signal }); // ephemeral; not tracked
  }

  render() {
    const label = this.getAttribute('label');
    if (this._btn) this._btn.textContent = label ?? this.textContent ?? '';

    // disabled reflection
    const disabled = this.hasAttribute('disabled');
    if (this._btn) disabled ? this._btn.setAttribute('disabled','') : this._btn.removeAttribute('disabled');

    // variant hook via data-attribute for styling
    this.dataset.variant = this.getAttribute('variant') ?? 'default';

    // basic styling via CSS variables (author can override)
    this.style.display = 'inline-block';
    if (this._btn) {
      this._btn.style.padding = '6px 10px';
      this._btn.style.borderRadius = '8px';
      this._btn.style.border = '1px solid #e5e7eb';
      this._btn.style.background = this.dataset.variant === 'primary' ? 'var(--x-accent)' : 'white';
      this._btn.style.color = this.dataset.variant === 'primary' ? 'white' : 'black';
      this._btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
  }
}

customElements.define('x-button', XButton);
```

---

## src/elements/XVirtualList.js
```js
import XBase from '../core/XBase.js';

export default class XVirtualList extends XBase {
  static observedAttributes = ['item-count','item-height'];

  onConnect(signal) {
    this.style.overflow = 'auto';
    this.style.position = 'relative';
    this._container = this.firstElementChild ?? this.appendChild(document.createElement('div'));
    this._container.style.position = 'relative';
    this.addEventListener('scroll', () => this.render(), { signal });
  }

  set renderer(fn) { this._renderer = fn; this.render(); }

  render() {
    const N = Number(this.getAttribute('item-count') ?? 0);
    const H = Number(this.getAttribute('item-height') ?? 24);
    const vh = this.clientHeight || 300;
    const start = Math.max(0, Math.floor(this.scrollTop / H) - 3);
    const visible = Math.min(N - start, Math.ceil(vh / H) + 6);

    this._container.style.height = `${N * H}px`;

    // pool children to needed size
    while (this._container.children.length < visible) {
      const item = document.createElement('div');
      item.style.position = 'absolute';
      item.style.left = '0'; item.style.right = '0';
      this._container.appendChild(item);
    }
    while (this._container.children.length > visible) this._container.lastChild.remove();

    for (let i = 0; i < visible; i++) {
      const idx = start + i;
      const el = this._container.children[i];
      el.style.top = `${idx * H}px`;
      el.style.height = `${H}px`;
      this._renderer?.(el, idx);
    }
  }
}

customElements.define('x-virtual-list', XVirtualList);
```

---

## src/examples/Counter.js
```js
export default class Counter {
  constructor(root) {
    if (!(root instanceof HTMLElement)) throw new Error('Counter: root element not found');
    this.root = root;
    this.countEl = root.querySelector('#count');
    this.incBtn = root.querySelector('#inc');
    this.decBtn = root.querySelector('#dec');

    // Paint from DOM attribute (DOM = state)
    this.paint();

    // Events write to attribute only
    this.incBtn.addEventListener('button-click', () => this.setCount(this.getCount() + 1));
    this.decBtn.addEventListener('button-click', () => this.setCount(this.getCount() - 1));

    // React to external changes as well
    new MutationObserver(muts => {
      if (muts.some(m => m.attributeName === 'count')) this.paint();
    }).observe(this.root, { attributes: true });
  }

  getCount() { return Number(this.root.getAttribute('count') ?? 0); }
  setCount(v) { this.root.setAttribute('count', String(v)); }
  paint() { this.countEl.textContent = this.getCount(); }
}
```

---

## src/examples/counter.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Counter Example</title>
  <script type="module">
    import '/src/elements/XButton.js';
    import Counter from '/src/examples/Counter.js';
    window.addEventListener('DOMContentLoaded', () => {
      new Counter(document.getElementById('counter-root'));
    });
  </script>
</head>
<body>
  <h1>Counter (DOM is state)</h1>
  <div id="counter-root" count="0">
    <span id="count">0</span>
    <x-button id="inc" label="+" aria-label="Increment"></x-button>
    <x-button id="dec" label="-" aria-label="Decrement"></x-button>
  </div>
</body>
</html>
```

---

## test/perf-harness.html
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Perf Harness</title>
  <script type="module">
    import '/src/elements/XButton.js';
    import '/src/elements/XVirtualList.js';
  </script>
  <style>
    body { font-family: ui-sans-serif, system-ui; margin: 16px; }
    #stats { margin: 12px 0; }
  </style>
</head>
<body>
  <h1>Performance Harness</h1>
  <div id="stats"></div>
  <x-virtual-list id="v" item-count="30000" item-height="24" style="height: 400px; border:1px solid #ddd"></x-virtual-list>

  <script type="module">
    const R = document.getElementById('v');
    R.renderer = (el, i) => { el.textContent = `Row ${i}`; };

    // Simple FPS sampler
    let last = performance.now(), frames = 0, acc = 0;
    function tick(now){
      frames++; acc += now - last; last = now;
      if (acc >= 1000) {
        const fps = Math.round(frames * 1000 / acc);
        document.getElementById('stats').textContent = `~${fps} FPS while scrolling`;
        frames = 0; acc = 0;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  </script>
</body>
</html>
```

---

## README.md
```markdown
# Zephyr Blueprint Starter

**Principle:** *DOM is the source of truth.* You update **attributes**, listen to **events**, and let elements perform direct, targeted DOM mutations. No reconciliation, no template compiler.

## Why
- **Speed**: O(1) direct updates via precomputed references—no vDOM diff.
- **Clarity**: HTML & CSS remain primary. State lives in the DOM via attributes.
- **Interop**: Works in any app. React/Vue adapters are trivial (just set attributes).
- **A11y & Forms**: Prefer native semantics and Form-Associated Custom Elements.

## Quickstart
```bash
npm i
npm run dev
# open http://localhost:5173/public/
```

## Authoring Rules
1. **Attributes are state.** Elements must render from attributes.
2. **Events form the API.** No internal global stores.
3. **No required Shadow DOM.** Use only when encapsulation is essential.
4. **Resource budgets.** Enforce node/listener caps where needed.

## Files of interest
- `src/core/XBase.js` — base class: attribute-driven rendering.
- `src/elements/XButton.js` — autonomous `<x-button>` with native semantics.
- `src/elements/XVirtualList.js` — 10k+ rows with recycling.
- `src/examples/Counter.js` — DOM-as-state demonstration.
- `test/perf-harness.html` — basic FPS sampler.

## Styling
Use CSS variables and the `::part(button)` hook in `x-button` if desired. Or style children normally—no Shadow DOM by default.

## Roadmap
- Form-associated custom elements for `x-input`, `x-select`.
- Budget metrics panel and CI budget checks.
- SSR resume: server writes attributes; elements read on connect—no hydration diff.
- Optional TypeScript typings & minimal linter for attribute schemas.
```

