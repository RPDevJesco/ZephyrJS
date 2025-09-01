import XBase from '../core/XBase.js';

/**
 * XSplitter - Resizable Pane Splitter Component
 * Completely redesigned for reliability and simplicity
 */
export default class XSplitter extends XBase {
    static get observedAttributes() {
        return [
            'orientation', 'split-position', 'min-size', 'max-size',
            'disabled', 'snap-threshold', 'handle-size', 'live-resize'
        ];
    }

    constructor() {
        super();
        this.state = {
            isDragging: false,
            startX: 0,
            startY: 0,
            startPosition: 0,
            currentPosition: 50 // percentage
        };

        // Pre-bind all event handlers
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleTouchStart = this.handleTouchStart.bind(this);
        this.handleTouchMove = this.handleTouchMove.bind(this);
        this.handleTouchEnd = this.handleTouchEnd.bind(this);
    }

    onConnect(signal) {
        this.initializeComponent();
        this.setupEventListeners(signal);
        this.render();

        // Initialize position after a brief delay to ensure proper sizing
        requestAnimationFrame(() => {
            this.setPosition(this.getAttribute('split-position') || '50');
        });
    }

    initializeComponent() {
        // Store existing content before clearing
        const existingContent = Array.from(this.childNodes).filter(node =>
            node.nodeType === Node.ELEMENT_NODE
        );

        // Clear and set up the basic structure
        this.innerHTML = '';

        // Create the container with proper CSS Grid layout
        this.style.cssText = `
            display: grid;
            width: 100%;
            height: 100%;
            overflow: hidden;
            position: relative;
        `;

        // Get orientation
        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
        const handleSize = this.getAttribute('handle-size') || '8';

        // Set up CSS Grid template
        if (isHorizontal) {
            this.style.gridTemplateColumns = `1fr ${handleSize}px 1fr`;
            this.style.gridTemplateRows = '1fr';
        } else {
            this.style.gridTemplateColumns = '1fr';
            this.style.gridTemplateRows = `1fr ${handleSize}px 1fr`;
        }

        // Create panes and handle
        this.paneA = this.createPane('pane-a');
        this.handle = this.createHandle();
        this.paneB = this.createPane('pane-b');

        // Append elements
        this.appendChild(this.paneA);
        this.appendChild(this.handle);
        this.appendChild(this.paneB);

        // Move any existing content to panes
        this.distributeExistingContent(existingContent);
    }

    createPane(className) {
        const pane = document.createElement('div');
        pane.className = className;
        pane.style.cssText = `
            overflow: auto;
            background: inherit;
            position: relative;
        `;
        return pane;
    }

    createHandle() {
        const handle = document.createElement('div');
        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';

        handle.className = 'splitter-handle';
        handle.tabIndex = 0;
        handle.setAttribute('role', 'separator');
        handle.setAttribute('aria-label', 'Resize panes');

        handle.style.cssText = `
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            cursor: ${isHorizontal ? 'col-resize' : 'row-resize'};
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            transition: background-color 0.15s ease;
            user-select: none;
            z-index: 10;
        `;

        // Add visual indicator
        const indicator = document.createElement('div');
        indicator.style.cssText = `
            ${isHorizontal ? `
                width: 2px;
                height: 20px;
                background: linear-gradient(to bottom, #94a3b8 40%, transparent 40%, transparent 60%, #94a3b8 60%);
            ` : `
                width: 20px;
                height: 2px;
                background: linear-gradient(to right, #94a3b8 40%, transparent 40%, transparent 60%, #94a3b8 60%);
            `}
            border-radius: 1px;
        `;

        handle.appendChild(indicator);
        return handle;
    }

    distributeExistingContent(existingContent) {
        if (existingContent.length > 0) {
            // Separate content by data-pane attribute
            const paneAContent = existingContent.filter(el =>
                el.hasAttribute && el.hasAttribute('data-pane') && el.getAttribute('data-pane') === 'a'
            );
            const paneBContent = existingContent.filter(el =>
                el.hasAttribute && el.hasAttribute('data-pane') && el.getAttribute('data-pane') === 'b'
            );

            // If no explicit pane assignments, split content evenly
            if (paneAContent.length === 0 && paneBContent.length === 0) {
                const mid = Math.ceil(existingContent.length / 2);
                paneAContent.push(...existingContent.slice(0, mid));
                paneBContent.push(...existingContent.slice(mid));
            }

            // Move content to appropriate panes
            paneAContent.forEach(el => this.paneA.appendChild(el));
            paneBContent.forEach(el => this.paneB.appendChild(el));
        }
    }

    setupEventListeners(signal) {
        // Mouse events
        this.handle.addEventListener('mousedown', this.handleMouseDown, { signal });

        // Touch events
        this.handle.addEventListener('touchstart', this.handleTouchStart, { signal, passive: false });

        // Keyboard events
        this.handle.addEventListener('keydown', this.handleKeyDown, { signal });

        // Hover effects
        this.handle.addEventListener('mouseenter', () => {
            if (!this.hasAttribute('disabled')) {
                this.handle.style.backgroundColor = '#e2e8f0';
            }
        }, { signal });

        this.handle.addEventListener('mouseleave', () => {
            if (!this.state.isDragging) {
                this.handle.style.backgroundColor = '#f1f5f9';
            }
        }, { signal });

        // Focus styles
        this.handle.addEventListener('focus', () => {
            this.handle.style.boxShadow = '0 0 0 2px #3b82f6';
        }, { signal });

        this.handle.addEventListener('blur', () => {
            this.handle.style.boxShadow = 'none';
        }, { signal });
    }

    handleMouseDown(e) {
        if (this.hasAttribute('disabled')) return;
        e.preventDefault();
        this.startDragging(e.clientX, e.clientY);

        // Add global listeners
        document.addEventListener('mousemove', this.handleMouseMove);
        document.addEventListener('mouseup', this.handleMouseUp);
    }

    handleMouseMove(e) {
        if (this.state.isDragging) {
            e.preventDefault();
            this.updatePosition(e.clientX, e.clientY);
        }
    }

    handleMouseUp(e) {
        if (this.state.isDragging) {
            this.stopDragging();
        }

        // Remove global listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
    }

    handleTouchStart(e) {
        if (this.hasAttribute('disabled')) return;
        e.preventDefault();
        const touch = e.touches[0];
        this.startDragging(touch.clientX, touch.clientY);

        // Add global touch listeners
        document.addEventListener('touchmove', this.handleTouchMove, { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd);
    }

    handleTouchMove(e) {
        if (this.state.isDragging) {
            e.preventDefault();
            const touch = e.touches[0];
            this.updatePosition(touch.clientX, touch.clientY);
        }
    }

    handleTouchEnd(e) {
        if (this.state.isDragging) {
            this.stopDragging();
        }

        // Remove global touch listeners
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
    }

    handleKeyDown(e) {
        if (this.hasAttribute('disabled')) return;

        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
        const step = 5; // percentage points
        let handled = false;

        if (isHorizontal) {
            if (e.key === 'ArrowLeft') {
                this.setPosition(Math.max(0, this.state.currentPosition - step));
                handled = true;
            } else if (e.key === 'ArrowRight') {
                this.setPosition(Math.min(100, this.state.currentPosition + step));
                handled = true;
            }
        } else {
            if (e.key === 'ArrowUp') {
                this.setPosition(Math.max(0, this.state.currentPosition - step));
                handled = true;
            } else if (e.key === 'ArrowDown') {
                this.setPosition(Math.min(100, this.state.currentPosition + step));
                handled = true;
            }
        }

        if (handled) {
            e.preventDefault();
            this.dispatchResizeEvent();
        }
    }

    startDragging(clientX, clientY) {
        this.state.isDragging = true;
        this.state.startX = clientX;
        this.state.startY = clientY;
        this.state.startPosition = this.state.currentPosition;

        // Visual feedback
        this.handle.style.backgroundColor = '#cbd5e1';
        document.body.style.userSelect = 'none';
        const cursor = (this.getAttribute('orientation') || 'horizontal') === 'horizontal' ? 'col-resize' : 'row-resize';
        document.body.style.cursor = cursor;

        this.setAttribute('dragging', '');

        this.dispatchEvent('splitter-drag-start', {
            position: this.state.currentPosition
        });
    }

    updatePosition(clientX, clientY) {
        if (!this.state.isDragging) return;

        const rect = this.getBoundingClientRect();
        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';

        let percentage;
        if (isHorizontal) {
            const deltaX = clientX - this.state.startX;
            const containerWidth = rect.width;
            const percentageChange = (deltaX / containerWidth) * 100;
            percentage = this.state.startPosition + percentageChange;
        } else {
            const deltaY = clientY - this.state.startY;
            const containerHeight = rect.height;
            const percentageChange = (deltaY / containerHeight) * 100;
            percentage = this.state.startPosition + percentageChange;
        }

        this.setPosition(percentage, true);

        if (this.hasAttribute('live-resize')) {
            this.dispatchResizeEvent();
        }
    }

    stopDragging() {
        this.state.isDragging = false;

        // Reset styles
        this.handle.style.backgroundColor = '#f1f5f9';
        document.body.style.userSelect = '';
        document.body.style.cursor = '';

        this.removeAttribute('dragging');

        this.dispatchEvent('splitter-drag-end', {
            position: this.state.currentPosition
        });

        this.dispatchResizeEvent();
    }

    setPosition(percentage, skipConstraints = false) {
        if (typeof percentage === 'string') {
            percentage = parseFloat(percentage);
        }

        if (!skipConstraints) {
            // Apply constraints
            const minSize = parseFloat(this.getAttribute('min-size') || '10');
            const maxSize = parseFloat(this.getAttribute('max-size') || '90');

            percentage = Math.max(minSize, Math.min(maxSize, percentage));

            // Apply snapping
            const snapThreshold = parseFloat(this.getAttribute('snap-threshold') || '5');
            if (Math.abs(percentage - 50) < snapThreshold) {
                percentage = 50;
            }
        }

        // Clamp to valid range
        percentage = Math.max(0, Math.min(100, percentage));

        this.state.currentPosition = percentage;

        // Update the grid layout
        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
        const handleSize = this.getAttribute('handle-size') || '8';
        const firstSize = `${percentage}%`;
        const secondSize = `${100 - percentage}%`;

        if (isHorizontal) {
            this.style.gridTemplateColumns = `${firstSize} ${handleSize}px ${secondSize}`;
        } else {
            this.style.gridTemplateRows = `${firstSize} ${handleSize}px ${secondSize}`;
        }

        // Update attribute
        this.setAttr('split-position', percentage.toFixed(1));
    }

    dispatchEvent(eventName, detail) {
        super.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    dispatchResizeEvent() {
        this.dispatchEvent('splitter-resize', {
            position: this.state.currentPosition,
            paneA: this.paneA,
            paneB: this.paneB
        });
    }

    render() {
        // Re-apply disabled state
        if (this.hasAttribute('disabled')) {
            this.handle.style.cursor = 'default';
            this.handle.style.opacity = '0.6';
            this.handle.tabIndex = -1;
        } else {
            const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
            this.handle.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
            this.handle.style.opacity = '1';
            this.handle.tabIndex = 0;
        }

        // Update position if changed
        const newPosition = this.getAttribute('split-position');
        if (newPosition && parseFloat(newPosition) !== this.state.currentPosition) {
            this.setPosition(newPosition);
        }
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();

        // Clean up any remaining global listeners
        document.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseup', this.handleMouseUp);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);

        // Reset body styles
        if (this.state.isDragging) {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        }
    }

    // Public API
    getSplitPosition() {
        return {
            percentage: this.state.currentPosition,
            pixels: this.getPixelPosition()
        };
    }

    getPixelPosition() {
        const rect = this.getBoundingClientRect();
        const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
        const size = isHorizontal ? rect.width : rect.height;
        const handleSize = parseFloat(this.getAttribute('handle-size') || '8');
        return ((this.state.currentPosition / 100) * (size - handleSize));
    }

    setSplitPosition(value) {
        if (typeof value === 'number') {
            if (value <= 1) {
                // Treat as percentage (0-1)
                this.setPosition(value * 100);
            } else if (value <= 100) {
                // Treat as percentage (0-100)
                this.setPosition(value);
            } else {
                // Treat as pixels - convert to percentage
                const rect = this.getBoundingClientRect();
                const isHorizontal = (this.getAttribute('orientation') || 'horizontal') === 'horizontal';
                const size = isHorizontal ? rect.width : rect.height;
                const handleSize = parseFloat(this.getAttribute('handle-size') || '8');
                const percentage = (value / (size - handleSize)) * 100;
                this.setPosition(percentage);
            }
        }
    }

    reset() {
        this.setPosition(50);
    }
}

customElements.define('x-splitter', XSplitter);