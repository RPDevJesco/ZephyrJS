import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class BasicCard extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
    }

    componentDidMount() {
        this.setState({
            title: 'Default Title',
            content: 'Default Content'
        });
    }
}

defineCustomElement('zephyr-card', BasicCard);