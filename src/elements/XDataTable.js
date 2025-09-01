import XBase from '../core/XBase.js';

// Sortable Data Table with Pagination
export default class XDataTable extends XBase {
    static get observedAttributes() {
        return [
            'columns', 'data', 'page-size', 'current-page', 'total-items',
            'sort-column', 'sort-direction', 'loading', 'selectable',
            'striped', 'hover', 'compact', 'sticky-header'
        ];
    }

    constructor() {
        super();
        this._table = null;
        this._thead = null;
        this._tbody = null;
        this._pagination = null;
        this._loadingOverlay = null;
        this._data = [];
        this._columns = [];
        this._selectedRows = new Set();
    }

    onConnect(signal) {
        this._parseInitialData();
        this._createTableStructure();
        this._setupEventListeners(signal);
        this.render();
    }

    _parseInitialData() {
        // Parse columns from attribute
        const columnsAttr = this.getAttribute('columns');
        if (columnsAttr) {
            try {
                this._columns = JSON.parse(columnsAttr);
            } catch (e) {
                console.warn('XDataTable: Invalid columns JSON');
                this._columns = [];
            }
        }

        // Parse data from attribute
        const dataAttr = this.getAttribute('data');
        if (dataAttr) {
            try {
                this._data = JSON.parse(dataAttr);
            } catch (e) {
                console.warn('XDataTable: Invalid data JSON');
                this._data = [];
            }
        }
    }

    _createTableStructure() {
        // Main table container
        const tableContainer = document.createElement('div');
        tableContainer.part = 'container';
        tableContainer.className = 'datatable-container';

        // Table element
        this._table = document.createElement('table');
        this._table.part = 'table';
        this._table.className = 'datatable';
        this._table.setAttribute('role', 'table');

        // Table sections
        this._thead = document.createElement('thead');
        this._thead.part = 'header';
        this._thead.setAttribute('role', 'rowgroup');

        this._tbody = document.createElement('tbody');
        this._tbody.part = 'body';
        this._tbody.setAttribute('role', 'rowgroup');

        // Pagination
        this._pagination = document.createElement('div');
        this._pagination.part = 'pagination';
        this._pagination.className = 'datatable-pagination';

        // Loading overlay
        this._loadingOverlay = document.createElement('div');
        this._loadingOverlay.part = 'loading';
        this._loadingOverlay.className = 'datatable-loading';
        this._loadingOverlay.innerHTML = `
            <div class="loading-content">
                <svg width="32" height="32" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" 
                            stroke-width="2" stroke-linecap="round" stroke-dasharray="32" 
                            stroke-dashoffset="32">
                        <animate attributeName="stroke-dasharray" dur="2s" 
                                values="0 32;16 16;0 32;0 32" repeatCount="indefinite"/>
                        <animate attributeName="stroke-dashoffset" dur="2s" 
                                values="0;-16;-32;-32" repeatCount="indefinite"/>
                    </circle>
                </svg>
                <span>Loading data...</span>
            </div>
        `;

        // Assembly
        this._table.appendChild(this._thead);
        this._table.appendChild(this._tbody);
        tableContainer.appendChild(this._table);

        this.innerHTML = '';
        this.appendChild(tableContainer);
        this.appendChild(this._pagination);
        this.appendChild(this._loadingOverlay);

        this._applyTableStyles();
    }

    _applyTableStyles() {
        const compact = this.hasAttribute('compact');
        const striped = this.hasAttribute('striped');
        const hover = this.hasAttribute('hover');
        const stickyHeader = this.hasAttribute('sticky-header');

        // Container styles
        const container = this.querySelector('[part="container"]');
        container.style.cssText = `
            position: relative;
            overflow-x: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: white;
            ${stickyHeader ? 'max-height: 500px; overflow-y: auto;' : ''}
        `;

        // Table styles
        this._table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-size: 14px;
        `;

        // Header styles
        this._thead.style.cssText = `
            background: #f9fafb;
            ${stickyHeader ? 'position: sticky; top: 0; z-index: 10;' : ''}
        `;

        // Pagination styles
        this._pagination.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: between;
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: #f9fafb;
            font-size: 14px;
            gap: 16px;
        `;

        // Loading overlay styles
        this._loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20;
            opacity: ${this.hasAttribute('loading') ? '1' : '0'};
            visibility: ${this.hasAttribute('loading') ? 'visible' : 'hidden'};
            transition: all 0.3s ease;
        `;

        // Loading content styles
        const loadingContent = this._loadingOverlay.querySelector('.loading-content');
        if (loadingContent) {
            loadingContent.style.cssText = `
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 12px;
                color: #6b7280;
            `;
        }
    }

    _renderHeaders() {
        this._thead.innerHTML = '';

        if (this._columns.length === 0) return;

        const headerRow = document.createElement('tr');
        headerRow.setAttribute('role', 'row');

        // Selection column
        if (this.hasAttribute('selectable')) {
            const selectAllCell = this._createSelectAllCell();
            headerRow.appendChild(selectAllCell);
        }

        // Data columns
        this._columns.forEach((column, index) => {
            const th = document.createElement('th');
            th.setAttribute('role', 'columnheader');
            th.style.cssText = `
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                color: #374151;
                border-bottom: 1px solid #e5e7eb;
                user-select: none;
                ${column.sortable !== false ? 'cursor: pointer;' : ''}
                ${column.width ? `width: ${column.width};` : ''}
            `;

            if (column.sortable !== false) {
                th.addEventListener('click', () => {
                    this._handleSort(column.key);
                });

                th.addEventListener('mouseenter', () => {
                    th.style.backgroundColor = '#f3f4f6';
                });

                th.addEventListener('mouseleave', () => {
                    th.style.backgroundColor = 'transparent';
                });
            }

            // Header content
            const headerContent = document.createElement('div');
            headerContent.style.cssText = `
                display: flex;
                align-items: center;
                gap: 8px;
            `;

            const title = document.createElement('span');
            title.textContent = column.title || column.key;
            headerContent.appendChild(title);

            // Sort indicator
            if (column.sortable !== false) {
                const sortIcon = this._createSortIcon(column.key);
                headerContent.appendChild(sortIcon);
            }

            th.appendChild(headerContent);
            headerRow.appendChild(th);
        });

        this._thead.appendChild(headerRow);
    }

    _createSelectAllCell() {
        const th = document.createElement('th');
        th.style.cssText = `
            padding: 12px 16px;
            width: 48px;
            text-align: center;
            border-bottom: 1px solid #e5e7eb;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.addEventListener('change', (e) => {
            this._handleSelectAll(e.target.checked);
        });

        th.appendChild(checkbox);
        return th;
    }

    _createSortIcon(columnKey) {
        const sortColumn = this.getAttribute('sort-column');
        const sortDirection = this.getAttribute('sort-direction') || 'asc';
        const isActive = sortColumn === columnKey;

        const icon = document.createElement('span');
        icon.style.cssText = `
            display: inline-flex;
            align-items: center;
            color: ${isActive ? '#3b82f6' : '#9ca3af'};
            transition: color 0.2s ease;
        `;

        if (isActive) {
            icon.innerHTML = sortDirection === 'asc'
                ? '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 14l5-5 5 5H7z"/></svg>'
                : '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>';
        } else {
            icon.innerHTML = '<svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5H7z"/></svg>';
        }

        return icon;
    }

    _renderRows() {
        this._tbody.innerHTML = '';

        if (this._data.length === 0) {
            this._renderEmptyState();
            return;
        }

        const currentData = this._getCurrentPageData();
        const striped = this.hasAttribute('striped');
        const hover = this.hasAttribute('hover');
        const compact = this.hasAttribute('compact');

        currentData.forEach((row, index) => {
            const tr = document.createElement('tr');
            tr.setAttribute('role', 'row');
            tr.dataset.rowIndex = index.toString();

            const rowStyles = `
                ${striped && index % 2 === 1 ? 'background: #f9fafb;' : ''}
                ${hover ? 'cursor: pointer;' : ''}
                transition: background-color 0.2s ease;
            `;
            tr.style.cssText = rowStyles;

            if (hover) {
                tr.addEventListener('mouseenter', () => {
                    tr.style.backgroundColor = '#f3f4f6';
                });

                tr.addEventListener('mouseleave', () => {
                    tr.style.backgroundColor = striped && index % 2 === 1 ? '#f9fafb' : 'transparent';
                });
            }

            // Selection cell
            if (this.hasAttribute('selectable')) {
                const selectCell = this._createSelectCell(row, index);
                tr.appendChild(selectCell);
            }

            // Data cells
            this._columns.forEach(column => {
                const td = document.createElement('td');
                td.setAttribute('role', 'gridcell');
                td.style.cssText = `
                    padding: ${compact ? '8px 16px' : '12px 16px'};
                    border-bottom: 1px solid #f3f4f6;
                    color: #374151;
                    vertical-align: top;
                `;

                const cellValue = this._getCellValue(row, column);
                td.innerHTML = cellValue;
                tr.appendChild(td);
            });

            // Row click handler
            tr.addEventListener('click', (e) => {
                // Don't trigger row click if clicking on selection checkbox
                if (e.target.type === 'checkbox') return;

                this._dispatchEvent('row-click', {
                    row,
                    index,
                    originalEvent: e
                });
            });

            this._tbody.appendChild(tr);
        });
    }

    _createSelectCell(row, index) {
        const td = document.createElement('td');
        td.style.cssText = `
            padding: 12px 16px;
            width: 48px;
            text-align: center;
            border-bottom: 1px solid #f3f4f6;
        `;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = this._selectedRows.has(index);
        checkbox.addEventListener('change', (e) => {
            this._handleRowSelect(index, e.target.checked);
        });

        td.appendChild(checkbox);
        return td;
    }

    _getCellValue(row, column) {
        let value = row[column.key];

        // Apply formatter if provided
        if (column.formatter && typeof column.formatter === 'function') {
            value = column.formatter(value, row);
        } else if (column.render && typeof column.render === 'function') {
            value = column.render(value, row);
        }

        return value != null ? String(value) : '';
    }

    _renderEmptyState() {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        const colSpan = this._columns.length + (this.hasAttribute('selectable') ? 1 : 0);

        td.setAttribute('colspan', colSpan.toString());
        td.style.cssText = `
            padding: 48px 16px;
            text-align: center;
            color: #9ca3af;
            font-style: italic;
        `;
        td.textContent = 'No data available';

        tr.appendChild(td);
        this._tbody.appendChild(tr);
    }

    _renderPagination() {
        const pageSize = Number(this.getAttribute('page-size') || '10');
        const currentPage = Number(this.getAttribute('current-page') || '1');
        const totalItems = Number(this.getAttribute('total-items') || this._data.length);
        const totalPages = Math.ceil(totalItems / pageSize);

        if (totalPages <= 1) {
            this._pagination.style.display = 'none';
            return;
        }

        this._pagination.style.display = 'flex';
        this._pagination.innerHTML = '';

        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.style.cssText = 'color: #6b7280; flex: 1;';
        const startItem = (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(currentPage * pageSize, totalItems);
        pageInfo.textContent = `Showing ${startItem}-${endItem} of ${totalItems} entries`;

        // Page controls
        const controls = document.createElement('div');
        controls.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        // Previous button
        const prevBtn = this._createPageButton('Previous', currentPage > 1, () => {
            this.setAttr('current-page', (currentPage - 1).toString());
            this._dispatchPageChangeEvent();
        });

        // Page numbers
        const pageNumbers = this._getVisiblePageNumbers(currentPage, totalPages);
        const pageButtons = pageNumbers.map(page => {
            if (page === '...') {
                const ellipsis = document.createElement('span');
                ellipsis.textContent = '...';
                ellipsis.style.cssText = 'padding: 8px 4px; color: #9ca3af;';
                return ellipsis;
            }

            return this._createPageButton(page.toString(), true, () => {
                this.setAttr('current-page', page.toString());
                this._dispatchPageChangeEvent();
            }, page === currentPage);
        });

        // Next button
        const nextBtn = this._createPageButton('Next', currentPage < totalPages, () => {
            this.setAttr('current-page', (currentPage + 1).toString());
            this._dispatchPageChangeEvent();
        });

        controls.appendChild(prevBtn);
        pageButtons.forEach(btn => controls.appendChild(btn));
        controls.appendChild(nextBtn);

        this._pagination.appendChild(pageInfo);
        this._pagination.appendChild(controls);
    }

    _createPageButton(text, enabled, onClick, active = false) {
        const button = document.createElement('button');
        button.textContent = text;
        button.disabled = !enabled;

        button.style.cssText = `
            padding: 8px 12px;
            border: 1px solid #e5e7eb;
            background: ${active ? '#3b82f6' : 'white'};
            color: ${active ? 'white' : enabled ? '#374151' : '#9ca3af'};
            border-radius: 4px;
            cursor: ${enabled ? 'pointer' : 'not-allowed'};
            font-size: 14px;
            transition: all 0.2s ease;
        `;

        if (enabled && !active) {
            button.addEventListener('mouseenter', () => {
                button.style.backgroundColor = '#f3f4f6';
            });
            button.addEventListener('mouseleave', () => {
                button.style.backgroundColor = 'white';
            });
        }

        if (enabled) {
            button.addEventListener('click', onClick);
        }

        return button;
    }

    _getVisiblePageNumbers(current, total) {
        const pages = [];
        const delta = 2; // Number of pages to show on each side of current page

        if (total <= 7) {
            // Show all pages if total is small
            for (let i = 1; i <= total; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (current - delta > 2) {
                pages.push('...');
            }

            // Show pages around current
            const start = Math.max(2, current - delta);
            const end = Math.min(total - 1, current + delta);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (current + delta < total - 1) {
                pages.push('...');
            }

            // Always show last page
            if (total > 1) {
                pages.push(total);
            }
        }

        return pages;
    }

    _getCurrentPageData() {
        const pageSize = Number(this.getAttribute('page-size') || '10');
        const currentPage = Number(this.getAttribute('current-page') || '1');
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return this._data.slice(startIndex, endIndex);
    }

    _setupEventListeners(signal) {
        // No additional global event listeners needed for now
    }

    _handleSort(columnKey) {
        const currentSortColumn = this.getAttribute('sort-column');
        const currentSortDirection = this.getAttribute('sort-direction') || 'asc';

        let newDirection = 'asc';
        if (currentSortColumn === columnKey && currentSortDirection === 'asc') {
            newDirection = 'desc';
        }

        this.setAttr('sort-column', columnKey);
        this.setAttr('sort-direction', newDirection);

        this._sortData(columnKey, newDirection);
        this._dispatchEvent('sort-change', {
            column: columnKey,
            direction: newDirection
        });
    }

    _sortData(columnKey, direction) {
        const column = this._columns.find(col => col.key === columnKey);
        if (!column) return;

        this._data.sort((a, b) => {
            let aValue = a[columnKey];
            let bValue = b[columnKey];

            // Handle null/undefined values
            if (aValue == null && bValue == null) return 0;
            if (aValue == null) return 1;
            if (bValue == null) return -1;

            // Convert to string for comparison if needed
            if (typeof aValue === 'string' && typeof bValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }

            let result = 0;
            if (aValue < bValue) result = -1;
            else if (aValue > bValue) result = 1;

            return direction === 'desc' ? -result : result;
        });

        // Reset to first page after sorting
        this.setAttr('current-page', '1');
        this.render();
    }

    _handleSelectAll(checked) {
        this._selectedRows.clear();

        if (checked) {
            const currentData = this._getCurrentPageData();
            currentData.forEach((_, index) => {
                this._selectedRows.add(index);
            });
        }

        this._updateSelectAllCheckbox();
        this._dispatchEvent('selection-change', {
            selectedRows: Array.from(this._selectedRows),
            selectedData: this._getSelectedData()
        });

        // Update row checkboxes
        this._tbody.querySelectorAll('input[type="checkbox"]').forEach((checkbox, index) => {
            checkbox.checked = checked;
        });
    }

    _handleRowSelect(index, checked) {
        if (checked) {
            this._selectedRows.add(index);
        } else {
            this._selectedRows.delete(index);
        }

        this._updateSelectAllCheckbox();
        this._dispatchEvent('selection-change', {
            selectedRows: Array.from(this._selectedRows),
            selectedData: this._getSelectedData()
        });
    }

    _updateSelectAllCheckbox() {
        const selectAllCheckbox = this._thead.querySelector('input[type="checkbox"]');
        if (!selectAllCheckbox) return;

        const currentData = this._getCurrentPageData();
        const allSelected = currentData.length > 0 &&
            currentData.every((_, index) => this._selectedRows.has(index));
        const someSelected = currentData.some((_, index) => this._selectedRows.has(index));

        selectAllCheckbox.checked = allSelected;
        selectAllCheckbox.indeterminate = someSelected && !allSelected;
    }

    _getSelectedData() {
        const currentData = this._getCurrentPageData();
        return Array.from(this._selectedRows).map(index => currentData[index]).filter(Boolean);
    }

    _dispatchPageChangeEvent() {
        this._dispatchEvent('page-change', {
            page: Number(this.getAttribute('current-page') || '1'),
            pageSize: Number(this.getAttribute('page-size') || '10')
        });
        this.render();
    }

    _dispatchEvent(eventName, detail) {
        this.dispatchEvent(new CustomEvent(eventName, {
            bubbles: true,
            composed: true,
            detail
        }));
    }

    render() {
        if (!this._table) return;

        this._applyTableStyles();
        this._renderHeaders();
        this._renderRows();
        this._renderPagination();
        this._updateSelectAllCheckbox();
    }

    // Public API
    setData(data) {
        this._data = Array.isArray(data) ? data : [];
        this.setAttr('current-page', '1');
        this.setAttr('total-items', this._data.length.toString());
        this._selectedRows.clear();
        this.render();
    }

    getData() {
        return [...this._data];
    }

    setColumns(columns) {
        this._columns = Array.isArray(columns) ? columns : [];
        this.setAttr('columns', JSON.stringify(this._columns));
        this.render();
    }

    getColumns() {
        return [...this._columns];
    }

    addRow(row, index = -1) {
        if (index === -1 || index >= this._data.length) {
            this._data.push(row);
        } else {
            this._data.splice(index, 0, row);
        }
        this.setAttr('total-items', this._data.length.toString());
        this.render();
    }

    removeRow(index) {
        if (index >= 0 && index < this._data.length) {
            this._data.splice(index, 1);
            this._selectedRows.delete(index);
            this.setAttr('total-items', this._data.length.toString());
            this.render();
            return true;
        }
        return false;
    }

    updateRow(index, row) {
        if (index >= 0 && index < this._data.length) {
            this._data[index] = row;
            this.render();
            return true;
        }
        return false;
    }

    getSelectedRows() {
        return Array.from(this._selectedRows);
    }

    getSelectedData() {
        return this._getSelectedData();
    }

    clearSelection() {
        this._selectedRows.clear();
        this.render();
    }

    setLoading(loading) {
        if (loading) {
            this.setAttr('loading', '');
        } else {
            this.removeAttribute('loading');
        }
    }

    goToPage(page) {
        const pageSize = Number(this.getAttribute('page-size') || '10');
        const totalPages = Math.ceil(this._data.length / pageSize);

        if (page >= 1 && page <= totalPages) {
            this.setAttr('current-page', page.toString());
            this._dispatchPageChangeEvent();
        }
    }

    refresh() {
        this.render();
        this._dispatchEvent('refresh');
    }
}

customElements.define('x-datatable', XDataTable);