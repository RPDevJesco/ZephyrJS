import XBase from '../core/XBase.js';

// Accordion Component with expandable/collapsible sections
export default class XAccordion extends XBase {
    static get observedAttributes() {
        return ['expanded', 'multiple', 'sections', 'animate', 'icon-position'];
    }

    constructor() {
        super();
        this._sections = [];
        this._sectionObserver = null;
    }

    onConnect(signal) {
        // Create accordion structure
        if (!this._container) {
            this._createAccordionStructure();
            this._setupEventListeners(signal);
            this._setupSectionObservation();
        }
    }

    _createAccordionStructure() {
        // Main container
        this._container = document.createElement('div');
        this._container.part = 'container';
        this._container.setAttribute('role', 'region');
        this._container.style.cssText = `
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    `;

        // Move existing content and process it
        const existingContent = Array.from(this.children);
        this.appendChild(this._container);

        // Process existing content for accordion sections
        this._processExistingContent(existingContent);
    }

    _processExistingContent(elements) {
        // Look for elements with accordion-related attributes
        elements.forEach(element => {
            if (element.tagName?.toLowerCase() === 'x-accordion-section' || element.hasAttribute('section-id')) {
                this._container.appendChild(element);
            }
        });
    }

    _setupEventListeners(signal) {
        // Delegate click events on section headers
        this._container.addEventListener('click', (e) => {
            const header = e.target.closest('[role="button"]');
            if (header && header.hasAttribute('aria-controls')) {
                const sectionId = header.getAttribute('aria-controls');
                this.toggleSection(sectionId);
            }
        }, { signal });

        // Keyboard navigation
        this._container.addEventListener('keydown', (e) => {
            this._handleKeyDown(e);
        }, { signal });
    }

    _setupSectionObservation() {
        // Observe for dynamically added accordion sections
        this._sectionObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName?.toLowerCase() === 'x-accordion-section' || node.hasAttribute('section-id')) {
                            shouldUpdate = true;
                        }
                    });

                    mutation.removedNodes.forEach(node => {
                        if (node.tagName?.toLowerCase() === 'x-accordion-section' || node.hasAttribute('section-id')) {
                            shouldUpdate = true;
                        }
                    });
                }
            });

            if (shouldUpdate) {
                this.render();
            }
        });

        this._sectionObserver.observe(this._container, {
            childList: true,
            subtree: false
        });
    }

    _parseSections() {
        const sectionsAttr = this.getAttribute('sections');
        if (sectionsAttr) {
            try {
                // Support JSON format: [{"id":"section1","title":"Section 1","content":"..."}]
                return JSON.parse(sectionsAttr);
            } catch (e) {
                console.warn('XAccordion: Invalid sections JSON format');
                return [];
            }
        }

        // Check for x-accordion-section elements or elements with section-id
        const sectionElements = this._container.querySelectorAll('x-accordion-section, [section-id]');
        return Array.from(sectionElements).map(element => ({
            id: element.getAttribute('section-id') || element.id,
            title: element.getAttribute('section-title') || element.getAttribute('title') || 'Section',
            content: element,
            disabled: element.hasAttribute('disabled'),
            expanded: element.hasAttribute('expanded')
        }));
    }

    _handleKeyDown(e) {
        const focusedHeader = e.target.closest('[role="button"]');
        if (!focusedHeader) return;

        const allHeaders = Array.from(this._container.querySelectorAll('[role="button"]'));
        const currentIndex = allHeaders.indexOf(focusedHeader);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                const nextIndex = (currentIndex + 1) % allHeaders.length;
                allHeaders[nextIndex].focus();
                break;
            case 'ArrowUp':
                e.preventDefault();
                const prevIndex = (currentIndex - 1 + allHeaders.length) % allHeaders.length;
                allHeaders[prevIndex].focus();
                break;
            case 'Home':
                e.preventDefault();
                allHeaders[0].focus();
                break;
            case 'End':
                e.preventDefault();
                allHeaders[allHeaders.length - 1].focus();
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                const sectionId = focusedHeader.getAttribute('aria-controls');
                this.toggleSection(sectionId);
                break;
        }
    }

    _createSectionHeader(section, index) {
        const header = document.createElement('button');
        header.part = 'header';
        header.setAttribute('role', 'button');
        header.setAttribute('aria-controls', section.id);
        header.setAttribute('aria-expanded', 'false');
        header.setAttribute('tabindex', '0');
        header.id = `${section.id}-header`;

        // Header content wrapper
        const content = document.createElement('div');
        content.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    `;

        // Title
        const title = document.createElement('span');
        title.textContent = section.title;
        title.style.cssText = `
      font-weight: 500;
      text-align: left;
    `;

        // Icon
        const icon = document.createElement('span');
        icon.className = 'accordion-icon';
        icon.innerHTML = '▼';
        icon.style.cssText = `
      transition: transform 0.2s ease;
      font-size: 12px;
      color: #6b7280;
    `;

        const iconPosition = this.getAttribute('icon-position') || 'right';
        if (iconPosition === 'left') {
            content.appendChild(icon);
            content.appendChild(title);
        } else {
            content.appendChild(title);
            content.appendChild(icon);
        }

        header.appendChild(content);

        // Styling
        header.style.cssText = `
      width: 100%;
      background: #f9fafb;
      border: none;
      border-bottom: 1px solid #e5e7eb;
      padding: 16px 20px;
      cursor: pointer;
      text-align: left;
      transition: background-color 0.15s ease;
      position: relative;
    `;

        if (section.disabled) {
            header.style.opacity = '0.5';
            header.style.cursor = 'not-allowed';
            header.setAttribute('aria-disabled', 'true');
        }

        // Hover effects
        if (!section.disabled) {
            header.addEventListener('mouseenter', () => {
                header.style.backgroundColor = '#f3f4f6';
            });

            header.addEventListener('mouseleave', () => {
                const isExpanded = header.getAttribute('aria-expanded') === 'true';
                header.style.backgroundColor = isExpanded ? 'white' : '#f9fafb';
            });

            header.addEventListener('focus', () => {
                header.style.outline = '2px solid var(--x-accent, #4f46e5)';
                header.style.outlineOffset = '-2px';
            });

            header.addEventListener('blur', () => {
                header.style.outline = 'none';
            });
        }

        return header;
    }

    _createSectionContent(section) {
        let contentDiv;

        if (section.content instanceof HTMLElement) {
            contentDiv = section.content;
            // Ensure it has the right structure
            if (!contentDiv.hasAttribute('role')) {
                contentDiv.setAttribute('role', 'region');
            }
        } else {
            contentDiv = document.createElement('div');
            contentDiv.innerHTML = section.content || '';
            contentDiv.setAttribute('role', 'region');
        }

        contentDiv.part = 'content';
        contentDiv.id = section.id;
        contentDiv.setAttribute('aria-labelledby', `${section.id}-header`);

        // Content wrapper for animation
        const wrapper = document.createElement('div');
        wrapper.part = 'content-wrapper';
        wrapper.style.cssText = `
      overflow: hidden;
      transition: max-height 0.3s ease, opacity 0.2s ease;
      max-height: 0;
      opacity: 0;
    `;

        // Inner content with padding
        const inner = document.createElement('div');
        inner.style.cssText = `
      padding: 20px;
      border-bottom: 1px solid #e5e7eb;
    `;

        // Move content into inner wrapper
        while (contentDiv.firstChild) {
            inner.appendChild(contentDiv.firstChild);
        }
        contentDiv.appendChild(wrapper);
        wrapper.appendChild(inner);

        return contentDiv;
    }

    _getExpandedSections() {
        const expandedAttr = this.getAttribute('expanded');
        if (!expandedAttr) return [];

        return expandedAttr.split(',').map(id => id.trim()).filter(Boolean);
    }

    _setExpandedSections(sectionIds) {
        if (sectionIds.length === 0) {
            this.removeAttribute('expanded');
        } else {
            this.setAttr('expanded', sectionIds.join(','));
        }
    }

    _animateSection(sectionElement, expand) {
        const wrapper = sectionElement.querySelector('[part="content-wrapper"]');
        const inner = wrapper.querySelector('div');

        if (!this.hasAttribute('animate')) {
            // No animation
            wrapper.style.maxHeight = expand ? 'none' : '0';
            wrapper.style.opacity = expand ? '1' : '0';
            return Promise.resolve();
        }

        return new Promise(resolve => {
            if (expand) {
                // Expanding
                wrapper.style.maxHeight = '0';
                wrapper.style.opacity = '0';

                requestAnimationFrame(() => {
                    const height = inner.scrollHeight;
                    wrapper.style.maxHeight = height + 'px';
                    wrapper.style.opacity = '1';

                    const handleTransition = () => {
                        wrapper.style.maxHeight = 'none';
                        wrapper.removeEventListener('transitionend', handleTransition);
                        resolve();
                    };

                    wrapper.addEventListener('transitionend', handleTransition, { once: true });
                });
            } else {
                // Collapsing
                const height = inner.scrollHeight;
                wrapper.style.maxHeight = height + 'px';

                requestAnimationFrame(() => {
                    wrapper.style.maxHeight = '0';
                    wrapper.style.opacity = '0';

                    wrapper.addEventListener('transitionend', resolve, { once: true });
                });
            }
        });
    }

    render() {
        if (!this._container) return;

        const sections = this._parseSections();
        const expandedSections = this._getExpandedSections();
        const allowMultiple = this.hasAttribute('multiple');

        // Clear existing sections
        this._container.innerHTML = '';
        this._sections = [];

        // Create sections
        sections.forEach((section, index) => {
            // Create section container
            const sectionContainer = document.createElement('div');
            sectionContainer.part = 'section';
            sectionContainer.style.cssText = `
        border-bottom: 1px solid #e5e7eb;
      `;

            // Remove border from last section
            if (index === sections.length - 1) {
                sectionContainer.style.borderBottom = 'none';
            }

            // Create header
            const header = this._createSectionHeader(section, index);

            // Create content
            let content = this._container.querySelector(`#${section.id}`);
            if (!content) {
                content = this._createSectionContent(section);
            }

            // Set initial expanded state
            const isExpanded = expandedSections.includes(section.id) || section.expanded;
            header.setAttribute('aria-expanded', String(isExpanded));

            if (isExpanded) {
                header.style.backgroundColor = 'white';
                const icon = header.querySelector('.accordion-icon');
                if (icon) {
                    icon.style.transform = 'rotate(180deg)';
                }

                const wrapper = content.querySelector('[part="content-wrapper"]');
                if (wrapper) {
                    wrapper.style.maxHeight = 'none';
                    wrapper.style.opacity = '1';
                }
            }

            sectionContainer.appendChild(header);
            sectionContainer.appendChild(content);
            this._container.appendChild(sectionContainer);

            this._sections.push({
                ...section,
                header,
                content,
                container: sectionContainer
            });
        });
    }

    // Public API methods
    expandSection(sectionId) {
        const expandedSections = this._getExpandedSections();
        const allowMultiple = this.hasAttribute('multiple');

        if (expandedSections.includes(sectionId)) {
            return false; // Already expanded
        }

        // Dispatch expand event (cancelable)
        const expandEvent = new CustomEvent('accordion-expand', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                sectionId,
                accordion: this
            }
        });

        this.dispatchEvent(expandEvent);

        if (expandEvent.defaultPrevented) {
            return false;
        }

        let newExpanded;
        if (allowMultiple) {
            newExpanded = [...expandedSections, sectionId];
        } else {
            // Collapse others first
            expandedSections.forEach(id => {
                if (id !== sectionId) {
                    this._collapseSection(id, false);
                }
            });
            newExpanded = [sectionId];
        }

        this._setExpandedSections(newExpanded);
        this._updateSectionState(sectionId, true);

        // Dispatch expanded event
        this.dispatchEvent(new CustomEvent('accordion-expanded', {
            bubbles: true,
            composed: true,
            detail: {
                sectionId,
                accordion: this
            }
        }));

        return true;
    }

    collapseSection(sectionId) {
        return this._collapseSection(sectionId, true);
    }

    _collapseSection(sectionId, dispatchEvents = true) {
        const expandedSections = this._getExpandedSections();

        if (!expandedSections.includes(sectionId)) {
            return false; // Already collapsed
        }

        if (dispatchEvents) {
            // Dispatch collapse event (cancelable)
            const collapseEvent = new CustomEvent('accordion-collapse', {
                bubbles: true,
                composed: true,
                cancelable: true,
                detail: {
                    sectionId,
                    accordion: this
                }
            });

            this.dispatchEvent(collapseEvent);

            if (collapseEvent.defaultPrevented) {
                return false;
            }
        }

        const newExpanded = expandedSections.filter(id => id !== sectionId);
        this._setExpandedSections(newExpanded);
        this._updateSectionState(sectionId, false);

        if (dispatchEvents) {
            // Dispatch collapsed event
            this.dispatchEvent(new CustomEvent('accordion-collapsed', {
                bubbles: true,
                composed: true,
                detail: {
                    sectionId,
                    accordion: this
                }
            }));
        }

        return true;
    }

    toggleSection(sectionId) {
        const expandedSections = this._getExpandedSections();

        if (expandedSections.includes(sectionId)) {
            return this.collapseSection(sectionId);
        } else {
            return this.expandSection(sectionId);
        }
    }

    _updateSectionState(sectionId, expanded) {
        const section = this._sections.find(s => s.id === sectionId);
        if (!section) return;

        section.header.setAttribute('aria-expanded', String(expanded));

        // Update header styling
        section.header.style.backgroundColor = expanded ? 'white' : '#f9fafb';

        // Update icon
        const icon = section.header.querySelector('.accordion-icon');
        if (icon) {
            icon.style.transform = expanded ? 'rotate(180deg)' : 'rotate(0deg)';
        }

        // Animate content
        this._animateSection(section.content, expanded);
    }

    expandAll() {
        if (!this.hasAttribute('multiple')) {
            console.warn('XAccordion: expandAll() requires multiple="true"');
            return false;
        }

        const sections = this._parseSections();
        const sectionIds = sections.filter(s => !s.disabled).map(s => s.id);

        this._setExpandedSections(sectionIds);
        this.render();

        return true;
    }

    collapseAll() {
        this._setExpandedSections([]);
        this.render();

        return true;
    }

    addSection(id, title, content, options = {}) {
        const sections = this._parseSections();

        // Check if section already exists
        if (sections.find(s => s.id === id)) {
            console.warn(`Accordion section with id "${id}" already exists`);
            return false;
        }

        const newSection = {
            id,
            title,
            content,
            disabled: options.disabled || false,
            expanded: options.expanded || false
        };

        // Add to sections attribute if using JSON format
        const sectionsAttr = this.getAttribute('sections');
        if (sectionsAttr) {
            try {
                const sectionsData = JSON.parse(sectionsAttr);
                sectionsData.push(newSection);
                this.setAttr('sections', JSON.stringify(sectionsData));
            } catch (e) {
                // Create new JSON format
                this.setAttr('sections', JSON.stringify([...sections, newSection]));
            }
        } else {
            // Create section element
            const sectionEl = document.createElement('div');
            sectionEl.id = id;
            sectionEl.setAttribute('section-id', id);
            sectionEl.setAttribute('section-title', title);
            if (options.disabled) sectionEl.setAttribute('disabled', '');
            if (options.expanded) sectionEl.setAttribute('expanded', '');
            sectionEl.innerHTML = content;
            this._container.appendChild(sectionEl);
            this.render();
        }

        return true;
    }

    removeSection(sectionId) {
        // Remove from expanded list
        const expandedSections = this._getExpandedSections().filter(id => id !== sectionId);
        this._setExpandedSections(expandedSections);

        // Remove from DOM
        const sectionEl = this._container.querySelector(`#${sectionId}`);
        if (sectionEl) {
            sectionEl.remove();
        }

        this.render();

        return true;
    }

    getSections() {
        return this._parseSections();
    }

    getExpandedSections() {
        return this._getExpandedSections();
    }

    // Focus management
    focus() {
        const firstHeader = this._container.querySelector('[role="button"]');
        if (firstHeader) {
            firstHeader.focus();
        }
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._sectionObserver) {
            this._sectionObserver.disconnect();
        }
    }
}

customElements.define('x-accordion', XAccordion);