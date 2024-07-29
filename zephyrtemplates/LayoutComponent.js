import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class LayoutComponent extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {};
    }

    connectedCallback() {
        super.connectedCallback();
        this.renderComponent();
    }

    renderComponent() {
        const container = this.shadowRoot;
    }
}

defineCustomElement('zephyr-layout-component', LayoutComponent);