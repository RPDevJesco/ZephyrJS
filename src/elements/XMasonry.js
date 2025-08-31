import XBase from '../core/XBase.js';

// Infinite Masonry Layout with Virtualization
export default class XMasonry extends XBase {
    static get observedAttributes() {
        return [
            'base-unit', 'gap', 'page-size', 'current-page',
            'is-loading', 'has-more', 'virtualize-buffer', 'patterns'
        ];
    }

    constructor() {
        super();
        this._items = [];
        this._positions = new Map();
        this._renderedItems = new Set();
        this._isInitialized = false;
        this._fetchFunction = null;
    }

    onConnect(signal) {
        if (!this._container) {
            this._createMasonryStructure();
            this._setupEventListeners(signal);
            this._isInitialized = true;
            this._loadInitialPage();
        }
    }

    _createMasonryStructure() {
        // Main masonry container
        this._container = document.createElement('div');
        this._container.part = 'container';
        this._container.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 100vh;
        `;

        // Modal for image viewing
        this._modal = document.createElement('div');
        this._modal.part = 'modal';
        this._modal.id = 'masonry-modal';
        this._modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            position: relative;
            max-width: 90vw;
            max-height: 90vh;
        `;

        this._modalImage = document.createElement('img');
        this._modalImage.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: -40px;
            right: 0;
            background: none;
            border: none;
            color: white;
            font-size: 30px;
            cursor: pointer;
            padding: 5px 10px;
        `;

        modalContent.appendChild(this._modalImage);
        modalContent.appendChild(closeBtn);
        this._modal.appendChild(modalContent);

        this.appendChild(this._container);
        document.body.appendChild(this._modal);

        // Setup modal close handlers
        closeBtn.addEventListener('click', () => this._closeModal());
        this._modal.addEventListener('click', (e) => {
            if (e.target === this._modal) this._closeModal();
        });
    }

    _setupEventListeners(signal) {
        // Throttled scroll handler for infinite loading and virtualization
        let scrollTimeout;
        const throttledScroll = () => {
            if (scrollTimeout) return;
            scrollTimeout = setTimeout(() => {
                this._handleScroll();
                this._updateVirtualization();
                scrollTimeout = null;
            }, 16); // ~60fps
        };

        window.addEventListener('scroll', throttledScroll, { signal, passive: true });

        // Debounced resize handler
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this._calculateAndRenderLayout();
            }, 150);
        };

        window.addEventListener('resize', debouncedResize, { signal });

        // Keyboard handler for modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this._modal.style.visibility === 'visible') {
                this._closeModal();
            }
        }, { signal });
    }

    _getDefaultPatterns() {
        return [
            { width: 2, height: 1 },    // Horizontal rectangle
            { width: 1, height: 2 },    // Vertical rectangle
            { width: 2, height: 2 },    // Large square
            { width: 1, height: 1 },    // Small square
        ];
    }

    _parsePatterns() {
        const patternsAttr = this.getAttribute('patterns');
        if (patternsAttr) {
            try {
                return JSON.parse(patternsAttr);
            } catch (e) {
                console.warn('XMasonry: Invalid patterns JSON, using defaults');
            }
        }
        return this._getDefaultPatterns();
    }

    async _loadInitialPage() {
        if (!this._fetchFunction) {
            console.warn('XMasonry: No fetch function set. Use setFetchFunction(fn)');
            return;
        }

        this.setAttr('current-page', '0');
        this.setAttr('is-loading', 'true');
        this.setAttr('has-more', 'true');

        await this._loadNextPage();
    }

    async _loadNextPage() {
        const currentPage = Number(this.getAttribute('current-page') || '0');
        const pageSize = Number(this.getAttribute('page-size') || '24');
        const isLoading = this.hasAttribute('is-loading');
        const hasMore = this.hasAttribute('has-more');

        if (isLoading || !hasMore || !this._fetchFunction) {
            return;
        }

        this.setAttr('is-loading', 'true');

        try {
            const newItems = await this._fetchFunction(currentPage, pageSize);

            // Add pattern information to each item
            const patterns = this._parsePatterns();
            const baseUnit = Number(this.getAttribute('base-unit') || '200');

            const processedItems = newItems.map((item, index) => {
                const pattern = patterns[index % patterns.length];
                return {
                    ...item,
                    pattern,
                    width: Math.round(pattern.width * baseUnit),
                    height: Math.round(pattern.height * baseUnit),
                    id: item.id || `${currentPage}-${index}`
                };
            });

            // Update items array
            this._items = [...this._items, ...processedItems];

            // Update attributes
            this.setAttr('current-page', String(currentPage + 1));

            if (newItems.length < pageSize) {
                this.removeAttribute('has-more');
            }

            // Recalculate layout with new items
            this._calculateAndRenderLayout();

            // Dispatch event
            this.dispatchEvent(new CustomEvent('masonry-loaded', {
                bubbles: true,
                composed: true,
                detail: {
                    page: currentPage,
                    newItems: processedItems.length,
                    totalItems: this._items.length
                }
            }));

        } catch (error) {
            console.error('XMasonry: Error loading page', error);

            // Dispatch error event
            this.dispatchEvent(new CustomEvent('masonry-error', {
                bubbles: true,
                composed: true,
                detail: { error, page: currentPage }
            }));
        } finally {
            this.removeAttribute('is-loading');
        }
    }

    _calculateLayout() {
        const containerWidth = this._container.clientWidth;
        const baseUnit = Number(this.getAttribute('base-unit') || '200');
        const gap = Number(this.getAttribute('gap') || '10');

        const positions = new Map();
        const grid = [];
        const cols = Math.floor(containerWidth / (baseUnit + gap));

        let currentX = 0;
        let currentY = 0;

        this._items.forEach(item => {
            const pattern = item.pattern;
            let placed = false;

            while (!placed) {
                if (currentX + pattern.width <= cols) {
                    let fits = true;
                    for (let y = currentY; y < currentY + pattern.height; y++) {
                        for (let x = currentX; x < currentX + pattern.width; x++) {
                            if (grid[y] && grid[y][x]) {
                                fits = false;
                                break;
                            }
                        }
                        if (!fits) break;
                    }

                    if (fits) {
                        // Mark grid cells as occupied
                        for (let y = currentY; y < currentY + pattern.height; y++) {
                            grid[y] = grid[y] || [];
                            for (let x = currentX; x < currentX + pattern.width; x++) {
                                grid[y][x] = item.id;
                            }
                        }

                        // Calculate position
                        positions.set(item.id, {
                            left: currentX * (baseUnit + gap),
                            top: currentY * (baseUnit + gap),
                            width: pattern.width * baseUnit + (pattern.width - 1) * gap,
                            height: pattern.height * baseUnit + (pattern.height - 1) * gap
                        });
                        placed = true;
                    }
                }

                if (!placed) {
                    currentX++;
                    if (currentX >= cols) {
                        currentX = 0;
                        currentY++;
                    }
                }
            }
        });

        // Set container height
        if (positions.size > 0) {
            const maxY = Math.max(...Array.from(positions.values()).map(pos =>
                pos.top + pos.height
            ));
            this._container.style.height = (maxY + gap) + 'px';
        }

        return positions;
    }

    _calculateAndRenderLayout() {
        this._positions = this._calculateLayout();
        this._updateVirtualization();
    }

    _updateVirtualization() {
        const buffer = Number(this.getAttribute('virtualize-buffer') || '2000');
        const viewportTop = window.scrollY - buffer;
        const viewportBottom = window.scrollY + window.innerHeight + buffer;

        this._items.forEach(item => {
            const position = this._positions.get(item.id);
            if (!position) return;

            const shouldRender = position.top < viewportBottom &&
                position.top + position.height > viewportTop;

            if (shouldRender && !this._renderedItems.has(item.id)) {
                this._renderItem(item, position);
                this._renderedItems.add(item.id);
            } else if (!shouldRender && this._renderedItems.has(item.id)) {
                this._removeItem(item.id);
                this._renderedItems.delete(item.id);
            }
        });
    }

    _renderItem(item, position) {
        const element = document.createElement('div');
        element.id = `masonry-item-${item.id}`;
        element.className = 'masonry-item';
        element.part = 'item';

        element.style.cssText = `
            position: absolute;
            left: ${position.left}px;
            top: ${position.top}px;
            width: ${position.width}px;
            height: ${position.height}px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        `;

        // Hover effects
        element.addEventListener('mouseenter', () => {
            element.style.transform = 'scale(1.02)';
            element.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
        });

        element.addEventListener('mouseleave', () => {
            element.style.transform = 'scale(1)';
            element.style.boxShadow = 'none';
        });

        // Click to open modal
        element.addEventListener('click', () => {
            this._openModal(item.src || item.url || '');
        });

        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.style.cssText = `
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), 
                        linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), 
                        linear-gradient(45deg, transparent 75%, #f0f0f0 75%), 
                        linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
            background-size: 20px 20px;
            background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #999;
        `;

        // Load image
        if (item.src || item.url) {
            const img = new Image();

            img.onload = () => {
                placeholder.remove();
                img.style.cssText = `
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: opacity 0.3s ease;
                `;
                element.appendChild(img);
            };

            img.onerror = () => {
                placeholder.innerHTML = '<span>Failed to load</span>';
            };

            img.src = item.src || item.url;
            img.alt = item.alt || `Masonry item ${item.id}`;
        }

        element.appendChild(placeholder);
        this._container.appendChild(element);
    }

    _removeItem(itemId) {
        const element = document.getElementById(`masonry-item-${itemId}`);
        if (element) {
            element.remove();
        }
    }

    _handleScroll() {
        const scrollBottom = window.scrollY + window.innerHeight;
        const containerBottom = this._container.offsetTop + this._container.offsetHeight;
        const remainingScroll = containerBottom - scrollBottom;

        // Load more when approaching bottom
        if (remainingScroll < 1000 && this.hasAttribute('has-more')) {
            this._loadNextPage();
        }
    }

    _openModal(imageSrc) {
        if (!imageSrc) return;

        this._modalImage.src = imageSrc;
        this._modal.style.visibility = 'visible';
        this._modal.style.opacity = '1';
        document.body.style.overflow = 'hidden';

        // Dispatch event
        this.dispatchEvent(new CustomEvent('masonry-modal-open', {
            bubbles: true,
            composed: true,
            detail: { imageSrc }
        }));
    }

    _closeModal() {
        this._modal.style.opacity = '0';
        this._modal.style.visibility = 'hidden';
        document.body.style.overflow = '';

        // Dispatch event
        this.dispatchEvent(new CustomEvent('masonry-modal-close', {
            bubbles: true,
            composed: true
        }));
    }

    render() {
        if (!this._isInitialized) return;

        // Re-render layout if container dimensions changed
        this._calculateAndRenderLayout();
    }

    // Public API methods
    setFetchFunction(fetchFn) {
        this._fetchFunction = fetchFn;
    }

    addItems(items) {
        const baseUnit = Number(this.getAttribute('base-unit') || '200');
        const patterns = this._parsePatterns();

        const processedItems = items.map((item, index) => {
            const pattern = patterns[(this._items.length + index) % patterns.length];
            return {
                ...item,
                pattern,
                width: Math.round(pattern.width * baseUnit),
                height: Math.round(pattern.height * baseUnit),
                id: item.id || `manual-${Date.now()}-${index}`
            };
        });

        this._items = [...this._items, ...processedItems];
        this._calculateAndRenderLayout();

        return processedItems;
    }

    refresh() {
        this._items = [];
        this._positions.clear();
        this._renderedItems.clear();
        this._container.innerHTML = '';
        this.setAttr('current-page', '0');
        this.setAttr('has-more', 'true');
        this._loadInitialPage();
    }

    getStats() {
        return {
            totalItems: this._items.length,
            renderedItems: this._renderedItems.size,
            currentPage: Number(this.getAttribute('current-page') || '0'),
            isLoading: this.hasAttribute('is-loading'),
            hasMore: this.hasAttribute('has-more')
        };
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._modal && this._modal.parentNode) {
            this._modal.parentNode.removeChild(this._modal);
        }
    }
}

customElements.define('x-masonry', XMasonry);