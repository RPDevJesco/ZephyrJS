import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class MarkdownShowcase extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['sections'];
    }

    constructor() {
        super();
        this.state = {
            sections: [],
            currentIndex: 0
        };
        this.next = this.next.bind(this);
        this.prev = this.prev.bind(this);
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.setupEventListeners();
        this.updateSectionContent();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'sections') {
            this.setState({ sections: JSON.parse(newValue) });
        }
    }

    setupEventListeners() {
        const nextButton = this.shadowRoot.querySelector('.showcase-next');
        const prevButton = this.shadowRoot.querySelector('.showcase-prev');
        if (nextButton) {
            nextButton.addEventListener('click', this.next);
        }
        if (prevButton) {
            prevButton.addEventListener('click', this.prev);
        }
    }

    updateSectionContent() {
        const container = this.shadowRoot.querySelector('.showcase-container');
        const { sections, currentIndex } = this.state;
        if (sections.length > 0) {
            const section = sections[currentIndex];
            container.innerHTML = `
                <div class="markdown-section">
                    <h3>${section.header}</h3>
                    <markdown-renderer markdown-content="${section.content}"></markdown-renderer>
                </div>
            `;
        }
    }

    next() {
        const newIndex = (this.state.currentIndex + 1) % this.state.sections.length;
        this.setState({ currentIndex: newIndex });
        this.updateSectionContent();
    }

    prev() {
        const newIndex = (this.state.currentIndex - 1 + this.state.sections.length) % this.state.sections.length;
        this.setState({ currentIndex: newIndex });
        this.updateSectionContent();
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
    }
}

defineCustomElement('zephyr-markdown-showcase', MarkdownShowcase);