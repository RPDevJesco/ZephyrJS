import XBase from '../core/XBase.js';

// Content Grid - Masonry layout specifically for content cards (tutorials, blog posts, projects)
export default class XContentGrid extends XBase {
    static get observedAttributes() {
        return [
            'columns', 'gap', 'loading', 'filter-by', 'sort-by', 'sort-direction',
            'auto-fit', 'min-column-width', 'show-metadata'
        ];
    }

    constructor() {
        super();
        this._container = null;
        this._filterBar = null;
        this._sortSelect = null;
        this._loadingOverlay = null;
        this._items = [];
        this._filteredItems = [];
        this._resizeObserver = null;
    }

    onConnect(signal) {
        this._parseInitialContent();
        this._createGridStructure();
        this._setupEventListeners(signal);
        this._setupResizeObserver();
        this.render();
    }

    _parseInitialContent() {
        // Parse existing content cards
        const existingCards = Array.from(this.children);
        this._items = existingCards.map((card, index) => {
            const metadata = this._extractMetadata(card);
            return {
                id: metadata.id || `item-${index}`,
                element: card,
                metadata,
                visible: true
            };
        });
        this._filteredItems = [...this._items];
    }

    _extractMetadata(element) {
        // Extract metadata from data attributes and content
        const metadata = {
            id: element.dataset.id || '',
            title: element.dataset.title || element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent || '',
            category: element.dataset.category || element.dataset.type || '',
            tags: element.dataset.tags ? element.dataset.tags.split(',').map(t => t.trim()) : [],
            date: element.dataset.date || element.querySelector('time')?.getAttribute('datetime') || '',
            author: element.dataset.author || element.querySelector('[data-author]')?.textContent || '',
            difficulty: element.dataset.difficulty || '',
            duration: element.dataset.duration || '',
            featured: element.hasAttribute('data-featured'),
            priority: Number(element.dataset.priority || '0')
        };

        // Extract text content for search
        const textElements = element.querySelectorAll('p, span:not([data-meta])');
        metadata.searchText = Array.from(textElements)
            .map(el => el.textContent)
            .join(' ')
            .toLowerCase();

        return metadata;
    }

    _createGridStructure() {
        // Filter and sort controls
        this._filterBar = document.createElement('div');
        this._filterBar.part = 'controls';
        this._filterBar.className = 'content-grid-controls';

        // Grid container
        this._container = document.createElement('div');
        this._container.part = 'container';
        this._container.className = 'content-grid-container';

        // Loading overlay
        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.part = 'loading';
        this._loadingOverlay.className = 'content-grid-loading';
        this._loadingOverlay.innerHTML = `
            <div class="loading-content">
                <svg width="32" height="32" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" 
                            stroke-width="2" stroke-linecap="round" stroke-dasharray="32" 
                            stroke-dashoffset="32">
                        <animate attributeName="stroke-dasharray" dur="2s" 
                                values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" 
                                values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <span>Loading content...</span>
            </div>
        `;

        // Move items to container
        this._items.forEach(item => {
            item.element.classList.add('content-grid-item');
            this._container.appendChild(item.element);
        });

        // Create controls
        this._createFilterControls();

        // Clear and assemble
        this.innerHTML = '';
        this.appendChild(this._filterBar);
        this.appendChild(this._container);
        this.appendChild(this._loadingOverlay);

        this._applyGridStyles();
    }

    _createFilterControls() {
        // Clear existing controls first
        this._filterBar.innerHTML = '';

        // Category filter
        const categories = [...new Set(this._items.map(item => item.metadata.category).filter(Boolean))];
        if (categories.length > 1) {
            const categoryFilter = this._createSelect('Category', [
                { value: '', label: 'All Categories' },
                ...categories.map(cat => ({ value: cat, label: cat }))
            ], 'filter-category');
            this._filterBar.appendChild(categoryFilter);
        }

        // Tag filter
        const allTags = [...new Set(this._items.flatMap(item => item.metadata.tags))];
        if (allTags.length > 0) {
            const tagFilter = this._createSelect('Tags', [
                { value: '', label: 'All Tags' },
                ...allTags.map(tag => ({ value: tag, label: tag }))
            ], 'filter-tag');
            this._filterBar.appendChild(tagFilter);
        }

        // Search input
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search content...';
        searchInput.className = 'content-search';
        searchInput.id = 'content-search';
        this._filterBar.appendChild(searchInput);

        // Sort dropdown
        this._sortSelect = this._createSelect('Sort by', [
            { value: 'date-desc', label: 'Newest first' },
            { value: 'date-asc', label: 'Oldest first' },
            { value: 'title-asc', label: 'Title A-Z' },
            { value: 'title-desc', label: 'Title Z-A' },
            { value: 'priority-desc', label: 'Priority' },
            { value: 'featured', label: 'Featured first' }
        ], 'sort-select');
        this._filterBar.appendChild(this._sortSelect);

        // Clear filters button
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear All';
        clearBtn.className = 'clear-filters-btn';
        this._filterBar.appendChild(clearBtn);

        clearBtn.addEventListener('click', () => {
            this._clearFilters();
        });

        // Re-attach event listeners for new controls
        this._attachFilterEventListeners();
    }

    _attachFilterEventListeners() {
        // Filter change handlers
        this._filterBar.addEventListener('change', (e) => {
            if (e.target.tagName === 'SELECT') {
                this._applyFilters();
            }
        });

        // Search input handler
        const searchInput = this._filterBar.querySelector('#content-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this._applyFilters();
                }, 300);
            });
        }
    }

    _createSelect(label, options, id) {
        const wrapper = document.createElement('div');
        wrapper.className = 'select-wrapper';

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.setAttribute('for', id);

        const select = document.createElement('select');
        select.id = id;
        select.className = 'content-filter-select';

        options.forEach(option => {
            const optionEl = document.createElement('option');
            optionEl.value = option.value;
            optionEl.textContent = option.label;
            select.appendChild(optionEl);
        });

        wrapper.appendChild(labelEl);
        wrapper.appendChild(select);
        return wrapper;
    }

    _applyGridStyles() {
        const columns = Number(this.getAttribute('columns') || '0');
        const gap = this.getAttribute('gap') || '24px';
        const minColumnWidth = this.getAttribute('min-column-width') || '300px';
        const autoFit = this.hasAttribute('auto-fit');

        // Main container styles
        this.style.cssText = `
            display: block;
            width: 100%;
        `;

        // Controls styles
        this._filterBar.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px 8px 0 0;
            align-items: end;
        `;

        // Grid container styles
        let gridColumns;
        if (autoFit) {
            gridColumns = `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`;
        } else if (columns > 0) {
            gridColumns = `repeat(${columns}, 1fr)`;
        } else {
            gridColumns = `repeat(auto-fit, minmax(${minColumnWidth}, 1fr))`;
        }

        this._container.style.cssText = `
            display: grid;
            grid-template-columns: ${gridColumns};
            gap: ${gap};
            padding: 24px;
            background: white;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 8px 8px;
            position: relative;
        `;

        // Item styles
        this._items.forEach(item => {
            item.element.style.cssText = `
                transition: all 0.3s ease;
                opacity: ${item.visible ? '1' : '0'};
                transform: scale(${item.visible ? '1' : '0.95'});
                pointer-events: ${item.visible ? 'auto' : 'none'};
                ${!item.visible ? 'position: absolute; visibility: hidden;' : ''}
            `;

            // Add metadata display if enabled
            if (this.hasAttribute('show-metadata') && !item.element.querySelector('.content-metadata')) {
                this._addMetadataDisplay(item);
            }
        });

        // Control element styles
        const selectWrappers = this._filterBar.querySelectorAll('.select-wrapper');
        selectWrappers.forEach(wrapper => {
            wrapper.style.cssText = `
                display: flex;
                flex-direction: column;
                gap: 4px;
                min-width: 120px;
            `;

            const label = wrapper.querySelector('label');
            label.style.cssText = `
                font-size: 12px;
                font-weight: 500;
                color: #6b7280;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            `;

            const select = wrapper.querySelector('select');
            select.style.cssText = `
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                background: white;
                cursor: pointer;
            `;
        });

        // Search input styles
        const searchInput = this._filterBar.querySelector('#content-search');
        if (searchInput) {
            searchInput.style.cssText = `
                padding: 8px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                flex: 1;
                min-width: 200px;
                max-width: 300px;
            `;
        }

        // Clear button styles
        const clearBtn = this._filterBar.querySelector('.clear-filters-btn');
        if (clearBtn) {
            clearBtn.style.cssText = `
                padding: 8px 16px;
                background: #ef4444;
                color: white;
                border: none;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s ease;
            `;
        }

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

        // Loading content styles
        const loadingContent = this._loadingOverlay.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                color: #6b7280;
            `;
        }
    }

    _addMetadataDisplay(item) {
        const metadata = item.metadata;
        const metaContainer = document.createElement('div');
        metaContainer.className = 'content-metadata';

        let metaHTML = '';

        if (metadata.category) {
            metaHTML += `<span class="meta-category">${metadata.category}</span>`;
        }

        if (metadata.date) {
            const date = new Date(metadata.date);
            metaHTML += `<span class="meta-date">${date.toLocaleDateString()}</span>`;
        }

        if (metadata.author) {
            metaHTML += `<span class="meta-author">by ${metadata.author}</span>`;
        }

        if (metadata.difficulty) {
            metaHTML += `<span class="meta-difficulty">${metadata.difficulty}</span>`;
        }

        if (metadata.duration) {
            metaHTML += `<span class="meta-duration">${metadata.duration}</span>`;
        }

        if (metadata.tags.length > 0) {
            const tagsHTML = metadata.tags.map(tag =>
                `<span class="meta-tag">${tag}</span>`
            ).join('');
            metaHTML += `<div class="meta-tags">${tagsHTML}</div>`;
        }

        metaContainer.innerHTML = metaHTML;

        // Style the metadata
        metaContainer.style.cssText = `
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #f3f4f6;
            font-size: 12px;
        `;

        // Style individual meta elements
        metaContainer.querySelectorAll('span').forEach(span => {
            const baseStyle = `
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 500;
            `;

            if (span.classList.contains('meta-category')) {
                span.style.cssText = baseStyle + 'background: #dbeafe; color: #1e40af;';
            } else if (span.classList.contains('meta-difficulty')) {
                span.style.cssText = baseStyle + 'background: #fef3c7; color: #92400e;';
            } else if (span.classList.contains('meta-tag')) {
                span.style.cssText = baseStyle + 'background: #f3f4f6; color: #6b7280;';
            } else {
                span.style.cssText = baseStyle + 'background: #f9fafb; color: #6b7280;';
            }
        });

        item.element.appendChild(metaContainer);
    }

    _setupEventListeners(signal) {
        // Initial filter event listeners setup
        this._attachFilterEventListeners();

        // Item click handlers
        this._container.addEventListener('click', (e) => {
            const item = e.target.closest('.content-grid-item');
            if (item) {
                const itemData = this._items.find(i => i.element === item);
                if (itemData) {
                    this._dispatchEvent('item-click', {
                        item: itemData,
                        element: item,
                        metadata: itemData.metadata,
                        originalEvent: e
                    });
                }
            }
        }, { signal });

        // Hover effects
        this._container.addEventListener('mouseenter', (e) => {
            const item = e.target.closest('.content-grid-item');
            if (item) {
                item.style.transform = 'translateY(-4px)';
                item.style.boxShadow = '0 10px 25px rgba(0,0,0,0.1)';
            }
        }, { signal, capture: true });

        this._container.addEventListener('mouseleave', (e) => {
            const item = e.target.closest('.content-grid-item');
            if (item) {
                item.style.transform = 'translateY(0)';
                item.style.boxShadow = 'none';
            }
        }, { signal, capture: true });
    }

    _setupResizeObserver() {
        if (!window.ResizeObserver) return;

        this._resizeObserver = new ResizeObserver(() => {
            this._applyGridStyles();
        });

        this._resizeObserver.observe(this);
    }

    _applyFilters() {
        const categoryFilter = this._filterBar.querySelector('#filter-category')?.value || '';
        const tagFilter = this._filterBar.querySelector('#filter-tag')?.value || '';
        const searchQuery = this._filterBar.querySelector('#content-search')?.value.toLowerCase() || '';

        this._filteredItems = this._items.filter(item => {
            const metadata = item.metadata;

            // Category filter
            if (categoryFilter && metadata.category !== categoryFilter) {
                return false;
            }

            // Tag filter
            if (tagFilter && !metadata.tags.includes(tagFilter)) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const searchable = `${metadata.title} ${metadata.searchText} ${metadata.tags.join(' ')}`.toLowerCase();
                if (!searchable.includes(searchQuery)) {
                    return false;
                }
            }

            return true;
        });

        this._applySorting();
        this._updateItemVisibility();

        this._dispatchEvent('filter-change', {
            filteredCount: this._filteredItems.length,
            totalCount: this._items.length,
            filters: { category: categoryFilter, tag: tagFilter, search: searchQuery }
        });
    }

    _applySorting() {
        const sortValue = this._sortSelect?.value || 'date-desc';
        const [sortBy, direction] = sortValue.split('-');

        this._filteredItems.sort((a, b) => {
            let comparison = 0;

            switch (sortBy) {
                case 'date':
                    const dateA = new Date(a.metadata.date || 0);
                    const dateB = new Date(b.metadata.date || 0);
                    comparison = dateA.getTime() - dateB.getTime();
                    break;
                case 'title':
                    comparison = a.metadata.title.localeCompare(b.metadata.title);
                    break;
                case 'priority':
                    comparison = a.metadata.priority - b.metadata.priority;
                    break;
                case 'featured':
                    // Featured items first
                    if (a.metadata.featured && !b.metadata.featured) comparison = -1;
                    else if (!a.metadata.featured && b.metadata.featured) comparison = 1;
                    else comparison = 0;
                    break;
            }

            return direction === 'desc' ? -comparison : comparison;
        });
    }

    _updateItemVisibility() {
        // Hide all items first
        this._items.forEach(item => {
            item.visible = false;
            item.element.style.opacity = '0';
            item.element.style.transform = 'scale(0.95)';
            item.element.style.pointerEvents = 'none';
        });

        // Show filtered items with animation
        this._filteredItems.forEach((item, index) => {
            item.visible = true;
            setTimeout(() => {
                item.element.style.opacity = '1';
                item.element.style.transform = 'scale(1)';
                item.element.style.pointerEvents = 'auto';
            }, index * 50); // Stagger animation
        });
    }

    _clearFilters() {
        // Reset all filter controls
        this._filterBar.querySelectorAll('select').forEach(select => {
            select.value = '';
        });

        const searchInput = this._filterBar.querySelector('#content-search');
        if (searchInput) {
            searchInput.value = '';
        }

        this._applyFilters();
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

        this._applyGridStyles();
        this._applyFilters();
    }

    // Public API
    addItem(element, metadata = {}) {
        const mergedMetadata = { ...this._extractMetadata(element), ...metadata };
        const item = {
            id: mergedMetadata.id || `item-${this._items.length}`,
            element,
            metadata: mergedMetadata,
            visible: true
        };

        element.classList.add('content-grid-item');
        this._items.push(item);
        this._container.appendChild(element);

        // Recreate filter controls to include new categories/tags
        this._createFilterControls();
        this._applyFilters();

        return item;
    }

    removeItem(id) {
        const index = this._items.findIndex(item => item.id === id);
        if (index === -1) return false;

        const item = this._items[index];
        item.element.remove();
        this._items.splice(index, 1);

        this._applyFilters();
        return true;
    }

    updateItem(id, metadata) {
        const item = this._items.find(item => item.id === id);
        if (!item) return false;

        item.metadata = { ...item.metadata, ...metadata };

        // Update metadata display if enabled
        if (this.hasAttribute('show-metadata')) {
            const existingMeta = item.element.querySelector('.content-metadata');
            if (existingMeta) {
                existingMeta.remove();
            }
            this._addMetadataDisplay(item);
        }

        this._applyFilters();
        return true;
    }

    getItems() {
        return [...this._items];
    }

    getFilteredItems() {
        return [...this._filteredItems];
    }

    setLoading(loading) {
        if (loading) {
            this.setAttr('loading', '');
        } else {
            this.removeAttribute('loading');
        }
    }

    refresh() {
        this._applyFilters();
        this._dispatchEvent('refresh');
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._resizeObserver) {
            this._resizeObserver.disconnect();
        }
    }
}

customElements.define('x-content-grid', XContentGrid);