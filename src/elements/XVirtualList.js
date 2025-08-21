import XBase from '../core/XBase.js';

export default class XVirtualList extends XBase {
    static observedAttributes = ['item-count','item-height'];

    onConnect(signal) {
        this.style.overflow = 'auto';
        this.style.position = 'relative';
        if (!this._container) {
            this._container = this.firstElementChild ?? this.appendChild(document.createElement('div'));
            this._container.style.position = 'relative';
        }
        this.addEventListener('scroll', () => this.render(), { signal });
    }

    set renderer(fn) { this._renderer = fn; this.render(); }

    render() {
        // Ensure container exists even if render() runs early
        if (!this._container) {
            this._container = this.firstElementChild ?? this.appendChild(document.createElement('div'));
            this._container.style.position = 'relative';
        }

        const N = Number(this.getAttribute('item-count') ?? 0);
        const H = Number(this.getAttribute('item-height') ?? 24);
        const vh = this.clientHeight || 300;
        const start = Math.max(0, Math.floor(this.scrollTop / H) - 3);
        const visible = Math.min(N - start, Math.ceil(vh / H) + 6);

        this._container.style.height = `${N * H}px`;

        while (this._container.children.length < visible) {
            const item = document.createElement('div');
            item.style.position = 'absolute';
            item.style.left = '0';
            item.style.right = '0';
            this._container.appendChild(item);
        }
        while (this._container.children.length > visible) this._container.lastChild.remove();

        for (let i = 0; i < visible; i++) {
            const idx = start + i;
            const el = this._container.children[i];
            el.style.top = `${idx * H}px`;
            el.style.height = `${H}px`;
            this._renderer?.(el, idx);
        }
    }
}

customElements.define('x-virtual-list', XVirtualList);