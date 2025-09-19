# ZephyrJS

> A back-to-basics web component library that rediscovers forgotten performance principles

ZephyrJS is a lightweight, modern web component library that strips away the complexity modern frameworks have accumulated over the years. By returning to fundamental web principles and using the DOM as the natural state container, ZephyrJS delivers the performance and simplicity that many developers have forgotten was possible.

## 🌟 Why ZephyrJS?

### **Back to Web Fundamentals**
While modern frameworks have added layers of abstraction, ZephyrJS returns to what the web platform already provides. By storing component state directly in DOM attributes—the way HTML was designed to work—this approach offers:

- **Rediscovered Simplicity** - No complex state management patterns or learning curves
- **Forgotten Performance** - Direct DOM manipulation without virtual DOM overhead
- **Web Platform Native** - Works with the browser, not against it
- **Zero Framework Lock-in** - Pure web standards that work anywhere

### **Performance Through Simplicity**
By embracing what browsers already do efficiently, ZephyrJS achieves performance characteristics that complex frameworks have lost sight of:
- **Minimal Bundle Size** - Core library is under 5KB gzipped
- **Direct DOM Updates** - No virtual DOM overhead or reconciliation
- **Efficient Rendering** - Only re-renders when attributes actually change
- **Memory Optimized** - Automatic cleanup with AbortController signals

### **Forgotten Developer Benefits**
Modern tooling has made us forget how simple web development can be:
- **Transparent State** - All component state is visible in the DOM inspector
- **No Build Step Required** - Works directly in browsers with ES modules
- **Immediate Feedback** - Changes reflect instantly without compilation
- **Standards Compliant** - Built on stable web APIs that won't change

## 🚀 Quick Start

### Visualization

You can see the framework used in an actual web setting via:
```bash
https://rpdevjesco.github.io/zephyrJS/
```

###

### Installation

```bash
git clone https://github.com/RPDevJesco/zephyrJS.git
cd zephyrJS
```

### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <script type="module">
        import { XButton, XInput, XCard } from 'zephyrjs';
    </script>
</head>
<body>
    <!-- Components work immediately -->
    <x-button label="Click me!" variant="primary"></x-button>
    <x-input label="Your name" placeholder="Enter name here"></x-input>
    
    <x-card elevated hoverable>
        <div slot="header">
            <h3>Welcome to ZephyrJS</h3>
        </div>
        <div slot="body">
            <p>This card responds to user interactions with zero JavaScript configuration.</p>
        </div>
    </x-card>
</body>
</html>
```

## 📦 Core Components

### Form Elements
- **`<x-input>`** - Smart input fields with validation
- **`<x-button>`** - Accessible buttons with variants
- **`<x-select>`** - Dropdown selectors with search
- **`<x-checkbox>`** - Checkboxes with indeterminate state
- **`<x-textarea>`** - Auto-resizing text areas
- **`<x-radio-group>`** - Radio button groups
- **`<x-fieldset>`** - Form grouping with validation

### Layout & Navigation
- **`<x-tabs>`** - Accessible tab navigation with keyboard support
- **`<x-card>`** - Flexible content cards with multiple variants
- **`<x-dialog>`** - Modal dialogs with focus management
- **`<x-splitter>`** - Resizable panes with drag handles
- **`<x-masonry>`** - Infinite masonry layouts with virtualization
- **`<x-content-grid>`** - Responsive content grids with filtering
- **`<x-data-table>`** - Sortable tables with pagination
- **`<x-scroll>`** - Custom scrollable areas

## 🏗️ The Philosophy: Less is More

### **What Modern Frameworks Forgot**

Over the years, web frameworks have accumulated complexity:
- Virtual DOMs to "fix" DOM performance (that was never actually broken)
- Complex state management systems to solve problems they created
- Build steps and compilation for simple UI updates
- Abstract patterns that hide the underlying web platform

### **What ZephyrJS Remembers**

ZephyrJS returns to the core principles that made the web powerful in the first place:

- **HTML attributes are perfect for component state** - They're observable, serializable, and debuggable
- **The DOM is already a reactive system** - Attribute changes automatically trigger updates
- **Browser APIs are mature and fast** - Custom Elements, observers, and events just work
- **Simple code is maintainable code** - Less abstraction means fewer bugs

### **The XBase Foundation**

The entire framework philosophy is embodied in our tiny base class:

All ZephyrJS components extend from `XBase`, a minimal custom element base class:

```javascript
export default class XBase extends HTMLElement {
    static observedAttributes = [];
    #abort = new AbortController();

    connectedCallback() {
        this.onConnect?.(this.#abort.signal);
        this.render?.();
    }
    
    disconnectedCallback() { 
        this.#abort.abort(); 
    }

    attributeChangedCallback() {
        if (this.isConnected) this.render?.();
    }

    setAttr(name, v) { 
        v == null ? this.removeAttribute(name) : this.setAttribute(name, String(v)); 
    }
}
```

This tiny foundation provides:
- **Automatic cleanup** with AbortController signals
- **Efficient re-rendering** only when connected and attributes change
- **Simple state management** with the `setAttr()` helper

### Component Example

Here's how a ZephyrJS component leverages DOM-as-state:

```javascript
export default class XButton extends XBase {
    static get observedAttributes() { 
        return ['label', 'disabled', 'variant']; 
    }

    onConnect(signal) {
        // Create internal button for semantics
        const btn = this._btn = document.createElement('button');
        btn.part = 'button';
        
        btn.addEventListener('click', (e) => {
            if (this.hasAttribute('disabled')) return;
            this.dispatchEvent(new CustomEvent('button-click', { 
                bubbles: true, 
                composed: true 
            }));
        }, { signal });
        
        this.appendChild(btn);
    }

    render() {
        const label = this.getAttribute('label');
        const disabled = this.hasAttribute('disabled');
        const variant = this.getAttribute('variant') ?? 'default';
        
        // State is visible in DOM attributes
        this._btn.textContent = label ?? '';
        this._btn.disabled = disabled;
        this.dataset.variant = variant;
        
        // Styling via CSS custom properties
        this._btn.style.background = variant === 'primary' 
            ? 'var(--x-accent)' 
            : 'white';
    }
}
```

### Event-Driven Communication

Components communicate through standard DOM events:

```javascript
// Listen for component events
document.addEventListener('button-click', (e) => {
    console.log('Button clicked:', e.target);
});

document.addEventListener('tab-changed', (e) => {
    console.log('Active tab:', e.detail.activeTab);
});

// Programmatic control
const tabs = document.querySelector('x-tabs');
tabs.setActiveTab('settings');
tabs.addTab('new-tab', 'New Tab', '<p>Content</p>');
```

## 🎨 Styling & Theming

### CSS Custom Properties

ZephyrJS uses CSS custom properties for consistent theming:

```css
:root {
    --x-accent: #4f46e5;
    --x-font: system-ui, -apple-system, sans-serif;
    --x-radius: 8px;
    --x-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

### CSS Parts

Style internal component parts with the `::part()` selector:

```css
/* Style the internal button of x-button */
x-button::part(button) {
    border-radius: 12px;
    font-weight: 600;
    transition: all 0.2s ease;
}

x-button::part(button):hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Style tab panels */
x-tabs::part(panel) {
    background: #f8fafc;
    border-radius: 8px;
    padding: 24px;
}
```

### Responsive Design

Components are mobile-first and responsive by default:

```css
x-card {
    width: 100%;
    max-width: 400px;
}

@media (min-width: 768px) {
    x-card[variant="featured"] {
        max-width: 600px;
    }
}
```

## 🆚 Why This Approach Matters

### **Performance Reality Check**

| Approach | Bundle Size | Runtime Overhead | Memory Usage | Debugging |
|----------|------------|------------------|--------------|-----------|
| **ZephyrJS** | ~5KB | Direct DOM updates | Minimal | Browser DevTools |
| **React** | ~42KB + React DOM | Virtual DOM reconciliation | State + VDOM tree | Requires React DevTools |
| **Vue** | ~35KB | Proxy reactivity system | Reactive objects + templates | Vue DevTools needed |
| **Angular** | ~130KB+ | Change detection cycles | DI containers + components | Complex debugging |

### **The Modern Framework Problem**

```javascript
// Modern Framework: Hidden complexity
const [count, setCount] = useState(0);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

// Where is this state? How do I debug it? 
// What happens when components unmount?
// How do I serialize this for SSR?
```

```html
<!-- ZephyrJS: Transparent simplicity -->
<x-button count="0" loading="false">
  Click me
</x-button>

<!-- State is visible, serializable, debuggable -->
<!-- Browser handles attribute changes automatically -->
```

### **When Simplicity Wins**

ZephyrJS isn't trying to solve every possible use case. It's optimized for the 80% of applications that don't need:
- Complex state management across hundreds of components
- Heavy client-side routing with code splitting
- Real-time collaborative editing with operational transforms
- Massive applications with team scaling concerns

For these simpler use cases (which are most applications), going back to basics delivers better performance, easier debugging, and faster development.

## 🎯 Perfect Use Cases

### **Where ZephyrJS Excels**
- **Content-heavy websites** - Blogs, marketing sites, documentation
- **Dashboard and admin interfaces** - Forms, tables, simple interactions
- **Progressive enhancement** - Adding interactivity to server-rendered pages
- **Component libraries** - Reusable UI components for any framework
- **Prototyping and demos** - Quick interactive mockups without build steps

### **When to Choose Something Else**
- **Complex SPAs** - Applications with intricate state management needs
- **Real-time collaborative** - Apps requiring sophisticated synchronization
- **Large teams** - Where TypeScript enforcement and patterns are critical
- **Heavy data manipulation** - Applications doing complex client-side processing

## ✨ Advanced Features (When You Need Them)

### **Smart Performance Optimizations**

Even with a back-to-basics approach, ZephyrJS includes smart optimizations where they actually matter:

```html
<!-- Automatic virtualization for large lists -->
<x-content-grid 
    virtual-height="400px" 
    item-height="200">
    <!-- Handles thousands of items efficiently -->
</x-content-grid>

<!-- Built-in accessibility without configuration -->
<x-tabs orientation="vertical" aria-label="Settings">
    <!-- ARIA attributes and keyboard nav work automatically -->
</x-tabs>
```

### **Native Form Integration**

Components work seamlessly with native HTML forms - no special form libraries needed:

```html
<form>
    <x-input name="email" type="email" required></x-input>
    <x-checkbox name="newsletter" label="Subscribe"></x-checkbox>
    <!-- Form validation uses native constraint validation -->
    <x-button type="submit" label="Submit"></x-button>
</form>
```

## 🎓 The Learning Curve (Or Lack Thereof)

### **If You Know HTML, You Know ZephyrJS**

```html
<!-- Standard HTML -->
<input type="text" value="hello" disabled>
<button onclick="handleClick()">Click me</button>

<!-- ZephyrJS components work the same way -->
<x-input value="hello" disabled></x-input>  
<x-button label="Click me" onclick="handleClick()"></x-button>
```

### **No New Concepts to Learn**
- No JSX syntax or special templating
- No hooks, lifecycle methods, or reactive declarations
- No build configuration or webpack setup
- No package.json dependencies beyond ZephyrJS itself

### **Progressive Enhancement**
Start with HTML, then enhance:

```html
<!-- Start with static HTML -->
<div class="tabs">
    <button>Tab 1</button>
    <button>Tab 2</button>
    <div>Content 1</div>
    <div>Content 2</div>
</div>

<!-- Enhance with one script tag -->
<script type="module">
    import { XTabs } from 'zephyrjs';
</script>

<!-- Replace when ready -->
<x-tabs active="tab1">
    <div tab-id="tab1" tab-label="Tab 1">Content 1</div>
    <div tab-id="tab2" tab-label="Tab 2">Content 2</div>
</x-tabs>
```

## 🛠️ Development

### Prerequisites

- Modern browser supporting Custom Elements

### Local Development

```bash
# Clone the repository
git clone https://github.com/RPDevJesco/zephyrJS.git
cd zephyrJS
```

### Project Structure

```
zephyrJS/
├── src/
│   ├── core/
│   │   └── XBase.js          # Base component class
│   └── elements/
│       ├── XButton.js        # Button component
│       ├── XInput.js         # Input component
│       ├── XCard.js          # Card component
│       └── ...               # Other components
├── examples/                 # Live examples
├── tests/                    # Test suites
└── docs/                     # Documentation
```

## 📚 Examples

Check out the `/examples` directory for comprehensive demonstrations:

- **Form Examples** - Complete form interactions with validation
- **Tab Examples** - Dynamic tab management and navigation
- **Card Examples** - Various card layouts and interactions
- **Masonry Gallery** - Infinite scroll image gallery
- **Data Table** - Sortable, paginated data display

## 🤝 Contributing

We welcome contributions! 

### Development Principles

1. **Web Standards First** - Leverage native browser APIs
2. **Performance Critical** - Every byte matters
3. **Accessibility Required** - WCAG 2.1 compliance minimum
4. **DOM-as-State** - No hidden internal state
5. **Framework Agnostic** - Works everywhere

## 📄 License

MIT License

**ZephyrJS: Rediscovering the performance and simplicity that web development once had.**
