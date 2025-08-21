import XBase from '../core/XBase.js';

// Dialog/Modal Component with focus management and accessibility
export default class XDialog extends XBase {
    static get observedAttributes() {
        return ['open', 'title', 'size', 'backdrop-close', 'escape-close', 'role'];
    }

    constructor() {
        super();
        this._previousFocus = null;
        this._isTransitioning = false;
    }

    onConnect(signal) {
        // Create dialog structure
        if (!this._dialog) {
            this._createDialogStructure();
            this._setupEventListeners(signal);
            this._setupAccessibility();
        }
    }

    _createDialogStructure() {
        // Backdrop overlay
        this._backdrop = document.createElement('div');
        this._backdrop.part = 'backdrop';
        this._backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      transition: opacity 0.2s ease;
    `;

        // Dialog container
        this._dialog = document.createElement('div');
        this._dialog.part = 'dialog';
        this._dialog.style.cssText = `
      background: white;
      border-radius: 8px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      transform: scale(0.95);
      transition: transform 0.2s ease;
      display: flex;
      flex-direction: column;
    `;

        // Header
        this._header = document.createElement('div');
        this._header.part = 'header';
        this._header.style.cssText = `
      padding: 16px 20px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

        this._titleEl = document.createElement('h2');
        this._titleEl.part = 'title';
        this._titleEl.style.cssText = `
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #111827;
    `;

        this._closeBtn = document.createElement('button');
        this._closeBtn.part = 'close-button';
        this._closeBtn.innerHTML = '✕';
        this._closeBtn.setAttribute('aria-label', 'Close dialog');
        this._closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      color: #6b7280;
      transition: background-color 0.15s ease;
    `;

        // Content area
        this._content = document.createElement('div');
        this._content.part = 'content';
        this._content.style.cssText = `
      padding: 20px;
      overflow-y: auto;
      flex: 1;
    `;

        // Footer (for actions)
        this._footer = document.createElement('div');
        this._footer.part = 'footer';
        this._footer.style.cssText = `
      padding: 16px 20px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
      gap: 8px;
    `;

        // Assemble structure
        this._header.appendChild(this._titleEl);
        this._header.appendChild(this._closeBtn);

        this._dialog.appendChild(this._header);
        this._dialog.appendChild(this._content);
        this._dialog.appendChild(this._footer);

        this._backdrop.appendChild(this._dialog);

        // Move original content into content area
        while (this.firstChild) {
            this._content.appendChild(this.firstChild);
        }

        // Initially hidden
        this._backdrop.style.display = 'none';
        document.body.appendChild(this._backdrop);
    }

    _setupEventListeners(signal) {
        // Close button
        this._closeBtn.addEventListener('click', () => {
            this.close('close-button');
        }, { signal });

        // Backdrop click (if enabled)
        this._backdrop.addEventListener('click', (e) => {
            if (e.target === this._backdrop && this._shouldCloseOnBackdrop()) {
                this.close('backdrop');
            }
        }, { signal });

        // Prevent dialog content clicks from closing
        this._dialog.addEventListener('click', (e) => {
            e.stopPropagation();
        }, { signal });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (!this.hasAttribute('open')) return;

            if (e.key === 'Escape' && this._shouldCloseOnEscape()) {
                e.preventDefault();
                this.close('escape');
            }

            // Focus trapping
            if (e.key === 'Tab') {
                this._handleTabKey(e);
            }
        }, { signal });

        // Close button hover effects
        this._closeBtn.addEventListener('mouseenter', () => {
            this._closeBtn.style.backgroundColor = '#f3f4f6';
        }, { signal });

        this._closeBtn.addEventListener('mouseleave', () => {
            this._closeBtn.style.backgroundColor = 'transparent';
        }, { signal });
    }

    _setupAccessibility() {
        // Set up ARIA attributes
        this._dialog.setAttribute('role', 'dialog');
        this._dialog.setAttribute('aria-modal', 'true');
        this._titleEl.setAttribute('id', `${this.id || 'dialog'}-title`);
        this._dialog.setAttribute('aria-labelledby', this._titleEl.id);
    }

    _shouldCloseOnBackdrop() {
        return this.getAttribute('backdrop-close') !== 'false';
    }

    _shouldCloseOnEscape() {
        return this.getAttribute('escape-close') !== 'false';
    }

    _getFocusableElements() {
        const focusableSelectors = [
            'button:not([disabled])',
            'input:not([disabled])',
            'select:not([disabled])',
            'textarea:not([disabled])',
            'a[href]',
            '[tabindex]:not([tabindex="-1"])',
            'x-button:not([disabled])',
            'x-input:not([disabled])',
            'x-select:not([disabled])',
            'x-checkbox:not([disabled])',
            'x-textarea:not([disabled])'
        ].join(', ');

        return Array.from(this._dialog.querySelectorAll(focusableSelectors))
            .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null);
    }

    _handleTabKey(e) {
        const focusableElements = this._getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            // Tab
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    }

    async _showDialog() {
        if (this._isTransitioning) return;
        this._isTransitioning = true;

        // Store current focus
        this._previousFocus = document.activeElement;

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Show backdrop
        this._backdrop.style.display = 'flex';

        // Trigger animations
        await new Promise(resolve => {
            requestAnimationFrame(() => {
                this._backdrop.style.opacity = '1';
                this._dialog.style.transform = 'scale(1)';
                setTimeout(resolve, 200); // Match transition duration
            });
        });

        // Focus management
        this._focusDialog();
        this._isTransitioning = false;

        // Dispatch open event
        this.dispatchEvent(new CustomEvent('dialog-open', {
            bubbles: true,
            composed: true,
            detail: { dialog: this }
        }));
    }

    async _hideDialog(reason = 'unknown') {
        if (this._isTransitioning) return;
        this._isTransitioning = true;

        // Dispatch close event (can be cancelled)
        const closeEvent = new CustomEvent('dialog-close', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: { reason, dialog: this }
        });

        this.dispatchEvent(closeEvent);

        if (closeEvent.defaultPrevented) {
            this._isTransitioning = false;
            return;
        }

        // Trigger exit animations
        this._backdrop.style.opacity = '0';
        this._dialog.style.transform = 'scale(0.95)';

        await new Promise(resolve => setTimeout(resolve, 200));

        // Hide dialog
        this._backdrop.style.display = 'none';

        // Restore body scroll
        document.body.style.overflow = '';

        // Restore focus
        if (this._previousFocus && document.contains(this._previousFocus)) {
            this._previousFocus.focus();
        }

        this._isTransitioning = false;

        // Dispatch closed event
        this.dispatchEvent(new CustomEvent('dialog-closed', {
            bubbles: true,
            composed: true,
            detail: { reason, dialog: this }
        }));
    }

    _focusDialog() {
        // Try to focus first focusable element, fallback to dialog itself
        const focusableElements = this._getFocusableElements();
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        } else {
            this._dialog.focus();
        }
    }

    _updateSize() {
        const size = this.getAttribute('size') || 'medium';

        const sizes = {
            small: '400px',
            medium: '600px',
            large: '800px',
            xlarge: '1000px',
            full: '95vw'
        };

        this._dialog.style.width = sizes[size] || sizes.medium;
    }

    render() {
        if (!this._dialog) return;

        const isOpen = this.hasAttribute('open');
        const title = this.getAttribute('title') || '';
        const role = this.getAttribute('role') || 'dialog';

        // Update title
        this._titleEl.textContent = title;
        this._titleEl.style.display = title ? 'block' : 'none';

        // Update size
        this._updateSize();

        // Update role
        this._dialog.setAttribute('role', role);

        // Update header visibility
        this._header.style.display = title || this._shouldShowCloseButton() ? 'flex' : 'none';

        // Update footer visibility (show if has slotted actions)
        const hasActions = this._footer.children.length > 0;
        this._footer.style.display = hasActions ? 'flex' : 'none';

        // Handle open/close state
        if (isOpen && this._backdrop.style.display === 'none') {
            this._showDialog();
        } else if (!isOpen && this._backdrop.style.display !== 'none') {
            this._hideDialog('attribute-change');
        }
    }

    _shouldShowCloseButton() {
        return this.getAttribute('show-close') !== 'false';
    }

    // Public API methods
    open() {
        this.setAttr('open', '');
    }

    close(reason = 'api') {
        this.removeAttribute('open');
        return this._hideDialog(reason);
    }

    toggle() {
        if (this.hasAttribute('open')) {
            this.close('toggle');
        } else {
            this.open();
        }
    }

    isOpen() {
        return this.hasAttribute('open');
    }

    // Method to add action buttons to footer
    addAction(button) {
        if (button instanceof HTMLElement) {
            this._footer.appendChild(button);
            this.render(); // Update footer visibility
        }
    }

    clearActions() {
        this._footer.innerHTML = '';
        this.render();
    }

    // Focus management
    focus() {
        if (this.hasAttribute('open')) {
            this._focusDialog();
        }
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();

        // Remove dialog from DOM
        if (this._backdrop && this._backdrop.parentNode) {
            this._backdrop.parentNode.removeChild(this._backdrop);
        }

        // Restore body scroll if dialog was open
        if (this.hasAttribute('open')) {
            document.body.style.overflow = '';
        }
    }

    // Static convenience methods for common dialog types
    static alert(message, title = 'Alert') {
        const dialog = document.createElement('x-dialog');
        dialog.setAttr('title', title);
        dialog.setAttr('size', 'small');
        dialog.setAttr('role', 'alertdialog');
        dialog.innerHTML = `<p style="margin: 0;">${message}</p>`;

        document.body.appendChild(dialog);

        const okButton = document.createElement('x-button');
        okButton.setAttr('label', 'OK');
        okButton.setAttr('variant', 'primary');
        okButton.addEventListener('button-click', () => {
            dialog.close('ok');
            document.body.removeChild(dialog);
        });

        dialog.addAction(okButton);
        dialog.open();

        return new Promise(resolve => {
            dialog.addEventListener('dialog-closed', () => {
                resolve();
            }, { once: true });
        });
    }

    static confirm(message, title = 'Confirm') {
        const dialog = document.createElement('x-dialog');
        dialog.setAttr('title', title);
        dialog.setAttr('size', 'small');
        dialog.setAttr('role', 'alertdialog');
        dialog.innerHTML = `<p style="margin: 0;">${message}</p>`;

        document.body.appendChild(dialog);

        let result = false;

        const cancelButton = document.createElement('x-button');
        cancelButton.setAttr('label', 'Cancel');
        cancelButton.addEventListener('button-click', () => {
            result = false;
            dialog.close('cancel');
        });

        const confirmButton = document.createElement('x-button');
        confirmButton.setAttr('label', 'Confirm');
        confirmButton.setAttr('variant', 'primary');
        confirmButton.addEventListener('button-click', () => {
            result = true;
            dialog.close('confirm');
        });

        dialog.addAction(cancelButton);
        dialog.addAction(confirmButton);
        dialog.open();

        return new Promise(resolve => {
            dialog.addEventListener('dialog-closed', () => {
                document.body.removeChild(dialog);
                resolve(result);
            }, { once: true });
        });
    }
}

customElements.define('x-dialog', XDialog);