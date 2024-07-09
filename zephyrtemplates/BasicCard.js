import { defineCustomElement, ZephyrJS } from "../zephyrcore/zephyr.js";

class BasicCard extends ZephyrJS {
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