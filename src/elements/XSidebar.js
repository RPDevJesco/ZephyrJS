import XBase from '../core/XBase.js';

// Collapsible Navigation Sidebar
export default class XSidebar extends XBase {
    static get observedAttributes() {
        return [
            'collapsed', 'position', 'width', 'collapsed-width', 'overlay',
            'backdrop', 'auto-collapse', 'breakpoint', 'animation-duration'
        ];
    }

    constructor() {
        super();
        this._sidebar = null;
        this._content = null;
        this._backdrop = null;
        this._toggle = null;
        this._resizeObserver = null;
    }

    onConnect(signal) {
        this._createSidebarStructure();
        this._setupEventListeners(signal);
        this._setupResponsive();
        this.render();
    }

    _createSidebarStructure() {
        // Create main structure
        this._sidebar = document.createElement('aside');
        this._sidebar.part = 'sidebar';
        this._sidebar.className = 'sidebar';
        this._sidebar.setAttribute('role', 'navigation');
        this._sidebar.setAttribute('aria-label', 'Main navigation');

        this._content = document.createElement('div');
        this._content.part = 'content';
        this._content.className = 'sidebar-content';

        // Create toggle button
        this._toggle = document.createElement('button');
        this._toggle.part = 'toggle';
        this._toggle.className = 'sidebar-toggle';
        this._toggle.setAttribute('aria-label', 'Toggle sidebar');
        this._toggle.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
        `;

        // Create backdrop for overlay mode
        this._backdrop = document.createElement('div');
        this._backdrop.part = 'backdrop';
        this._backdrop.className = 'sidebar-backdrop';

        // Move existing content to sidebar content
        const existingContent = Array.from(this.children);
        existingContent.forEach(child => this._content.appendChild(child));

        // Clear and setup structure
        this.innerHTML = '';
        this.appendChild(this._backdrop);
        this.appendChild(this._sidebar);
        this._sidebar.appendChild(this._toggle);
        this._sidebar.appendChild(this._content);

        this._applySidebarStyles();
    }

    _applySidebarStyles() {
        const position = this.getAttribute('position') || 'left';
        const width = this.getAttribute('width') || '280px';
        const collapsedWidth = this.getAttribute('collapsed-width') || '60px';
        const animationDuration = this.getAttribute('animation-duration') || '300ms';
        const isOverlay = this.hasAttribute('overlay');

        // Container styles
        this.style.cssText = `
            display: flex;
            ${position === 'right' ? 'flex-direction: row-reverse;' : ''}
            height: 100%;
            position: relative;
            overflow: hidden;
        `;

        // Sidebar styles
        this._sidebar.style.cssText = `
            display: flex;
            flex-direction: column;
            height: 100%;
            background: #ffffff;
            border-${position === 'left' ? 'right' : 'left'}: 1px solid #e5e7eb;
            box-shadow: ${position === 'left' ? '2px' : '-2px'} 0 8px rgba(0, 0, 0, 0.1);
            transition: all ${animationDuration} cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10;
            ${isOverlay ? `
                position: fixed;
                ${position}: 0;
                top: 0;
                width: ${width};
            ` : `
                position: relative;
                width: ${width};
                flex-shrink: 0;
            `}
        `;

        // Toggle button styles
        this._toggle.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 48px;
            background: none;
            border: none;
            cursor: pointer;
            color: #6b7280;
            border-bottom: 1px solid #f3f4f6;
            transition: all 0.2s ease;
        `;

        // Content styles
        this._content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 16px;
        `;

        // Backdrop styles
        this._backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 5;
            opacity: 0;
            visibility: hidden;
            transition: all ${animationDuration} ease;
            ${!isOverlay ? 'display: none;' : ''}
        `;
    }

    _setupEventListeners(signal) {
        // Toggle button click
        this._toggle.addEventListener('click', () => {
            this.toggle();
        }, { signal });

        // Backdrop click to close
        this._backdrop.addEventListener('click', () => {
            if (this.hasAttribute('overlay') && !this.hasAttribute('collapsed')) {
                this.collapse();
            }
        }, { signal });

        // Keyboard support
        this.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.hasAttribute('overlay') && !this.hasAttribute('collapsed')) {
                this.collapse();
                e.preventDefault();
            }
        }, { signal });

        // Toggle button hover effects
        this._toggle.addEventListener('mouseenter', () => {
            this._toggle.style.backgroundColor = '#f3f4f6';
        }, { signal });

        this._toggle.addEventListener('mouseleave', () => {
            this._toggle.style.backgroundColor = 'transparent';
        }, { signal });

        // Handle navigation items
        this.addEventListener('click', (e) => {
            const navItem = e.target.closest('[data-nav-item]');
            if (navItem) {
                // Remove active state from other items
                this.querySelectorAll('[data-nav-item].active').forEach(item => {
                    item.classList.remove('active');
                });

                // Add active state to clicked item
                navItem.classList.add('active');

                // Dispatch navigation event
                this._dispatchEvent('sidebar-navigate', {
                    item: navItem,
                    value: navItem.dataset.navItem,
                    text: navItem.textContent.trim()
                });

                // Auto-collapse on mobile if overlay
                if (this.hasAttribute('overlay') && this._isMobileBreakpoint()) {
                    this.collapse();
                }
            }
        }, { signal });
    }

    _setupResponsive() {
        // Setup ResizeObserver for responsive behavior
        if (window.ResizeObserver) {
            this._resizeObserver = new ResizeObserver(() => {
                this._handleResize();
            });
            this._resizeObserver.observe(document.documentElement);
        } else {
            // Fallback for older browsers
            window.addEventListener('resize', () => {
                this._handleResize();
            });
        }
    }

    _handleResize() {
        if (!this.hasAttribute('auto-collapse')) return;

        const isMobile = this._isMobileBreakpoint();

        if (isMobile && !this.hasAttribute('overlay')) {
            this.setAttr('overlay', '');
            this.collapse();
        } else if (!isMobile && this.hasAttribute('overlay')) {
            this.removeAttribute('overlay');
            this.expand();
        }
    }

    _isMobileBreakpoint() {
        const breakpoint = Number(this.getAttribute('breakpoint') || '768');
        return window.innerWidth < breakpoint;
    }

    _updateCollapsedState() {
        const isCollapsed = this.hasAttribute('collapsed');
        const isOverlay = this.hasAttribute('overlay');
        const width = this.getAttribute('width') || '280px';
        const collapsedWidth = this.getAttribute('collapsed-width') || '60px';

        if (isOverlay) {
            // Overlay mode
            if (isCollapsed) {
                this._sidebar.style.transform = `translateX(${
                    this.getAttribute('position') === 'right' ? '' : '-'
                }100%)`;
                this._backdrop.style.opacity = '0';
                this._backdrop.style.visibility = 'hidden';
            } else {
                this._sidebar.style.transform = 'translateX(0)';
                this._backdrop.style.opacity = '1';
                this._backdrop.style.visibility = 'visible';
            }
        } else {
            // Push mode
            this._sidebar.style.width = isCollapsed ? collapsedWidth : width;
            this._sidebar.style.transform = 'none';
        }

        // Update toggle icon
        const icon = this._toggle.querySelector('svg');
        if (icon) {
            if (isCollapsed) {
                icon.innerHTML = '<path d="M3 12h18M3 6h18M3 18h18"/>';
            } else {
                icon.innerHTML = '<path d="M18 6L6 18M6 6l12 12"/>';
            }
        }

        // Update content visibility for collapsed state
        if (isCollapsed && !isOverlay) {
            this._content.style.opacity = '0';
            this._content.style.pointerEvents = 'none';
        } else {
            this._content.style.opacity = '1';
            this._content.style.pointerEvents = 'auto';
        }

        // Update ARIA attributes
        this._sidebar.setAttribute('aria-hidden', isCollapsed.toString());
        this._toggle.setAttribute('aria-expanded', (!isCollapsed).toString());
    }

    _dispatchEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    render() {
        if (!this._sidebar) return;

        this._applySidebarStyles();
        this._updateCollapsedState();
    }

    // Public API
    toggle() {
        if (this.hasAttribute('collapsed')) {
            this.expand();
        } else {
            this.collapse();
        }
    }

    collapse() {
        this.setAttr('collapsed', '');
        this._dispatchEvent('sidebar-collapse');
    }

    expand() {
        this.removeAttribute('collapsed');
        this._dispatchEvent('sidebar-expand');
    }

    setActiveItem(value) {
        // Remove active state from all items
        this.querySelectorAll('[data-nav-item].active').forEach(item => {
            item.classList.remove('active');
        });

        // Add active state to matching item
        const item = this.querySelector(`[data-nav-item="${value}"]`);
        if (item) {
            item.classList.add('active');
        }
    }

    getActiveItem() {
        const activeItem = this.querySelector('[data-nav-item].active');
        return activeItem ? activeItem.dataset.navItem : null;
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }
}

customElements.define('x-sidebar', XSidebar);