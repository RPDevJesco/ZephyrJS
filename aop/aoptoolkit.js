/**
 * AOPToolkit Class
 * Provides a set of static methods to apply cross-cutting concerns (like logging, validation, error handling) around existing function logic.
 */
export class AOPToolkit {
    /**
     * Creates a function that executes the specified advice before the target function.
     * This is useful for actions that need to happen prior to the main logic, such as logging or pre-validation.
     * @param {Function} targetFunction - The original function to wrap.
     * @param {Function} advice - The advice function to execute before the target function.
     * @returns {Function} A new function that first executes the advice, then the target function.
     */
    static before(targetFunction, advice) {
        return function(...args) {
            advice.apply(this, args);
            return targetFunction.apply(this, args);
        };
    }

    /**
     * Creates a function that executes the specified advice after the target function.
     * This can be used for actions that should occur after the main logic, such as post-execution logging or cleanup.
     * @param {Function} targetFunction - The original function to wrap.
     * @param {Function} advice - The advice function to execute after the target function.
     * @returns {Function} A new function that first executes the target function, then the advice.
     */
    static after(targetFunction, advice) {
        return function(...args) {
            const result = targetFunction.apply(this, args);
            advice.apply(this, args);
            return result;
        };
    }

    /**
     * Creates a function that allows the advice to wrap around the target function.
     * The advice controls when and whether the target function is called, enabling more complex behaviors.
     * @param {Function} targetFunction - The original function to wrap.
     * @param {Function} advice - The advice function that wraps around the target function.
     * @returns {Function} A new function that delegates control to the advice function.
     */
    static around(targetFunction, advice) {
        return function(...args) {
            return advice.call(this, targetFunction, args);
        };
    }

    /**
     * Creates a function that executes the specified advice after the target function,
     * but only if the target function successfully returns a value.
     * This is typically used for post-processing results or conditional logging.
     * @param {Function} targetFunction - The original function to wrap.
     * @param {Function} advice - The advice function to execute after the target function returns.
     * @returns {Function} A new function that executes the target function and then the advice if no error was thrown.
     */
    static afterReturning(targetFunction, advice) {
        return function(...args) {
            const result = targetFunction.apply(this, args);
            advice.apply(this, [result, ...args]);
            return result;
        };
    }

    /**
     * Creates a function that executes the specified advice when the target function throws an error.
     * This is useful for centralized error handling that can be applied across multiple functions.
     * @param {Function} targetFunction - The original function to wrap.
     * @param {Function} advice - The advice function to execute if the target function throws an error.
     * @returns {Function} A new function that executes the target function and handles any thrown errors with the advice.
     */
    static afterThrowing(targetFunction, advice) {
        return function(...args) {
            try {
                return targetFunction.apply(this, args);
            } catch (error) {
                advice.apply(this, [error, ...args]);
                throw error; // Re-throw the error after advice
            }
        };
    }
}