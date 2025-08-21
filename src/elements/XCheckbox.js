import XBase from '../core/XBase.js';

// Form-Associated Checkbox Element
export default class XCheckbox extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['checked', 'label', 'required', 'disabled', 'error', 'value'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    onConnect(signal) {
        // Render internal checkbox for native semantics & form integration
        if (!this._checkbox) {
            const wrapper = this._wrapper = document.createElement('div');
            wrapper.part = 'wrapper';
            wrapper.style.display = 'flex';
            wrapper.style.alignItems = 'flex-start';
            wrapper.style.gap = '8px';
            wrapper.style.cursor = 'pointer';

            const checkbox = this._checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.part = 'checkbox';

            // Forward checkbox events
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.setAttr('checked', '');
                } else {
                    this.removeAttribute('checked');
                }

                this._updateFormValue();
                this.dispatchEvent(new CustomEvent('checkbox-change', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        checked: e.target.checked,
                        value: this.getAttribute('value') || 'on'
                    }
                }));
            }, { signal });

            checkbox.addEventListener('focus', () => {
                this.dispatchEvent(new CustomEvent('checkbox-focus', { bubbles: true, composed: true }));
            }, { signal });

            checkbox.addEventListener('blur', () => {
                this._validateAndUpdate();
                this.dispatchEvent(new CustomEvent('checkbox-blur', { bubbles: true, composed: true }));
            }, { signal });

            // Create label element for the text
            const labelEl = this._labelEl = document.createElement('label');
            labelEl.part = 'label';
            labelEl.style.cursor = 'pointer';
            labelEl.style.userSelect = 'none';
            labelEl.addEventListener('click', () => {
                if (!this.hasAttribute('disabled')) {
                    checkbox.click();
                }
            }, { signal });

            wrapper.appendChild(checkbox);
            wrapper.appendChild(labelEl);
            this.appendChild(wrapper);
        }
    }

    _updateFormValue() {
        const checked = this.hasAttribute('checked');
        const value = this.getAttribute('value') || 'on';

        // Form submission: checked checkboxes submit their value, unchecked submit nothing
        this._internals.setFormValue(checked ? value : null);
    }

    _validateAndUpdate() {
        const checked = this.hasAttribute('checked');
        const required = this.hasAttribute('required');

        let error = '';

        // Basic validation
        if (required && !checked) {
            error = 'This field is required';
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

    render() {
        if (!this._checkbox) return;

        const checked = this.hasAttribute('checked');
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');
        const label = this.getAttribute('label') || this.textContent?.trim();

        // Update checkbox state
        this._checkbox.checked = checked;

        if (disabled) {
            this._checkbox.setAttribute('disabled', '');
        } else {
            this._checkbox.removeAttribute('disabled');
        }

        // Update label text
        if (this._labelEl) {
            this._labelEl.textContent = label || '';
        }

        // Update form value
        this._updateFormValue();

        // Basic styling
        this.style.display = 'block';
        this.style.marginBottom = error ? '4px' : '12px';

        if (this._wrapper) {
            this._wrapper.style.opacity = disabled ? '0.6' : '1';
            this._wrapper.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }

        if (this._checkbox) {
            this._checkbox.style.width = '16px';
            this._checkbox.style.height = '16px';
            this._checkbox.style.marginTop = '2px'; // Align with first line of text
            this._checkbox.style.accentColor = 'var(--x-accent, #4f46e5)';
            this._checkbox.style.cursor = disabled ? 'not-allowed' : 'pointer';
        }

        if (this._labelEl) {
            this._labelEl.style.fontSize = '14px';
            this._labelEl.style.lineHeight = '1.5';
            this._labelEl.style.color = disabled ? '#9ca3af' : '#374151';
            this._labelEl.style.cursor = disabled ? 'not-allowed' : 'pointer';

            // Highlight if error
            if (error) {
                this._labelEl.style.color = '#ef4444';
            }
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
            this._errorEl.style.marginLeft = '24px'; // Align with label text
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
        this.removeAttribute('checked');
    }

    formStateRestoreCallback(state) {
        if (state) {
            this.setAttr('checked', '');
        } else {
            this.removeAttribute('checked');
        }
    }

    // Focus management
    focus() {
        this._checkbox?.focus();
    }

    blur() {
        this._checkbox?.blur();
    }

    // Convenience methods
    get isChecked() {
        return this.hasAttribute('checked');
    }

    check() {
        this.setAttr('checked', '');
    }

    uncheck() {
        this.removeAttribute('checked');
    }

    toggle() {
        if (this.isChecked) {
            this.uncheck();
        } else {
            this.check();
        }
    }
}

customElements.define('x-checkbox', XCheckbox);