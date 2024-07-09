import { defineCustomElement, ZephyrJS } from "../zephyrcore/zephyr.js";

class ModalDialog extends ZephyrJS {
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

ModalDialog.isCoreTemplate = true;
defineCustomElement('modal-dialog', ModalDialog);