import { ZephyrJS, defineCustomElement } from "../zephyrcore/zephyr.js";

export default class DynamicFocusCard extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['width', 'height', 'zoom-factor', 'focus-size'];
    }

    constructor() {
        super();
        this.state = {
            width: null,
            height: null,
            zoomFactor: 1,
            focusSize: 100,
            focusPosition: { x: 0.5, y: 0.5 },
            imageLoaded: false,
            imageSrc: ''
        };
        console.log('DynamicFocusCard constructor called');
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'width':
                this.setState({ width: newValue || null });
                break;
            case 'height':
                this.setState({ height: newValue || null });
                break;
            case 'zoom-factor':
                this.setState({ zoomFactor: parseFloat(newValue) || 2 });
                break;
            case 'focus-size':
                this.setState({ focusSize: parseInt(newValue) || 100 });
                break;
        }
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
        this.extractImageInfo();
        await this.loadImage();
        await this.render();
        console.log('DynamicFocusCard connected and rendered');
    }

    setupEventListeners() {
        this.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
        this.addEventListener('touchmove', this.handleTouchMove.bind(this));
        console.log('Event listeners set up');
    }

    handleMouseMove(event) {
        const { clientX, clientY } = event;
        const rect = this.getBoundingClientRect();
        const x = (clientX - rect.left) / rect.width;
        const y = (clientY - rect.top) / rect.height;
        this.updateFocusPosition(x, y);
    }

    handleMouseLeave() {
        this.updateFocusPosition(0.5, 0.5);
    }

    handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.handleMouseMove(touch);
    }

    updateFocusPosition(x, y) {
        this.setState({ focusPosition: { x, y } });
    }

    extractImageInfo() {
        const imgElement = this.querySelector('img');
        if (imgElement) {
            this.state.imageSrc = imgElement.src;
            this.state.imageAlt = imgElement.alt;
        } else {
            console.error('No image element found within DynamicFocusCard');
        }
    }

    async loadImage() {
        return new Promise((resolve) => {
            if (!this.state.imageSrc) {
                console.error('No image source found');
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                if (!this.state.width) {
                    this.setState({ width: `${img.naturalWidth}px` });
                }
                if (!this.state.height) {
                    this.setState({ height: `${img.naturalHeight}px` });
                }
                this.setState({ imageLoaded: true });
                resolve();
            };
            img.onerror = () => {
                console.error('Failed to load image');
                resolve();
            };
            img.src = this.state.imageSrc;
        });
    }

    render() {
        const { width, height, zoomFactor, focusSize, focusPosition, imageLoaded, imageSrc, imageAlt } = this.state;

        if (!imageLoaded) {
            this.shadowRoot.innerHTML = '<div>Loading...</div>';
            return;
        }

        const effectiveZoomFactor = 1 + (zoomFactor - 1) * 2; // This makes the zoom more pronounced

        this.style.width = width;
        this.style.height = height;
        this.style.position = 'relative';
        this.style.overflow = 'hidden';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    border-radius: 8px;
                }
                .image-container {
                    width: 100%;
                    height: 100%;
                    position: relative;
                    overflow: hidden;
                }
                .image-container img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .focus-area {
                    position: absolute;
                    width: ${focusSize}px;
                    height: ${focusSize}px;
                    border-radius: 50%;
                    top: ${focusPosition.y * 100}%;
                    left: ${focusPosition.x * 100}%;
                    transform: translate(-50%, -50%);
                    overflow: hidden;
                    box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
                    pointer-events: none;
                    transition: top 0.2s ease-out, left 0.2s ease-out;
                }
                .focus-image {
                    position: absolute;
                    width: ${100 * effectiveZoomFactor}%;
                    height: ${100 * effectiveZoomFactor}%;
                    object-fit: cover;
                    top: ${-focusPosition.y * 100 * (effectiveZoomFactor - 1)}%;
                    left: ${-focusPosition.x * 100 * (effectiveZoomFactor - 1)}%;
                    transition: top 0.2s ease-out, left 0.2s ease-out;
                }
            </style>
            <div class="image-container">
                <img src="${imageSrc}" alt="${imageAlt}" />
                <div class="focus-area">
                    <img src="${imageSrc}" alt="${imageAlt}" class="focus-image" />
                </div>
            </div>
        `;
        console.log('DynamicFocusCard rendered');
    }
}

defineCustomElement('zephyr-focus-card', DynamicFocusCard);