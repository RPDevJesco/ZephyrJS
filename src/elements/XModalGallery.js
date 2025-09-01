import XBase from '../core/XBase.js';

export default class XModalGallery extends XBase {
    static get observedAttributes() {
        return [
            'items', 'current-index', 'show-thumbnails', 'show-captions',
            'show-counter', 'auto-play', 'auto-play-delay', 'loop',
            'keyboard-nav', 'touch-nav', 'zoom-enabled'
        ];
    }

    constructor() {
        super();
        this._items = [];
        this._currentIndex = 0;
        this._isOpen = false;
        this._autoPlayTimer = null;
        this._zoomLevel = 1;
        this._panOffset = { x: 0, y: 0 };
        this._isDragging = false;
        this._dragStart = { x: 0, y: 0 };
        this._touchStart = { x: 0, y: 0 };

        // DOM elements
        this._modal = null;
        this._backdrop = null;
        this._container = null;
        this._imageArea = null;
        this._mainImage = null;
        this._controls = null;
        this._thumbnails = null;
        this._caption = null;
        this._counter = null;

        // Bound methods for cleanup
        this._boundKeyHandler = this._handleKeyDown.bind(this);
        this._boundMouseMove = this._handleMouseMove.bind(this);
        this._boundMouseUp = this._handleMouseUp.bind(this);
    }

    onConnect(signal) {
        this._parseItems();
        this._createModal();
        this._setupEventListeners(signal);
        this.render();
    }

    _parseItems() {
        const itemsAttr = this.getAttribute('items');
        if (itemsAttr) {
            try {
                this._items = JSON.parse(itemsAttr);
            } catch (e) {
                console.warn('XModalGallery: Invalid items JSON');
                this._items = [];
            }
        }

        // Parse from child elements
        const childImages = Array.from(this.querySelectorAll('img, [data-gallery-item]'));
        childImages.forEach((el) => {
            if (el.tagName === 'IMG') {
                this._items.push({
                    src: el.src,
                    alt: el.alt,
                    caption: el.title || el.dataset.caption || '',
                    thumbnail: el.dataset.thumbnail || el.src
                });
            } else {
                this._items.push({
                    src: el.dataset.src || '',
                    alt: el.dataset.alt || '',
                    caption: el.dataset.caption || '',
                    thumbnail: el.dataset.thumbnail || el.dataset.src || ''
                });
            }
        });
    }

    _createModal() {
        // Remove existing modal if it exists
        if (this._modal) {
            this._modal.remove();
        }

        // Backdrop
        this._backdrop = this._createElement('div', 'gallery-backdrop', {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            zIndex: '1000',
            opacity: '0',
            visibility: 'hidden',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        // Main container
        this._container = this._createElement('div', 'gallery-container', {
            position: 'relative',
            width: '95vw',
            height: '95vh',
            maxWidth: '1200px',
            maxHeight: '900px',
            backgroundColor: '#1a1a1a',
            borderRadius: '12px',
            overflow: 'hidden',
            transform: 'scale(0.9)',
            transition: 'transform 0.3s ease',
            display: 'flex',
            flexDirection: 'column'
        });

        // Image area
        this._imageArea = this._createElement('div', 'gallery-image-area', {
            flex: '1',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#000'
        });

        // Main image
        this._mainImage = this._createElement('img', 'gallery-main-image', {
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            transition: 'transform 0.3s ease',
            cursor: 'grab',
            userSelect: 'none',
            pointerEvents: 'auto'
        });

        // Controls container
        this._controls = this._createElement('div', 'gallery-controls', {
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '60px',
            background: 'linear-gradient(rgba(0,0,0,0.7), transparent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: '10'
        });

        // Counter
        this._counter = this._createElement('div', 'gallery-counter', {
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            backgroundColor: 'rgba(0,0,0,0.5)',
            padding: '6px 12px',
            borderRadius: '20px'
        });

        // Close button
        const closeBtn = this._createButton('gallery-close-btn', '×', {
            fontSize: '24px',
            width: '40px',
            height: '40px'
        });

        // Navigation buttons
        const prevBtn = this._createButton('gallery-prev-btn', '‹', {
            fontSize: '32px',
            width: '50px',
            height: '50px',
            position: 'absolute',
            left: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: '15'  // Higher z-index to ensure it's clickable
        });

        const nextBtn = this._createButton('gallery-next-btn', '›', {
            fontSize: '32px',
            width: '50px',
            height: '50px',
            position: 'absolute',
            right: '20px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: '15'  // Higher z-index to ensure it's clickable
        });

        // Zoom controls
        const zoomControls = this._createElement('div', 'gallery-zoom-controls', {
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            display: 'flex',
            gap: '8px',
            zIndex: '10'
        });

        const zoomInBtn = this._createButton('zoom-in-btn', '+', { width: '36px', height: '36px' });
        const zoomOutBtn = this._createButton('zoom-out-btn', '−', { width: '36px', height: '36px' });
        const zoomResetBtn = this._createButton('zoom-reset-btn', '1:1', { width: '36px', height: '36px', fontSize: '12px' });

        // Caption
        this._caption = this._createElement('div', 'gallery-caption', {
            backgroundColor: '#2a2a2a',
            color: 'white',
            padding: '16px 20px',
            fontSize: '14px',
            lineHeight: '1.5',
            borderTop: '1px solid #444'
        });

        // Thumbnails
        this._thumbnails = this._createElement('div', 'gallery-thumbnails', {
            backgroundColor: '#2a2a2a',
            padding: '16px 20px',
            display: 'flex',
            gap: '12px',
            overflowX: 'auto',
            borderTop: '1px solid #444',
            scrollbarWidth: 'thin',
            scrollbarColor: '#666 #2a2a2a'
        });

        // Assembly
        zoomControls.append(zoomInBtn, zoomOutBtn, zoomResetBtn);
        this._controls.append(this._counter, closeBtn);
        this._imageArea.append(this._mainImage, this._controls, prevBtn, nextBtn, zoomControls);
        this._container.append(this._imageArea, this._caption, this._thumbnails);
        this._backdrop.appendChild(this._container);

        // Store references to buttons for event handling
        this._closeBtn = closeBtn;
        this._prevBtn = prevBtn;
        this._nextBtn = nextBtn;
        this._zoomInBtn = zoomInBtn;
        this._zoomOutBtn = zoomOutBtn;
        this._zoomResetBtn = zoomResetBtn;

        document.body.appendChild(this._backdrop);
        this._modal = this._backdrop; // For compatibility
    }

    _createElement(tag, className, styles = {}) {
        const element = document.createElement(tag);
        element.className = className;
        Object.assign(element.style, styles);
        return element;
    }

    _createButton(className, text, styles = {}) {
        const button = document.createElement('button');
        button.className = className;
        button.textContent = text;

        const defaultStyles = {
            backgroundColor: 'rgba(0,0,0,0.6)',
            border: 'none',
            borderRadius: '50%',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            fontSize: '18px',
            fontWeight: 'bold'
        };

        Object.assign(button.style, defaultStyles, styles);

        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = 'rgba(0,0,0,0.8)';
            button.style.transform = (styles.transform || '') + ' scale(1.1)';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = 'rgba(0,0,0,0.6)';
            button.style.transform = styles.transform || '';
        });

        return button;
    }

    _setupEventListeners(signal) {
        // Only prevent backdrop clicks, not all container clicks
        this._backdrop.addEventListener('click', (e) => {
            if (e.target === this._backdrop) {
                this.close();
            }
        }, { signal });

        // Control buttons - simple and direct
        this._closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
        }, { signal });

        this._prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.previous();
        }, { signal });

        this._nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.next();
        }, { signal });

        // Zoom controls - simple and direct
        this._zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._zoom(1.25);
        }, { signal });

        this._zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._zoom(0.8);
        }, { signal });

        this._zoomResetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this._resetZoom();
        }, { signal });

        // Image interactions
        this._mainImage.addEventListener('wheel', this._handleWheel.bind(this), { signal, passive: false });
        this._mainImage.addEventListener('mousedown', this._handleMouseDown.bind(this), { signal });

        // Touch events
        this._imageArea.addEventListener('touchstart', this._handleTouchStart.bind(this), { signal, passive: false });
        this._imageArea.addEventListener('touchmove', this._handleTouchMove.bind(this), { signal, passive: false });
        this._imageArea.addEventListener('touchend', this._handleTouchEnd.bind(this), { signal, passive: false });

        // Double click to reset zoom
        this._mainImage.addEventListener('dblclick', () => this._resetZoom(), { signal });

        // Image load handler
        this._mainImage.addEventListener('load', () => {
            this._resetZoom();
            this._dispatchEvent('image-loaded', {
                index: this._currentIndex,
                item: this._items[this._currentIndex]
            });
        }, { signal });
    }

    _handleKeyDown(e) {
        if (!this._isOpen) return;

        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.close();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.previous();
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.next();
                break;
            case '+':
            case '=':
                e.preventDefault();
                this._zoom(1.25);
                break;
            case '-':
                e.preventDefault();
                this._zoom(0.8);
                break;
            case '0':
                e.preventDefault();
                this._resetZoom();
                break;
        }
    }

    _handleWheel(e) {
        if (!this.hasAttribute('zoom-enabled')) return;

        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this._zoom(delta);
    }

    _handleMouseDown(e) {
        if (this._zoomLevel <= 1) return;

        this._isDragging = true;
        this._dragStart = {
            x: e.clientX - this._panOffset.x,
            y: e.clientY - this._panOffset.y
        };

        this._mainImage.style.cursor = 'grabbing';
        document.addEventListener('mousemove', this._boundMouseMove);
        document.addEventListener('mouseup', this._boundMouseUp);
        e.preventDefault();
    }

    _handleMouseMove(e) {
        if (!this._isDragging) return;

        this._panOffset = {
            x: e.clientX - this._dragStart.x,
            y: e.clientY - this._dragStart.y
        };

        this._updateImageTransform();
    }

    _handleMouseUp() {
        this._isDragging = false;
        this._mainImage.style.cursor = this._zoomLevel > 1 ? 'grab' : 'default';
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);
    }

    _handleTouchStart(e) {
        if (!this.hasAttribute('touch-nav')) return;

        this._touchStart = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            time: Date.now()
        };
    }

    _handleTouchMove(e) {
        if (!this.hasAttribute('touch-nav')) return;

        // Prevent default for horizontal swipes
        const deltaX = Math.abs(e.touches[0].clientX - this._touchStart.x);
        const deltaY = Math.abs(e.touches[0].clientY - this._touchStart.y);

        if (deltaX > deltaY) {
            e.preventDefault();
        }
    }

    _handleTouchEnd(e) {
        if (!this.hasAttribute('touch-nav')) return;

        const deltaX = e.changedTouches[0].clientX - this._touchStart.x;
        const deltaY = Math.abs(e.changedTouches[0].clientY - this._touchStart.y);
        const deltaTime = Date.now() - this._touchStart.time;

        // Check for swipe gesture
        if (Math.abs(deltaX) > 50 && deltaY < 100 && deltaTime < 300) {
            if (deltaX > 0) {
                this.previous();
            } else {
                this.next();
            }
        }
    }

    _zoom(factor) {
        if (!this.hasAttribute('zoom-enabled')) return;

        this._zoomLevel = Math.max(0.5, Math.min(5, this._zoomLevel * factor));

        if (this._zoomLevel <= 1) {
            this._panOffset = { x: 0, y: 0 };
            this._mainImage.style.cursor = 'default';
        } else {
            this._mainImage.style.cursor = 'grab';
        }

        this._updateImageTransform();
    }

    _resetZoom() {
        this._zoomLevel = 1;
        this._panOffset = { x: 0, y: 0 };
        this._mainImage.style.cursor = 'default';
        this._updateImageTransform();
    }

    _updateImageTransform() {
        const scale = this._zoomLevel;
        const translateX = this._panOffset.x / scale;
        const translateY = this._panOffset.y / scale;

        this._mainImage.style.transform =
            `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
    }

    _generateThumbnails() {
        this._thumbnails.innerHTML = '';

        this._items.forEach((item, index) => {
            const thumb = this._createElement('img', 'gallery-thumbnail', {
                width: '60px',
                height: '60px',
                objectFit: 'cover',
                borderRadius: '4px',
                cursor: 'pointer',
                opacity: index === this._currentIndex ? '1' : '0.6',
                border: index === this._currentIndex ? '2px solid #3b82f6' : '2px solid transparent',
                transition: 'all 0.2s ease',
                flexShrink: '0'
            });

            thumb.src = item.thumbnail || item.src;
            thumb.alt = item.alt;

            // Use a more direct approach for thumbnail clicks
            thumb.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                e.stopImmediatePropagation();

                // Use requestAnimationFrame to ensure the click is processed after any other events
                requestAnimationFrame(() => {
                    this.goToIndex(index);
                });
            }, { passive: false, capture: true });

            thumb.addEventListener('mouseenter', () => {
                if (index !== this._currentIndex) {
                    thumb.style.opacity = '0.8';
                }
            });

            thumb.addEventListener('mouseleave', () => {
                if (index !== this._currentIndex) {
                    thumb.style.opacity = '0.6';
                }
            });

            this._thumbnails.appendChild(thumb);
        });
    }

    _updateContent() {
        if (this._items.length === 0) return;

        const currentItem = this._items[this._currentIndex];
        if (!currentItem) return;

        // Update main image
        this._mainImage.src = currentItem.src;
        this._mainImage.alt = currentItem.alt || '';

        // Update counter
        if (this.hasAttribute('show-counter')) {
            this._counter.textContent = `${this._currentIndex + 1} / ${this._items.length}`;
            this._counter.style.display = 'block';
        } else {
            this._counter.style.display = 'none';
        }

        // Update caption
        if (this.hasAttribute('show-captions') && currentItem.caption) {
            this._caption.textContent = currentItem.caption;
            this._caption.style.display = 'block';
        } else {
            this._caption.style.display = 'none';
        }

        // Update thumbnails
        if (this.hasAttribute('show-thumbnails')) {
            this._thumbnails.style.display = 'flex';
            this._generateThumbnails();
        } else {
            this._thumbnails.style.display = 'none';
        }

        // Update navigation buttons
        const canGoPrev = this._currentIndex > 0 || this.hasAttribute('loop');
        const canGoNext = this._currentIndex < this._items.length - 1 || this.hasAttribute('loop');

        this._prevBtn.style.opacity = canGoPrev ? '1' : '0.3';
        this._prevBtn.disabled = !canGoPrev;
        this._nextBtn.style.opacity = canGoNext ? '1' : '0.3';
        this._nextBtn.disabled = !canGoNext;

        // Show/hide zoom controls
        if (this.hasAttribute('zoom-enabled')) {
            this._zoomInBtn.parentElement.style.display = 'flex';
        } else {
            this._zoomInBtn.parentElement.style.display = 'none';
        }
    }

    _startAutoPlay() {
        if (!this.hasAttribute('auto-play') || this._items.length <= 1) return;

        const delay = Number(this.getAttribute('auto-play-delay') || '5000');
        this._autoPlayTimer = setInterval(() => {
            this.next();
        }, delay);
    }

    _stopAutoPlay() {
        if (this._autoPlayTimer) {
            clearInterval(this._autoPlayTimer);
            this._autoPlayTimer = null;
        }
    }

    _dispatchEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    // Public API
    open(index = 0) {
        if (this._items.length === 0) return;

        this._currentIndex = Math.max(0, Math.min(index, this._items.length - 1));
        this._isOpen = true;

        // Show modal
        this._backdrop.style.opacity = '1';
        this._backdrop.style.visibility = 'visible';
        this._container.style.transform = 'scale(1)';

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Add keyboard listener
        if (this.hasAttribute('keyboard-nav')) {
            document.addEventListener('keydown', this._boundKeyHandler);
        }

        this._updateContent();
        this._startAutoPlay();

        this._dispatchEvent('gallery-opened', {
            index: this._currentIndex,
            item: this._items[this._currentIndex]
        });
    }

    close() {
        if (!this._isOpen) return;

        this._isOpen = false;

        // Hide modal
        this._backdrop.style.opacity = '0';
        this._backdrop.style.visibility = 'hidden';
        this._container.style.transform = 'scale(0.9)';

        // Restore body scroll
        document.body.style.overflow = '';

        // Remove keyboard listener
        document.removeEventListener('keydown', this._boundKeyHandler);

        this._stopAutoPlay();
        this._resetZoom();

        this._dispatchEvent('gallery-closed', {
            index: this._currentIndex
        });
    }

    next() {
        if (this._items.length <= 1) return;

        let nextIndex = this._currentIndex + 1;
        if (nextIndex >= this._items.length) {
            if (this.hasAttribute('loop')) {
                nextIndex = 0;
            } else {
                return;
            }
        }

        console.log('Next clicked - moving to index:', nextIndex); // Debug log
        this.goToIndex(nextIndex);
    }

    previous() {
        if (this._items.length <= 1) return;

        let prevIndex = this._currentIndex - 1;
        if (prevIndex < 0) {
            if (this.hasAttribute('loop')) {
                prevIndex = this._items.length - 1;
            } else {
                return;
            }
        }

        console.log('Previous clicked - moving to index:', prevIndex); // Debug log
        this.goToIndex(prevIndex);
    }

    goToIndex(index) {
        if (index < 0 || index >= this._items.length || index === this._currentIndex) return;

        this._currentIndex = index;
        this.setAttr('current-index', index.toString());

        this._updateContent();
        this._resetZoom();

        this._dispatchEvent('gallery-changed', {
            index: this._currentIndex,
            item: this._items[this._currentIndex]
        });
    }

    setItems(items) {
        this._items = Array.isArray(items) ? items : [];
        this.setAttr('items', JSON.stringify(this._items));
        this._currentIndex = 0;

        if (this._isOpen) {
            this._updateContent();
        }
    }

    getItems() {
        return [...this._items];
    }

    getCurrentItem() {
        return this._items[this._currentIndex] || null;
    }

    getCurrentIndex() {
        return this._currentIndex;
    }

    isOpen() {
        return this._isOpen;
    }

    render() {
        if (this._modal) {
            this._updateContent();
        }
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();

        this._stopAutoPlay();

        // Clean up event listeners
        document.removeEventListener('keydown', this._boundKeyHandler);
        document.removeEventListener('mousemove', this._boundMouseMove);
        document.removeEventListener('mouseup', this._boundMouseUp);

        // Remove modal from DOM
        if (this._backdrop && this._backdrop.parentNode) {
            this._backdrop.parentNode.removeChild(this._backdrop);
        }

        // Restore body scroll if modal was open
        if (this._isOpen) {
            document.body.style.overflow = '';
        }
    }
}

customElements.define('x-modal-gallery', XModalGallery);