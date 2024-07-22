import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Notification extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.autoDismissTimeout = null;
    }

    componentDidMount() {
        this.setupCloseButton();
        this.setupAutoDismiss();
    }

    setupCloseButton() {
        const closeButton = this._shadowRoot.querySelector('.close-button');
        closeButton.addEventListener('click', () => this.dismiss());
    }

    setupAutoDismiss() {
        const autoDismissAttr = this.getAttribute('auto-dismiss');
        if (autoDismissAttr !== null) {
            const timeout = parseInt(autoDismissAttr, 10) || 5000; // Default to 5000ms
            this.autoDismissTimeout = setTimeout(() => this.dismiss(), timeout);
        }
    }

    dismiss() {
        this.style.opacity = '0';
        this.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            this.remove();
        }, 300); // Match the transition duration
    }

    disconnectedCallback() {
        if (this.autoDismissTimeout) {
            clearTimeout(this.autoDismissTimeout);
        }
        super.disconnectedCallback();
    }
}

defineCustomElement('notification-box', Notification);