import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class BasicCard extends ZephyrJS {
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

BasicCard.isCoreTemplate = true; // Indicate this is a core template
defineCustomElement('basic-card', BasicCard);