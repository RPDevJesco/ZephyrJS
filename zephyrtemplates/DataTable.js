import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class DataTable extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            columns: [],
            data: [],
            filteredData: [],
            sortColumn: null,
            sortDirection: 'asc',
            filters: {},
            currentPage: 1,
            rowsPerPage: 10
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('DataTable component connected');
        if (this.hasAttribute('columns') && this.hasAttribute('data')) {
            this.state.columns = JSON.parse(this.getAttribute('columns'));
            this.state.data = JSON.parse(this.getAttribute('data'));
            this.state.filteredData = this.state.data;
            this.renderTable();
        }
    }

    componentDidMount() {
        console.log('DataTable component did mount');
        if (this.state.columns.length > 0 && this.state.data.length > 0) {
            this.renderTable();
        }
    }

    setColumns(columns) {
        this.state.columns = columns;
        if (this.shadowRoot) {
            this.renderTable();
        }
    }

    setData(data) {
        this.state.data = data;
        this.state.filteredData = data;
        if (this.shadowRoot) {
            this.renderTable();
        }
    }

    sortByColumn(field) {
        const sortDirection = this.state.sortColumn === field && this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        this.state.sortDirection = sortDirection;
        this.state.sortColumn = field;

        this.state.filteredData.sort((a, b) => {
            if (a[field] < b[field]) {
                return sortDirection === 'asc' ? -1 : 1;
            }
            if (a[field] > b[field]) {
                return sortDirection === 'asc' ? 1 : -1;
            }
            return 0;
        });

        this.renderTable();
    }

    applyFilters() {
        let filteredData = [...this.state.data];
        Object.keys(this.state.filters).forEach(field => {
            const filterValue = this.state.filters[field];
            filteredData = filteredData.filter(row => {
                return row[field].toString().includes(filterValue);
            });
        });
        this.state.filteredData = filteredData;
        this.renderTable();
    }

    handleFilterChange(field, value) {
        this.state.filters[field] = value;
        this.applyFilters();
    }

    handleEdit(field, rowId, newValue) {
        const rowIndex = this.state.data.findIndex(row => row.id === rowId);
        if (rowIndex > -1) {
            this.state.data[rowIndex][field] = newValue;
            this.applyFilters();  // Reapply filters to include edited data
        }
    }

    handlePageChange(newPage) {
        this.state.currentPage = newPage;
        this.renderTable();
    }

    renderTable() {
        const tableContainer = this.shadowRoot.querySelector('.table-container');
        if (!tableContainer) {
            return;
        }

        tableContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('data-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        this.state.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            th.dataset.field = column.field;
            th.addEventListener('click', () => this.sortByColumn(column.field));
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        tableElement.appendChild(thead);

        const tbody = document.createElement('tbody');
        const dataToRender = this.getPagedData();

        dataToRender.forEach(row => {
            const tr = document.createElement('tr');
            this.state.columns.forEach(column => {
                const td = document.createElement('td');
                if (column.editable) {
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = row[column.field];
                    input.addEventListener('change', (e) => this.handleEdit(column.field, row.id, e.target.value));
                    td.appendChild(input);
                } else {
                    td.textContent = row[column.field];
                }
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });

        tableElement.appendChild(tbody);
        tableContainer.appendChild(tableElement);

        this.renderPaginationControls(tableContainer);
    }

    getPagedData() {
        const start = (this.state.currentPage - 1) * this.state.rowsPerPage;
        const end = start + this.state.rowsPerPage;
        return this.state.filteredData.slice(start, end);
    }

    renderPaginationControls(container) {
        const paginationControls = document.createElement('div');
        paginationControls.classList.add('pagination-controls');

        const totalPages = Math.ceil(this.state.filteredData.length / this.state.rowsPerPage);
        for (let i = 1; i <= totalPages; i++) {
            const pageButton = document.createElement('button');
            pageButton.textContent = i;
            pageButton.disabled = i === this.state.currentPage;
            pageButton.addEventListener('click', () => this.handlePageChange(i));
            paginationControls.appendChild(pageButton);
        }

        container.appendChild(paginationControls);
    }
}

defineCustomElement('data-table', DataTable);