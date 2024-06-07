AOPToolkit Class:

    Purpose: Provides a set of static methods to apply cross-cutting concerns (like logging, validation, error handling) around existing function logic.
    Methods:
        before(targetFunction, advice): Executes advice before the target function.
        after(targetFunction, advice): Executes advice after the target function.
        around(targetFunction, advice): Wraps advice around the target function.
        afterReturning(targetFunction, advice): Executes advice after the target function returns a value.
        afterThrowing(targetFunction, advice): Executes advice if the target function throws an error.
    Use Cases: These methods enable adding functionality like logging, validation, and error handling without modifying the original function logic. This approach adheres to the principles of AOP, enhancing modularity and separation of concerns.

Signal Class:

    Purpose: Represents a reactive signal that holds a value and notifies listeners upon changes.
    Features:
        get(), set(newValue): Methods to get and set the signal value.
        subscribe(listener): Adds a listener to the signal.
        notifyListeners(value): Notifies all subscribed listeners.
        applyAOPAdvices(): Applies AOP advices for logging.
    AOP Integration: Uses AOPToolkit to log actions before setting the signal value and after notifying listeners.

Store Class:

    Purpose: Manages application state and notifies listeners upon state changes.
    Features:
        getState(), setState(newState): Methods to get and set the state.
        subscribe(listener): Adds a listener to the store.
        select(selector): Creates a Signal for a subset of the state.
        notifyListeners(state): Notifies all subscribed listeners.
        applyAOPAdvices(): Applies AOP advices for logging.
    AOP Integration: Uses AOPToolkit to log actions before setting the store state and after notifying listeners.

Router Class:

    Purpose: Manages routing within the application, handling navigation and API requests.
    Features:
        Adds routes, API routes, global guards, and middleware.
        Starts the router and handles route loading and navigation.
        Parses paths and matches routes.
        Handles client-side navigation and API requests.
        Injects HTML files and executes scripts.
    State Management Integration: Uses the Store class to manage route-related state and pass it to route handlers.

General Observations:

    Modularity and Separation of Concerns: The use of AOP allows you to separate cross-cutting concerns from business logic, promoting clean and maintainable code.
    Reactivity and State Management: The Signal and Store classes provide a robust state management solution, supporting reactive updates and selective state subscriptions.
    Routing Flexibility: The Router class is designed to handle both client-side navigation and API requests, with support for dynamic routes, guards, and middleware.
    Logging and Debugging: The integration of logging through AOP advices aids in debugging and monitoring application behavior.
