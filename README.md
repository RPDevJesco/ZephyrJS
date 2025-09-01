# ZephyrJS

> A web component library built on DOM-as-state architecture

ZephyrJS is a lightweight, modern web component library that reimagines how we think about state management in web applications. By using the DOM as the single source of truth, ZephyrJS eliminates the complexity of state synchronization while delivering exceptional performance and developer experience.

## 🌟 Why ZephyrJS?

### **DOM-as-State Architecture**
Unlike traditional frameworks that maintain separate state objects, ZephyrJS stores all component state directly in DOM attributes. This revolutionary approach offers:

- **Zero State Synchronization Issues** - No more wondering if your UI matches your state
- **Instant Debugging** - See all state changes directly in the DOM inspector
- **Memory Efficient** - No duplicate state storage or complex state management overhead
- **Framework Agnostic** - Works seamlessly with any framework or vanilla JavaScript

### **Performance First**
- **Minimal Bundle Size** - Core library is under 5KB gzipped
- **Direct DOM Updates** - No virtual DOM overhead or reconciliation
- **Efficient Rendering** - Only re-renders when attributes actually change
- **Memory Optimized** - Automatic cleanup with AbortController signals

### **Developer Experience**
- **Web Standards Compliant** - Built on native Custom Elements
- **TypeScript Ready** - Full type definitions included
- **CSS Parts Integration** - Style internal component parts with `::part()` selectors
- **Accessibility First** - ARIA compliance and keyboard navigation built-in

## 🚀 Quick Start

### Installation

```bash
npm install zephyrjs
# or
yarn add zephyrjs
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

## 🏗️ Architecture Deep Dive

### The XBase Foundation

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

## 🆚 Framework Comparison

### vs React

| Feature | ZephyrJS | React |
|---------|----------|-------|
| **State Management** | DOM attributes | useState, props, context |
| **Bundle Size** | ~5KB | ~42KB + React DOM |
| **Runtime Overhead** | Minimal | Virtual DOM diffing |
| **Learning Curve** | Web standards | JSX, hooks, lifecycle |
| **Debugging** | DOM inspector | React DevTools required |
| **Framework Lock-in** | None | React ecosystem |

```html
<!-- ZephyrJS: State visible in DOM -->
<x-tabs active="settings">
    <div tab-id="profile" tab-label="Profile">Profile content</div>
    <div tab-id="settings" tab-label="Settings">Settings content</div>
</x-tabs>

<!-- React: Hidden internal state -->
<TabComponent activeTab="settings">
    <Tab id="profile" label="Profile">Profile content</Tab>
    <Tab id="settings" label="Settings">Settings content</Tab>
</TabComponent>
```

### vs Vue

| Feature | ZephyrJS | Vue |
|---------|----------|-----|
| **Reactivity** | DOM mutation observers | Proxy-based reactivity |
| **Template Syntax** | Standard HTML | Vue templates |
| **Component Definition** | ES6 classes | SFC or Options API |
| **State Debugging** | Browser DevTools | Vue DevTools |
| **SSR Support** | Native | Nuxt/SSR setup |

### vs Angular

| Feature | ZephyrJS | Angular |
|---------|----------|---------|
| **Architecture** | Web Components | Component + Service |
| **Change Detection** | Attribute observers | Zone.js |
| **Bundle Size** | ~5KB | ~130KB+ |
| **TypeScript** | Optional | Required |
| **Dependency Injection** | None needed | Complex DI system |

### vs Svelte

| Feature | ZephyrJS | Svelte |
|---------|----------|--------|
| **Compilation** | None (runtime) | Compile-time |
| **State** | DOM attributes | Component variables |
| **Syntax** | Standard HTML | Svelte syntax |
| **Reactivity** | DOM-based | Compiler-generated |
| **Bundle** | No build step | Requires compiler |

## ✨ Advanced Features

### Virtualization

Large lists and grids automatically virtualize for performance:

```html
<x-content-grid 
    virtual-height="400px" 
    item-height="200">
    <!-- Thousands of items rendered efficiently -->
</x-content-grid>

<x-masonry 
    virtualize-buffer="5" 
    base-unit="200">
    <!-- Infinite scroll with automatic cleanup -->
</x-masonry>
```

### Accessibility

ARIA compliance and keyboard navigation built-in:

```html
<!-- Automatic ARIA attributes -->
<x-tabs orientation="vertical" aria-label="Settings navigation">
    <div tab-id="account" tab-label="Account Settings">
        <!-- Tab content automatically gets proper roles -->
    </div>
</x-tabs>

<!-- Keyboard navigation works immediately -->
<x-button label="Save" aria-describedby="save-help">
```

### Form Integration

Seamless integration with native forms:

```html
<form>
    <x-fieldset legend="User Information">
        <x-input name="firstName" label="First Name" required></x-input>
        <x-input name="email" type="email" label="Email" required></x-input>
        <x-checkbox name="newsletter" label="Subscribe to newsletter"></x-checkbox>
    </x-fieldset>
    
    <!-- Form validation works with native constraint validation -->
    <x-button type="submit" label="Submit"></x-button>
</form>
```

## 🛠️ Development

### Prerequisites

- Node.js 16+
- Modern browser supporting Custom Elements

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/zephyrjs.git
cd zephyrjs
```

### Project Structure

```
zephyrjs/
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
---

**ZephyrJS: Where the DOM is your state, and simplicity is your superpower.**