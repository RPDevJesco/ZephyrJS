import XBase from '../core/XBase.js';

// Form-Associated Fieldset for grouping and coordinating form controls
export default class XFieldset extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['legend', 'disabled', 'required', 'error', 'validate-on', 'show-when', 'enable-when'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._childControls = new Set();
        this._validationObserver = null;
    }

    onConnect(signal) {
        // Create semantic fieldset structure
        if (!this._fieldset) {
            this._fieldset = document.createElement('fieldset');
            this._fieldset.part = 'fieldset';

            // Move all existing children into the fieldset
            while (this.firstChild) {
                this._fieldset.appendChild(this.firstChild);
            }

            this.appendChild(this._fieldset);
            this._setupLegend();
            this._setupChildObservation();
        }
    }

    _setupLegend() {
        const legend = this.getAttribute('legend');
        if (legend && !this._legend) {
            this._legend = document.createElement('legend');
            this._legend.part = 'legend';
            this._legend.textContent = legend;
            this._fieldset.insertBefore(this._legend, this._fieldset.firstChild);
        }
    }

    _setupChildObservation() {
        // Observe child form controls for validation and state changes
        this._validationObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Handle added/removed form controls
                    mutation.addedNodes.forEach(node => {
                        if (this._isFormControl(node)) {
                            this._addChildControl(node);
                            shouldUpdate = true;
                        }
                    });

                    mutation.removedNodes.forEach(node => {
                        if (this._isFormControl(node)) {
                            this._removeChildControl(node);
                            shouldUpdate = true;
                        }
                    });
                } else if (mutation.type === 'attributes') {
                    // Handle attribute changes on form controls
                    if (this._isFormControl(mutation.target)) {
                        shouldUpdate = true;
                    }
                }
            });

            if (shouldUpdate) {
                this._updateValidationState();
                this._updateConditionalLogic();
            }
        });

        // Observe the fieldset content for changes
        this._validationObserver.observe(this._fieldset, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['error', 'required', 'disabled', 'value', 'checked']
        });

        // Initial scan for existing controls
        this._scanForControls();
    }

    _isFormControl(element) {
        if (!element || !element.tagName) return false;
        const formTags = ['x-input', 'x-select', 'x-checkbox', 'x-textarea', 'x-radio-group'];
        return formTags.includes(element.tagName.toLowerCase());
    }

    _scanForControls() {
        const controls = this._fieldset.querySelectorAll('x-input, x-select, x-checkbox, x-textarea, x-radio-group');
        controls.forEach(control => this._addChildControl(control));
    }

    _addChildControl(control) {
        if (this._childControls.has(control)) return;

        this._childControls.add(control);

        // Listen for control changes
        const eventMap = {
            'x-input': 'input-change',
            'x-select': 'select-change',
            'x-checkbox': 'checkbox-change',
            'x-textarea': 'textarea-change',
            'x-radio-group': 'radio-change'
        };

        const eventType = eventMap[control.tagName.toLowerCase()];
        if (eventType) {
            control.addEventListener(eventType, () => {
                this._updateValidationState();
                this._updateConditionalLogic();
                this._dispatchFieldsetChange();
            });
        }
    }

    _removeChildControl(control) {
        this._childControls.delete(control);
    }

    _updateValidationState() {
        const validateOn = this.getAttribute('validate-on') || 'submit'; // 'change', 'blur', 'submit'

        if (validateOn === 'change') {
            this._performValidation();
        }
    }

    _performValidation() {
        const errors = [];
        const requiredErrors = [];

        this._childControls.forEach(control => {
            // Check for existing errors
            const error = control.getAttribute('error');
            if (error) {
                errors.push(`${this._getControlLabel(control)}: ${error}`);
            }

            // Check required fields
            if (control.hasAttribute('required')) {
                const isEmpty = this._isControlEmpty(control);
                if (isEmpty) {
                    requiredErrors.push(this._getControlLabel(control));
                }
            }
        });

        // Handle fieldset-level required validation
        if (this.hasAttribute('required') && requiredErrors.length > 0) {
            errors.push(`Required fields: ${requiredErrors.join(', ')}`);
        }

        // Update fieldset validation state
        if (errors.length > 0) {
            const errorMessage = errors.join('\n');
            this._internals.setValidity({ customError: true }, errorMessage);
            this.setAttr('error', errorMessage);
        } else {
            this._internals.setValidity({});
            this.removeAttribute('error');
        }

        // Collect and submit fieldset value
        const value = this._collectFieldsetValue();
        this._internals.setFormValue(JSON.stringify(value));
    }

    _getControlLabel(control) {
        return control.getAttribute('label') ||
            control.getAttribute('legend') ||
            control.id ||
            'Unnamed field';
    }

    _isControlEmpty(control) {
        const tag = control.tagName.toLowerCase();

        switch (tag) {
            case 'x-checkbox':
                return !control.hasAttribute('checked');
            case 'x-input':
            case 'x-textarea':
            case 'x-select':
            case 'x-radio-group':
                const value = control.getAttribute('value') || '';
                return !value.trim();
            default:
                return true;
        }
    }

    _updateConditionalLogic() {
        const showWhen = this.getAttribute('show-when');
        const enableWhen = this.getAttribute('enable-when');

        if (showWhen) {
            const shouldShow = this._evaluateCondition(showWhen);
            this.style.display = shouldShow ? 'block' : 'none';
        }

        if (enableWhen) {
            const shouldEnable = this._evaluateCondition(enableWhen);
            if (shouldEnable) {
                this.removeAttribute('disabled');
            } else {
                this.setAttr('disabled', '');
            }
        }
    }

    _evaluateCondition(condition) {
        // Simple condition format: "field_id:value" or "field_id:!value"
        // Example: "payment_method:credit_card" or "subscribe:!false"
        try {
            const [fieldId, expectedValue] = condition.split(':');
            const targetControl = document.getElementById(fieldId.trim());

            if (!targetControl) return false;

            const actualValue = this._getControlValue(targetControl);
            const expected = expectedValue.trim();

            if (expected.startsWith('!')) {
                // Negation
                return actualValue !== expected.substring(1);
            } else {
                return actualValue === expected;
            }
        } catch (e) {
            console.warn('XFieldset: Invalid condition format:', condition);
            return true;
        }
    }

    _getControlValue(control) {
        const tag = control.tagName.toLowerCase();

        switch (tag) {
            case 'x-checkbox':
                return control.hasAttribute('checked') ? 'true' : 'false';
            case 'x-input':
            case 'x-textarea':
            case 'x-select':
            case 'x-radio-group':
                return control.getAttribute('value') || '';
            default:
                return '';
        }
    }

    _collectFieldsetValue() {
        const value = {};

        this._childControls.forEach(control => {
            const id = control.id;
            if (!id) return;

            const tag = control.tagName.toLowerCase();

            switch (tag) {
                case 'x-checkbox':
                    value[id] = control.hasAttribute('checked');
                    break;
                case 'x-input':
                case 'x-textarea':
                case 'x-select':
                case 'x-radio-group':
                    value[id] = control.getAttribute('value') || '';
                    break;
            }
        });

        return value;
    }

    _dispatchFieldsetChange() {
        const value = this._collectFieldsetValue();
        const errors = this._getFieldsetErrors();

        this.dispatchEvent(new CustomEvent('fieldset-change', {
            bubbles: true,
            composed: true,
            detail: {
                value,
                errors,
                isValid: errors.length === 0,
                fieldset: this
            }
        }));
    }

    _getFieldsetErrors() {
        const errors = [];

        this._childControls.forEach(control => {
            const error = control.getAttribute('error');
            if (error) {
                errors.push({
                    control: control.id,
                    message: error
                });
            }
        });

        return errors;
    }

    render() {
        if (!this._fieldset) return;

        const legend = this.getAttribute('legend');
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');

        // Update legend
        if (legend && this._legend) {
            this._legend.textContent = legend;
        } else if (legend && !this._legend) {
            this._setupLegend();
        }

        // Update fieldset disabled state
        if (disabled) {
            this._fieldset.setAttribute('disabled', '');
            // Cascade disabled state to child controls
            this._childControls.forEach(control => {
                control.setAttr('disabled', '');
            });
        } else {
            this._fieldset.removeAttribute('disabled');
            // Remove disabled state from child controls (unless they were individually disabled)
            this._childControls.forEach(control => {
                // Only remove if it was set by fieldset, not individually
                if (!control.hasAttribute('data-individually-disabled')) {
                    control.removeAttribute('disabled');
                }
            });
        }

        // Update conditional logic
        this._updateConditionalLogic();

        // Basic styling
        this.style.marginBottom = error ? '4px' : '16px';

        if (this._fieldset) {
            this._fieldset.style.border = error ? '1px solid #ef4444' : '1px solid #e5e7eb';
            this._fieldset.style.borderRadius = '8px';
            this._fieldset.style.padding = '16px';
            this._fieldset.style.margin = '0';
            this._fieldset.style.background = disabled ? '#f9fafb' : 'white';
            this._fieldset.style.opacity = disabled ? '0.6' : '1';
        }

        if (this._legend) {
            this._legend.style.fontSize = '16px';
            this._legend.style.fontWeight = '600';
            this._legend.style.color = error ? '#ef4444' : '#374151';
            this._legend.style.padding = '0 8px';
            this._legend.style.marginBottom = '12px';
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
            this._errorEl.style.marginTop = '8px';
            this._errorEl.style.padding = '8px';
            this._errorEl.style.background = '#fef2f2';
            this._errorEl.style.borderRadius = '4px';
            this._errorEl.style.whiteSpace = 'pre-line';
            this._fieldset.appendChild(this._errorEl);
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
        this._childControls.forEach(control => {
            const tag = control.tagName.toLowerCase();

            if (tag === 'x-checkbox') {
                control.removeAttribute('checked');
            } else {
                control.setAttr('value', '');
            }
            control.removeAttribute('error');
        });

        this.removeAttribute('error');
    }

    formStateRestoreCallback(state) {
        try {
            const value = JSON.parse(state);
            this._restoreFieldsetValue(value);
        } catch (e) {
            console.warn('XFieldset: Could not restore state:', state);
        }
    }

    _restoreFieldsetValue(value) {
        Object.entries(value).forEach(([id, fieldValue]) => {
            const control = document.getElementById(id);
            if (!control || !this._childControls.has(control)) return;

            const tag = control.tagName.toLowerCase();

            if (tag === 'x-checkbox') {
                if (fieldValue) {
                    control.setAttr('checked', '');
                } else {
                    control.removeAttribute('checked');
                }
            } else {
                control.setAttr('value', String(fieldValue));
            }
        });
    }

    // Public API methods
    validate() {
        this._performValidation();
        return this._getFieldsetErrors().length === 0;
    }

    getFieldsetValue() {
        return this._collectFieldsetValue();
    }

    resetFieldset() {
        this.formResetCallback();
    }

    getChildControls() {
        return Array.from(this._childControls);
    }

    isValid() {
        return this._getFieldsetErrors().length === 0;
    }

    // Focus management
    focus() {
        // Focus the first child control
        const firstControl = Array.from(this._childControls)[0];
        firstControl?.focus();
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();
        if (this._validationObserver) {
            this._validationObserver.disconnect();
        }
    }
}

customElements.define('x-fieldset', XFieldset);