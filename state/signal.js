import { AOPToolkit } from '../aop/aoptoolkit.js';

/**
 * Signal class.
 * Represents a reactive signal that holds a value and notifies listeners upon changes.
 */
export default class Signal {
    /**
     * Constructor.
     * Initializes the signal with an initial value and applies AOP advices.
     * @param {*} initialValue - The initial value of the signal.
     */
    constructor(initialValue) {
        this.listeners = new Set();
        this.value = initialValue;
        this.applyAOPAdvices();
    }

    /**
     * Gets the current value of the signal.
     * @returns {*} The current value.
     */
    get() {
        return this.value;
    }

    /**
     * Sets a new value for the signal and notifies listeners.
     * @param {*} newValue - The new value to be set.
     */
    set(newValue) {
        this.value = newValue;
        this.notifyListeners(this.value);
    }

    /**
     * Subscribes a listener to signal changes.
     * @param {Function} listener - The listener function to be called on signal changes.
     * @returns {Function} A function to unsubscribe the listener.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Notifies all subscribed listeners with the current value.
     * @param {*} value - The current value to notify listeners with.
     */
    notifyListeners(value) {
        this.listeners.forEach((listener) => listener(value));
    }

    /**
     * Applies Aspect-Oriented Programming (AOP) advices for logging.
     * Logs actions before setting the signal value and after notifying listeners.
     */
    applyAOPAdvices() {
        this.set = AOPToolkit.before(this.set, function(newValue) {
            console.log(`Setting signal value: ${newValue}`);
        });

        this.notifyListeners = AOPToolkit.afterReturning(this.notifyListeners, function(value) {
            console.log(`Notified listeners with value: ${value}`);
        });
    }
}

export { Signal };