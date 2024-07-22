import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Carousel extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['orientation', 'autoplay', 'autoplay-interval', 'transition-duration'];
    }

    constructor() {
        super();
        this.state = {
            items: [],
            currentIndex: 0,
            autoplay: true,
            autoplayInterval: 5000,
            transitionDuration: 500,
            orientation: 'horizontal',
            loop: true
        };

        this.intervalId = null;

        // Bind methods to ensure correct 'this' context
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
        this.goToIndex = this.goToIndex.bind(this);
        this.updateItemsPosition = this.updateItemsPosition.bind(this);
        this.renderComponent = this.renderComponent.bind(this);
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.loadItemsFromSlot();
        this.startAutoplay();
        this.renderComponent();
        this.dispatchEvent(new CustomEvent('connected'));
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.stopAutoplay();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'orientation':
                this.state.orientation = newValue;
                break;
            case 'autoplay':
                this.state.autoplay = newValue !== 'false';
                this.state.autoplay ? this.startAutoplay() : this.stopAutoplay();
                break;
            case 'autoplay-interval':
                this.state.autoplayInterval = parseInt(newValue, 10) || 5000;
                if (this.state.autoplay) {
                    this.stopAutoplay();
                    this.startAutoplay();
                }
                break;
            case 'transition-duration':
                this.state.transitionDuration = parseInt(newValue, 10) || 500;
                break;
        }
        this.renderComponent();
    }

    loadItemsFromSlot() {
        const itemsSlot = this.querySelector('[slot="items"]');
        if (itemsSlot) {
            const items = Array.from(itemsSlot.children).map(child => ({
                content: child.outerHTML
            }));
            this.setState({ items });
        }
    }

    startAutoplay() {
        if (this.state.autoplay && !this.intervalId) {
            this.intervalId = setInterval(() => {
                this.next();
            }, this.state.autoplayInterval);
        }
    }

    stopAutoplay() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    next() {
        const newIndex = (this.state.currentIndex + 1) % this.state.items.length;
        this.setState({ currentIndex: newIndex });
        this.updateItemsPosition();
    }

    prev() {
        const newIndex = (this.state.currentIndex - 1 + this.state.items.length) % this.state.items.length;
        this.setState({ currentIndex: newIndex });
        this.updateItemsPosition();
    }

    goToIndex(index) {
        this.setState({ currentIndex: index });
        this.updateItemsPosition();
    }

    renderComponent() {
        if (!this.shadowRoot) return;

        const container = this.shadowRoot.querySelector('.carousel-container');
        const itemsContainer = this.shadowRoot.querySelector('.carousel-items');
        const prevButton = this.shadowRoot.querySelector('.carousel-prev');
        const nextButton = this.shadowRoot.querySelector('.carousel-next');
        const indicators = this.shadowRoot.querySelector('.carousel-indicators');

        if (!container || !itemsContainer || !prevButton || !nextButton || !indicators) return;

        // Set orientation
        container.style.flexDirection = this.state.orientation === 'vertical' ? 'column' : 'row';

        // Render items
        itemsContainer.innerHTML = '';
        this.state.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'carousel-item';
            itemElement.innerHTML = item.content;
            itemElement.style.transition = `transform ${this.state.transitionDuration}ms ease-in-out`;
            itemsContainer.appendChild(itemElement);
        });

        // Update indicators
        indicators.innerHTML = '';
        this.state.items.forEach((_, index) => {
            const indicator = document.createElement('button');
            indicator.className = 'carousel-indicator';
            indicator.classList.toggle('active', index === this.state.currentIndex);
            indicator.addEventListener('click', () => this.goToIndex(index));
            indicators.appendChild(indicator);
        });

        // Update navigation buttons
        prevButton.onclick = this.prev;
        nextButton.onclick = this.next;

        // Initial position update
        this.updateItemsPosition();
    }

    updateItemsPosition() {
        const itemsContainer = this.shadowRoot.querySelector('.carousel-items');
        const size = 100;
        let transformValue;
        switch (this.state.orientation) {
            case 'vertical':
                transformValue = `translateY(-${this.state.currentIndex * size}%)`;
                break;
            case 'diagonal':
                transformValue = `translate(-${this.state.currentIndex * size}%, -${this.state.currentIndex * size}%)`;
                break;
            default: // horizontal
                transformValue = `translateX(-${this.state.currentIndex * size}%)`;
                break;
        }
        itemsContainer.style.transform = transformValue;
    }
}

defineCustomElement('zephyr-carousel', Carousel);