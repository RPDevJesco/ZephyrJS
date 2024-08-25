import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class DynamicScrollingTimeline extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            events: [],
            detailLevel: 'medium',
            scrollSpeed: 0,
            lastSignificantScrollSpeed: 0
        };

        this.lastScrollTop = 0;
        this.lastScrollTime = Date.now();
    }

    getDetailLevel() {
        return this.state.detailLevel;
    }

    getScrollSpeed() {
        return this.state.scrollSpeed;
    }

    async connectedCallback() {
        await super.connectedCallback();

        // Initialize scroll-related properties here
        this.lastScrollTop = 0;
        this.lastScrollTime = Date.now();
        this.scrollSpeeds = [];
        this.scrollSpeedBufferSize = 5; // Number of recent scroll speeds to consider

        await this.updateComplete;

        const timelineContainer = this.shadowRoot.querySelector('.timeline');
        if (timelineContainer) {
            timelineContainer.addEventListener('scroll', this.handleScroll.bind(this));
        } else {
            console.error('Timeline container not found in shadow DOM');
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        const timelineContainer = this.shadowRoot.querySelector('.timeline');
        if (timelineContainer) {
            timelineContainer.removeEventListener('scroll', this.handleScroll.bind(this));
        }
    }

    handleScroll(event) {
        const currentTime = Date.now();
        const currentScrollTop = event.target.scrollTop;
        const timeDiff = (currentTime - this.lastScrollTime) / 1000; // Convert to seconds
        const scrollDiff = Math.abs(currentScrollTop - this.lastScrollTop);

        const instantScrollSpeed = timeDiff > 0 ? scrollDiff / timeDiff : 0; // pixels per second

        // Add the current scroll speed to the buffer
        this.scrollSpeeds.push(instantScrollSpeed);
        if (this.scrollSpeeds.length > this.scrollSpeedBufferSize) {
            this.scrollSpeeds.shift(); // Remove the oldest speed if we've exceeded the buffer size
        }

        // Calculate the average scroll speed
        const averageScrollSpeed = this.scrollSpeeds.reduce((a, b) => a + b, 0) / this.scrollSpeeds.length;

        this.updateDetailLevel(averageScrollSpeed);

        this.lastScrollTop = currentScrollTop;
        this.lastScrollTime = currentTime;
    }

    updateDetailLevel(averageScrollSpeed) {
        let newDetailLevel = this.state.detailLevel;

        if (averageScrollSpeed > 800) {
            newDetailLevel = 'overview';
        } else if (averageScrollSpeed > 400) {
            newDetailLevel = 'medium';
        } else {
            newDetailLevel = 'full';
        }

        // Only update if the detail level has changed
        if (newDetailLevel !== this.state.detailLevel) {
            this.setState({ detailLevel: newDetailLevel, scrollSpeed: averageScrollSpeed });
        }
    }

    addEvent(event) {
        this.setState({ events: [...this.state.events, event] });
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.requestUpdate();
    }

    requestUpdate() {
        this.updateTimelineDisplay();
    }

    updateTimelineDisplay() {
        const timeline = this.shadowRoot.querySelector('.timeline');
        if (!timeline) return;

        timeline.className = `timeline ${this.state.detailLevel}-detail`;

        // Re-render all events with the new detail level
        this.renderEvents();
    }

    renderEvents() {
        const eventsContainer = this.shadowRoot.querySelector('.timeline');
        if (eventsContainer) {
            eventsContainer.innerHTML = this.state.events.map(event => this.renderEvent(event)).join('');
        }
    }

    renderEvent(event) {
        let content = '';
        switch (this.state.detailLevel) {
            case 'overview':
                content = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date}</div>
                `;
                break;
            case 'medium':
                content = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date}</div>
                    <div class="event-description">${this.truncateDescription(event.description, 50)}</div>
                `;
                break;
            case 'full':
            default:
                content = `
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date}</div>
                    <div class="event-description">${event.description}</div>
                `;
                break;
        }
        return `<div class="event ${this.state.detailLevel}-detail">${content}</div>`;
    }

    truncateDescription(description, maxLength) {
        if (description.length <= maxLength) return description;
        return description.substr(0, maxLength) + '...';
    }

    async processBindings(content) {
        await super.processBindings(content);

        const eventsContainer = content.querySelector('.timeline');
        if (eventsContainer) {
            eventsContainer.innerHTML = this.state.events.map(event => `
                <div class="event ${this.state.detailLevel}-detail">
                    <div class="event-title">${event.title}</div>
                    <div class="event-date">${event.date}</div>
                    <div class="event-description">${event.description}</div>
                </div>
            `).join('');
        }
    }
}

defineCustomElement('dynamic-scrolling-timeline', DynamicScrollingTimeline);