import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class ModalDialog extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
    }

    componentDidMount() {
        // Initial setup if needed
    }

    close() {
        this.style.display = 'none';
    }
}

defineCustomElement('zephyr-modal-dialog', ModalDialog);