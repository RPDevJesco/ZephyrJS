import XBase from '../core/XBase.js';

// Breadcrumb Navigation Component
export default class XBreadcrumb extends XBase {
    static get observedAttributes() {
        return ['path', 'separator', 'max-items', 'home-icon', 'clickable-current'];
    }

    constructor() {
        super();
        this._breadcrumbItems = [];
    }

    onConnect(signal) {
        // Create breadcrumb structure
        if (!this._nav) {
            this._createBreadcrumbStructure();
            this._setupEventListeners(signal);
        }
    }

    _createBreadcrumbStructure() {
        // Semantic nav element
        this._nav = document.createElement('nav');
        this._nav.part = 'nav';
        this._nav.setAttribute('aria-label', 'Breadcrumb');

        // Breadcrumb list
        this._list = document.createElement('ol');
        this._list.part = 'list';
        this._list.style.cssText = `
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      list-style: none;
      margin: 0;
      padding: 0;
      gap: 8px;
    `;

        this._nav.appendChild(this._list);

        // Move existing content and process it
        const existingContent = Array.from(this.children);
        this.appendChild(this._nav);

        // Process existing breadcrumb items if any
        this._processExistingContent(existingContent);
    }

    _processExistingContent(elements) {
        // Look for existing breadcrumb items
        elements.forEach(element => {
            if (element.tagName?.toLowerCase() === 'x-breadcrumb-item' || element.hasAttribute('breadcrumb-item')) {
                // Move to end of container for processing
                this.appendChild(element);
            }
        });
    }

    _setupEventListeners(signal) {
        // Delegate click events on breadcrumb links
        this._list.addEventListener('click', (e) => {
            const link = e.target.closest('a[href], [role="link"]');
            if (link) {
                const href = link.getAttribute('href');
                const label = link.textContent.trim();
                const index = parseInt(link.getAttribute('data-index'));

                // Dispatch navigation event (cancelable)
                const navEvent = new CustomEvent('breadcrumb-navigate', {
                    bubbles: true,
                    composed: true,
                    cancelable: true,
                    detail: {
                        href,
                        label,
                        index,
                        breadcrumb: this
                    }
                });

                this.dispatchEvent(navEvent);

                if (navEvent.defaultPrevented) {
                    e.preventDefault();
                }
            }
        }, { signal });

        // Keyboard navigation
        this._list.addEventListener('keydown', (e) => {
            this._handleKeyDown(e);
        }, { signal });
    }

    _parsePath() {
        const pathAttr = this.getAttribute('path');
        if (pathAttr) {
            try {
                // Support JSON format: [{"label":"Home","href":"/"},{"label":"Products","href":"/products"}]
                return JSON.parse(pathAttr);
            } catch (e) {
                // Fallback: simple format "Home:/,Products:/products,Category:/category"
                if (pathAttr.includes(':')) {
                    return pathAttr.split(',').map(item => {
                        const [label, href] = item.split(':');
                        return {
                            label: label.trim(),
                            href: href ? href.trim() : null
                        };
                    });
                }

                // Simple array format ["Home", "Products", "Category"]
                return pathAttr.split(',').map(label => ({
                    label: label.trim(),
                    href: null
                }));
            }
        }

        // Check for x-breadcrumb-item elements
        const itemElements = this.querySelectorAll('x-breadcrumb-item, [breadcrumb-item]');
        return Array.from(itemElements).map(element => ({
            label: element.getAttribute('label') || element.textContent.trim(),
            href: element.getAttribute('href'),
            icon: element.getAttribute('icon'),
            current: element.hasAttribute('current')
        }));
    }

    _handleKeyDown(e) {
        const focusedLink = e.target.closest('a[href], [role="link"]');
        if (!focusedLink) return;

        const allLinks = Array.from(this._list.querySelectorAll('a[href], [role="link"]'));
        const currentIndex = allLinks.indexOf(focusedLink);

        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                if (currentIndex > 0) {
                    allLinks[currentIndex - 1].focus();
                }
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (currentIndex < allLinks.length - 1) {
                    allLinks[currentIndex + 1].focus();
                }
                break;
            case 'Home':
                e.preventDefault();
                allLinks[0].focus();
                break;
            case 'End':
                e.preventDefault();
                allLinks[allLinks.length - 1].focus();
                break;
        }
    }

    _createBreadcrumbItem(item, index, isLast, isCollapsed = false) {
        const listItem = document.createElement('li');
        listItem.part = 'item';
        listItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;

        // Handle collapsed items (ellipsis)
        if (isCollapsed) {
            const ellipsis = document.createElement('span');
            ellipsis.part = 'ellipsis';
            ellipsis.textContent = '...';
            ellipsis.style.cssText = `
        color: #6b7280;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.15s ease;
      `;
            ellipsis.setAttribute('title', 'Show collapsed items');

            ellipsis.addEventListener('click', () => {
                this.removeAttribute('max-items');
            });

            ellipsis.addEventListener('mouseenter', () => {
                ellipsis.style.backgroundColor = '#f3f4f6';
            });

            ellipsis.addEventListener('mouseleave', () => {
                ellipsis.style.backgroundColor = 'transparent';
            });

            listItem.appendChild(ellipsis);
            return listItem;
        }

        // Create the main content (link or span)
        let content;
        const clickableCurrent = this.hasAttribute('clickable-current');

        if (item.href && (!isLast || clickableCurrent)) {
            // Clickable link
            content = document.createElement('a');
            content.href = item.href;
            content.setAttribute('data-index', index);
            content.style.cssText = `
        color: var(--x-accent, #4f46e5);
        text-decoration: none;
        padding: 4px 8px;
        border-radius: 4px;
        transition: background-color 0.15s ease;
      `;

            content.addEventListener('mouseenter', () => {
                content.style.backgroundColor = '#f0f9ff';
            });

            content.addEventListener('mouseleave', () => {
                content.style.backgroundColor = 'transparent';
            });

            content.addEventListener('focus', () => {
                content.style.outline = '2px solid var(--x-accent, #4f46e5)';
                content.style.outlineOffset = '2px';
            });

            content.addEventListener('blur', () => {
                content.style.outline = 'none';
            });
        } else {
            // Non-clickable current item
            content = document.createElement('span');
            content.setAttribute('aria-current', 'page');
            content.style.cssText = `
        color: #374151;
        font-weight: 500;
        padding: 4px 8px;
      `;
        }

        // Add icon if specified
        if (item.icon || (index === 0 && this.hasAttribute('home-icon'))) {
            const icon = document.createElement('span');
            icon.className = 'breadcrumb-icon';
            icon.style.cssText = `
        display: inline-flex;
        align-items: center;
        margin-right: 4px;
      `;

            if (index === 0 && this.hasAttribute('home-icon')) {
                icon.innerHTML = this.getAttribute('home-icon') || '🏠';
            } else if (item.icon) {
                icon.innerHTML = item.icon;
            }

            content.insertBefore(icon, content.firstChild);
        }

        // Add label text
        const labelSpan = document.createElement('span');
        labelSpan.textContent = item.label;
        content.appendChild(labelSpan);

        listItem.appendChild(content);

        // Add separator (except for last item)
        if (!isLast) {
            const separator = document.createElement('span');
            separator.part = 'separator';
            separator.setAttribute('aria-hidden', 'true');
            separator.style.cssText = `
        color: #9ca3af;
        user-select: none;
      `;

            const separatorText = this.getAttribute('separator') || '/';
            separator.innerHTML = separatorText;

            listItem.appendChild(separator);
        }

        return listItem;
    }

    _applyCollapsing(items) {
        const maxItems = parseInt(this.getAttribute('max-items'));
        if (!maxItems || items.length <= maxItems) {
            return items;
        }

        // Always show first and last items, collapse middle items
        if (maxItems < 3) {
            // If max-items is too small, just show first and last
            return [
                items[0],
                { collapsed: true },
                items[items.length - 1]
            ];
        }

        const visibleCount = maxItems - 1; // Account for ellipsis
        const startItems = Math.ceil(visibleCount / 2);
        const endItems = Math.floor(visibleCount / 2);

        return [
            ...items.slice(0, startItems),
            { collapsed: true },
            ...items.slice(items.length - endItems)
        ];
    }

    render() {
        if (!this._list) return;

        const items = this._parsePath();

        // Apply collapsing logic if max-items is set
        const displayItems = this._applyCollapsing(items);

        // Clear existing items
        this._list.innerHTML = '';
        this._breadcrumbItems = [];

        // Create breadcrumb items
        displayItems.forEach((item, index) => {
            const isLast = index === displayItems.length - 1;
            const isCollapsed = item.collapsed;

            const listItem = this._createBreadcrumbItem(item, index, isLast, isCollapsed);
            this._list.appendChild(listItem);

            if (!isCollapsed) {
                this._breadcrumbItems.push(item);
            }
        });

        // Update ARIA attributes
        this._updateAccessibility();
    }

    _updateAccessibility() {
        // Set proper ARIA roles and states
        const links = this._list.querySelectorAll('a, [aria-current]');

        links.forEach((link, index) => {
            if (link.hasAttribute('aria-current')) {
                // Current page - already has aria-current="page"
            } else {
                // Regular breadcrumb link
                link.setAttribute('role', 'link');
            }
        });
    }

    // Public API methods
    setPath(pathItems) {
        if (Array.isArray(pathItems)) {
            this.setAttr('path', JSON.stringify(pathItems));
        } else {
            console.warn('XBreadcrumb: setPath expects an array of path items');
        }
    }

    addItem(label, href = null, options = {}) {
        const items = this._parsePath();
        const newItem = {
            label,
            href,
            icon: options.icon,
            current: options.current || false
        };

        items.push(newItem);
        this.setPath(items);
    }

    removeLastItem() {
        const items = this._parsePath();
        if (items.length > 0) {
            items.pop();
            this.setPath(items);
            return true;
        }
        return false;
    }

    navigateToIndex(index) {
        const items = this._parsePath();
        if (index >= 0 && index < items.length) {
            const newPath = items.slice(0, index + 1);
            this.setPath(newPath);

            const item = items[index];
            if (item.href) {
                // Dispatch navigation event
                this.dispatchEvent(new CustomEvent('breadcrumb-navigate', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        href: item.href,
                        label: item.label,
                        index,
                        breadcrumb: this
                    }
                }));
            }
            return true;
        }
        return false;
    }

    clear() {
        this.setPath([]);
    }

    getPath() {
        return this._parsePath();
    }

    getCurrentItem() {
        const items = this._parsePath();
        return items.length > 0 ? items[items.length - 1] : null;
    }

    // Focus management
    focus() {
        const firstLink = this._list.querySelector('a[href], [role="link"]');
        if (firstLink) {
            firstLink.focus();
        }
    }

    // Static utility methods
    static fromURL(url = window.location.pathname) {
        const pathSegments = url.split('/').filter(segment => segment.length > 0);

        const items = [{ label: 'Home', href: '/' }];

        let currentPath = '';
        pathSegments.forEach(segment => {
            currentPath += '/' + segment;

            // Convert kebab-case to Title Case for display
            const label = segment
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');

            items.push({
                label,
                href: currentPath
            });
        });

        return items;
    }

    static fromObject(obj, pathKey = 'path', labelKey = 'label', hrefKey = 'href') {
        if (!obj || !obj[pathKey]) return [];

        return obj[pathKey].map(item => ({
            label: item[labelKey] || item.toString(),
            href: item[hrefKey] || null,
            icon: item.icon,
            current: item.current
        }));
    }
}

customElements.define('x-breadcrumb', XBreadcrumb);