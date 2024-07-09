import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Dropdown extends ZephyrJS {
    constructor() {
        super();
    }

    componentDidMount() {
        // Initial setup if needed
    }
}

Dropdown.isCoreTemplate = true;
defineCustomElement('custom-dropdown', Dropdown);