import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class PaginationComponent extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            currentPage: 1,
            totalPages: 1
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('PaginationComponent connected');
        if (this.hasAttribute('total-pages')) {
            this.state.totalPages = parseInt(this.getAttribute('total-pages'), 10);
            this.renderPagination();
        }
    }

    componentDidMount() {
        console.log('PaginationComponent did mount');
        this.renderPagination();
    }

    setTotalPages(totalPages) {
        this.state.totalPages = totalPages;
        this.renderPagination();
    }

    renderPagination() {
        const paginationContainer = this.shadowRoot.querySelector('.pagination-container');
        if (!paginationContainer) {
            return;
        }

        paginationContainer.innerHTML = '';

        for (let i = 1; i <= this.state.totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.disabled = i === this.state.currentPage;
            pageButton.addEventListener('click', () => this.handlePageChange(i));
            paginationContainer.appendChild(pageButton);
        }
    }

    handlePageChange(newPage) {
        this.state.currentPage = newPage;
        this.dispatchEvent(new CustomEvent('pagechange', { detail: this.state.currentPage }));
        this.renderPagination();
    }
}

defineCustomElement('zephyr-pagination', PaginationComponent);