import { ZephyrJS, defineCustomElement } from "../zephyrcore/zephyr.js";

export default class LayeredCard extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['card-width', 'card-height', 'mask-opacity'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'card-width') this.style.width = newValue;
        if (name === 'card-height') this.style.height = newValue;
        if (name === 'mask-opacity') this.setState({ maskOpacity: parseFloat(newValue) });
    }

    constructor() {
        super();
        this.state = {
            maskOpacity: 0.1,
            popoverVisible: false,
            mousePosition: { x: 0, y: 0 },
        };
    }

    async connectedCallback() {
        await super.connectedCallback();
        await this.render();
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.addEventListener('touchend', this.handleMouseLeave.bind(this));
    }

    handleMouseMove(event) {
        const rect = this.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        this.updateMousePosition(x, y);
        this.showPopover();
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.handleMouseMove(touch);
    }

    handleMouseLeave() {
        this.setState({ popoverVisible: false });
    }

    updateMousePosition(x, y) {
        this.setState({ mousePosition: { x, y } });
    }

    showPopover() {
        this.setState({ popoverVisible: true });
        this.dispatchEvent(new CustomEvent('popover-shown', {
            detail: { x: this.state.mousePosition.x, y: this.state.mousePosition.y }
        }));
    }

    async setState(newState) {
        await super.setState(newState);
        await this.updatePopover();
    }

    async updatePopover() {
        if (!this.shadowRoot) return;

        const popover = this.shadowRoot.querySelector('.popover-layer');
        if (popover) {
            const { popoverVisible, mousePosition } = this.state;
            popover.style.display = popoverVisible ? 'block' : 'none';
            popover.style.top = `${mousePosition.y}px`;
            popover.style.left = `${mousePosition.x}px`;
            popover.style.opacity = popoverVisible ? '1' : '0';
        }
    }

    render() {
        if (!this.shadowRoot) return;

        const { maskOpacity, mousePosition } = this.state;

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    width: 300px;
                    height: 200px;
                    overflow: hidden;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .content-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    padding: 20px;
                    box-sizing: border-box;
                    overflow: auto;
                }
                .mask-layer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, ${maskOpacity});
                    pointer-events: none;
                }
                .popover-layer {
                    position: absolute;
                    background-color: white;
                    border-radius: 5px;
                    padding: 10px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                    display: none;
                    top: ${mousePosition.y}px;
                    left: ${mousePosition.x}px;
                    transform: translate(-50%, -100%);
                    z-index: 10;
                    transition: opacity 0.3s ease-in-out;
                    opacity: 0;
                }
            </style>
            <div class="content-layer">
                <slot name="content"></slot>
            </div>
            <div class="mask-layer"></div>
            <div class="popover-layer" role="tooltip">
                <slot name="popover"></slot>
            </div>
        `;
    }
}

defineCustomElement('zephyr-layered-card', LayeredCard);