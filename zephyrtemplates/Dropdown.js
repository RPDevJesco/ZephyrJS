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
            isOpen: false,
            placeholder: 'Select an option'
        };
        console.log('Dropdown constructor called');
    }

    async connectedCallback() {
        await super.connectedCallback();

        this.setOptions(JSON.parse(this.getAttribute('options') || '[]'));
        this.state.placeholder = this.getAttribute('placeholder') || this.state.placeholder;
        this.state.selectedOption = this.getAttribute('selected') || null;

        await this.renderAndAddListeners();
    }

    setState(newState) {
        super.setState(newState);
        this.render();
    }

    setOptions(options) {
        this.setState({ options });
    }

    toggleDropdown() {
        this.setState({ isOpen: !this.state.isOpen });
    }

    selectOption(option) {
        this.setState({ selectedOption: option, isOpen: false });
        this.dispatchCustomEvent('optionSelected', { option });
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

        let dropdownContainer = this.shadowRoot.querySelector('.dropdown-container');
        if (!dropdownContainer) {
            if (this.template && this.template.content) {
                const templateContent = this.template.content.cloneNode(true);
                this.shadowRoot.appendChild(templateContent);
                dropdownContainer = this.shadowRoot.querySelector('.dropdown-container');
            } else {
                console.error('Template content not available');
                return;
            }
        }

        if (!dropdownContainer) {
            console.error('Dropdown container still not found after inserting template');
            return;
        }

        const dropdownToggle = dropdownContainer.querySelector('.dropdown-toggle');
        const dropdownOptions = dropdownContainer.querySelector('.dropdown-options');

        const selectedOption = this.state.options.find(opt => opt.value === this.state.selectedOption);
        dropdownToggle.textContent = selectedOption ? selectedOption.label : this.state.placeholder;

        dropdownOptions.innerHTML = this.state.options.map(option => `
            <li class="dropdown-option" data-value="${option.value}">${option.label}</li>
        `).join('');

        dropdownOptions.style.display = this.state.isOpen ? 'block' : 'none';
        // Set background color using CSS variable
        dropdownOptions.style.backgroundColor = 'var(--primary-color)';
    }

    addEventListeners() {
        const dropdownToggle = this.shadowRoot.querySelector('.dropdown-toggle');
        const optionsList = this.shadowRoot.querySelector('.dropdown-options');

        if (dropdownToggle) {
            dropdownToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        } else {
            console.error('Dropdown toggle not found');
        }

        if (optionsList) {
            optionsList.addEventListener('click', (e) => {
                if (e.target.classList.contains('dropdown-option')) {
                    const selectedValue = e.target.dataset.value;
                    this.selectOption(selectedValue);
                }
            });
        } else {
            console.error('Options list not found');
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            if (this.state.isOpen) {
                this.setState({ isOpen: false });
            }
        });
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }
}

defineCustomElement('zephyr-dropdown', Dropdown);