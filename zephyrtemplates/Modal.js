import ZephyrJS, { defineCustomElement } from "../zephyrcore/zephyr.js";

export default class Modal extends ZephyrJS {
    static get isCoreTemplate() {
        return true;
    }

    static get renderBlocking() {
        return false;
    }

    constructor() {
        super();
        this.state = {
            isVisible: false,
            content: ''
        };
        this.closeModal = this.closeModal.bind(this);
    }

    async connectedCallback() {
        await super.connectedCallback();
        const modal = this.shadowRoot.querySelector('.modal');
        const overlay = this.shadowRoot.querySelector('.overlay');

        if (!modal || !overlay) {
            console.error('Modal or overlay element not found');
            return;
        }

        overlay.addEventListener('click', this.closeModal);
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    showModal(content) {
        this.setState({ isVisible: true, content: content });
    }

    closeModal() {
        this.setState({ isVisible: false, content: '' });
    }

    render() {
        return `
            <style>
                .overlay {
                    display: ${this.state.isVisible ? 'block' : 'none'};
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 1000;
                }
                .modal {
                    display: ${this.state.isVisible ? 'block' : 'none'};
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: white;
                    padding: 20px;
                    border-radius: 8px;
                    z-index: 1001;
                    max-width: 80%;
                    max-height: 80%;
                    overflow-y: auto;
                }
                .modal-content {
                    padding: 20px;
                }
            </style>
            <div class="overlay"></div>
            <div class="modal">
                <div class="modal-content">${this.state.content}</div>
            </div>
        `;
    }
}

defineCustomElement('zephyr-modal', Modal);