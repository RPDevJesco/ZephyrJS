import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class FilterComponent extends ZephyrJS {
    constructor() {
        super();
        this.state = {
            filters: {}
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('FilterComponent connected');
        if (this.hasAttribute('fields')) {
            this.state.fields = JSON.parse(this.getAttribute('fields'));
            this.renderFilters();
        }
    }

    componentDidMount() {
        console.log('FilterComponent did mount');
        if (this.state.fields) {
            this.renderFilters();
        }
    }

    renderFilters() {
        const filterContainer = this.shadowRoot.querySelector('.filter-container');
        if (!filterContainer) {
            return;
        }

        filterContainer.innerHTML = '';

        this.state.fields.forEach(field => {
            const filterDiv = document.createElement('div');
            filterDiv.classList.add('filter');

            const label = document.createElement('label');
            label.textContent = field.label;
            filterDiv.appendChild(label);

            const input = document.createElement('input');
            input.type = 'text';
            input.addEventListener('input', (e) => this.handleFilterChange(field.field, e.target.value));
            filterDiv.appendChild(input);

            filterContainer.appendChild(filterDiv);
        });
    }

    handleFilterChange(field, value) {
        this.state.filters[field] = value;
        this.dispatchEvent(new CustomEvent('filterchange', { detail: this.state.filters }));
    }
}

FilterComponent.isCoreTemplate = true;
defineCustomElement('filter-component', FilterComponent);