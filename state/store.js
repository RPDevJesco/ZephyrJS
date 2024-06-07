import Signal from "./signal.js";
import { AOPToolkit } from '../aop/aoptoolkit.js';

/**
 * Store class.
 * Manages application state and notifies listeners upon state changes.
 */
class Store {
    /**
     * Constructor.
     * Initializes the state and applies AOP advices.
     * @param {object} initialState - The initial state of the store.
     */
    constructor(initialState) {
        this.state = initialState;
        this.listeners = new Set();
        this.applyAOPAdvices();
    }

    /**
     * Gets the current state.
     * @returns {object} The current state.
     */
    getState() {
        return this.state;
    }

    /**
     * Sets a new state by merging it with the current state and notifies listeners.
     * @param {object} newState - The new state to be merged with the current state.
     */
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners(this.state);
    }

    /**
     * Subscribes a listener to state changes.
     * @param {Function} listener - The listener function to be called on state changes.
     * @returns {Function} A function to unsubscribe the listener.
     */
    subscribe(listener) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    /**
     * Selects a part of the state using a selector function and returns a Signal.
     * @param {Function} selector - The selector function to derive part of the state.
     * @returns {Signal} A Signal representing the selected part of the state.
     */
    select(selector) {
        const selectedState = selector(this.state);
        const signal = new Signal(selectedState);

        this.subscribe((newState) => {
            const newSelectedState = selector(newState);
            if (newSelectedState !== signal.get()) {
                signal.set(newSelectedState);
            }
        });

        return signal;
    }

    /**
     * Notifies all subscribed listeners with the current state.
     * @param {object} state - The current state to notify listeners with.
     */
    notifyListeners(state) {
        this.listeners.forEach((listener) => listener(state));
    }

    /**
     * Applies Aspect-Oriented Programming (AOP) advices for logging.
     * Logs actions before setting the state and after notifying listeners.
     */
    applyAOPAdvices() {
        this.setState = AOPToolkit.before(this.setState, function(newState) {
            console.log(`Setting store state:`, newState);
        });

        this.notifyListeners = AOPToolkit.afterReturning(this.notifyListeners, function(state) {
            console.log(`Notified store listeners with state:`, state);
        });
    }
}

export { Store };