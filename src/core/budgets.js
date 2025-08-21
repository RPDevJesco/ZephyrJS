// Lightweight resource budget enforcement & metrics for a subtree.
export function enforceBudget(root, { nodes, listeners } = {}) {
    if (!(root instanceof Element)) return;
    if (nodes) {
        const count = root.querySelectorAll('*').length + 1; // include root
        if (count > nodes) throw new Error(`[Budget] Node budget exceeded: ${count} > ${nodes}`);
    }
    if (listeners) {
        let count = 0;
        const add = EventTarget.prototype.addEventListener;
        const patched = function(type, listener, options) {
            if (root.contains(this)) {
                count++; if (count > listeners) throw new Error(`[Budget] Listener budget exceeded`);
            }
            return add.call(this, type, listener, options);
        };
        // Patch only once per root
        if (!root.__listenerPatched) {
            EventTarget.prototype.addEventListener = patched;
            root.__listenerPatched = true;
        }
    }
}

export function metrics(root) {
    return {
        nodes: root.querySelectorAll('*').length + 1,
        // Listener count is not observable cross-browser without instrumentation; expose hook instead.
    };
}