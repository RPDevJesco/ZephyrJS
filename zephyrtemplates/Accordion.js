import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Accordion extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            items: []
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('Accordion component connected');
        if (this.hasAttribute('items')) {
            this.state.items = JSON.parse(this.getAttribute('items'));
            this.renderItems();
        }
    }

    componentDidMount() {
        console.log('Accordion component did mount');
        if (this.state.items.length > 0) {
            this.renderItems();
        }
    }

    setItems(items) {
        this.state.items = items;
        if (this.shadowRoot) {
            this.renderItems();
        }
    }

    renderItems() {
        const accordionContainer = this.shadowRoot.querySelector('.accordion-container');
        if (!accordionContainer) {
            return;
        }

        accordionContainer.innerHTML = '';

        this.state.items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('accordion-item');
            itemElement.innerHTML = `
                <div class="accordion-header" data-index="${index}">${item.header}</div>
                <div class="accordion-content">${item.content}</div>
            `;

            accordionContainer.appendChild(itemElement);
        });

        this.addAccordionHandlers();
    }

    addAccordionHandlers() {
        const headers = this.shadowRoot.querySelectorAll('.accordion-header');
        headers.forEach(header => {
            header.addEventListener('click', this.toggleAccordion.bind(this));
        });
    }

    toggleAccordion(event) {
        const header = event.target;
        const content = header.nextElementSibling;
        const index = header.getAttribute('data-index');

        if (content.style.display === 'block') {
            content.style.display = 'none';
        } else {
            content.style.display = 'block';
        }

        this.state.items[index].expanded = content.style.display === 'block';
    }
}

defineCustomElement('zephyr-accordion', Accordion);