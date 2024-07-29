import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Input extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

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

    componentDidMount() {
        this.setupEventListeners();
    }

    initializeTemplate() {
        const template = document.getElementById('input').content.cloneNode(true);
        this.shadowRoot.appendChild(template);
    }

    setupEventListeners() {
        const inputElement = this.shadowRoot.querySelector('input');
        inputElement.addEventListener('input', (event) => {
            this.state.value = event.target.value;
            this.dispatchEvent(new CustomEvent('input', { detail: { value: this.state.value } }));
        });

        inputElement.addEventListener('change', (event) => {
            this.dispatchEvent(new CustomEvent('change', { detail: { value: this.state.value } }));
        });
    }

    static get observedAttributes() {
        return ['type', 'placeholder', 'value', 'disabled'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.updateAttributes();
    }

    updateAttributes() {
        const inputElement = this.shadowRoot.querySelector('input');
        inputElement.type = this.getAttribute('type') || 'text';
        inputElement.placeholder = this.getAttribute('placeholder') || '';
        inputElement.disabled = this.hasAttribute('disabled');
        inputElement.value = this.state.value;
    }

    updateBindings() {
        const inputElement = this.shadowRoot.querySelector('input');
        inputElement.value = this.state.value;
    }
}

defineCustomElement('zephyr-input', Input);