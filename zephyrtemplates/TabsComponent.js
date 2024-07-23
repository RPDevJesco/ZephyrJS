import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class TabsComponent extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['active-tab'];
    }

    constructor() {
        super();
        this.state = {
            tabs: [],
            activeTab: 0
        };
    }

    async connectedCallback() {
        console.log('Tabs connectedCallback called');
        await super.connectedCallback();

        console.log('Shadow root after super.connectedCallback:', this.shadowRoot?.innerHTML);

        // Wait for the next microtask to ensure the shadow DOM is fully populated
        await new Promise(resolve => setTimeout(resolve, 0));

        this.parseTabs();
        this.renderTabs();
        this.setupEventListeners();

        if (this.hasAttribute('active-tab')) {
            const activeTab = parseInt(this.getAttribute('active-tab'), 10);
            if (!isNaN(activeTab) && activeTab >= 0 && activeTab < this.state.tabs.length) {
                this.setActiveTab(activeTab);
            }
        }
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === 'active-tab' && this.isConnected) {
            const activeTab = parseInt(newValue, 10);
            if (!isNaN(activeTab) && activeTab >= 0 && activeTab < this.state.tabs.length) {
                this.setActiveTab(activeTab);
            }
        }
    }

    parseTabs() {
        const tabElements = this.querySelectorAll('div[slot^="tab-"]');
        const contentElements = this.querySelectorAll('div[slot^="content-"]');

        this.state.tabs = Array.from(tabElements).map((tabElement, index) => ({
            id: tabElement.getAttribute('slot').split('-')[1],
            title: tabElement.textContent,
            content: contentElements[index] ? contentElements[index].innerHTML : ''
        }));
    }

    renderTabs() {
        const tabList = this.shadowRoot.querySelector('.tab-list');
        const tabContent = this.shadowRoot.querySelector('.tab-content');

        if (!tabList || !tabContent) {
            console.error('Tab list or content container not found in shadow DOM');
            return;
        }

        tabList.innerHTML = this.state.tabs.map((tab, index) => `
            <button class="tab-button ${index === this.state.activeTab ? 'active' : ''}" data-tab="${index}">
                ${tab.title}
            </button>
        `).join('');

        tabContent.innerHTML = `
            <div class="tab-pane active">
                ${this.state.tabs[this.state.activeTab]?.content || ''}
            </div>
        `;
    }

    setupEventListeners() {
        const tabList = this.shadowRoot.querySelector('.tab-list');
        if (tabList) {
            tabList.addEventListener('click', (event) => {
                const tabButton = event.target.closest('.tab-button');
                if (tabButton) {
                    const tabIndex = parseInt(tabButton.getAttribute('data-tab'), 10);
                    this.setActiveTab(tabIndex);
                }
            });
        }
    }

    setActiveTab(index) {
        if (index !== this.state.activeTab && index >= 0 && index < this.state.tabs.length) {
            this.state.activeTab = index;
            this.renderTabs();
            this.dispatchEvent(new CustomEvent('tab-changed', { detail: { activeTab: index } }));
        }
    }
}

defineCustomElement('zephyr-tabs', TabsComponent);