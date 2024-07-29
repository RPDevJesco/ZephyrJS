import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class AccordionTable extends ZephyrJS {
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
        console.log('AccordionTable component connected');
        if (this.hasAttribute('columns') && this.hasAttribute('data')) {
            this.state.columns = JSON.parse(this.getAttribute('columns'));
            this.state.data = JSON.parse(this.getAttribute('data'));
            this.renderTable();
        }
    }

    componentDidMount() {
        console.log('AccordionTable component did mount');
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
        tableElement.classList.add('accordion-table');

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

        this.state.data.forEach(row => {
            const tr = document.createElement('tr');
            tr.classList.add('accordion-table-row');
            tr.dataset.id = row.id;

            this.state.columns.forEach(column => {
                const td = document.createElement('td');
                td.textContent = row[column.field];
                tr.appendChild(td);
            });

            tbody.appendChild(tr);

            if (row.details) {
                const detailsTr = document.createElement('tr');
                detailsTr.classList.add('accordion-details');
                if (!this.state.expandedRows.has(row.id)) {
                    detailsTr.style.display = 'none';
                }
                const detailsTd = document.createElement('td');
                detailsTd.colSpan = this.state.columns.length;
                detailsTd.innerHTML = row.details;
                detailsTr.appendChild(detailsTd);
                tbody.appendChild(detailsTr);

                tr.addEventListener('click', () => this.toggleRow(row.id));
            }
        });

        tableElement.appendChild(tbody);
        tableContainer.appendChild(tableElement);
    }
}

defineCustomElement('zephyr-accordion-table', AccordionTable);