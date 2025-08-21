import XBase from '../core/XBase.js';

export default class XVirtualList extends XBase {
    static observedAttributes = ['item-count', 'item-height'];

    constructor() {
        super();
        this._isInitialized = false;
    }

    onConnect(signal) {
        this._initializeContainer();
        this._setupScrolling(signal);
        this._isInitialized = true;
        // Render after initialization is complete
        this.render();
    }

    _initializeContainer() {
        // Set up the virtual list container styles
        this.style.overflow = 'auto';
        this.style.position = 'relative';

        // Create or get the container element
        this._container = this.firstElementChild;
        if (!this._container || this._container.nodeType !== Node.ELEMENT_NODE) {
            this._container = document.createElement('div');
            this.appendChild(this._container);
        }

        this._container.style.position = 'relative';
        this._container.style.width = '100%';
    }

    _setupScrolling(signal) {
        // Throttle scroll events for better performance
        let scrollTimeout;
        const throttledRender = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                this.render();
                scrollTimeout = null;
            }, 16); // ~60fps
        };

        this.addEventListener('scroll', throttledRender, { signal, passive: true });

        // Also listen for resize events that might affect visible area
        window.addEventListener('resize', throttledRender, { signal, passive: true });
    }

    set renderer(fn) {
        this._renderer = fn;
        if (this._isInitialized) {
            this.render();
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);

        // Re-render when item-count or item-height changes
        if (this._isInitialized && (name === 'item-count' || name === 'item-height')) {
            this.render();
        }
    }

    render() {
        // Don't render if not properly initialized
        if (!this._container || !this._isInitialized) {
            return;
        }

        const N = Math.max(0, Number(this.getAttribute('item-count') ?? 0));
        const H = Math.max(1, Number(this.getAttribute('item-height') ?? 24));

        // Get actual viewport height, with better fallback handling
        const vh = this.clientHeight || this.getBoundingClientRect().height || 300;

        // Ensure we have a valid viewport height
        if (vh <= 0) {
            return; // Skip rendering if we can't determine viewport size
        }

        // Calculate visible range with proper bounds checking
        const scrollTop = Math.max(0, this.scrollTop);
        const start = Math.max(0, Math.floor(scrollTop / H) - 3);
        const visible = Math.min(N - start, Math.ceil(vh / H) + 6);

        // Set container height to accommodate all items
        this._container.style.height = `${N * H}px`;

        // Don't render if no items are visible
        if (visible <= 0 || N === 0) {
            this._container.innerHTML = '';
            return;
        }

        // Pool children to needed size
        this._updateChildPool(visible);

        // Position and render visible items
        for (let i = 0; i < visible && i < this._container.children.length; i++) {
            const idx = start + i;
            if (idx >= N) break; // Safety check

            const el = this._container.children[i];
            el.style.top = `${idx * H}px`;
            el.style.height = `${H}px`;

            // Call the renderer if available
            try {
                this._renderer?.(el, idx);
            } catch (error) {
                console.warn('XVirtualList renderer error:', error);
                el.textContent = `Item ${idx}`;
            }
        }
    }

    _updateChildPool(needed) {
        const current = this._container.children.length;

        // Add children if we need more
        while (this._container.children.length < needed) {
            const item = document.createElement('div');
            item.style.position = 'absolute';
            item.style.left = '0';
            item.style.right = '0';
            item.style.boxSizing = 'border-box';
            this._container.appendChild(item);
        }

        // Remove excess children
        while (this._container.children.length > needed) {
            this._container.lastElementChild?.remove();
        }
    }

    // Public method to scroll to a specific item
    scrollToItem(index) {
        const H = Number(this.getAttribute('item-height') ?? 24);
        const N = Number(this.getAttribute('item-count') ?? 0);

        if (index < 0 || index >= N) {
            return;
        }

        // If element isn't ready yet, defer the scroll
        if (!this._isInitialized || this.clientHeight === 0) {
            // Use requestAnimationFrame to ensure layout is complete
            requestAnimationFrame(() => {
                // Double-check we're ready, then try again
                if (this.clientHeight > 0) {
                    this.scrollTop = index * H;
                    this.render(); // Force a render after scroll
                } else {
                    // If still not ready, use a small delay
                    setTimeout(() => this.scrollToItem(index), 10);
                }
            });
            return;
        }

        this.scrollTop = index * H;
        this.render(); // Force a render after scroll
    }

    // Public method to refresh the list
    refresh() {
        if (this._isInitialized) {
            this.render();
        }
    }
}

customElements.define('x-virtual-list', XVirtualList);