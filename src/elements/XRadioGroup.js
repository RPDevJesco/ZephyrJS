import XBase from '../core/XBase.js';

// Form-Associated Radio Group Element
export default class XRadioGroup extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['value', 'options', 'name', 'required', 'disabled', 'error', 'label', 'layout'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._radioButtons = [];
    }

    onConnect(signal) {
        // Create container for radio buttons
        if (!this._container) {
            this._container = document.createElement('div');
            this._container.part = 'container';
            this.appendChild(this._container);
            this._setupLabel();
        }
    }

    _setupLabel() {
        const label = this.getAttribute('label');
        if (label && !this._label) {
            this._label = document.createElement('legend');
            this._label.part = 'label';
            this._label.textContent = label;

            // Create fieldset wrapper for semantic grouping
            if (!this._fieldset) {
                this._fieldset = document.createElement('fieldset');
                this._fieldset.part = 'fieldset';
                this._fieldset.style.border = 'none';
                this._fieldset.style.margin = '0';
                this._fieldset.style.padding = '0';

                // Move container into fieldset
                this._fieldset.appendChild(this._label);
                this._fieldset.appendChild(this._container);
                this.appendChild(this._fieldset);
            }
        }
    }

    _parseOptions() {
        const optionsAttr = this.getAttribute('options') || '[]';
        try {
            // Support JSON format: [{"value":"option1","label":"Option 1"}]
            return JSON.parse(optionsAttr);
        } catch (e) {
            // Fallback: simple format "option1:Option 1,option2:Option 2"
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

    _createRadioButton(option, index, signal) {
        const wrapper = document.createElement('div');
        wrapper.part = 'option-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.marginBottom = '8px';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.value = option.value;
        radio.name = this.getAttribute('name') || this.id || 'radio-group';
        radio.id = `${this.id || 'radio'}-${index}`;
        radio.part = 'radio';

        const label = document.createElement('label');
        label.htmlFor = radio.id;
        label.textContent = option.label || option.value;
        label.part = 'option-label';
        label.style.cursor = 'pointer';
        label.style.userSelect = 'none';

        // Handle radio button changes
        radio.addEventListener('change', (e) => {
            if (e.target.checked) {
                this.setAttr('value', e.target.value);
                this._internals.setFormValue(e.target.value);
                this.dispatchEvent(new CustomEvent('radio-change', {
                    bubbles: true,
                    composed: true,
                    detail: {
                        value: e.target.value,
                        selectedOption: this._getSelectedOption(),
                        previousValue: this._previousValue || null
                    }
                }));
                this._previousValue = e.target.value;
            }
        }, { signal });

        radio.addEventListener('focus', () => {
            this.dispatchEvent(new CustomEvent('radio-focus', {
                bubbles: true,
                composed: true,
                detail: { value: radio.value }
            }));
        }, { signal });

        radio.addEventListener('blur', () => {
            this._validateAndUpdate();
            this.dispatchEvent(new CustomEvent('radio-blur', {
                bubbles: true,
                composed: true,
                detail: { value: radio.value }
            }));
        }, { signal });

        wrapper.appendChild(radio);
        wrapper.appendChild(label);

        return { wrapper, radio, label };
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
        if (!this._container) return;

        const value = this.getAttribute('value') || '';
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');
        const label = this.getAttribute('label');
        const layout = this.getAttribute('layout') || 'vertical'; // vertical, horizontal, grid
        const options = this._parseOptions();

        // Clear existing radio buttons
        this._container.innerHTML = '';
        this._radioButtons = [];

        // Create radio buttons for each option
        const signal = new AbortController().signal;
        options.forEach((option, index) => {
            const { wrapper, radio, label: optionLabel } = this._createRadioButton(option, index, signal);

            // Set checked state
            radio.checked = option.value === value;

            // Set disabled state
            if (disabled) {
                radio.setAttribute('disabled', '');
                optionLabel.style.opacity = '0.6';
                optionLabel.style.cursor = 'not-allowed';
            } else {
                radio.removeAttribute('disabled');
                optionLabel.style.opacity = '1';
                optionLabel.style.cursor = 'pointer';
            }

            // Style radio button
            radio.style.width = '16px';
            radio.style.height = '16px';
            radio.style.accentColor = 'var(--x-accent, #4f46e5)';
            radio.style.cursor = disabled ? 'not-allowed' : 'pointer';

            // Style option label
            optionLabel.style.fontSize = '14px';
            optionLabel.style.lineHeight = '1.5';
            optionLabel.style.color = disabled ? '#9ca3af' : '#374151';

            this._container.appendChild(wrapper);
            this._radioButtons.push({ wrapper, radio, label: optionLabel });
        });

        // Update label
        if (label && this._label) {
            this._label.textContent = label;
        } else if (label && !this._label) {
            this._setupLabel();
        }

        // Update form value
        this._internals.setFormValue(value);

        // Apply layout styling
        this._applyLayout(layout);

        // Basic styling
        this.style.display = 'block';
        this.style.marginBottom = error ? '4px' : '12px';

        if (this._label) {
            this._label.style.display = 'block';
            this._label.style.marginBottom = '8px';
            this._label.style.fontSize = '14px';
            this._label.style.fontWeight = '500';
            this._label.style.color = '#374151';
        }

        // Error message
        this._updateErrorMessage(error);
    }

    _applyLayout(layout) {
        if (!this._container) return;

        switch (layout) {
            case 'horizontal':
                this._container.style.display = 'flex';
                this._container.style.flexDirection = 'row';
                this._container.style.flexWrap = 'wrap';
                this._container.style.gap = '16px';
                // Update option wrappers
                this._radioButtons.forEach(({ wrapper }) => {
                    wrapper.style.marginBottom = '0';
                });
                break;

            case 'grid':
                this._container.style.display = 'grid';
                this._container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
                this._container.style.gap = '8px';
                // Update option wrappers
                this._radioButtons.forEach(({ wrapper }) => {
                    wrapper.style.marginBottom = '0';
                });
                break;

            default: // vertical
                this._container.style.display = 'block';
                this._container.style.flexDirection = '';
                this._container.style.gridTemplateColumns = '';
                this._container.style.gap = '';
                // Reset option wrappers
                this._radioButtons.forEach(({ wrapper }) => {
                    wrapper.style.marginBottom = '8px';
                });
                break;
        }
    }

    _updateErrorMessage(error) {
        if (error && !this._errorEl) {
            this._errorEl = document.createElement('div');
            this._errorEl.part = 'error';
            this._errorEl.style.fontSize = '12px';
            this._errorEl.style.color = '#ef4444';
            this._errorEl.style.marginTop = '4px';
            const target = this._fieldset || this;
            target.appendChild(this._errorEl);
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
        // Focus the selected radio button, or the first one if none selected
        const selectedRadio = this._radioButtons.find(({ radio }) => radio.checked);
        const targetRadio = selectedRadio || this._radioButtons[0];
        targetRadio?.radio.focus();
    }

    blur() {
        // Blur any focused radio button
        this._radioButtons.forEach(({ radio }) => {
            if (document.activeElement === radio) {
                radio.blur();
            }
        });
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

        // Clear selection if removing the selected option
        if (this.getAttribute('value') === value) {
            this.setAttr('value', '');
        }
    }

    clearOptions() {
        this.setAttr('options', '[]');
        this.setAttr('value', '');
    }

    getSelectedOption() {
        return this._getSelectedOption();
    }

    selectOption(value) {
        const options = this._parseOptions();
        if (options.some(opt => opt.value === value)) {
            this.setAttr('value', value);
        }
    }

    clearSelection() {
        this.setAttr('value', '');
    }
}

customElements.define('x-radio-group', XRadioGroup);