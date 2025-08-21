import XBase from '../core/XBase.js';

// Tab Navigation Component with keyboard support and accessibility
export default class XTabs extends XBase {
    static get observedAttributes() {
        return ['active', 'orientation', 'tabs', 'lazy-load', 'closeable'];
    }

    constructor() {
        super();
        this._tabButtons = [];
        this._tabPanels = [];
        this._tabObserver = null;
    }

    onConnect(signal) {
        // Create tab structure
        if (!this._container) {
            this._createTabStructure();
            this._setupEventListeners(signal);
            this._setupAccessibility();
            this._setupChildObservation();
        }
    }

    _createTabStructure() {
        // Main container
        this._container = document.createElement('div');
        this._container.part = 'container';
        this._container.style.cssText = `
      display: flex;
      flex-direction: column;
      width: 100%;
    `;

        // Tab list (the row of tab buttons)
        this._tabList = document.createElement('div');
        this._tabList.part = 'tab-list';
        this._tabList.setAttribute('role', 'tablist');
        this._tabList.style.cssText = `
      display: flex;
      border-bottom: 1px solid #e5e7eb;
      background: #f9fafb;
    `;

        // Content area for tab panels
        this._contentArea = document.createElement('div');
        this._contentArea.part = 'content';
        this._contentArea.style.cssText = `
      flex: 1;
      padding: 16px;
      background: white;
    `;

        this._container.appendChild(this._tabList);
        this._container.appendChild(this._contentArea);

        // Move existing content into container and process it
        const existingContent = Array.from(this.children);
        this.appendChild(this._container);

        // Process existing content for tab panels
        this._processExistingContent(existingContent);
    }

    _processExistingContent(elements) {
        // Look for elements with tab-related attributes or x-tab-panel elements
        elements.forEach(element => {
            if (element.tagName?.toLowerCase() === 'x-tab-panel' || element.hasAttribute('tab-id')) {
                this._contentArea.appendChild(element);
            }
        });
    }

    _setupEventListeners(signal) {
        // Delegate click events on tab list
        this._tabList.addEventListener('click', (e) => {
            const tabButton = e.target.closest('[role="tab"]');
            if (tabButton) {
                const tabId = tabButton.getAttribute('aria-controls');
                this.setActiveTab(tabId);
            }
        }, { signal });

        // Keyboard navigation
        this._tabList.addEventListener('keydown', (e) => {
            this._handleKeyDown(e);
        }, { signal });

        // Close button clicks (if closeable tabs are enabled)
        this._tabList.addEventListener('click', (e) => {
            if (e.target.closest('.tab-close-btn')) {
                e.stopPropagation();
                const tabButton = e.target.closest('[role="tab"]');
                if (tabButton) {
                    const tabId = tabButton.getAttribute('aria-controls');
                    this.closeTab(tabId);
                }
            }
        }, { signal });
    }

    _setupAccessibility() {
        // ARIA attributes are set up per tab button and panel
        this._container.setAttribute('role', 'presentation');
    }

    _setupChildObservation() {
        // Observe for dynamically added x-tab-panel elements
        this._tabObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName?.toLowerCase() === 'x-tab-panel') {
                            this._contentArea.appendChild(node);
                            shouldUpdate = true;
                        }
                    });

                    mutation.removedNodes.forEach(node => {
                        if (node.tagName?.toLowerCase() === 'x-tab-panel') {
                            shouldUpdate = true;
                        }
                    });
                }
            });

            if (shouldUpdate) {
                this.render();
            }
        });

        this._tabObserver.observe(this, {
            childList: true,
            subtree: false
        });
    }

    _parseTabs() {
        const tabsAttr = this.getAttribute('tabs');
        if (tabsAttr) {
            try {
                // Support JSON format: [{"id":"tab1","label":"Tab 1","content":"..."}]
                return JSON.parse(tabsAttr);
            } catch (e) {
                // Fallback: simple format "tab1:Tab 1,tab2:Tab 2"
                if (tabsAttr.includes(':')) {
                    return tabsAttr.split(',').map(item => {
                        const [id, label] = item.split(':').map(s => s.trim());
                        return { id, label, content: '' };
                    });
                }
            }
        }

        // Check for x-tab-panel elements
        const panels = this._contentArea.querySelectorAll('x-tab-panel, [tab-id]');
        return Array.from(panels).map(panel => ({
            id: panel.getAttribute('tab-id') || panel.id,
            label: panel.getAttribute('tab-label') || panel.getAttribute('title') || 'Tab',
            content: panel,
            disabled: panel.hasAttribute('disabled')
        }));
    }

    _handleKeyDown(e) {
        const tabs = this._tabButtons;
        if (tabs.length === 0) return;

        const currentIndex = tabs.findIndex(tab => tab === document.activeElement);
        let newIndex = currentIndex;

        switch (e.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                e.preventDefault();
                newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                e.preventDefault();
                newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                break;
            case 'Home':
                e.preventDefault();
                newIndex = 0;
                break;
            case 'End':
                e.preventDefault();
                newIndex = tabs.length - 1;
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                if (currentIndex >= 0) {
                    const tabId = tabs[currentIndex].getAttribute('aria-controls');
                    this.setActiveTab(tabId);
                }
                return;
            default:
                return;
        }

        if (newIndex !== currentIndex) {
            tabs[newIndex].focus();
        }
    }

    _createTabButton(tab, index) {
        const button = document.createElement('button');
        button.part = 'tab';
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-controls', tab.id);
        button.setAttribute('aria-selected', 'false');
        button.setAttribute('tabindex', '-1');
        button.id = `${tab.id}-tab`;

        // Create button content
        const label = document.createElement('span');
        label.textContent = tab.label;
        button.appendChild(label);

        // Add close button if closeable
        if (this.hasAttribute('closeable') && !tab.disabled) {
            const closeBtn = document.createElement('span');
            closeBtn.className = 'tab-close-btn';
            closeBtn.innerHTML = '×';
            closeBtn.setAttribute('aria-label', `Close ${tab.label}`);
            closeBtn.style.cssText = `
        margin-left: 8px;
        padding: 0 4px;
        border-radius: 2px;
        opacity: 0.6;
        transition: opacity 0.15s ease, background-color 0.15s ease;
      `;
            button.appendChild(closeBtn);
        }

        // Styling
        button.style.cssText = `
      background: none;
      border: none;
      padding: 12px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #6b7280;
      border-bottom: 2px solid transparent;
      transition: all 0.15s ease;
      display: flex;
      align-items: center;
      white-space: nowrap;
    `;

        if (tab.disabled) {
            button.style.opacity = '0.5';
            button.style.cursor = 'not-allowed';
            button.setAttribute('aria-disabled', 'true');
        }

        // Hover effects
        if (!tab.disabled) {
            button.addEventListener('mouseenter', () => {
                button.style.color = '#374151';
                button.style.background = '#f3f4f6';

                const closeBtn = button.querySelector('.tab-close-btn');
                if (closeBtn) {
                    closeBtn.style.opacity = '1';
                }
            });

            button.addEventListener('mouseleave', () => {
                if (button.getAttribute('aria-selected') !== 'true') {
                    button.style.color = '#6b7280';
                    button.style.background = 'none';
                }

                const closeBtn = button.querySelector('.tab-close-btn');
                if (closeBtn) {
                    closeBtn.style.opacity = '0.6';
                }
            });

            // Close button hover
            const closeBtn = button.querySelector('.tab-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('mouseenter', () => {
                    closeBtn.style.backgroundColor = '#ef4444';
                    closeBtn.style.color = 'white';
                });

                closeBtn.addEventListener('mouseleave', () => {
                    closeBtn.style.backgroundColor = 'transparent';
                    closeBtn.style.color = 'inherit';
                });
            }
        }

        return button;
    }

    _createTabPanel(tab) {
        let panel;

        if (tab.content instanceof HTMLElement) {
            panel = tab.content;
        } else {
            panel = document.createElement('div');
            panel.innerHTML = tab.content || '';
        }

        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', `${tab.id}-tab`);
        panel.id = tab.id;
        panel.setAttribute('tabindex', '0');

        // Initially hide all panels
        panel.style.display = 'none';

        return panel;
    }

    _updateOrientation() {
        const orientation = this.getAttribute('orientation') || 'horizontal';

        if (orientation === 'vertical') {
            this._container.style.flexDirection = 'row';
            this._tabList.style.flexDirection = 'column';
            this._tabList.style.borderBottom = 'none';
            this._tabList.style.borderRight = '1px solid #e5e7eb';
            this._tabList.style.minWidth = '200px';
            this._tabList.setAttribute('aria-orientation', 'vertical');
        } else {
            this._container.style.flexDirection = 'column';
            this._tabList.style.flexDirection = 'row';
            this._tabList.style.borderRight = 'none';
            this._tabList.style.borderBottom = '1px solid #e5e7eb';
            this._tabList.style.minWidth = 'auto';
            this._tabList.setAttribute('aria-orientation', 'horizontal');
        }
    }

    render() {
        if (!this._container) return;

        const tabs = this._parseTabs();
        const activeTab = this.getAttribute('active') || (tabs.length > 0 ? tabs[0].id : '');

        // Clear existing tabs and panels
        this._tabList.innerHTML = '';
        this._tabButtons = [];
        this._tabPanels = [];

        // Create tab buttons and panels
        tabs.forEach((tab, index) => {
            // Create and add tab button
            const button = this._createTabButton(tab, index);
            this._tabList.appendChild(button);
            this._tabButtons.push(button);

            // Create and add tab panel (if not already in DOM)
            let panel = this._contentArea.querySelector(`#${tab.id}`);
            if (!panel) {
                panel = this._createTabPanel(tab);
                this._contentArea.appendChild(panel);
            }
            this._tabPanels.push(panel);

            // Set active state
            const isActive = tab.id === activeTab;
            button.setAttribute('aria-selected', String(isActive));
            button.setAttribute('tabindex', isActive ? '0' : '-1');

            if (isActive) {
                button.style.color = '#111827';
                button.style.borderBottomColor = 'var(--x-accent, #4f46e5)';
                button.style.background = 'white';
                panel.style.display = 'block';

                // Lazy load content if needed
                if (this.hasAttribute('lazy-load') && panel.hasAttribute('data-lazy')) {
                    this._loadTabContent(panel);
                }
            } else {
                panel.style.display = 'none';
            }
        });

        // Update orientation
        this._updateOrientation();

        // Ensure we have an active tab
        if (activeTab && !tabs.find(t => t.id === activeTab)) {
            if (tabs.length > 0) {
                this.setAttr('active', tabs[0].id);
            }
        }
    }

    _loadTabContent(panel) {
        const lazyUrl = panel.getAttribute('data-lazy');
        if (lazyUrl) {
            panel.innerHTML = '<div style="text-align: center; padding: 20px;">Loading...</div>';

            // Simulate async content loading
            fetch(lazyUrl)
                .then(response => response.text())
                .then(content => {
                    panel.innerHTML = content;
                    panel.removeAttribute('data-lazy');
                })
                .catch(error => {
                    panel.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Failed to load content</div>';
                });
        }
    }

    // Public API methods
    setActiveTab(tabId) {
        const previousActive = this.getAttribute('active');

        // Dispatch change event (cancelable)
        const changeEvent = new CustomEvent('tab-change', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                previousTab: previousActive,
                newTab: tabId,
                tabs: this
            }
        });

        this.dispatchEvent(changeEvent);

        if (changeEvent.defaultPrevented) {
            return false;
        }

        this.setAttr('active', tabId);

        // Dispatch changed event
        this.dispatchEvent(new CustomEvent('tab-changed', {
            bubbles: true,
            composed: true,
            detail: {
                previousTab: previousActive,
                activeTab: tabId,
                tabs: this
            }
        }));

        return true;
    }

    addTab(id, label, content = '', options = {}) {
        const tabs = this._parseTabs();

        // Check if tab already exists
        if (tabs.find(t => t.id === id)) {
            console.warn(`Tab with id "${id}" already exists`);
            return false;
        }

        const newTab = {
            id,
            label,
            content,
            disabled: options.disabled || false
        };

        // Add to tabs attribute if using JSON format
        const tabsAttr = this.getAttribute('tabs');
        if (tabsAttr) {
            try {
                const tabsData = JSON.parse(tabsAttr);
                tabsData.push(newTab);
                this.setAttr('tabs', JSON.stringify(tabsData));
            } catch (e) {
                // Create new JSON format
                this.setAttr('tabs', JSON.stringify([...tabs, newTab]));
            }
        } else {
            // Create tab panel element
            const panel = document.createElement('div');
            panel.id = id;
            panel.setAttribute('tab-id', id);
            panel.setAttribute('tab-label', label);
            panel.innerHTML = content;
            this._contentArea.appendChild(panel);
            this.render();
        }

        // Make it active if it's the first tab
        if (tabs.length === 0) {
            this.setActiveTab(id);
        }

        return true;
    }

    removeTab(tabId) {
        const tabs = this._parseTabs();
        const tabIndex = tabs.findIndex(t => t.id === tabId);

        if (tabIndex === -1) {
            return false;
        }

        // Dispatch close event (cancelable)
        const closeEvent = new CustomEvent('tab-close', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                tabId,
                tabIndex,
                tabs: this
            }
        });

        this.dispatchEvent(closeEvent);

        if (closeEvent.defaultPrevented) {
            return false;
        }

        // Remove from DOM
        const panel = this._contentArea.querySelector(`#${tabId}`);
        if (panel) {
            panel.remove();
        }

        // Update tabs attribute or trigger re-render
        const tabsAttr = this.getAttribute('tabs');
        if (tabsAttr) {
            try {
                const tabsData = JSON.parse(tabsAttr);
                tabsData.splice(tabIndex, 1);
                this.setAttr('tabs', JSON.stringify(tabsData));
            } catch (e) {
                this.render();
            }
        } else {
            this.render();
        }

        // Handle active tab change if removing active tab
        const currentActive = this.getAttribute('active');
        if (currentActive === tabId) {
            const remainingTabs = this._parseTabs();
            if (remainingTabs.length > 0) {
                // Activate adjacent tab
                const newActiveIndex = Math.min(tabIndex, remainingTabs.length - 1);
                this.setActiveTab(remainingTabs[newActiveIndex].id);
            } else {
                this.removeAttribute('active');
            }
        }

        // Dispatch closed event
        this.dispatchEvent(new CustomEvent('tab-closed', {
            bubbles: true,
            composed: true,
            detail: {
                tabId,
                tabs: this
            }
        }));

        return true;
    }

    closeTab(tabId) {
        return this.removeTab(tabId);
    }

    getActiveTab() {
        return this.getAttribute('active');
    }

    getTabs() {
        return this._parseTabs();
    }

    // Focus management
    focus() {
        const activeTabButton = this._tabButtons.find(btn =>
            btn.getAttribute('aria-selected') === 'true'
        );

        if (activeTabButton) {
            activeTabButton.focus();
        } else if (this._tabButtons.length > 0) {
            this._tabButtons[0].focus();
        }
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._tabObserver) {
            this._tabObserver.disconnect();
        }
    }
}

customElements.define('x-tabs', XTabs);