import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class TimelineItem extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get observedAttributes() {
        return ['date', 'title', 'description', 'content'];
    }

    constructor() {
        super();
        this.state = {
            date: '',
            title: '',
            description: '',
            content: ''
        };
        this.showModal = this.showModal.bind(this);
    }

    async connectedCallback() {
        await super.connectedCallback();
        this.updateContent();
        this.addEventListener('mouseenter', this.showModal);
    }

    attributeChangedCallback(name, oldValue, newValue) {
        this.setState({ [name]: newValue });
        this.updateContent();
    }

    updateContent() {
        const { date, title, description } = this.state;
        const dateElement = this.shadowRoot.querySelector('.date');
        const titleElement = this.shadowRoot.querySelector('.title');
        const descriptionElement = this.shadowRoot.querySelector('.description');

        if (dateElement) {
            dateElement.textContent = date;
        }
        if (titleElement) {
            titleElement.textContent = title;
        }
        if (descriptionElement) {
            descriptionElement.textContent = description;
        }
    }

    showModal() {
        const { content } = this.state;
        const modal = document.querySelector('zephyr-modal');
        if (modal) {
            modal.showModal(content);
        } else {
            console.error('Modal component not found');
        }
    }

    render() {
        return `
            <style>
                .timeline-item {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin: 20px 0;
                    position: relative;
                }
                .circle {
                    width: 50px;
                    height: 50px;
                    background-color: var(--primary, #007bff);
                    border-radius: 50%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    color: white;
                    cursor: pointer;
                }
                .date, .title, .description {
                    display: none;
                }
            </style>
            <div class="timeline-item">
                <div class="circle">
                    <slot name="date"></slot>
                </div>
                <div class="date"></div>
                <div class="title"></div>
                <div class="description"></div>
            </div>
        `;
    }
}

defineCustomElement('zephyr-timeline-item', TimelineItem);
