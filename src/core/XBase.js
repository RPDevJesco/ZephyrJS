export default class XBase extends HTMLElement {
    static observedAttributes = [];
    #abort = new AbortController();

    connectedCallback() {
        this.onConnect?.(this.#abort.signal);
        this.render?.();
    }
    disconnectedCallback() { this.#abort.abort(); }

    // Only render on attribute changes after we're connected.
    attributeChangedCallback() {
        if (this.isConnected) this.render?.();
    }

    setAttr(name, v) { v == null ? this.removeAttribute(name) : this.setAttribute(name, String(v)); }
}
