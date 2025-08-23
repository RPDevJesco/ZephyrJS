# ZephyrJS

> **Mission Statement**  
> ZephyrJS exists to prove that the **web platform is enough** for 99% of web apps and sites.  
> By treating the DOM as the single source of truth, ZephyrJS demonstrates that modern UIs can be **fast, accessible, and simple** without reconciliation engines, template compilers, or heavyweight frameworks.

---

## What It Is
ZephyrJS is a **tiny, DOM-first UI framework** built on native Web Components.  
It embraces **attributes as state** and **events as API**, so the browser’s DOM is not something to fight — it *is* the framework.

- ✅ No virtual DOM  
- ✅ No template compiler  
- ✅ No framework lock-in  
- ✅ Bare ES modules, works anywhere  

---

## What It Does
ZephyrJS provides a **blueprint** for building interactive apps that are:

- ⚡ **Fast** – O(1) updates via direct DOM references.  
- ♿ **Accessible** – built from native semantics & Form-Associated Custom Elements.  
- 🔌 **Interop-friendly** – drop into React, Vue, Svelte, or vanilla projects.  
- 🪶 **Lightweight** – no reconciliation, no hydration diff, no build chain required.  

---

## Problems ZephyrJS Solves
1. **Over-engineering for simple apps**  
   Most frameworks force reconciliation engines, global stores, and template DSLs even for trivial UIs.  
   → ZephyrJS skips all that.  

2. **Accessibility as an afterthought**  
   Many libraries require ARIA patches or wrappers.  
   → ZephyrJS starts from native HTML semantics and enhances them.  

3. **Framework churn & rewrites**  
   Switching React ↔ Vue ↔ Svelte often means rebuilding everything.  
   → ZephyrJS components interop anywhere because they’re just custom elements.  

4. **Slow hydration in SSR apps**  
   Hydration wastes time diffing DOM.  
   → ZephyrJS resumes instantly: server writes attributes, client reads them.  

---

## How It Solves Them
- **Attributes are state**: components render directly from their attributes.  
- **Events are the API**: no hidden globals, no magic stores.  
- **Direct DOM mutations**: no reconciliation diff, no virtual DOM overhead.  
- **Resource budgets**: optional caps on nodes & listeners to keep apps lean.  
- **CSS-first styling**: no Shadow DOM by default; use `::part` and variables when needed.  

---

## Quickstart
```bash
git clone https://github.com/your-org/zephyrjs
cd zephyrjs
npm i
npm run dev
# open http://localhost:5173/public/
```

Uses bare ES modules — no bundler required.  

---

## Examples

### Counter (DOM = state)
```html
<div id="counter-root" count="0" class="row">
  <span id="count">0</span>
  <x-button id="inc" label="+" aria-label="Increment"></x-button>
  <x-button id="dec" label="-" aria-label="Decrement"></x-button>
</div>
```

```js
import Counter from '/src/examples/Counter.js';
new Counter(document.getElementById('counter-root'));
```

---

### Virtual List (10,000 rows at 60fps)
```html
<x-virtual-list id="vlist" item-count="10000" item-height="28"
  style="height: 300px; border:1px solid #e5e7eb; border-radius: 10px;">
</x-virtual-list>
```

```js
const vlist = document.getElementById('vlist');
vlist.renderer = (el, i) => {
  el.textContent = `Row ${i}`;
  el.style.padding = '0 8px';
  el.style.background = i % 2 ? '#fafafa' : 'white';
};
```

---

## Authoring Rules
1. **Attributes are state.** Always render from attributes.  
2. **Events form the API.** Components talk through events only.  
3. **No required Shadow DOM.** Use only when encapsulation is essential.  
4. **Resource budgets.** Enforce node/listener caps for large trees.  

---

## Roadmap
- Form-associated custom elements: `<x-input>`, `<x-select>`.  
- CI budget checks for nodes/listeners.  
- SSR resume: attributes = initial state, no hydration diff.  
- Optional TypeScript typings & linter for attribute schemas.  

---

## Why ZephyrJS Matters
Even if ZephyrJS never “catches on,” it proves an important point:  
**The web platform already has the primitives needed for nearly every project.**  

By showing that **99% of web apps can be built with just DOM + attributes + events**, ZephyrJS is a reminder that simplicity scales further than most developers expect.  

---
