class ShowcaseApp {
    constructor() {
        this.currentExample = null;
        this.init();
    }

    init() {
        this.setupSidebarNavigation();
        this.showHome();
    }

    setupSidebarNavigation() {
        const sidebar = document.getElementById('main-sidebar');

        // Listen for sidebar navigation events
        sidebar.addEventListener('sidebar-navigate', (e) => {
            const navItem = e.detail.value;
            if (navItem === 'home') {
                this.showHome();
            } else {
                this.loadExample(navItem);
            }
        });

        // Also handle direct clicks on nav items
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const navItem = item.getAttribute('data-nav-item');

                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');

                if (navItem === 'home') {
                    this.showHome();
                } else {
                    this.loadExample(navItem);
                }
            });
        });

        // Set home as active by default
        const homeItem = sidebar.querySelector('[data-nav-item="home"]');
        if (homeItem) {
            homeItem.classList.add('active');
        }
    }

    showHome() {
        const contentArea = document.getElementById('content-area');
        const breadcrumb = document.getElementById('breadcrumb');

        // Hide loading and error states
        this.hideLoading();
        this.hideError();

        // Update breadcrumb
        breadcrumb.innerHTML = '<span>Home</span>';

        // Load home page in iframe like other examples
        contentArea.innerHTML = `
                <div class="example-content" style="padding: 0;">
                    <iframe src="public/home.html" style="width: 100%; min-height: 800px; border: none; border-radius: 0; background: white;"></iframe>
                </div>
            `;

        this.currentExample = 'home';
    }

    async loadExample(exampleName) {
        const contentArea = document.getElementById('content-area');
        const breadcrumb = document.getElementById('breadcrumb');

        // Show loading state
        this.showLoading();
        this.hideError();

        try {
            // because github pages are picky. Just resolve it here prior to getting to the examplePath.
            const ghBase =
                location.hostname.endsWith('github.io') ? `/${location.pathname.split('/')[1]}` : '';

            const examplePath = `${ghBase}/src/examples/${exampleName}.html`;

            // Update breadcrumb
            const componentName = this.getComponentDisplayName(exampleName);
            breadcrumb.innerHTML = `
                <a href="#" onclick="app.showHome()">Home</a> >
                <span>${componentName}</span>
            `;

            // Fetch the example HTML
            const response = await fetch(examplePath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const htmlContent = await response.text();

            // Parse the HTML to extract just the body content
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Get the body content (excluding scripts that might interfere)
            const bodyContent = doc.body.innerHTML;

            // Hide loading and show content
            this.hideLoading();

            // Create an iframe to safely display the example
            contentArea.innerHTML = `
                <div class="example-content">
                    <h2 style="margin-top: 0; color: var(--dark);">${componentName} Example</h2>
                    <p style="color: #6b7280; margin-bottom: 2rem;">Interactive demonstration of the ${componentName} component with live code examples.</p>
                    <iframe src="${examplePath}" style="width: 100%; min-height: 800px; border: 1px solid #e5e7eb; border-radius: 8px; background: white;"></iframe>
                </div>
            `;

            this.currentExample = exampleName;

        } catch (error) {
            console.error('Failed to load example:', error);
            this.hideLoading();
            this.showError(`Failed to load ${exampleName}. Make sure the file exists at examples/${exampleName}.html`);
        }
    }

    getComponentDisplayName(exampleName) {
        // Convert example file names back to component names
        const componentMap = {
            'accordion-example': 'XAccordion',
            'breadcrumb-example': 'XBreadcrumb',
            'card-example': 'XCard',
            'checkbox-example': 'XCheckbox',
            'contentgrid-example': 'XContentGrid',
            'datatable-example': 'XDataTable',
            'dialog-example': 'XDialog',
            'fieldset-example': 'XFieldset',
            'form-example': 'XForm',
            'input-example': 'XInput',
            'masonry-example': 'XMasonry',
            'modalgallery-example': 'XModalGallery',
            'radiogroup-example': 'XRadioGroup',
            'scroll-example': 'XScroll',
            'select-example': 'XSelect',
            'sidebar-example': 'XSidebar',
            'splitter-example': 'XSplitter',
            'tabs-example': 'XTabs',
            'textarea-example': 'XTextArea',
            'virtuallist-example': 'XVirtualList'
        };

        return componentMap[exampleName] || exampleName;
    }

    showLoading() {
        const loading = document.getElementById('loading');
        loading.classList.add('active');
    }

    hideLoading() {
        const loading = document.getElementById('loading');
        loading.classList.remove('active');
    }

    showError(message) {
        const error = document.getElementById('error');
        error.textContent = message;
        error.classList.add('active');
    }

    hideError() {
        const error = document.getElementById('error');
        error.classList.remove('active');
    }
}

// Global function for home navigation
function loadExample(exampleName) {
    if (window.app) {
        window.app.loadExample(exampleName);

        // Update sidebar active state
        const sidebar = document.getElementById('main-sidebar');
        const navItems = sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-nav-item') === exampleName) {
                item.classList.add('active');
            }
        });
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShowcaseApp();
});