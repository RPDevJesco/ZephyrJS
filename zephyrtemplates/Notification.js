import { defineCustomElement, ZephyrJS } from "../zephyrcore/zephyr.js";

class Notification extends ZephyrJS {
    constructor() {
        super();
    }

    componentDidMount() {
        // Initial setup if needed
    }
}

Notification.isCoreTemplate = true;
defineCustomElement('notification-box', Notification);