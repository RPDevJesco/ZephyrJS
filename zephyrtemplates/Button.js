import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Button extends ZephyrJS {
    constructor() {
        super();
    }

    componentDidMount() {
        this._shadowRoot.addEventListener('click', this.handleClick.bind(this));
    }

    handleClick(event) {
        if (this.hasAttribute('disabled')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
        }

        // Dispatch a custom event for the button click
        this.dispatchEvent(new CustomEvent('button-click', {
            detail: {
                message: 'Button clicked!'
            },
            bubbles: true,
            composed: true
        }));
    }

    disconnectedCallback() {
        this._shadowRoot.removeEventListener('click', this.handleClick.bind(this));
    }
}

Button.isCoreTemplate = true;
defineCustomElement('custom-button', Button);