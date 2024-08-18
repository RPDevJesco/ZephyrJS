import { ZephyrJS, defineCustomElement } from "../zephyrcore/zephyr.js";

export default class DynamicFocusZone extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['focus-size', 'blur-amount', 'dim-amount'];
    }

    constructor() {
        super();
        this.state = {
            focusPosition: { x: 50, y: 50 },
            focusSize: 200,
            blurAmount: 10,
            dimAmount: 0.8,
        };
        console.log('DynamicFocusZone constructor called');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'focus-size':
                this.setState({ focusSize: parseInt(newValue) || 200 });
                break;
            case 'blur-amount':
                this.setState({ blurAmount: parseInt(newValue) || 10 });
                break;
            case 'dim-amount':
                this.setState({ dimAmount: parseFloat(newValue) || 0.8 });
                break;
        }
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
        this.cloneContent();
        await this.render();
        console.log('DynamicFocusZone connected and rendered');
    }

    setupEventListeners() {
        this.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.addEventListener('touchmove', this.handleTouchMove.bind(this));
        console.log('Event listeners set up');
    }

    handleMouseMove(event) {
        const { clientX, clientY } = event;
        const { left, top, width, height } = this.getBoundingClientRect();
        const x = Math.min(Math.max(clientX - left, 0), width);
        const y = Math.min(Math.max(clientY - top, 0), height);
        this.updateFocusPosition(x, y);
        console.log('Mouse moved', x, y);
    }

    handleMouseLeave() {
        const { width, height } = this.getBoundingClientRect();
        this.updateFocusPosition(width / 2, height / 2);
        console.log('Mouse left, focus centered');
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.handleMouseMove(touch);
    }

    updateFocusPosition(x, y) {
        this.setState({ focusPosition: { x, y } });
    }

    cloneContent() {
        this.originalContent = this.innerHTML;
        this.innerHTML = '';
        console.log('Content cloned:', this.originalContent);
    }

    render() {
        const { focusPosition, focusSize, blurAmount, dimAmount } = this.state;

        this.shadowRoot.innerHTML = `
            <div id="debug-outline" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; border: 5px solid red; z-index: 9999;"></div>
            <div id="content-container" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; filter: blur(${blurAmount}px); transition: filter 0.3s ease;">
                ${this.originalContent}
            </div>
            <div id="focus-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, ${dimAmount}); z-index: 1;"></div>
            <div id="focus-zone" style="position: absolute; width: ${focusSize}px; height: ${focusSize}px; border-radius: 50%; top: ${focusPosition.y}px; left: ${focusPosition.x}px; transform: translate(-50%, -50%); overflow: hidden; pointer-events: none; box-shadow: 0 0 0 9999px rgba(0, 0, 0, ${dimAmount}); border: 5px solid yellow; z-index: 2;">
                <div id="focus-content" style="position: absolute; width: 100%; height: 100%; top: ${-focusPosition.y}px; left: ${-focusPosition.x}px; filter: blur(0); transform: translate(50%, 50%);">
                    ${this.originalContent}
                </div>
            </div>
            <div id="debug-center" style="position: absolute; width: 20px; height: 20px; background-color: blue; border-radius: 50%; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 9999;"></div>
        `;
        console.log('DynamicFocusZone rendered');
    }
}

defineCustomElement('zephyr-focus-zone', DynamicFocusZone);