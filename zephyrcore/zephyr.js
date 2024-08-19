/**
 * ZephyrJS is a base class for creating custom HTML elements with shadow DOM, state management,
 * and data binding capabilities.
 */
export default class ZephyrJS extends HTMLElement {
    //static baseUrl = 'https://cdn.jsdelivr.net/gh/RPDevJesco/ZephyrJS@0.15/';
    static baseUrl = '';
    /**
     * Sets the base URL for loading templates.
     * If a CDN link is provided, it is used as is.
     * If a relative path is provided, it's treated as a local path.
     */
    static setBaseURL(url) {
        if (url.startsWith('http')) {
            // CDN or full URL
            ZephyrJS.baseUrl = url.endsWith('/') ? url : url + '/';
        } else {
            // Local relative path
            ZephyrJS.baseUrl = new URL(url, window.location.origin).href;
        }
    }

    /**
     * Initializes the custom element, sets up shadow DOM, state management, and data bindings.
     */
    constructor() {
        super(); // Call the parent class's constructor

        // Create a shadow DOM and attach it to the element
        this._shadowRoot = this.attachShadow({ mode: 'open' });

        // Initialize a map to store bindings between state properties and DOM elements
        this._bindings = new Map();

        // Initialize a list to store added event listeners for cleanup
        this._eventListeners = [];

        // Create a proxy for the component's state to track changes and update bindings automatically
        this._state = {};
        this.state = new Proxy(this._state, {
            set: (target, property, value) => {
                if (typeof target[property] === 'function') {
                    console.error(`Cannot set computed property "${property}"`);
                    return false;
                }
                target[property] = value;
                this.updateBindings(); // Update bindings whenever the state changes
                return true;
            }
        });

        const className = this.constructor.name.toLowerCase();
        if (this.constructor.isCoreTemplate) {
            this.templateUrl = `${ZephyrJS.baseUrl}/zephyrtemplates/templates/${className}.html`;
        } else {
            this.templateUrl = `./templates/${className}.html`;
        }

        this.renderBlocking = this.constructor.renderBlocking || false;
    }

    /**
     * Called when the element is added to the document's DOM.
     * Loads the template, renders the component, and calls componentDidMount if defined.
     */
    async connectedCallback() {
        try {
            if (this.renderBlocking) {
                await this.performRenderBlockingTasks();
            }
            this.template = await this.loadTemplate(); // Load the template asynchronously
            await this.render(); // Render the component
            this.componentDidMount && this.componentDidMount(); // Call componentDidMount if defined
        } catch (error) {
            console.error('Error during component initialization', error);
        }
    }

    /**
     * Called when the element is removed from the document's DOM.
     * Calls componentWillUnmount if defined and cleans up event listeners and other resources.
     */
    disconnectedCallback() {
        try {
            this.componentWillUnmount && this.componentWillUnmount(); // Call componentWillUnmount if defined
            this.cleanupEventListeners(); // Clean up all event listeners
        } catch (error) {
            console.error('Error during component unmounting', error);
        }
    }

    /**
     * Observe attributes for changes and sync them to state.
     */
    static get observedAttributes() {
        return this.attributesList || [];
    }

    /**
     * Called when an observed attribute changes. Syncs the attribute to the state.
     * @param {string} name - The name of the attribute.
     * @param {any} oldValue - The old value of the attribute.
     * @param {any} newValue - The new value of the attribute.
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (this._state[name] !== undefined) {
            this._state[name] = newValue;
        }
    }

    /**
     * Load the HTML template from the specified URL.
     * @returns {Promise<HTMLElement>} - The loaded template.
     */
    async loadTemplate() {
        try {
            if (!this.templateUrl) return null;

            const response = await fetch(this.templateUrl);
            if (!response.ok) throw new Error(`Failed to load template: ${response.statusText}`);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            return doc.querySelector('template');
        } catch (error) {
            console.error('Error loading template', error);
            throw error;
        }
    }

    /**
     * Bind event listeners to elements with the 'on' attribute and store them for cleanup.
     */
    bindEvents() {
        this._shadowRoot.querySelectorAll('[on]').forEach(element => {
            const eventBinding = element.getAttribute('on');
            const matches = eventBinding.match(/(\w+):"?{{(\w+)}}"?/);
            if (matches) {
                const [, eventName, methodName] = matches;
                if (typeof this[methodName] === 'function') {
                    const boundMethod = this[methodName].bind(this);
                    element.addEventListener(eventName, boundMethod);
                    this._eventListeners.push({ element, eventName, boundMethod });
                } else {
                    console.warn(`Method "${methodName}" not defined`);
                }
            }
        });
    }

    /**
     * Update the text content and value of elements bound to state properties.
     */
    updateBindings() {
        this._bindings.forEach((binding, key) => {
            binding.elements.forEach(element => {
                if (element.type === 'checkbox') {
                    element.checked = this.state[key];
                } else if (element.type === 'radio') {
                    element.checked = (element.value === this.state[key]);
                } else if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'SELECT') {
                    element.value = this.state[key];
                } else {
                    element.textContent = this.state[key];
                }
            });
        });
    }

    /**
     * Render the component by attaching the template content to the shadow DOM.
     */
    async render() {
        if (this.template) {
            this._shadowRoot.innerHTML = ''; // Clear the shadow DOM
            const content = this.template.content.cloneNode(true); // Clone the template content
            await this.processBindings(content); // Process data bindings in the template
            this._shadowRoot.appendChild(content); // Append the template content to the shadow DOM
            this.bindEvents(); // Bind events to the elements
            this.updateBindings(); // Update bindings with the current state
            this.renderSlots(); // Render slot content
        }
    }

    /**
     * Process data bindings in the template content.
     * @param {HTMLElement} content - The template content.
     */
    async processBindings(content) {
        const elements = content.querySelectorAll('*');
        for (const element of elements) {
            Array.from(element.attributes).forEach(attr => {
                if (attr.value.match(/{{.*}}/)) {
                    const key = attr.value.match(/{{(.*)}}/)[1];
                    if (attr.name === 'bind') {
                        if (!this._bindings.has(key)) {
                            this._bindings.set(key, { elements: [], eventListeners: [] });
                        }
                        this._bindings.get(key).elements.push(element);

                        const updateState = (event) => {
                            if (element.type === 'checkbox') {
                                this.state[key] = element.checked;
                            } else if (element.type === 'radio' && element.checked) {
                                this.state[key] = element.value;
                            } else {
                                this.state[key] = element.value;
                            }
                        };
                        element.addEventListener('input', updateState);
                        this._bindings.get(key).eventListeners.push(updateState);
                    } else {
                        const originalValue = attr.value;
                        Object.defineProperty(element, attr.name, {
                            get: () => this.state[key],
                            set: (value) => {
                                this.state[key] = value;
                                attr.value = originalValue;
                            }
                        });
                    }
                }
            });
            if (element.childNodes.length === 1 && element.childNodes[0].nodeType === Node.TEXT_NODE) {
                const text = element.childNodes[0].textContent;
                const match = text.match(/{{(.*)}}/);
                if (match) {
                    const key = match[1];
                    if (!this._bindings.has(key)) {
                        this._bindings.set(key, { elements: [], eventListeners: [] });
                    }
                    this._bindings.get(key).elements.push(element);
                }
            }

            if (customElements.get(element.localName)) {
                await customElements.whenDefined(element.localName);
                element.connectedCallback && element.connectedCallback();
            }
        }
    }

    /**
     * Render the slot content by appending assigned nodes to their respective slots.
     */
    renderSlots() {
        const slotElements = this._shadowRoot.querySelectorAll('slot');
        slotElements.forEach(slot => {
            const name = slot.getAttribute('name');
            const assignedNodes = this.querySelectorAll(`[slot="${name}"]`);
            assignedNodes.forEach(node => slot.appendChild(node.cloneNode(true))); // Append assigned nodes to the slot
        });
    }

    /**
     * Set the state properties and trigger bindings update.
     * @param {object} newState - The new state to be merged with the existing state.
     * @returns {Promise<void>} - A promise that resolves when the state is updated and bindings are refreshed.
     */
    async setState(newState) {
        Object.keys(newState).forEach(key => {
            if (typeof this._state[key] !== 'function') {
                this.state[key] = newState[key];
            }
        });
        this.updateBindings();
    }

    /**
     * Define a computed property that automatically recalculates based on state changes.
     * @param {string} name - The name of the computed property.
     * @param {function} computeFn - The function to compute the property's value.
     */
    defineComputedProperty(name, computeFn) {
        Object.defineProperty(this.state, name, {
            get: computeFn,
            enumerable: true,
            configurable: true
        });
    }

    /**
     * Dispatch a custom event from the element.
     * @param {string} eventName - The name of the event.
     * @param {object} detail - The detail object to be attached to the event.
     */
    dispatchCustomEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, { detail }));
    }

    /**
     * Apply a theme to the element using CSS variables.
     * @param {object} theme - The theme object containing CSS variable values.
     */
    applyTheme(theme) {
        for (const [key, value] of Object.entries(theme)) {
            this.style.setProperty(`--${key}`, value);
        }
    }

    /**
     * Clean up all event listeners added by the component.
     */
    cleanupEventListeners() {
        this._eventListeners.forEach(({ element, eventName, boundMethod }) => {
            element.removeEventListener(eventName, boundMethod);
        });
        this._eventListeners = []; // Clear the event listeners list
    }

    /**
     * Perform render blocking tasks. Override in subclasses to provide specific tasks.
     */
    async performRenderBlockingTasks() {
        // Default implementation does nothing. Subclasses should override this method.
        return Promise.resolve();
    }
}

/**
 * Define a custom element with the specified name and class.
 * @param {string} name - The name of the custom element.
 * @param {class} elementClass - The class representing the custom element.
 */
function defineCustomElement(name, elementClass) {
    customElements.define(name, elementClass); // Register the custom element with the browser
}

export { ZephyrJS, defineCustomElement }; // Export the CustomElement class and defineCustomElement function