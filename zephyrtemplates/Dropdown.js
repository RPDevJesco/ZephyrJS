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
        console.log('Dropdown constructor called');
    }

    async connectedCallback() {
        console.log('Dropdown connectedCallback started');
        await super.connectedCallback();
        console.log('Dropdown super.connectedCallback completed');

        this.setOptions(JSON.parse(this.getAttribute('options') || '[]'));
        this.state.placeholder = this.getAttribute('placeholder') || this.state.placeholder;
        this.state.selectedOption = this.getAttribute('selected') || null;

        console.log('Dropdown state after attribute processing:', this.state);

        await this.renderAndAddListeners();
        console.log('Dropdown renderAndAddListeners completed');
    }

    setOptions(options) {
        this.setState({ options });
        this.renderAndAddListeners();
    }

    async renderAndAddListeners() {
        console.log('renderAndAddListeners started');
        await this.render();
        this.addEventListeners();
        console.log('renderAndAddListeners completed');
    }

    async render() {
        console.log('Render started');
        if (!this.shadowRoot) {
            console.error('Shadow root not found');
            return;
        }

        let select = this.shadowRoot.querySelector('select');
        if (!select) {
            console.log('Select element not found, inserting template content');
            if (this.template && this.template.content) {
                const templateContent = this.template.content.cloneNode(true);
                console.log('Cloned template content:', templateContent);
                this.shadowRoot.appendChild(templateContent);
                select = this.shadowRoot.querySelector('select');
                console.log('Select element after insertion:', select);
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

        console.log('Render completed, select content:', select.innerHTML);
    }

    addEventListeners() {
        console.log('Adding event listeners');
        const select = this.shadowRoot.querySelector('select');

        if (select) {
            select.addEventListener('change', (e) => {
                this.state.selectedOption = e.target.value;
                this.dispatchCustomEvent('optionSelected', { option: this.state.selectedOption });
            });
            console.log('Change listener added to select element');
        } else {
            console.error('Select element not found');
        }

        console.log('Event listeners added');
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        console.log('Dropdown disconnected');
    }
}

defineCustomElement('zephyr-dropdown', Dropdown);