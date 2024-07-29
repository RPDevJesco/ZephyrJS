import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Dropdown extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            options: [],
            selectedOption: null,
            placeholder: 'Select an option'
        };
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.setOptions(JSON.parse(this.getAttribute('options') || '[]'));
        this.state.placeholder = this.getAttribute('placeholder') || this.state.placeholder;
        this.state.selectedOption = this.getAttribute('selected') || null;

        await this.renderAndAddListeners();
    }

    setOptions(options) {
        this.setState({ options });
        this.renderAndAddListeners();
    }

    async renderAndAddListeners() {
        await this.render();
        this.addEventListeners();
    }

    async render() {
        if (!this.shadowRoot) {
            console.error('Shadow root not found');
            return;
        }

        let select = this.shadowRoot.querySelector('select');
        if (!select) {
            if (this.template && this.template.content) {
                const templateContent = this.template.content.cloneNode(true);
                this.shadowRoot.appendChild(templateContent);
                select = this.shadowRoot.querySelector('select');
            } else {
                console.error('Template content not available');
                return;
            }
        }

        if (!select) {
            console.error('Select element still not found after inserting template');
            console.log('Shadow root content:', this.shadowRoot.innerHTML);
            return;
        }

        // Clear existing options
        select.innerHTML = '';

        // Add placeholder option if needed
        if (this.state.placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = this.state.placeholder;
            placeholderOption.disabled = true;
            placeholderOption.selected = !this.state.selectedOption;
            select.appendChild(placeholderOption);
        }

        // Add options
        this.state.options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option.value;
            optionElement.textContent = option.label;
            optionElement.selected = option.value === this.state.selectedOption;
            select.appendChild(optionElement);
        });
    }

    addEventListeners() {
        const select = this.shadowRoot.querySelector('select');

        if (select) {
            select.addEventListener('change', (e) => {
                this.state.selectedOption = e.target.value;
                this.dispatchCustomEvent('optionSelected', { option: this.state.selectedOption });
            });
        } else {
            console.error('Select element not found');
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }
}

defineCustomElement('zephyr-dropdown', Dropdown);