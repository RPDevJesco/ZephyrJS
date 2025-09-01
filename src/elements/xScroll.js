import XBase from '../core/XBase.js';

// Smooth Scrolling Container for Large Collections
export default class XScroll extends XBase {
    static get observedAttributes() {
        return [
            'direction', 'smooth', 'snap', 'center-active', 'loop',
            'auto-scroll', 'scroll-speed', 'show-arrows', 'show-dots',
            'items-visible', 'item-width', 'gap'
        ];
    }

    constructor() {
        super();
        this._container = null;
        this._scrollTrack = null;
        this._leftArrow = null;
        this._rightArrow = null;
        this._dotsContainer = null;
        this._items = [];
        this._currentIndex = 0;
        this._isScrolling = false;
        this._autoScrollTimer = null;
        this._observer = null;
    }

    onConnect(signal) {
        this._createScrollStructure();
        this._setupEventListeners(signal);
        this._setupIntersectionObserver();
        this._startAutoScroll();
        this.render();
    }

    _createScrollStructure() {
        // Container
        this._container = document.createElement('div');
        this._container.part = 'container';
        this._container.className = 'scroll-container';

        // Scroll track (holds the items)
        this._scrollTrack = document.createElement('div');
        this._scrollTrack.part = 'track';
        this._scrollTrack.className = 'scroll-track';

        // Navigation arrows
        this._leftArrow = document.createElement('button');
        this._leftArrow.part = 'arrow-left';
        this._leftArrow.className = 'scroll-arrow scroll-arrow-left';
        this._leftArrow.setAttribute('aria-label', 'Scroll left');
        this._leftArrow.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        `;

        this._rightArrow = document.createElement('button');
        this._rightArrow.part = 'arrow-right';
        this._rightArrow.className = 'scroll-arrow scroll-arrow-right';
        this._rightArrow.setAttribute('aria-label', 'Scroll right');
        this._rightArrow.innerHTML = `
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        `;

        // Dots indicator
        this._dotsContainer = document.createElement('div');
        this._dotsContainer.part = 'dots';
        this._dotsContainer.className = 'scroll-dots';

        // Move existing content to scroll track
        const existingItems = Array.from(this.children);
        existingItems.forEach((item, index) => {
            item.classList.add('scroll-item');
            item.dataset.scrollIndex = index.toString();
            this._scrollTrack.appendChild(item);
        });
        this._items = existingItems;

        // Clear and assemble structure
        this.innerHTML = '';
        this._container.appendChild(this._scrollTrack);

        this.appendChild(this._container);
        this.appendChild(this._leftArrow);
        this.appendChild(this._rightArrow);
        this.appendChild(this._dotsContainer);

        this._applyScrollStyles();
    }

    _applyScrollStyles() {
        const direction = this.getAttribute('direction') || 'horizontal';
        const itemWidth = this.getAttribute('item-width') || 'auto';
        const gap = this.getAttribute('gap') || '16px';
        const itemsVisible = Number(this.getAttribute('items-visible') || '0');
        const smooth = this.hasAttribute('smooth');
        const snap = this.hasAttribute('snap');

        // Main container styles
        this.style.cssText = `
            position: relative;
            display: block;
            width: 100%;
            overflow: hidden;
        `;

        // Scroll container styles
        this._container.style.cssText = `
            position: relative;
            overflow-x: ${direction === 'horizontal' ? 'auto' : 'hidden'};
            overflow-y: ${direction === 'vertical' ? 'auto' : 'hidden'};
            scroll-behavior: ${smooth ? 'smooth' : 'auto'};
            ${snap ? `scroll-snap-type: ${direction === 'horizontal' ? 'x' : 'y'} mandatory;` : ''}
            scrollbar-width: none;
            -ms-overflow-style: none;
        `;

        // Hide scrollbars
        const style = document.createElement('style');
        style.textContent = `
            .scroll-container::-webkit-scrollbar {
                display: none;
            }
        `;
        if (!document.head.querySelector('style[data-xscroll-styles]')) {
            style.setAttribute('data-xscroll-styles', '');
            document.head.appendChild(style);
        }

        // Scroll track styles
        this._scrollTrack.style.cssText = `
            display: flex;
            flex-direction: ${direction === 'horizontal' ? 'row' : 'column'};
            gap: ${gap};
            padding: 16px;
            ${direction === 'horizontal' ? 'width: max-content;' : 'height: max-content;'}
        `;

        // Item styles
        this._items.forEach((item, index) => {
            item.style.cssText = `
                flex-shrink: 0;
                ${itemWidth !== 'auto' ? `width: ${itemWidth};` : ''}
                ${itemsVisible > 0 ? `width: calc((100% - ${gap} * ${itemsVisible - 1}) / ${itemsVisible});` : ''}
                ${snap ? `scroll-snap-align: ${this.hasAttribute('center-active') ? 'center' : 'start'};` : ''}
                transition: all 0.3s ease;
            `;
        });

        // Arrow styles
        const showArrows = this.hasAttribute('show-arrows');
        const arrowStyles = `
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            z-index: 10;
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid #e5e7eb;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: ${showArrows ? 'flex' : 'none'};
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #374151;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        `;

        this._leftArrow.style.cssText = `
            ${arrowStyles}
            left: 8px;
        `;

        this._rightArrow.style.cssText = `
            ${arrowStyles}
            right: 8px;
        `;

        // Dots styles
        const showDots = this.hasAttribute('show-dots');
        this._dotsContainer.style.cssText = `
            display: ${showDots ? 'flex' : 'none'};
            justify-content: center;
            align-items: center;
            gap: 8px;
            padding: 16px 0;
        `;
    }

    _setupEventListeners(signal) {
        // Arrow click handlers
        this._leftArrow.addEventListener('click', () => {
            this.scrollPrevious();
        }, { signal });

        this._rightArrow.addEventListener('click', () => {
            this.scrollNext();
        }, { signal });

        // Arrow hover effects
        [this._leftArrow, this._rightArrow].forEach(arrow => {
            arrow.addEventListener('mouseenter', () => {
                arrow.style.background = 'white';
                arrow.style.transform = 'translateY(-50%) scale(1.05)';
            }, { signal });

            arrow.addEventListener('mouseleave', () => {
                arrow.style.background = 'rgba(255, 255, 255, 0.9)';
                arrow.style.transform = 'translateY(-50%) scale(1)';
            }, { signal });
        });

        // Container scroll handler
        this._container.addEventListener('scroll', () => {
            this._updateActiveItem();
            this._updateArrowStates();
            this._restartAutoScroll();
        }, { signal, passive: true });

        // Touch/swipe support
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        this._container.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isDragging = true;
            this._stopAutoScroll();
        }, { signal, passive: true });

        this._container.addEventListener('touchmove', (e) => {
            if (!isDragging) return;

            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            const direction = this.getAttribute('direction') || 'horizontal';

            // Prevent default scroll behavior for the appropriate direction
            if ((direction === 'horizontal' && Math.abs(deltaX) > Math.abs(deltaY)) ||
                (direction === 'vertical' && Math.abs(deltaY) > Math.abs(deltaX))) {
                e.preventDefault();
            }
        }, { signal });

        this._container.addEventListener('touchend', (e) => {
            if (!isDragging) return;

            const deltaX = e.changedTouches[0].clientX - startX;
            const deltaY = e.changedTouches[0].clientY - startY;
            const direction = this.getAttribute('direction') || 'horizontal';
            const threshold = 50;

            if (direction === 'horizontal') {
                if (Math.abs(deltaX) > threshold) {
                    if (deltaX > 0) {
                        this.scrollPrevious();
                    } else {
                        this.scrollNext();
                    }
                }
            } else {
                if (Math.abs(deltaY) > threshold) {
                    if (deltaY > 0) {
                        this.scrollPrevious();
                    } else {
                        this.scrollNext();
                    }
                }
            }

            isDragging = false;
            this._startAutoScroll();
        }, { signal, passive: true });

        // Keyboard navigation
        this.addEventListener('keydown', (e) => {
            const direction = this.getAttribute('direction') || 'horizontal';

            if ((direction === 'horizontal' && e.key === 'ArrowLeft') ||
                (direction === 'vertical' && e.key === 'ArrowUp')) {
                e.preventDefault();
                this.scrollPrevious();
            } else if ((direction === 'horizontal' && e.key === 'ArrowRight') ||
                (direction === 'vertical' && e.key === 'ArrowDown')) {
                e.preventDefault();
                this.scrollNext();
            }
        }, { signal });

        // Pause auto-scroll on hover
        this.addEventListener('mouseenter', () => {
            this._stopAutoScroll();
        }, { signal });

        this.addEventListener('mouseleave', () => {
            this._startAutoScroll();
        }, { signal });
    }

    _setupIntersectionObserver() {
        if (!window.IntersectionObserver) return;

        const options = {
            root: this._container,
            threshold: 0.5,
            rootMargin: '0px'
        };

        this._observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const item = entry.target;
                if (entry.isIntersecting) {
                    const index = Number(item.dataset.scrollIndex);
                    this._currentIndex = index;
                    this._updateActiveStates();

                    this._dispatchEvent('item-visible', {
                        item,
                        index,
                        isVisible: true
                    });
                }
            });
        }, options);

        this._items.forEach(item => {
            this._observer.observe(item);
        });
    }

    _updateActiveItem() {
        const direction = this.getAttribute('direction') || 'horizontal';
        const containerRect = this._container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const centerY = containerRect.top + containerRect.height / 2;

        let closestItem = null;
        let closestDistance = Infinity;

        this._items.forEach((item, index) => {
            const itemRect = item.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;

            const distance = direction === 'horizontal'
                ? Math.abs(centerX - itemCenterX)
                : Math.abs(centerY - itemCenterY);

            if (distance < closestDistance) {
                closestDistance = distance;
                closestItem = item;
                this._currentIndex = index;
            }
        });

        this._updateActiveStates();
    }

    _updateActiveStates() {
        // Update item active states
        this._items.forEach((item, index) => {
            const isActive = index === this._currentIndex;
            item.classList.toggle('active', isActive);
            item.setAttribute('aria-current', isActive.toString());

            if (this.hasAttribute('center-active') && isActive) {
                item.style.transform = 'scale(1.05)';
                item.style.zIndex = '2';
            } else {
                item.style.transform = 'scale(1)';
                item.style.zIndex = '1';
            }
        });

        // Update dots
        this._updateDots();
    }

    _updateArrowStates() {
        const direction = this.getAttribute('direction') || 'horizontal';
        const isAtStart = direction === 'horizontal'
            ? this._container.scrollLeft <= 0
            : this._container.scrollTop <= 0;

        const isAtEnd = direction === 'horizontal'
            ? this._container.scrollLeft >= this._container.scrollWidth - this._container.clientWidth
            : this._container.scrollTop >= this._container.scrollHeight - this._container.clientHeight;

        this._leftArrow.style.opacity = isAtStart ? '0.5' : '1';
        this._leftArrow.disabled = isAtStart;

        this._rightArrow.style.opacity = isAtEnd ? '0.5' : '1';
        this._rightArrow.disabled = isAtEnd;
    }

    _updateDots() {
        if (!this.hasAttribute('show-dots')) return;

        this._dotsContainer.innerHTML = '';

        this._items.forEach((_, index) => {
            const dot = document.createElement('button');
            dot.className = 'scroll-dot';
            dot.setAttribute('aria-label', `Go to item ${index + 1}`);

            const isActive = index === this._currentIndex;
            dot.style.cssText = `
                width: 8px;
                height: 8px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                transition: all 0.3s ease;
                background: ${isActive ? '#3b82f6' : '#d1d5db'};
                transform: ${isActive ? 'scale(1.25)' : 'scale(1)'};
            `;

            dot.addEventListener('click', () => {
                this.scrollToIndex(index);
            });

            dot.addEventListener('mouseenter', () => {
                if (!isActive) {
                    dot.style.background = '#9ca3af';
                }
            });

            dot.addEventListener('mouseleave', () => {
                if (!isActive) {
                    dot.style.background = '#d1d5db';
                }
            });

            this._dotsContainer.appendChild(dot);
        });
    }

    _startAutoScroll() {
        if (!this.hasAttribute('auto-scroll')) return;

        const speed = Number(this.getAttribute('scroll-speed') || '3000');

        this._autoScrollTimer = setInterval(() => {
            if (this.hasAttribute('loop')) {
                this.scrollNext();
            } else {
                if (this._currentIndex >= this._items.length - 1) {
                    this.scrollToIndex(0);
                } else {
                    this.scrollNext();
                }
            }
        }, speed);
    }

    _stopAutoScroll() {
        if (this._autoScrollTimer) {
            clearInterval(this._autoScrollTimer);
            this._autoScrollTimer = null;
        }
    }

    _restartAutoScroll() {
        this._stopAutoScroll();
        setTimeout(() => {
            this._startAutoScroll();
        }, 1000); // Wait 1 second before restarting
    }

    _dispatchEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    render() {
        if (!this._container) return;

        this._applyScrollStyles();
        this._updateActiveStates();
        this._updateArrowStates();
        this._updateDots();
    }

    // Public API
    scrollNext() {
        const nextIndex = this.hasAttribute('loop') && this._currentIndex >= this._items.length - 1
            ? 0
            : Math.min(this._currentIndex + 1, this._items.length - 1);

        this.scrollToIndex(nextIndex);
    }

    scrollPrevious() {
        const prevIndex = this.hasAttribute('loop') && this._currentIndex <= 0
            ? this._items.length - 1
            : Math.max(this._currentIndex - 1, 0);

        this.scrollToIndex(prevIndex);
    }

    scrollToIndex(index) {
        if (index < 0 || index >= this._items.length) return;

        const item = this._items[index];
        if (!item) return;

        const direction = this.getAttribute('direction') || 'horizontal';
        const behavior = this.hasAttribute('smooth') ? 'smooth' : 'auto';

        if (direction === 'horizontal') {
            item.scrollIntoView({
                behavior,
                block: 'nearest',
                inline: this.hasAttribute('center-active') ? 'center' : 'start'
            });
        } else {
            item.scrollIntoView({
                behavior,
                block: this.hasAttribute('center-active') ? 'center' : 'start',
                inline: 'nearest'
            });
        }

        this._currentIndex = index;
        this._updateActiveStates();

        this._dispatchEvent('scroll-to', {
            index,
            item
        });
    }

    getCurrentIndex() {
        return this._currentIndex;
    }

    getCurrentItem() {
        return this._items[this._currentIndex];
    }

    getItems() {
        return [...this._items];
    }

    addItem(element, index = -1) {
        element.classList.add('scroll-item');

        if (index === -1 || index >= this._items.length) {
            this._items.push(element);
            this._scrollTrack.appendChild(element);
        } else {
            this._items.splice(index, 0, element);
            const nextSibling = this._scrollTrack.children[index];
            this._scrollTrack.insertBefore(element, nextSibling);
        }

        // Update indices
        this._items.forEach((item, i) => {
            item.dataset.scrollIndex = i.toString();
        });

        if (this._observer) {
            this._observer.observe(element);
        }

        this.render();
    }

    removeItem(index) {
        if (index < 0 || index >= this._items.length) return false;

        const item = this._items[index];
        if (this._observer) {
            this._observer.unobserve(item);
        }

        this._items.splice(index, 1);
        item.remove();

        // Update indices
        this._items.forEach((item, i) => {
            item.dataset.scrollIndex = i.toString();
        });

        // Adjust current index if needed
        if (this._currentIndex >= index) {
            this._currentIndex = Math.max(0, this._currentIndex - 1);
        }

        this.render();
        return true;
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        this._stopAutoScroll();
        if (this._observer) {
            this._observer.disconnect();
        }
    }
}

customElements.define('x-scroll', XScroll);