import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class InlineEditingComponent extends ZephyrJS {
    constructor() {
        super();
        this.state = {
            editing: false,
            value: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('InlineEditingComponent connected');
        this.state.value = this.getAttribute('value') || '';
        this.renderComponent();
    }

    componentDidMount() {
        console.log('InlineEditingComponent did mount');
        this.renderComponent();
    }

    renderComponent() {
        const container = this.shadowRoot.querySelector('.inline-editing-container');
        if (!container) {
            return;
        }

        container.innerHTML = '';

        if (this.state.editing) {
            const input = document.createElement('input');
            input.type = 'text';
            input.value = this.state.value;
            input.addEventListener('blur', () => this.saveEdit());
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.saveEdit();
                }
            });
            container.appendChild(input);
            input.focus();
        } else {
            const span = document.createElement('span');
            span.textContent = this.state.value;
            span.addEventListener('click', () => this.startEdit());
            container.appendChild(span);
        }
    }

    startEdit() {
        this.state.editing = true;
        this.renderComponent();
    }

    saveEdit() {
        const input = this.shadowRoot.querySelector('input');
        this.state.value = input.value;
        this.state.editing = false;
        this.dispatchEvent(new CustomEvent('valuechange', { detail: this.state.value }));
        this.renderComponent();
    }
}

InlineEditingComponent.isCoreTemplate = true;
defineCustomElement('inline-editing-component', InlineEditingComponent);