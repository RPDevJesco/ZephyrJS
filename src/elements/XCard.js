import XBase from '../core/XBase.js';

// Content Card with Header/Body/Footer sections
export default class XCard extends XBase {
    static get observedAttributes() {
        return [
            'variant', 'elevated', 'bordered', 'hoverable', 'clickable',
            'loading', 'image', 'image-position', 'compact'
        ];
    }

    constructor() {
        super();
        this._header = null;
        this._body = null;
        this._footer = null;
        this._imageElement = null;
        this._loadingOverlay = null;
    }

    onConnect(signal) {
        this._createCardStructure();
        this._setupEventListeners(signal);
        this.render();
    }

    _createCardStructure() {
        // Preserve existing content and organize by data attributes
        const existingContent = Array.from(this.children);

        // Create card sections
        this._header = document.createElement('div');
        this._header.part = 'header';
        this._header.className = 'card-header';

        this._body = document.createElement('div');
        this._body.part = 'body';
        this._body.className = 'card-body';

        this._footer = document.createElement('div');
        this._footer.part = 'footer';
        this._footer.className = 'card-footer';

        // Create image element
        this._imageElement = document.createElement('div');
        this._imageElement.part = 'image';
        this._imageElement.className = 'card-image';

        // Create loading overlay
        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.part = 'loading';
        this._loadingOverlay.className = 'card-loading';
        this._loadingOverlay.innerHTML = `
            <div class="loading-spinner">
                <svg width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" 
                            stroke-width="2" stroke-linecap="round" stroke-dasharray="32" 
                            stroke-dashoffset="32">
                        <animate attributeName="stroke-dasharray" dur="2s" 
                                values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" 
                                values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <span>Loading...</span>
            </div>
        `;

        // Organize existing content
        const headerContent = existingContent.filter(el =>
            el.hasAttribute('data-card-section') && el.getAttribute('data-card-section') === 'header'
        );
        const bodyContent = existingContent.filter(el =>
            !el.hasAttribute('data-card-section') || el.getAttribute('data-card-section') === 'body'
        );
        const footerContent = existingContent.filter(el =>
            el.hasAttribute('data-card-section') && el.getAttribute('data-card-section') === 'footer'
        );

        // Move content to appropriate sections
        headerContent.forEach(el => this._header.appendChild(el));
        bodyContent.forEach(el => this._body.appendChild(el));
        footerContent.forEach(el => this._footer.appendChild(el));

        // Clear and rebuild structure
        this.innerHTML = '';

        // Add image if specified
        const imageUrl = this.getAttribute('image');
        if (imageUrl) {
            this._setupImage(imageUrl);
        }

        // Add sections (order depends on image position)
        this._arrangeCardSections();

        // Add loading overlay
        this.appendChild(this._loadingOverlay);

        this._applyCardStyles();
    }

    _setupImage(url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = this.getAttribute('image-alt') || '';
        img.style.cssText = `
            width: 100%;
            height: 100%;
            object-fit: cover;
            display: block;
        `;

        // Handle image loading
        img.addEventListener('load', () => {
            this._imageElement.classList.add('loaded');
        });

        img.addEventListener('error', () => {
            this._imageElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; 
                           height: 100%; color: #9ca3af; font-size: 14px;">
                    <svg width="48" height="48" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                    </svg>
                </div>
            `;
        });

        this._imageElement.innerHTML = '';
        this._imageElement.appendChild(img);
    }

    _arrangeCardSections() {
        const imagePosition = this.getAttribute('image-position') || 'top';

        // Clear existing arrangement
        [this._imageElement, this._header, this._body, this._footer].forEach(section => {
            if (section.parentNode === this) {
                this.removeChild(section);
            }
        });

        // Arrange based on image position
        switch (imagePosition) {
            case 'top':
                this._appendNonEmptySections([this._imageElement, this._header, this._body, this._footer]);
                break;
            case 'bottom':
                this._appendNonEmptySections([this._header, this._body, this._footer, this._imageElement]);
                break;
            case 'left':
                this._createSideImageLayout('left');
                break;
            case 'right':
                this._createSideImageLayout('right');
                break;
            default:
                this._appendNonEmptySections([this._header, this._body, this._footer]);
        }
    }

    _createSideImageLayout(side) {
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `
            display: flex;
            ${side === 'right' ? 'flex-direction: row-reverse;' : ''}
            height: 100%;
        `;

        const contentWrapper = document.createElement('div');
        contentWrapper.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
        `;

        this._imageElement.style.width = '40%';
        this._imageElement.style.flexShrink = '0';

        this._appendNonEmptySections([this._header, this._body, this._footer], contentWrapper);

        if (this.getAttribute('image')) {
            wrapper.appendChild(this._imageElement);
        }
        wrapper.appendChild(contentWrapper);
        this.appendChild(wrapper);
    }

    _appendNonEmptySections(sections, container = this) {
        sections.forEach(section => {
            if (section === this._imageElement) {
                if (this.getAttribute('image')) {
                    container.appendChild(section);
                }
            } else if (section.children.length > 0 || section.textContent.trim()) {
                container.appendChild(section);
            }
        });
    }

    _applyCardStyles() {
        const variant = this.getAttribute('variant') || 'default';
        const elevated = this.hasAttribute('elevated');
        const bordered = this.hasAttribute('bordered');
        const compact = this.hasAttribute('compact');

        // Base card styles
        this.style.cssText = `
            display: block;
            position: relative;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            transition: all 0.2s ease;
            ${this._getVariantStyles(variant)}
            ${elevated ? this._getElevationStyles() : ''}
            ${bordered ? 'border: 1px solid #e5e7eb;' : ''}
        `;

        // Header styles
        this._header.style.cssText = `
            padding: ${compact ? '12px 16px' : '16px 20px'};
            border-bottom: 1px solid #f3f4f6;
            font-weight: 600;
            font-size: 18px;
            color: #111827;
        `;

        // Body styles
        this._body.style.cssText = `
            padding: ${compact ? '12px 16px' : '16px 20px'};
            flex: 1;
            color: #374151;
            line-height: 1.6;
        `;

        // Footer styles
        this._footer.style.cssText = `
            padding: ${compact ? '12px 16px' : '16px 20px'};
            border-top: 1px solid #f3f4f6;
            background: #f9fafb;
            font-size: 14px;
            color: #6b7280;
        `;

        // Image styles
        this._imageElement.style.cssText = `
            position: relative;
            background: #f3f4f6;
            ${this._getImagePositionStyles()}
        `;

        // Loading overlay styles
        this._loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10;
            opacity: ${this.hasAttribute('loading') ? '1' : '0'};
            visibility: ${this.hasAttribute('loading') ? 'visible' : 'hidden'};
            transition: all 0.3s ease;
        `;

        // Loading spinner styles
        const spinner = this._loadingOverlay.querySelector('.loading-spinner');
        if (spinner) {
            spinner.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 8px;
                color: #6b7280;
                font-size: 14px;
            `;
        }
    }

    _getVariantStyles(variant) {
        const variants = {
            default: '',
            primary: 'border: 2px solid #3b82f6; background: #eff6ff;',
            success: 'border: 2px solid #10b981; background: #ecfdf5;',
            warning: 'border: 2px solid #f59e0b; background: #fffbeb;',
            danger: 'border: 2px solid #ef4444; background: #fef2f2;',
            info: 'border: 2px solid #06b6d4; background: #f0f9ff;'
        };
        return variants[variant] || variants.default;
    }

    _getElevationStyles() {
        return `
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        `;
    }

    _getImagePositionStyles() {
        const position = this.getAttribute('image-position') || 'top';
        switch (position) {
            case 'top':
            case 'bottom':
                return 'height: 200px;';
            case 'left':
            case 'right':
                return 'height: 100%;';
            default:
                return 'height: 200px;';
        }
    }

    _setupEventListeners(signal) {
        // Handle hoverable cards
        if (this.hasAttribute('hoverable')) {
            this.addEventListener('mouseenter', () => {
                this.style.transform = 'translateY(-2px)';
                if (this.hasAttribute('elevated')) {
                    this.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
                }
            }, { signal });

            this.addEventListener('mouseleave', () => {
                this.style.transform = 'translateY(0)';
                if (this.hasAttribute('elevated')) {
                    this.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
                }
            }, { signal });
        }

        // Handle clickable cards
        if (this.hasAttribute('clickable')) {
            this.style.cursor = 'pointer';
            this.setAttribute('tabindex', '0');
            this.setAttribute('role', 'button');

            this.addEventListener('click', (e) => {
                this._dispatchEvent('card-click', { originalEvent: e });
            }, { signal });

            this.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this._dispatchEvent('card-click', { originalEvent: e });
                }
            }, { signal });

            // Focus styles
            this.addEventListener('focus', () => {
                this.style.outline = '2px solid #3b82f6';
                this.style.outlineOffset = '2px';
            }, { signal });

            this.addEventListener('blur', () => {
                this.style.outline = 'none';
            }, { signal });
        }
    }

    _dispatchEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    render() {
        if (!this._body) return;

        this._applyCardStyles();

        // Update image if changed
        const imageUrl = this.getAttribute('image');
        if (imageUrl && !this._imageElement.querySelector('img')) {
            this._setupImage(imageUrl);
        } else if (!imageUrl && this._imageElement.querySelector('img')) {
            this._imageElement.innerHTML = '';
        }

        // Re-arrange sections if image position changed
        this._arrangeCardSections();
    }

    // Public API
    setLoading(loading) {
        if (loading) {
            this.setAttr('loading', '');
        } else {
            this.removeAttribute('loading');
        }
    }

    setImage(url, alt = '') {
        this.setAttr('image', url);
        if (alt) {
            this.setAttr('image-alt', alt);
        }
    }

    updateContent(section, content) {
        let targetSection;
        switch (section) {
            case 'header':
                targetSection = this._header;
                break;
            case 'body':
                targetSection = this._body;
                break;
            case 'footer':
                targetSection = this._footer;
                break;
            default:
                return false;
        }

        if (typeof content === 'string') {
            targetSection.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            targetSection.innerHTML = '';
            targetSection.appendChild(content);
        }

        this._arrangeCardSections();
        return true;
    }

    getContent(section) {
        switch (section) {
            case 'header':
                return this._header.innerHTML;
            case 'body':
                return this._body.innerHTML;
            case 'footer':
                return this._footer.innerHTML;
            default:
                return null;
        }
    }
}

customElements.define('x-card', XCard);