import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class KanbanBoard extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    constructor() {
        super();
        this.state = {
            columns: []
        };
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('KanbanBoard component connected');
        if (this.hasAttribute('columns')) {
            this.state.columns = JSON.parse(this.getAttribute('columns'));
        }
    }

    componentDidMount() {
        console.log('KanbanBoard component did mount');
        if (this.state.columns.length > 0) {
            this.renderColumns();
        }
    }

    setColumns(columns) {
        this.state.columns = columns;
        if (this.shadowRoot) {
            this.renderColumns();
        }
    }

    renderColumns() {
        const columnsContainer = this.shadowRoot.querySelector('.columns');
        if (!columnsContainer) {
            return;
        }

        columnsContainer.innerHTML = '';

        this.state.columns.forEach((column, colIndex) => {
            const columnElement = document.createElement('div');
            columnElement.classList.add('column');
            columnElement.innerHTML = `
                <h2>${column.name}</h2>
                <div class="cards" data-col-index="${colIndex}">
                    ${column.cards.map(card => `<div class="card" draggable="true">${card}</div>`).join('')}
                </div>
            `;

            columnsContainer.appendChild(columnElement);
        });

        this.addDragAndDropHandlers();
    }

    addDragAndDropHandlers() {
        const cards = this.shadowRoot.querySelectorAll('.card');
        const columns = this.shadowRoot.querySelectorAll('.cards');

        cards.forEach(card => {
            card.addEventListener('dragstart', this.handleDragStart.bind(this));
            card.addEventListener('dragend', this.handleDragEnd.bind(this));
        });

        columns.forEach(column => {
            column.addEventListener('dragover', this.handleDragOver.bind(this));
            column.addEventListener('drop', this.handleDrop.bind(this));
        });
    }

    handleDragStart(event) {
        event.dataTransfer.setData('text/plain', event.target.textContent);
        event.dataTransfer.effectAllowed = 'move';
        event.target.classList.add('dragging');
    }

    handleDragEnd(event) {
        event.target.classList.remove('dragging');
    }

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }

    handleDrop(event) {
        event.preventDefault();
        const cardText = event.dataTransfer.getData('text/plain');
        const colIndex = event.target.closest('.cards').dataset.colIndex;

        this.moveCard(cardText, parseInt(colIndex, 10));
    }

    moveCard(cardText, targetColIndex) {
        this.state.columns.forEach(column => {
            const cardIndex = column.cards.indexOf(cardText);
            if (cardIndex > -1) {
                column.cards.splice(cardIndex, 1);
            }
        });

        this.state.columns[targetColIndex].cards.push(cardText);
        this.renderColumns();
    }
}

defineCustomElement('zephyr-kanban-board', KanbanBoard);