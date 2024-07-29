import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class TreeTable extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            columns: [],
            data: [],
            expandedRows: new Set()
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('TreeTable component connected');
        if (this.hasAttribute('columns') && this.hasAttribute('data')) {
            this.state.columns = JSON.parse(this.getAttribute('columns'));
            this.state.data = JSON.parse(this.getAttribute('data'));
            this.renderTable();
        }
    }

    componentDidMount() {
        console.log('TreeTable component did mount');
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
        if (this.shadowRoot) {
            this.renderTable();
        }
    }

    toggleRow(rowId) {
        if (this.state.expandedRows.has(rowId)) {
            this.state.expandedRows.delete(rowId);
        } else {
            this.state.expandedRows.add(rowId);
        }
        this.renderTable();
    }

    renderTable() {
        const tableContainer = this.shadowRoot.querySelector('.table-container');
        if (!tableContainer) {
            return;
        }

        tableContainer.innerHTML = '';

        const tableElement = document.createElement('table');
        tableElement.classList.add('tree-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        this.state.columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        tableElement.appendChild(thead);

        const tbody = document.createElement('tbody');
        this.renderRows(tbody, this.state.data);

        tableElement.appendChild(tbody);
        tableContainer.appendChild(tableElement);
    }

    renderRows(tbody, rows, level = 0) {
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.classList.add('tree-table-row');
            tr.dataset.id = row.id;
            tr.style.paddingLeft = `${level * 20}px`;

            this.state.columns.forEach(column => {
                const td = document.createElement('td');
                if (column.field === 'name' && row.children && row.children.length > 0) {
                    td.innerHTML = `
                        <span class="toggle-icon" data-id="${row.id}">
                            ${this.state.expandedRows.has(row.id) ? '▼' : '►'}
                        </span>
                        ${row[column.field]}
                    `;
                    td.querySelector('.toggle-icon').addEventListener('click', () => this.toggleRow(row.id));
                } else {
                    td.textContent = row[column.field];
                }
                tr.appendChild(td);
            });

            tbody.appendChild(tr);

            if (this.state.expandedRows.has(row.id) && row.children) {
                this.renderRows(tbody, row.children, level + 1);
            }
        });
    }
}

defineCustomElement('zephyr-tree-table', TreeTable);