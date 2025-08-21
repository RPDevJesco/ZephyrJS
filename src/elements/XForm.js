import XBase from '../core/XBase.js';

// Form-Associated Form Controller with validation orchestration and submission handling
export default class XForm extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['validate-on', 'auto-save', 'readonly', 'processing', 'action', 'method', 'success-message', 'error-message'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
        this._fieldsets = new Set();
        this._controls = new Set();
        this._formObserver = null;
        this._autoSaveTimeout = null;
        this._submissionData = null;
    }

    onConnect(signal) {
        // Create form structure
        if (!this._form) {
            this._createFormStructure();
            this._setupEventListeners(signal);
            this._setupFormObservation();
            this._setupAutoSave();
        }
    }

    _createFormStructure() {
        // Native form element for proper semantics and behavior
        this._form = document.createElement('form');
        this._form.part = 'form';
        this._form.setAttribute('novalidate', ''); // We handle validation ourselves

        // Move existing content into form
        while (this.firstChild) {
            this._form.appendChild(this.firstChild);
        }

        this.appendChild(this._form);

        // Status message area
        this._statusArea = document.createElement('div');
        this._statusArea.part = 'status';
        this._statusArea.style.cssText = `
      margin-top: 12px;
      padding: 12px;
      border-radius: 6px;
      display: none;
    `;
        this._form.appendChild(this._statusArea);
    }

    _setupEventListeners(signal) {
        // Form submission
        this._form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submit();
        }, { signal });

        // Listen for changes from child controls
        this._form.addEventListener('input', (e) => {
            this._handleFormChange(e);
        }, { signal });

        this._form.addEventListener('change', (e) => {
            this._handleFormChange(e);
        }, { signal });

        // Listen for custom events from our components
        const componentEvents = [
            'input-change', 'select-change', 'checkbox-change',
            'textarea-change', 'radio-change', 'fieldset-change'
        ];

        componentEvents.forEach(eventType => {
            this._form.addEventListener(eventType, (e) => {
                this._handleComponentChange(e);
            }, { signal });
        });
    }

    _setupFormObservation() {
        // Observe for dynamically added form controls and fieldsets
        this._formObserver = new MutationObserver((mutations) => {
            let shouldUpdate = false;

            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(node => {
                        if (this._isFormElement(node)) {
                            this._registerFormElement(node);
                            shouldUpdate = true;
                        }
                    });

                    mutation.removedNodes.forEach(node => {
                        if (this._isFormElement(node)) {
                            this._unregisterFormElement(node);
                            shouldUpdate = true;
                        }
                    });
                }
            });

            if (shouldUpdate) {
                this._updateFormState();
            }
        });

        this._formObserver.observe(this._form, {
            childList: true,
            subtree: true
        });

        // Initial scan
        this._scanForFormElements();
    }

    _setupAutoSave() {
        if (this.hasAttribute('auto-save')) {
            const interval = parseInt(this.getAttribute('auto-save')) || 30000; // 30 seconds default

            this._autoSaveInterval = setInterval(() => {
                if (this._hasUnsavedChanges()) {
                    this._performAutoSave();
                }
            }, interval);
        }
    }

    _isFormElement(element) {
        if (!element || !element.tagName) return false;

        const formTags = [
            'x-fieldset', 'x-input', 'x-select', 'x-checkbox',
            'x-textarea', 'x-radio-group', 'input', 'select', 'textarea'
        ];

        return formTags.includes(element.tagName.toLowerCase());
    }

    _registerFormElement(element) {
        const tagName = element.tagName.toLowerCase();

        if (tagName === 'x-fieldset') {
            this._fieldsets.add(element);
        } else {
            this._controls.add(element);
        }
    }

    _unregisterFormElement(element) {
        this._fieldsets.delete(element);
        this._controls.delete(element);
    }

    _scanForFormElements() {
        // Scan for fieldsets
        const fieldsets = this._form.querySelectorAll('x-fieldset');
        fieldsets.forEach(fieldset => this._fieldsets.add(fieldset));

        // Scan for individual controls
        const controls = this._form.querySelectorAll('x-input, x-select, x-checkbox, x-textarea, x-radio-group, input, select, textarea');
        controls.forEach(control => this._controls.add(control));
    }

    _handleFormChange(e) {
        this._updateFormState();
        this._triggerValidation('change');
        this._scheduleAutoSave();

        this.dispatchEvent(new CustomEvent('form-change', {
            bubbles: true,
            composed: true,
            detail: {
                target: e.target,
                form: this,
                formData: this.getFormData()
            }
        }));
    }

    _handleComponentChange(e) {
        this._updateFormState();
        this._triggerValidation('change');
        this._scheduleAutoSave();

        this.dispatchEvent(new CustomEvent('form-change', {
            bubbles: true,
            composed: true,
            detail: {
                component: e.target,
                componentDetail: e.detail,
                form: this,
                formData: this.getFormData()
            }
        }));
    }

    _triggerValidation(trigger) {
        const validateOn = this.getAttribute('validate-on') || 'submit';

        if (validateOn === trigger || validateOn === 'change') {
            this.validate();
        }
    }

    _scheduleAutoSave() {
        if (!this.hasAttribute('auto-save')) return;

        clearTimeout(this._autoSaveTimeout);
        this._autoSaveTimeout = setTimeout(() => {
            this._performAutoSave();
        }, 2000); // Debounce auto-save
    }

    _performAutoSave() {
        if (this.hasAttribute('readonly') || this.hasAttribute('processing')) return;

        const formData = this.getFormData();

        this.dispatchEvent(new CustomEvent('form-auto-save', {
            bubbles: true,
            composed: true,
            detail: {
                formData,
                timestamp: new Date().toISOString(),
                form: this
            }
        }));

        // Store in sessionStorage as fallback
        try {
            const storageKey = `xform-autosave-${this.id || 'default'}`;
            sessionStorage.setItem(storageKey, JSON.stringify({
                data: formData,
                timestamp: Date.now()
            }));
        } catch (e) {
            console.warn('XForm: Could not auto-save to sessionStorage');
        }
    }

    _hasUnsavedChanges() {
        // Compare current form data with last saved data
        const currentData = JSON.stringify(this.getFormData());
        const lastSaved = JSON.stringify(this._submissionData || {});
        return currentData !== lastSaved;
    }

    _updateFormState() {
        const formData = this.getFormData();
        this._internals.setFormValue(JSON.stringify(formData));
    }

    getFormData() {
        const formData = {};

        // Collect from fieldsets first (they aggregate their controls)
        this._fieldsets.forEach(fieldset => {
            if (fieldset.getFieldsetValue) {
                const fieldsetData = fieldset.getFieldsetValue();
                const fieldsetName = fieldset.id || fieldset.getAttribute('legend') || 'fieldset';
                formData[fieldsetName] = fieldsetData;
            }
        });

        // Collect from individual controls not in fieldsets
        this._controls.forEach(control => {
            if (this._isControlInFieldset(control)) return;

            const name = control.name || control.id;
            if (!name) return;

            formData[name] = this._getControlValue(control);
        });

        return formData;
    }

    _isControlInFieldset(control) {
        return control.closest('x-fieldset') !== null;
    }

    _getControlValue(control) {
        const tagName = control.tagName.toLowerCase();

        switch (tagName) {
            case 'x-checkbox':
                return control.hasAttribute('checked');
            case 'x-input':
            case 'x-textarea':
            case 'x-select':
            case 'x-radio-group':
                return control.getAttribute('value') || '';
            case 'input':
                if (control.type === 'checkbox' || control.type === 'radio') {
                    return control.checked;
                }
                return control.value;
            case 'select':
            case 'textarea':
                return control.value;
            default:
                return '';
        }
    }

    validate() {
        const errors = [];
        const warnings = [];

        // Validate fieldsets
        this._fieldsets.forEach(fieldset => {
            if (fieldset.validate) {
                const isValid = fieldset.validate();
                if (!isValid) {
                    const fieldsetName = fieldset.getAttribute('legend') || fieldset.id || 'Fieldset';
                    errors.push(`${fieldsetName}: Has validation errors`);
                }
            }
        });

        // Validate individual controls
        this._controls.forEach(control => {
            if (this._isControlInFieldset(control)) return;

            const error = this._validateControl(control);
            if (error) {
                errors.push(error);
            }
        });

        // Check required fieldsets
        this._fieldsets.forEach(fieldset => {
            if (fieldset.hasAttribute('required')) {
                const fieldsetData = fieldset.getFieldsetValue ? fieldset.getFieldsetValue() : {};
                const isEmpty = Object.values(fieldsetData).every(value =>
                    value === '' || value === false || value == null
                );

                if (isEmpty) {
                    const fieldsetName = fieldset.getAttribute('legend') || fieldset.id || 'Required section';
                    errors.push(`${fieldsetName}: This section is required`);
                }
            }
        });

        // Update form validity
        const isValid = errors.length === 0;

        if (isValid) {
            this._internals.setValidity({});
            this.removeAttribute('error-message');
        } else {
            this._internals.setValidity({ customError: true }, errors.join('\n'));
            this.setAttr('error-message', errors.join('\n'));
        }

        // Dispatch validation event
        this.dispatchEvent(new CustomEvent('form-validate', {
            bubbles: true,
            composed: true,
            detail: {
                isValid,
                errors,
                warnings,
                form: this
            }
        }));

        return isValid;
    }

    _validateControl(control) {
        // Basic validation for native controls
        if (control.hasAttribute('required')) {
            const value = this._getControlValue(control);
            const isEmpty = value === '' || value === false || value == null;

            if (isEmpty) {
                const label = control.getAttribute('label') || control.name || control.id || 'Field';
                return `${label}: This field is required`;
            }
        }

        return null;
    }

    async submit() {
        if (this.hasAttribute('processing')) return false;

        // Set processing state
        this.setAttr('processing', '');
        this._showStatus('processing', 'Processing...');

        // Validate form
        const isValid = this.validate();

        if (!isValid) {
            this.removeAttribute('processing');
            this._showStatus('error', 'Please fix validation errors before submitting.');
            return false;
        }

        const formData = this.getFormData();

        // Dispatch submit event (cancelable)
        const submitEvent = new CustomEvent('form-submit', {
            bubbles: true,
            composed: true,
            cancelable: true,
            detail: {
                formData,
                form: this
            }
        });

        this.dispatchEvent(submitEvent);

        if (submitEvent.defaultPrevented) {
            this.removeAttribute('processing');
            this._hideStatus();
            return false;
        }

        try {
            // Handle submission
            const result = await this._performSubmission(formData);

            this._submissionData = formData; // Mark as saved
            this.removeAttribute('processing');

            const successMessage = this.getAttribute('success-message') || 'Form submitted successfully!';
            this._showStatus('success', successMessage);

            // Dispatch success event
            this.dispatchEvent(new CustomEvent('form-success', {
                bubbles: true,
                composed: true,
                detail: {
                    formData,
                    result,
                    form: this
                }
            }));

            return true;

        } catch (error) {
            this.removeAttribute('processing');

            const errorMessage = this.getAttribute('error-message') || error.message || 'Submission failed. Please try again.';
            this._showStatus('error', errorMessage);

            // Dispatch error event
            this.dispatchEvent(new CustomEvent('form-error', {
                bubbles: true,
                composed: true,
                detail: {
                    error,
                    formData,
                    form: this
                }
            }));

            return false;
        }
    }

    async _performSubmission(formData) {
        const action = this.getAttribute('action');
        const method = (this.getAttribute('method') || 'POST').toUpperCase();

        if (action) {
            // Submit to URL
            const response = await fetch(action, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } else {
            // Simulate submission for demo
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { success: true, message: 'Form submitted successfully' };
        }
    }

    _showStatus(type, message) {
        this._statusArea.style.display = 'block';
        this._statusArea.textContent = message;

        // Style based on type
        const styles = {
            success: { background: '#d1fae5', color: '#065f46', border: '1px solid #34d399' },
            error: { background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171' },
            warning: { background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b' },
            processing: { background: '#dbeafe', color: '#1e40af', border: '1px solid #3b82f6' }
        };

        const style = styles[type] || styles.processing;
        Object.assign(this._statusArea.style, style);
    }

    _hideStatus() {
        this._statusArea.style.display = 'none';
    }

    render() {
        if (!this._form) return;

        const readonly = this.hasAttribute('readonly');
        const processing = this.hasAttribute('processing');

        // Update form attributes
        const action = this.getAttribute('action');
        const method = this.getAttribute('method') || 'POST';

        if (action) {
            this._form.setAttribute('action', action);
            this._form.setAttribute('method', method);
        }

        // Apply readonly state to all controls
        if (readonly || processing) {
            this._applyReadonlyState(true);
        } else {
            this._applyReadonlyState(false);
        }

        // Update form styling
        this._form.style.opacity = processing ? '0.7' : '1';
        this._form.style.pointerEvents = processing ? 'none' : 'auto';
    }

    _applyReadonlyState(readonly) {
        const allElements = this._form.querySelectorAll('x-input, x-select, x-checkbox, x-textarea, x-radio-group, input, select, textarea, button');

        allElements.forEach(element => {
            if (readonly) {
                element.setAttribute('disabled', '');
            } else {
                // Only remove if it wasn't individually disabled
                if (!element.hasAttribute('data-individually-disabled')) {
                    element.removeAttribute('disabled');
                }
            }
        });
    }

    // Form-Associated Custom Element methods
    formDisabledCallback(disabled) {
        this._applyReadonlyState(disabled);
    }

    formResetCallback() {
        this.reset();
    }

    formStateRestoreCallback(state) {
        try {
            const formData = JSON.parse(state);
            this.setFormData(formData);
        } catch (e) {
            console.warn('XForm: Could not restore form state');
        }
    }

    // Public API methods
    reset() {
        // Reset fieldsets
        this._fieldsets.forEach(fieldset => {
            if (fieldset.resetFieldset) {
                fieldset.resetFieldset();
            }
        });

        // Reset individual controls
        this._controls.forEach(control => {
            if (this._isControlInFieldset(control)) return;

            const tagName = control.tagName.toLowerCase();

            if (tagName.startsWith('x-')) {
                if (tagName === 'x-checkbox') {
                    control.removeAttribute('checked');
                } else {
                    control.setAttr('value', '');
                }
            } else {
                control.value = '';
                if (control.type === 'checkbox' || control.type === 'radio') {
                    control.checked = false;
                }
            }
        });

        this._hideStatus();
        this.removeAttribute('error-message');

        this.dispatchEvent(new CustomEvent('form-reset', {
            bubbles: true,
            composed: true,
            detail: { form: this }
        }));
    }

    setFormData(data) {
        Object.entries(data).forEach(([key, value]) => {
            // Try to find fieldset first
            const fieldset = this._form.querySelector(`x-fieldset[id="${key}"]`);
            if (fieldset && fieldset._restoreFieldsetValue) {
                fieldset._restoreFieldsetValue(value);
                return;
            }

            // Try to find individual control
            const control = this._form.querySelector(`[name="${key}"], [id="${key}"]`);
            if (control) {
                this._setControlValue(control, value);
            }
        });
    }

    _setControlValue(control, value) {
        const tagName = control.tagName.toLowerCase();

        if (tagName.startsWith('x-')) {
            if (tagName === 'x-checkbox') {
                if (value) {
                    control.setAttr('checked', '');
                } else {
                    control.removeAttribute('checked');
                }
            } else {
                control.setAttr('value', String(value));
            }
        } else {
            if (control.type === 'checkbox' || control.type === 'radio') {
                control.checked = Boolean(value);
            } else {
                control.value = String(value);
            }
        }
    }

    isValid() {
        return this.validate();
    }

    isDirty() {
        return this._hasUnsavedChanges();
    }

    // Cleanup
    disconnectedCallback() {
        super.disconnectedCallback();

        if (this._formObserver) {
            this._formObserver.disconnect();
        }

        if (this._autoSaveInterval) {
            clearInterval(this._autoSaveInterval);
        }

        if (this._autoSaveTimeout) {
            clearTimeout(this._autoSaveTimeout);
        }
    }
}

customElements.define('x-form', XForm);