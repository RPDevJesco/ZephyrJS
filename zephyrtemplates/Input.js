import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Input extends ZephyrJS {
    constructor() {
        super();
    }

    componentDidMount() {
        // Initial setup if needed
    }
}

Input.isCoreTemplate = true;
defineCustomElement('custom-input', Input);