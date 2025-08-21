import XBase from '../core/XBase.js';

// Form-Associated Custom Element for native form integration
export default class XInput extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['value', 'type', 'placeholder', 'required', 'disabled', 'error', 'label'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    onConnect(signal) {
        // Render internal input for native semantics & form integration
        if (!this._input) {
            const input = this._input = document.createElement('input');
            input.part = 'input'; // allows ::part styling

            // Forward all input events
            input.addEventListener('input', (e) => {
                this.setAttr('value', e.target.value);
                this._internals.setFormValue(e.target.value);
                this.dispatchEvent(new CustomEvent('input-change', {
                    bubbles: true,
                    composed: true,
                    detail: { value: e.target.value }
                }));
            }, { signal });

            input.addEventListener('focus', () => {
                this.dispatchEvent(new CustomEvent('input-focus', { bubbles: true, composed: true }));
            }, { signal });

            input.addEventListener('blur', () => {
                this._validateAndUpdate();
                this.dispatchEvent(new CustomEvent('input-blur', { bubbles: true, composed: true }));
            }, { signal });

            this.appendChild(input);
            this._setupLabel();
        }
    }

    _setupLabel() {
        const label = this.getAttribute('label');
        if (label && !this._label) {
            this._label = document.createElement('label');
            this._label.part = 'label';
            this._label.textContent = label;
            this.insertBefore(this._label, this._input);
        }
    }

    _validateAndUpdate() {
        const value = this.getAttribute('value') || '';
        const required = this.hasAttribute('required');
        const type = this.getAttribute('type') || 'text';

        let error = '';

        // Basic validation
        if (required && !value.trim()) {
            error = 'This field is required';
        } else if (type === 'email' && value && !this._isValidEmail(value)) {
            error = 'Please enter a valid email address';
        }

        // Allow custom error to override
        const customError = this.getAttribute('error');
        if (customError) error = customError;

        // Update form validity
        if (error) {
            this._internals.setValidity({ customError: true }, error);
            this.setAttr('error', error);
        } else {
            this._internals.setValidity({});
            this.removeAttribute('error');
        }
    }

    _isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    render() {
        if (!this._input) return;

        const value = this.getAttribute('value') || '';
        const type = this.getAttribute('type') || 'text';
        const placeholder = this.getAttribute('placeholder') || '';
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');
        const label = this.getAttribute('label');

        // Update input properties
        this._input.value = value;
        this._input.type = type;
        this._input.placeholder = placeholder;

        if (disabled) {
            this._input.setAttribute('disabled', '');
        } else {
            this._input.removeAttribute('disabled');
        }

        // Update label
        if (label && this._label) {
            this._label.textContent = label;
        } else if (label && !this._label) {
            this._setupLabel();
        }

        // Update form value
        this._internals.setFormValue(value);

        // Basic styling
        this.style.display = 'block';
        this.style.marginBottom = error ? '4px' : '12px';

        if (this._label) {
            this._label.style.display = 'block';
            this._label.style.marginBottom = '4px';
            this._label.style.fontSize = '14px';
            this._label.style.fontWeight = '500';
            this._label.style.color = '#374151';
        }

        if (this._input) {
            this._input.style.width = '100%';
            this._input.style.padding = '8px 12px';
            this._input.style.border = error ? '1px solid #ef4444' : '1px solid #e5e7eb';
            this._input.style.borderRadius = '6px';
            this._input.style.fontSize = '14px';
            this._input.style.outline = 'none';
            this._input.style.transition = 'border-color 0.15s ease';
            this._input.style.background = disabled ? '#f9fafb' : 'white';
            this._input.style.color = disabled ? '#9ca3af' : 'black';
            this._input.style.cursor = disabled ? 'not-allowed' : 'text';
        }

        // Error message
        this._updateErrorMessage(error);
    }

    _updateErrorMessage(error) {
        if (error && !this._errorEl) {
            this._errorEl = document.createElement('div');
            this._errorEl.part = 'error';
            this._errorEl.style.fontSize = '12px';
            this._errorEl.style.color = '#ef4444';
            this._errorEl.style.marginTop = '4px';
            this.appendChild(this._errorEl);
        }

        if (this._errorEl) {
            if (error) {
                this._errorEl.textContent = error;
                this._errorEl.style.display = 'block';
            } else {
                this._errorEl.style.display = 'none';
            }
        }
    }

    // Form-Associated Custom Element methods
    formDisabledCallback(disabled) {
        if (disabled) {
            this.setAttr('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    formResetCallback() {
        this.setAttr('value', '');
    }

    formStateRestoreCallback(state) {
        this.setAttr('value', state);
    }

    // Focus management
    focus() {
        this._input?.focus();
    }

    blur() {
        this._input?.blur();
    }
}

customElements.define('x-input', XInput);