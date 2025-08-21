import XBase from '../core/XBase.js';

// Autonomous custom element (<x-button>) for widest browser support.
export default class XButton extends XBase {
    static get observedAttributes() { return ['label','disabled','variant']; }

    onConnect(signal) {
        // Render internal button for native semantics & keyboard
        if (!this._btn) {
            const btn = this._btn = document.createElement('button');
            btn.part = 'button'; // allows ::part styling
            btn.addEventListener('click', (e) => {
                if (this.hasAttribute('disabled')) { e.preventDefault(); return; }
                this.dispatchEvent(new CustomEvent('button-click', { bubbles: true, composed: true }));
            }, { signal });
            this.appendChild(btn);
            this._applyA11y();
        }
    }

    _applyA11y() {
        this.setAttribute('role', 'button');
        this.tabIndex = 0;
        this.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this._btn?.click(); }
        }, { signal: new AbortController().signal }); // ephemeral; not tracked
    }

    render() {
        const label = this.getAttribute('label');
        if (this._btn) this._btn.textContent = label ?? this.textContent ?? '';

        // disabled reflection
        const disabled = this.hasAttribute('disabled');
        if (this._btn) disabled ? this._btn.setAttribute('disabled','') : this._btn.removeAttribute('disabled');

        // variant hook via data-attribute for styling
        this.dataset.variant = this.getAttribute('variant') ?? 'default';

        // basic styling via CSS variables (author can override)
        this.style.display = 'inline-block';
        if (this._btn) {
            this._btn.style.padding = '6px 10px';
            this._btn.style.borderRadius = '8px';
            this._btn.style.border = '1px solid #e5e7eb';
            this._btn.style.background = this.dataset.variant === 'primary' ? 'var(--x-accent)' : 'white';
            this._btn.style.color = this.dataset.variant === 'primary' ? 'white' : 'black';
            this._btn.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }
    }
}

customElements.define('x-button', XButton);