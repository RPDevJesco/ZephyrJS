export default class Counter {
    constructor(root) {
        if (!(root instanceof HTMLElement)) throw new Error('Counter: root element not found');
        this.root = root;
        this.countEl = root.querySelector('#count');
        this.incBtn = root.querySelector('#inc');
        this.decBtn = root.querySelector('#dec');

        // Paint from DOM attribute (DOM = state)
        this.paint();

        // Events write to attribute only
        this.incBtn.addEventListener('button-click', () => this.setCount(this.getCount() + 1));
        this.decBtn.addEventListener('button-click', () => this.setCount(this.getCount() - 1));

        // React to external changes as well
        new MutationObserver(muts => {
            if (muts.some(m => m.attributeName === 'count')) this.paint();
        }).observe(this.root, { attributes: true });
    }

    getCount() { return Number(this.root.getAttribute('count') ?? 0); }
    setCount(v) { this.root.setAttribute('count', String(v)); }
    paint() { this.countEl.textContent = this.getCount(); }
}