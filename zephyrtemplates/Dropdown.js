import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Dropdown extends ZephyrJS {
    constructor() {
        super();

        if (!this.shadowRoot) {
            this.attachShadow({ mode: 'open' });
            this.initializeTemplate();
        }

        // Initialize component state
        this._state = { value: '' };
        this.state = new Proxy(this._state, {
            set: (target, property, value) => {
                target[property] = value;
                this.updateBindings();
                return true;
            }
        });
    }

    connectedCallback() {
        this.setupEventListeners();
        this.updateSlotContent();
    }

    initializeTemplate() {
        const template = document.getElementById('dropdown').content.cloneNode(true);
        this.shadowRoot.innerHTML = ''; // Clear any existing content
        this.shadowRoot.appendChild(template);
    }

    setupEventListeners() {
        const selectElement = this.shadowRoot.querySelector('select');
        if (selectElement) {
            selectElement.addEventListener('change', (event) => {
                this.state.value = event.target.value;
                this.dispatchEvent(new CustomEvent('change', { detail: { value: this.state.value } }));
            });
        }
    }

    static get observedAttributes() {
        return ['disabled', 'value'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateAttributes();
    }

    updateAttributes() {
        const selectElement = this.shadowRoot.querySelector('select');
        if (selectElement) {
            selectElement.disabled = this.hasAttribute('disabled');

            if (this.hasAttribute('value')) {
                selectElement.value = this.getAttribute('value');
                this.state.value = selectElement.value;
            }
        }
    }

    updateBindings() {
        const selectElement = this.shadowRoot.querySelector('select');
        if (selectElement) {
            selectElement.value = this.state.value;
        }
    }

    updateSlotContent() {
        const selectElement = this.shadowRoot.querySelector('select');
        if (selectElement) {
            const options = this.querySelectorAll('option');
            selectElement.innerHTML = ''; // Clear existing options
            options.forEach(option => {
                selectElement.appendChild(option.cloneNode(true));
            });
        }
    }
}

Dropdown.isCoreTemplate = true;
defineCustomElement('custom-dropdown', Dropdown);