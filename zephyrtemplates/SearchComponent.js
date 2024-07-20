import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class SearchComponent extends ZephyrJS {
    constructor() {
        super();
        this.state = {
            query: ''
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('SearchComponent connected');
        this.renderSearch();
    }

    componentDidMount() {
        console.log('SearchComponent did mount');
        this.renderSearch();
    }

    renderSearch() {
        const searchContainer = this.shadowRoot.querySelector('.search-container');
        if (!searchContainer) {
            return;
        }

        searchContainer.innerHTML = '';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Search...';
        input.addEventListener('input', (e) => this.handleSearchChange(e.target.value));
        searchContainer.appendChild(input);
    }

    handleSearchChange(value) {
        this.state.query = value;
        this.dispatchEvent(new CustomEvent('searchchange', { detail: this.state.query }));
    }
}

SearchComponent.isCoreTemplate = true;
defineCustomElement('search-component', SearchComponent);