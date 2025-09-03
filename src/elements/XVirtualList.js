import XBase from '../core/XBase.js';

export default class XVirtualList extends XBase {
    static observedAttributes = ['item-count', 'item-height'];

    constructor() {
        super();
        this._isInitialized = false;
        this._renderer = null;
        this._pendingRender = false;
    }

    onConnect(signal) {
        this._initializeContainer();
        this._setupScrolling(signal);
        this._isInitialized = true;

        // Force an immediate render to ensure items appear right away
        requestAnimationFrame(() => {
            this.render();
        });
    }

    _initializeContainer() {
        // Set up the virtual list container styles immediately
        this.style.overflow = 'auto';
        this.style.position = 'relative';
        this.style.display = 'block'; // Ensure it's visible

        // Create or get the container element
        this._container = this.firstElementChild;
        if (!this._container || this._container.nodeType !== Node.ELEMENT_NODE) {
            this._container = document.createElement('div');
            this.appendChild(this._container);
        }

        this._container.style.position = 'relative';
        this._container.style.width = '100%';
        this._container.style.minHeight = '100%';
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
        // Immediately render when renderer is set if we're initialized
        if (this._isInitialized) {
            this.render();
        }
    }

    get renderer() {
        return this._renderer;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback?.(name, oldValue, newValue);

        // Re-render when item-count or item-height changes
        if (this._isInitialized && (name === 'item-count' || name === 'item-height')) {
            // Use requestAnimationFrame to avoid render thrashing
            if (!this._pendingRender) {
                this._pendingRender = true;
                requestAnimationFrame(() => {
                    this.render();
                    this._pendingRender = false;
                });
            }
        }
    }

    render() {
        // Don't render if not properly initialized
        if (!this._container || !this._isInitialized) {
            return;
        }

        const N = Math.max(0, Number(this.getAttribute('item-count') ?? 0));
        const H = Math.max(1, Number(this.getAttribute('item-height') ?? 24));

        // Get viewport height with better fallback handling
        let vh = this.clientHeight;

        // If clientHeight is 0, try to get it from computed styles
        if (vh <= 0) {
            const computedStyle = window.getComputedStyle(this);
            vh = parseInt(computedStyle.height) || 400; // fallback to 400px
        }

        // If still no valid height, wait and try again
        if (vh <= 0) {
            requestAnimationFrame(() => this.render());
            return;
        }

        // Calculate visible range with proper bounds checking
        const scrollTop = Math.max(0, this.scrollTop || 0);
        const start = Math.max(0, Math.floor(scrollTop / H) - 3);
        const visible = Math.min(N - start, Math.ceil(vh / H) + 6);

        // Set container height to accommodate all items
        this._container.style.height = `${N * H}px`;

        // Handle empty list case
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
            el.style.position = 'absolute';
            el.style.top = `${idx * H}px`;
            el.style.left = '0';
            el.style.right = '0';
            el.style.height = `${H}px`;
            el.style.boxSizing = 'border-box';

            // Call the renderer if available
            try {
                if (this._renderer) {
                    this._renderer(el, idx);
                } else {
                    // Default renderer if none provided
                    el.textContent = `Item ${idx}`;
                    el.style.padding = '8px';
                    el.style.borderBottom = '1px solid #eee';
                    el.style.background = idx % 2 === 0 ? '#f9f9f9' : 'white';
                }
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
            item.style.overflow = 'hidden'; // Prevent content overflow
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

        // Calculate target scroll position
        const targetScrollTop = index * H;

        // If element isn't ready yet, defer the scroll
        if (!this._isInitialized || this.clientHeight === 0) {
            // Use a more reliable approach to wait for readiness
            const waitForReady = () => {
                if (this.clientHeight > 0 && this._isInitialized) {
                    this.scrollTop = targetScrollTop;
                    // Force a render after scroll
                    requestAnimationFrame(() => this.render());
                } else {
                    // Keep trying, but with exponential backoff
                    setTimeout(waitForReady, 50);
                }
            };
            waitForReady();
            return;
        }

        // Immediate scroll if ready
        this.scrollTop = targetScrollTop;

        // Force a render after scroll to ensure items appear immediately
        requestAnimationFrame(() => this.render());
    }

    // Public method to refresh the list
    refresh() {
        if (this._isInitialized) {
            // Clear container first to force re-render
            this._container.innerHTML = '';
            requestAnimationFrame(() => this.render());
        }
    }

    // Get current visible range (for debugging)
    getVisibleRange() {
        const H = Number(this.getAttribute('item-height') ?? 24);
        const vh = this.clientHeight || 400;
        const scrollTop = this.scrollTop || 0;
        const start = Math.max(0, Math.floor(scrollTop / H) - 3);
        const visible = Math.ceil(vh / H) + 6;

        return {
            start,
            end: start + visible,
            scrollTop,
            clientHeight: vh
        };
    }
}

customElements.define('x-virtual-list', XVirtualList);