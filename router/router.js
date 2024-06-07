import { Store } from '../state/store.js';

/**
 * Router class.
 * Manages routing within the application, handling navigation and API requests.
 */
class Router {
    constructor(basePath = '') {
        this.basePath = basePath;
        this.routes = [];
        this.apiRoutes = [];
        this.notFoundHandler = null;
        this.globalGuards = [];
        this.middlewares = [];
        this.store = new Store({});
        console.log('Router initialized');
    }

    /**
     * Adds a new route to the router.
     * @param {string} route - The route path, e.g., '/post/[id]'.
     * @param {function|string} handler - The function to handle the route or the path to the HTML file.
     * @param {function[]} [guards] - Optional array of guard functions.
     */
    addRoute(route, handler, guards = []) {
        console.log('Adding route:', route);
        this.routes.push({ route, handler, guards });
    }

    /**
     * Adds a new API route to the router.
     * @param {string} route - The API route path, e.g., '/api/post/[id]'.
     * @param {function} handler - The function to handle the API route.
     */
    addApiRoute(route, handler) {
        console.log('Adding API route:', route);
        this.apiRoutes.push({ route, handler });
    }

    /**
     * Sets the handler for 404 Not Found routes.
     * @param {function} handler - The function to handle 404 Not Found routes.
     */
    setNotFoundHandler(handler) {
        this.notFoundHandler = handler;
    }

    /**
     * Adds a global guard function.
     * @param {function} guard - The guard function.
     */
    addGlobalGuard(guard) {
        this.globalGuards.push(guard);
    }

    /**
     * Adds a middleware function.
     * @param {function} middleware - The middleware function.
     */
    use(middleware) {
        this.middlewares.push(middleware);
    }

    /**
     * Starts the router and loads the initial route.
     */
    start() {
        window.addEventListener('popstate', () => {
            this.loadRoute(window.location.pathname.replace(this.basePath, ''));
        });
        this.loadInitialRoute();
    }

    /**
     * Loads the initial route based on the current URL path.
     */
    loadInitialRoute() {
        let path = window.location.pathname.replace(this.basePath, '');
        if (path === '' || path === '/' || path === '/index.html') {
            path = '/';
        }
        console.log('Loading initial route:', path);
        this.loadRoute(path);
    }

    /**
     * Loads the route matching the given path.
     * @param {string} path - The path to load.
     */
    async loadRoute(path) {
        console.log('Loading route:', path);
        const { pathname, searchParams } = this.parsePath(path);
        const matchedRoute = this.matchRoute(pathname);

        if (matchedRoute) {
            const { handler, params, guards } = matchedRoute;

            // Execute global guards
            for (const guard of this.globalGuards) {
                const guardResult = await guard(pathname, params, searchParams);
                if (!guardResult) {
                    console.log('Global guard blocked the route');
                    return;
                }
            }

            // Execute route-specific guards
            for (const guard of guards) {
                const guardResult = await guard(pathname, params, searchParams);
                if (!guardResult) {
                    console.log('Route-specific guard blocked the route');
                    return;
                }
            }

            // Execute middlewares
            for (const middleware of this.middlewares) {
                await middleware(pathname, params, searchParams);
            }

            if (typeof handler === 'function') {
                const view = handler(params, searchParams, this.store); // Pass the store to the handler
                console.log('Matched route, rendering view');
                document.getElementById('app').innerHTML = view;
                this.addLinkListeners();
            } else if (typeof handler === 'string') {
                await this.loadHtmlFile(handler, params, searchParams);
            }
        } else {
            console.log('No route matched for path:', path);
            if (this.notFoundHandler) {
                this.notFoundHandler();
            }
        }
    }

    /**
     * Parses the given path into pathname and searchParams.
     * @param {string} path - The path to parse.
     * @returns {object} - The parsed pathname and searchParams.
     */
    parsePath(path) {
        const url = new URL(path, window.location.origin);
        return {
            pathname: url.pathname,
            searchParams: Object.fromEntries(url.searchParams.entries())
        };
    }

    /**
     * Matches the given path with the registered routes.
     * @param {string} path - The path to match.
     * @returns {object|null} - The matched route and parameters, or null if no match is found.
     */
    matchRoute(path) {
        for (const route of this.routes) {
            console.log('Trying to match route:', route.route, 'with path:', path);
            const routeMatch = this.matchDynamicRoute(route.route, path);
            if (routeMatch) {
                console.log('Route matched:', route.route);
                return { handler: route.handler, params: routeMatch.params, guards: route.guards };
            }
        }
        console.log('No matching route found for path:', path);
        return null;
    }

    /**
     * Matches a dynamic route with the given path.
     * @param {string} route - The route pattern, e.g., '/post/[id]'.
     * @param {string} path - The actual path, e.g., '/post/123'.
     * @returns {object|null} - The matched parameters, or null if no match is found.
     */
    matchDynamicRoute(route, path) {
        const routeParts = route.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        console.log('Matching route parts:', routeParts, 'with path parts:', pathParts);

        if (routeParts.length !== pathParts.length) {
            console.log('Route parts length mismatch');
            return null;
        }

        const params = {};
        for (let i = 0; i < routeParts.length; i++) {
            if (routeParts[i].startsWith('[') && routeParts[i].endsWith(']')) {
                const paramName = routeParts[i].slice(1, -1);
                params[paramName] = pathParts[i];
            } else if (routeParts[i] !== pathParts[i]) {
                console.log(`Route part mismatch at index ${i}: ${routeParts[i]} !== ${pathParts[i]}`);
                return null;
            }
        }

        return { params };
    }

    /**
     * Loads and injects an HTML file into the DOM.
     * @param {string} filePath - The path to the HTML file.
     * @param {object} params - The parameters from the route.
     * @param {object} searchParams - The query parameters from the URL.
     */
    async loadHtmlFile(filePath, params, searchParams) {
        console.log('Loading HTML file:', filePath);
        try {
            const response = await fetch(filePath);
            const html = await response.text();
            document.getElementById('app').innerHTML = html;
            this.addLinkListeners();
            this.executeScripts();
            if (params) {
                // You can pass the parameters to the loaded page if needed
                window.routeParams = params;
            }
            if (searchParams) {
                // You can pass the query parameters to the loaded page if needed
                window.routeQueryParams = searchParams;
            }
        } catch (error) {
            console.error('Error loading HTML file:', error);
        }
    }

    /**
     * Executes scripts within the loaded HTML.
     */
    executeScripts() {
        const scripts = document.querySelectorAll('#app script');
        scripts.forEach(script => {
            const newScript = document.createElement('script');
            newScript.type = script.type ? script.type : 'text/javascript';

            if (script.src) {
                newScript.src = script.src;
            } else {
                newScript.textContent = script.textContent;
            }

            newScript.onload = () => {
                console.log(`Script loaded: ${newScript.src || 'inline script'}`);
            };

            newScript.onerror = (e) => {
                console.error(`Script error: ${newScript.src || 'inline script'}`, e);
            };

            document.body.appendChild(newScript);
            document.body.removeChild(newScript);
        });
    }

    /**
     * Adds click event listeners to links for client-side navigation.
     */
    addLinkListeners() {
        const links = document.querySelectorAll('a[href^="/"]');
        for (const link of links) {
            link.addEventListener('click', (event) => {
                event.preventDefault();
                const path = link.getAttribute('href').replace(this.basePath, '');
                console.log('Link clicked, navigating to:', path);
                history.pushState({}, '', this.basePath + path);
                this.loadRoute(path);
            });
        }
    }

    /**
     * Handles API requests by matching them with the registered API routes.
     * @param {string} path - The API path.
     * @returns {object|null} - The API response or null if no match is found.
     */
    handleApiRequest(path) {
        const matchedRoute = this.matchApiRoute(path);
        if (matchedRoute) {
            return matchedRoute.handler(matchedRoute.params);
        }
        return null;
    }

    /**
     * Matches the given path with the registered API routes.
     * @param {string} path - The path to match.
     * @returns {object|null} - The matched API route and parameters, or null if no match is found.
     */
    matchApiRoute(path) {
        for (const route of this.apiRoutes) {
            console.log('Trying to match API route:', route.route, 'with path:', path);
            const routeMatch = this.matchDynamicRoute(route.route, path);
            if (routeMatch) {
                console.log('API route matched:', route.route);
                return { handler: route.handler, params: routeMatch.params };
            }
        }
        console.log('No matching API route found for path:', path);
        return null;
    }
}

export default Router;