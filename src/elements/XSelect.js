import XBase from '../core/XBase.js';

// Form-Associated Select Element
export default class XSelect extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['value', 'options', 'placeholder', 'required', 'disabled', 'error', 'label'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    onConnect(signal) {
        // Render internal select for native semantics & form integration
        if (!this._select) {
            const select = this._select = document.createElement('select');
            select.part = 'select'; // allows ::part styling

            // Forward select events
            select.addEventListener('change', (e) => {
                this.setAttr('value', e.target.value);
                this._internals.setFormValue(e.target.value);
                this.dispatchEvent(new CustomEvent('select-change', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        value: e.target.value,
                        selectedOption: this._getSelectedOption()
                    }
                }));
            }, { signal });

            select.addEventListener('focus', () => {
                this.dispatchEvent(new CustomEvent('select-focus', { bubbles: true, composed: true }));
            }, { signal });

            select.addEventListener('blur', () => {
                this._validateAndUpdate();
                this.dispatchEvent(new CustomEvent('select-blur', { bubbles: true, composed: true }));
            }, { signal });

            this.appendChild(select);
            this._setupLabel();
        }
    }

    _setupLabel() {
        const label = this.getAttribute('label');
        if (label && !this._label) {
            this._label = document.createElement('label');
            this._label.part = 'label';
            this._label.textContent = label;
            this.insertBefore(this._label, this._select);
        }
    }

    _parseOptions() {
        const optionsAttr = this.getAttribute('options') || '[]';
        try {
            // Support JSON format: [{"value":"us","label":"United States"}]
            return JSON.parse(optionsAttr);
        } catch (e) {
            // Fallback: simple format "us:United States,ca:Canada"
            if (optionsAttr.includes(':')) {
                return optionsAttr.split(',').map(item => {
                    const [value, label] = item.split(':').map(s => s.trim());
                    return { value, label: label || value };
                });
            }
            return [];
        }
    }

    _getSelectedOption() {
        const options = this._parseOptions();
        const value = this.getAttribute('value');
        return options.find(opt => opt.value === value) || null;
    }

    _validateAndUpdate() {
        const value = this.getAttribute('value') || '';
        const required = this.hasAttribute('required');

        let error = '';

        // Basic validation
        if (required && !value.trim()) {
            error = 'Please select an option';
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
        if (!this._select) return;

        const value = this.getAttribute('value') || '';
        const placeholder = this.getAttribute('placeholder');
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');
        const label = this.getAttribute('label');
        const options = this._parseOptions();

        // Clear existing options
        this._select.innerHTML = '';

        // Add placeholder option if provided
        if (placeholder) {
            const placeholderOption = document.createElement('option');
            placeholderOption.value = '';
            placeholderOption.textContent = placeholder;
            placeholderOption.disabled = true;
            placeholderOption.selected = !value;
            this._select.appendChild(placeholderOption);
        }

        // Add options
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label || opt.value;
            option.selected = opt.value === value;
            this._select.appendChild(option);
        });

        // Update select properties
        if (disabled) {
            this._select.setAttribute('disabled', '');
        } else {
            this._select.removeAttribute('disabled');
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

        if (this._select) {
            this._select.style.width = '100%';
            this._select.style.padding = '8px 12px';
            this._select.style.border = error ? '1px solid #ef4444' : '1px solid #e5e7eb';
            this._select.style.borderRadius = '6px';
            this._select.style.fontSize = '14px';
            this._select.style.outline = 'none';
            this._select.style.transition = 'border-color 0.15s ease';
            this._select.style.background = disabled ? '#f9fafb' : 'white';
            this._select.style.color = disabled ? '#9ca3af' : 'black';
            this._select.style.cursor = disabled ? 'not-allowed' : 'pointer';

            // Style for placeholder when no value selected
            if (!value && placeholder) {
                this._select.style.color = '#9ca3af';
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
        this._select?.focus();
    }

    blur() {
        this._select?.blur();
    }

    // Convenience methods for external manipulation
    addOption(value, label) {
        const options = this._parseOptions();
        options.push({ value, label: label || value });
        this.setAttr('options', JSON.stringify(options));
    }

    removeOption(value) {
        const options = this._parseOptions().filter(opt => opt.value !== value);
        this.setAttr('options', JSON.stringify(options));
    }

    clearOptions() {
        this.setAttr('options', '[]');
    }

    getSelectedOption() {
        return this._getSelectedOption();
    }
}

customElements.define('x-select', XSelect);