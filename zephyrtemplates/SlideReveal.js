import ZephyrJS, { defineCustomElement } from '../zephyrcore/zephyr.js';

export default class SlideReveal extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            orientation: 'horizontal',
            revealPercentage: 0,
        };
        this.isDragging = false;
        this.isRendered = false;
        this.imageRect = null;
    }

    static get observedAttributes() {
        return ['orientation'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (name === 'orientation') {
            this.state.orientation = newValue;
        } else if (name === 'reveal-percentage') {
            this.state.revealPercentage = parseFloat(newValue);
        }
        if (this.isRendered) {
            this.updateReveal();
        }
    }

    connectedCallback() {
        super.connectedCallback();
        if (this.isRendered) {
            this.updateReveal();
        }
    }

    async render() {
        await super.render();
        this.isRendered = true;
        this.setupDragHandle();
        this.updateImageRect();
        window.addEventListener('resize', this.updateImageRect.bind(this));
        this.updateReveal();
    }

    updateImageRect() {
        const backgroundImage = this.querySelector('img[slot="background"]');
        if (backgroundImage) {
            this.imageRect = backgroundImage.getBoundingClientRect();
            this.updateReveal();
        }
    }

    setupDragHandle() {
        const dragHandle = this._shadowRoot.querySelector('.drag-handle');
        if (dragHandle) {
            dragHandle.addEventListener('mousedown', this.startDragging.bind(this));
            dragHandle.addEventListener('touchstart', this.startDragging.bind(this), { passive: false });
        } else {
            console.error('Drag handle not found');
        }
    }

    startDragging(event) {
        event.preventDefault();
        this.isDragging = true;

        const moveHandler = this.drag.bind(this);
        const stopHandler = () => {
            this.isDragging = false;
            document.removeEventListener('mousemove', moveHandler);
            document.removeEventListener('touchmove', moveHandler);
            document.removeEventListener('mouseup', stopHandler);
            document.removeEventListener('touchend', stopHandler);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });
        document.addEventListener('mouseup', stopHandler);
        document.addEventListener('touchend', stopHandler);
    }

    drag(event) {
        if (!this.isDragging || !this.imageRect) return;

        const isHorizontal = this.state.orientation === 'horizontal';
        let percentage;

        if (isHorizontal) {
            const x = event.touches ? event.touches[0].clientX : event.clientX;
            percentage = ((x - this.imageRect.left) / this.imageRect.width) * 100;
        } else {
            const y = event.touches ? event.touches[0].clientY : event.clientY;
            percentage = ((y - this.imageRect.top) / this.imageRect.height) * 100;
        }

        percentage = Math.max(0, Math.min(100, percentage));
        this.setState({ revealPercentage: percentage });
    }

    updateReveal() {
        if (!this.isRendered || !this.imageRect) return;

        const revealPercentage = this.state.revealPercentage;
        const orientation = this.state.orientation;

        const container = this._shadowRoot.querySelector('.container');
        const foreground = this._shadowRoot.querySelector('.foreground');
        const dragHandle = this._shadowRoot.querySelector('.drag-handle');

        if (container && foreground && dragHandle) {
            const containerRect = container.getBoundingClientRect();

            if (orientation === 'horizontal') {
                // Update the clip-path to progressively reveal from left to right
                foreground.style.clipPath = `inset(0 0 0 ${100 - revealPercentage}%)`;

                // Update the drag handle's position based on the calculated percentage
                const handleLeft = this.imageRect.left - containerRect.left + (revealPercentage / 100) * this.imageRect.width;
                dragHandle.style.left = `${handleLeft}px`;
                dragHandle.style.top = `${this.imageRect.top - containerRect.top}px`;
                dragHandle.style.height = `${this.imageRect.height}px`;
                dragHandle.style.width = '2px';
            } else {
                // Update the clip-path to progressively reveal from top to bottom
                foreground.style.clipPath = `inset(${100 - revealPercentage}% 0 0 0)`;

                // Update the drag handle's position based on the calculated percentage
                const handleTop = this.imageRect.top - containerRect.top + (revealPercentage / 100) * this.imageRect.height;
                dragHandle.style.top = `${handleTop}px`;
                dragHandle.style.left = `${this.imageRect.left - containerRect.left}px`;
                dragHandle.style.width = `${this.imageRect.width}px`;
                dragHandle.style.height = '4px';
            }
        } else {
            console.error('Container, foreground, or drag handle not found.');
        }
    }

    async setState(newState) {
        Object.assign(this.state, newState);
        this.updateBindings();
        this.updateReveal();
    }
}

defineCustomElement('slide-reveal', SlideReveal);