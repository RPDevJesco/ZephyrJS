import XBase from '../core/XBase.js';

// Form-Associated Textarea Element with auto-resize and character counting
export default class XTextArea extends XBase {
    static formAssociated = true;
    static get observedAttributes() {
        return ['value', 'placeholder', 'required', 'disabled', 'error', 'label', 'rows', 'auto-resize', 'max-length', 'show-count'];
    }

    constructor() {
        super();
        this._internals = this.attachInternals();
    }

    onConnect(signal) {
        // Render internal textarea for native semantics & form integration
        if (!this._textarea) {
            const textarea = this._textarea = document.createElement('textarea');
            textarea.part = 'textarea'; // allows ::part styling

            // Forward all textarea events
            textarea.addEventListener('input', (e) => {
                this.setAttr('value', e.target.value);
                this._internals.setFormValue(e.target.value);
                this._handleAutoResize();
                this._updateCharacterCount();
                this.dispatchEvent(new CustomEvent('textarea-change', {
                    bubbles: true,
                    composed: true,
                    detail: { value: e.target.value }
                }));
            }, { signal });

            textarea.addEventListener('focus', () => {
                this.dispatchEvent(new CustomEvent('textarea-focus', { bubbles: true, composed: true }));
            }, { signal });

            textarea.addEventListener('blur', () => {
                this._validateAndUpdate();
                this.dispatchEvent(new CustomEvent('textarea-blur', { bubbles: true, composed: true }));
            }, { signal });

            // Handle paste events for auto-resize
            textarea.addEventListener('paste', () => {
                setTimeout(() => this._handleAutoResize(), 0);
            }, { signal });

            this.appendChild(textarea);
            this._setupLabel();
        }
    }

    _setupLabel() {
        const label = this.getAttribute('label');
        if (label && !this._label) {
            this._label = document.createElement('label');
            this._label.part = 'label';
            this._label.textContent = label;
            this.insertBefore(this._label, this._textarea);
        }
    }

    _handleAutoResize() {
        if (!this.hasAttribute('auto-resize') || !this._textarea) return;

        // Reset height to auto to shrink if content is removed
        this._textarea.style.height = 'auto';

        // Set height to scrollHeight to expand for content
        const newHeight = Math.max(this._textarea.scrollHeight, this._getMinHeight());
        this._textarea.style.height = newHeight + 'px';
    }

    _getMinHeight() {
        const rows = Number(this.getAttribute('rows')) || 3;
        const lineHeight = parseInt(getComputedStyle(this._textarea).lineHeight) || 20;
        const padding = parseInt(getComputedStyle(this._textarea).paddingTop) +
            parseInt(getComputedStyle(this._textarea).paddingBottom);
        return (rows * lineHeight) + padding;
    }

    _updateCharacterCount() {
        if (!this.hasAttribute('show-count')) return;

        const value = this.getAttribute('value') || '';
        const maxLength = Number(this.getAttribute('max-length'));

        if (!this._countEl) {
            this._countEl = document.createElement('div');
            this._countEl.part = 'count';
            this._countEl.style.fontSize = '12px';
            this._countEl.style.color = '#6b7280';
            this._countEl.style.textAlign = 'right';
            this._countEl.style.marginTop = '4px';
            this.appendChild(this._countEl);
        }

        let countText = `${value.length}`;
        if (maxLength) {
            countText += ` / ${maxLength}`;
            // Change color if approaching or exceeding limit
            if (value.length > maxLength * 0.9) {
                this._countEl.style.color = value.length > maxLength ? '#ef4444' : '#f59e0b';
            } else {
                this._countEl.style.color = '#6b7280';
            }
        }

        this._countEl.textContent = countText;
    }

    _validateAndUpdate() {
        const value = this.getAttribute('value') || '';
        const required = this.hasAttribute('required');
        const maxLength = Number(this.getAttribute('max-length'));

        let error = '';

        // Basic validation
        if (required && !value.trim()) {
            error = 'This field is required';
        } else if (maxLength && value.length > maxLength) {
            error = `Maximum ${maxLength} characters allowed`;
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
        if (!this._textarea) return;

        const value = this.getAttribute('value') || '';
        const placeholder = this.getAttribute('placeholder') || '';
        const disabled = this.hasAttribute('disabled');
        const error = this.getAttribute('error');
        const label = this.getAttribute('label');
        const rows = Number(this.getAttribute('rows')) || 3;
        const maxLength = Number(this.getAttribute('max-length'));

        // Update textarea properties
        this._textarea.value = value;
        this._textarea.placeholder = placeholder;
        this._textarea.rows = rows;

        if (maxLength) {
            this._textarea.maxLength = maxLength;
        } else {
            this._textarea.removeAttribute('maxLength');
        }

        if (disabled) {
            this._textarea.setAttribute('disabled', '');
        } else {
            this._textarea.removeAttribute('disabled');
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

        if (this._textarea) {
            this._textarea.style.width = '100%';
            this._textarea.style.padding = '8px 12px';
            this._textarea.style.border = error ? '1px solid #ef4444' : '1px solid #e5e7eb';
            this._textarea.style.borderRadius = '6px';
            this._textarea.style.fontSize = '14px';
            this._textarea.style.outline = 'none';
            this._textarea.style.transition = 'border-color 0.15s ease';
            this._textarea.style.background = disabled ? '#f9fafb' : 'white';
            this._textarea.style.color = disabled ? '#9ca3af' : 'black';
            this._textarea.style.cursor = disabled ? 'not-allowed' : 'text';
            this._textarea.style.fontFamily = 'inherit';
            this._textarea.style.lineHeight = '1.5';

            // Auto-resize specific styles
            if (this.hasAttribute('auto-resize')) {
                this._textarea.style.resize = 'none';
                this._textarea.style.overflow = 'hidden';
                this._textarea.style.minHeight = this._getMinHeight() + 'px';
            } else {
                this._textarea.style.resize = 'vertical';
                this._textarea.style.overflow = 'auto';
                this._textarea.style.minHeight = 'auto';
            }
        }

        // Handle auto-resize on render
        this._handleAutoResize();

        // Update character count
        this._updateCharacterCount();

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
        this._textarea?.focus();
    }

    blur() {
        this._textarea?.blur();
    }

    // Convenience methods
    selectAll() {
        this._textarea?.select();
    }

    insertText(text, position = null) {
        if (!this._textarea) return;

        const textarea = this._textarea;
        const currentValue = textarea.value;

        if (position === null) {
            position = textarea.selectionStart;
        }

        const newValue = currentValue.slice(0, position) + text + currentValue.slice(position);
        this.setAttr('value', newValue);

        // Set cursor position after inserted text
        setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = position + text.length;
        }, 0);
    }

    getSelection() {
        if (!this._textarea) return { start: 0, end: 0, text: '' };

        return {
            start: this._textarea.selectionStart,
            end: this._textarea.selectionEnd,
            text: this._textarea.value.slice(this._textarea.selectionStart, this._textarea.selectionEnd)
        };
    }
}

customElements.define('x-textarea', XTextArea);