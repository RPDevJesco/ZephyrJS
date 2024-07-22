import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class CardGroup extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['layout', 'cards'];
    }

    constructor() {
        super();
        this.state = {
            cards: [],
            layout: 'grid' // Default layout
        };
    }

    async connectedCallback() {
        await super.connectedCallback();

        // Wait for the next microtask to ensure the shadow DOM is fully populated
        await new Promise(resolve => setTimeout(resolve, 0));

        this.updateLayout();
        if (this.hasAttribute('cards')) {
            try {
                const cards = JSON.parse(this.getAttribute('cards'));
                this.setState({ cards });
            } catch (error) {
                console.error('Invalid cards attribute:', error);
            }
        }
        if (this.hasAttribute('layout')) {
            this.setState({ layout: this.getAttribute('layout') });
        }
        this.renderCards();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (this.isConnected) {
            if (name === 'layout') {
                this.setState({ layout: newValue });
                this.updateLayout();
            } else if (name === 'cards') {
                try {
                    const cards = JSON.parse(newValue);
                    this.setState({ cards });
                    this.renderCards();
                } catch (error) {

                }
            }
        }
    }

    updateLayout() {
        const container = this.shadowRoot?.querySelector('.card-group-container');
        if (container) {
            container.className = `card-group-container ${this.state.layout}-layout`;
        }
    }

    renderCards() {
        console.log('renderCards called, cards:', this.state.cards);
        const container = this.shadowRoot?.querySelector('.card-group-container');

        container.innerHTML = '';
        this.state.cards.forEach(card => {
            const cardElement = document.createElement('div');
            cardElement.className = 'card';
            cardElement.innerHTML = `
                <h3>${card.header}</h3>
                <p>${card.content}</p>
            `;
            container.appendChild(cardElement);
        });
        console.log('Cards rendered:', container.children.length);
    }

    setLayout(newLayout) {
        if (newLayout === 'grid' || newLayout === 'list') {
            this.setAttribute('layout', newLayout);
        }
    }
}

defineCustomElement('card-group', CardGroup);