import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class TimelineView extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get renderBlocking() {
        return false;
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.shadowRoot.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('mouseenter', () => this.showModal(item));
        });
    }

    showModal(item) {
        const modal = this.shadowRoot.querySelector('zephyr-modal');
        const content = item.querySelector('[slot="content"]').innerHTML;
        modal.toggleVisibility(content);
    }
}

defineCustomElement('zephyr-timeline-view', TimelineView);