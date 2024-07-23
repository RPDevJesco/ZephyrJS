import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class TooltipComponent extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['text', 'position'];
    }

    constructor() {
        super();
        this.state = {
            text: '',
            position: 'top',
            isVisible: false
        };
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
        this.updateTooltipContent();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'text') {
            this.setState({ text: newValue });
            this.updateTooltipContent();
        } else if (name === 'position') {
            this.setState({ position: newValue });
            this.updateTooltipPosition();
        }
    }

    setupEventListeners() {
        this.addEventListener('mouseenter', this.showTooltip.bind(this));
        this.addEventListener('mouseleave', this.hideTooltip.bind(this));
        this.addEventListener('focus', this.showTooltip.bind(this));
        this.addEventListener('blur', this.hideTooltip.bind(this));
    }

    updateTooltipContent() {
        const tooltipContent = this.shadowRoot.querySelector('.tooltip-content');
        if (tooltipContent) {
            tooltipContent.textContent = this.state.text;
        }
    }

    updateTooltipPosition() {
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        if (tooltip) {
            tooltip.className = `tooltip ${this.state.position}`;
        }
    }

    showTooltip() {
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        if (tooltip) {
            tooltip.classList.add('visible');
        }
    }

    hideTooltip() {
        const tooltip = this.shadowRoot.querySelector('.tooltip');
        if (tooltip) {
            tooltip.classList.remove('visible');
        }
    }
}

defineCustomElement('zephyr-tooltip', TooltipComponent);