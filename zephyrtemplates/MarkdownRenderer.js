import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";
import { parseMarkdown } from '../zephyrcore/markdown-parser.js';

export default class MarkdownRenderer extends ZephyrJS {
    static isCoreTemplate = true;

    constructor() {
        super();
        console.log('MarkdownRenderer constructor called');

        this.state = {
            markdown: ''
        };
    }

    static get observedAttributes() {
        return ['markdown'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} changed from ${oldValue} to ${newValue}`);
        if (name === 'markdown') {
            this.setState({ markdown: newValue });
        }
    }

    async performRenderBlockingTasks() {
        console.log('Performing render blocking tasks...');
        // You can add any async tasks that need to complete before rendering
    }

    async componentDidMount() {
        console.log('Component did mount');
        this.renderMarkdown();
    }

    renderMarkdown() {
        console.log('Rendering markdown...');
        const markdownContent = this.state.markdown || '## No content provided';
        const htmlContent = parseMarkdown(markdownContent);
        console.log('Parsed HTML content:', htmlContent);

        const contentDiv = this.shadowRoot.getElementById('content');
        if (contentDiv) {
            console.log('Setting innerHTML of content div.');
            contentDiv.innerHTML = htmlContent;
        } else {
            console.error('Content div not found.');
            console.log('Shadow root children:', this.shadowRoot.children);
        }
    }
}

defineCustomElement('markdown-renderer', MarkdownRenderer);
console.log('markdown-renderer custom element defined');