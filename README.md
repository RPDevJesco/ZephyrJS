# ZephyrJS

ZephyrJS is a lightweight, customizable web component framework for building modern web applications. It provides a set of reusable, encapsulated UI components and a core library for creating your own custom elements.

## Features

- Custom Elements**: Built on Web Components standards
- Shadow DOM**: Encapsulation for styles and markup
- Reactive State Management**: Simple and efficient state handling
- Template System**: Easy-to-use HTML templating
- Two-way Data Binding**: Seamless updates between state and UI
- Lifecycle Hooks**: Familiar component lifecycle management
- Event Handling**: Simplified custom event system
- Theming**: CSS variables for easy customization
- Utility Classes**: Common CSS utilities included

## Quick Start

### Import ZephyrJS:

```js
import  ZephyrJS, {defineCustomElement } from 'zephyrjs';
```

### Create a custom element:

```js
class MyComponent extends ZephyrJS {
  constructor() {
    super();
  }

  componentDidMount() {
    // Component logic here
  }
}

defineCustomElement('my-component', MyComponent);
```

### Create the HTML template file (/templates/my-component.html):
```html
<template id="my-component">
  <style>
    :host {
      display: block;
      padding: 10px;
      border: 1px solid var(--primary-color);
    }
    .content {
      font-family: var(--font-family-sans-serif);
    }
  </style>
  <div class="content">
    <slot></slot>
  </div>
</template>
```

### Use in HTML:
```html
<my-component></my-component>
```

### Core Components
ZephyrJS comes with several pre-built components:
```html
<zephyr-accordion>
  <zephyr-accordion-item header="Section 1">
    Content for section 1.
  </zephyr-accordion-item>
  <zephyr-accordion-item header="Section 2">
    Content for section 2.
  </zephyr-accordion-item>
</zephyr-accordion>

<zephyr-accordion-table>
  <!-- Define your table structure here -->
</zephyr-accordion-table>

<zephyr-basic-card title="Card Title" content="This is a simple card."></zephyr-basic-card>

<zephyr-button label="Click Me"></zephyr-button>

<zephyr-card-group>
  <zephyr-basic-card title="Card 1" content="Content 1"></zephyr-basic-card>
  <zephyr-basic-card title="Card 2" content="Content 2"></zephyr-basic-card>
</zephyr-card-group>

<zephyr-data-table>
  <!-- Define your table structure here -->
</zephyr-data-table>

<zephyr-dropdown>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</zephyr-dropdown>

<zephyr-input type="text" placeholder="Enter text"></zephyr-input>

<zephyr-kanban-board>
  <!-- Define your Kanban board structure here -->
</zephyr-kanban-board>

<zephyr-layout-component>
  <header slot="top"></header>
  <nav slot="left"></nav>
  <main slot="center"></main>
</zephyr-layout-component>

<zephyr-markdown-editor></zephyr-markdown-editor>

<zephyr-markdown-renderer content='
  # Markdown Content
  This is some **markdown** content to render.'
>
</zephyr-markdown-renderer>

<zephyr-modal>
  <p>This is a modal content.</p>
</zephyr-modal>

<zephyr-notification>
  <p>This is a notification message.</p>
</zephyr-notification>

<zephyr-tabs>
  <zephyr-tab name="Tab 1">
    Content for tab 1.
  </zephyr-tab>
  <zephyr-tab name="Tab 2">
    Content for tab 2.
  </zephyr-tab>
</zephyr-tabs>

<zephyr-tooltip content="This is a tooltip">
  Hover over me
</zephyr-tooltip>

<zephyr-tree-table>
  <!-- Define your tree table structure here -->
</zephyr-tree-table>
```

### Customization
Customize components using CSS variables:

```css
[data-theme="custom"] {
    /* Main palette colors */
    --primary-color: #2C2C2C;    /* Dark gray */
    --secondary-color: #4B0000;  /* Dark red */
    --accent-color: #FF4500;     /* Bright orange-red */
    --background-color: #1A1A1A; /* Almost black */
    --neutral-color: #808080;    /* Medium gray */
    --secondary-color-light: #8B0000; /* Dark red */

    /* Semantic colors */
    --info-color: #FF6347;       /* Tomato */
    --info-background: #FFE4E1;  /* Light red */
    --success-color: #32CD32;    /* Lime green */
    --success-background: #F0FFF0; /* Honeydew */
    --danger-color: #DC143C;     /* Crimson */
    --danger-background: #FFE4E1; /* Light red */
    --warning-color: #FFD700;    /* Gold */
    --warning-background: #FFF8DC; /* Light yellow */

    /* Text colors */
    --light-text: #FFFFFF;       /* White */
    --dark-text: #FF4500;        /* Bright orange-red */

    /* Component-specific colors */
    --button-hover-bg: #CD5C5C;  /* Indian red */
    --input-focus-border: #FF4500; /* Adjusted to match the accent color */
    --button-click-bg: #B22222;  /* Firebrick */

    /* Typography */
    --font-family-sans-serif: "Montserrat", "Helvetica Neue", Arial, sans-serif;
    --font-family-serif: "Merriweather", Georgia, serif;
    --font-family-monospace: "Fira Code", "Courier New", monospace;

    /* Body styles */
    --body-bg: var(--background-color);
    --body-color: #FF4500;       /* Bright orange-red for main text */

    /* Link styles */
    --link-color: var(--accent-color);
    --link-decoration: none;
    --link-hover-color: #FF6347; /* Tomato */

    /* Additional theme-specific variables */
    --header-bg: var(--primary-color);
    --header-color: var(--neutral-color);
    --footer-bg: var(--secondary-color);
    --footer-color: var(--primary-color);
    --button-primary-bg: var(--accent-color);
    --button-primary-color: white;
    --card-bg: #2C2C2C; /* Dark gray for card background */
    --card-border: var(--neutral-color);

    /* Button specific variables */
    --button-padding: 10px 20px;
    --button-border-radius: 5px;
    --button-font-size: 1em;
    --button-primary-bg-color: var(--accent-color);
    --button-disabled-background: var(--neutral-color);

    /* Card specific variables */
    --card-box-shadow: var(--shadow-light);
    --card-padding: 16px;
    --card-border-radius: 8px;
    --card-header-font-size: 1.5em;
    --card-header-margin-bottom: 12px;
    --card-content-margin-top: 8px;

    /* CardGroup Component Variables */
    --card-group-gap: 1rem;
    --card-min-width: 250px;
    --card-border-color: #808080;
    --card-header-color: #FF4500;
    --card-content-color: #CD5C5C; /* Indian red */
    --card-content-font-size: 1rem;

    /* Input specific variables */
    --input-margin: 10px 0;
    --input-padding: 10px;
    --input-border: 1px solid var(--neutral-color);
    --input-border-radius: 4px;
    --input-font-size: 1rem;
    --input-focus-border-color: var(--accent-color);

    /* Dropdown specific variables */
    --dropdown-padding: 10px;
    --dropdown-border: 1px solid var(--neutral-color);
    --dropdown-border-radius: 4px;
    --dropdown-font-size: 1rem;
    --dropdown-background: var(--background-color);
    --dropdown-arrow: url('data:image/svg+xml;utf8,<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 140,0 70,70" style="fill:%23808080;"/></svg>');
    --dropdown-focus-border-color: var(--accent-color);

    /* Modal specific variables */
    --modal-background: var(--background-color);
    --modal-border-radius: 10px;
    --modal-box-shadow: var(--shadow-dark);
    --modal-width: 300px;
    --modal-z-index: 1000;
    --modal-header-padding: 16px;
    --modal-header-background: var(--primary-color);
    --modal-header-border-color: var(--neutral-color);
    --modal-header-font-size: 1.25em;
    --modal-body-padding: 16px;
    --modal-footer-padding: 16px;
    --modal-footer-background: var(--neutral-color);
    --modal-footer-border-color: var(--neutral-color);

    /* Notification specific variables */
    --notification-padding: 16px;
    --notification-background: var(--dark-text);
    --notification-border-color: var(--primary-color);
    --notification-font-size: 1em;
    --notification-success-background: var(--success-background);
    --notification-error-background: var(--danger-background);
    --notification-warning-background: var(--warning-background);
    --notification-success-text: var(--success-color);
    --notification-error-text: var(--danger-color);
    --notification-warning-text: var(--warning-color);

    /* Markdown Editor and Renderer Colors */
    --markdown-bg: #2C2C2C;
    --markdown-color: #FF4500;
    --markdown-keyword: #DC143C;
    --markdown-string: #32CD32;
    --markdown-number: #FFD700;
    --markdown-function: #FF6347;
    --markdown-comment: #75715E;
    --markdown-method: #FF4500;
    --markdown-tag: #4B0000;
    --markdown-attribute: #FF6347;
    --markdown-at-rule: #AF00DB;
    --markdown-punctuation: #000000;
    --markdown-property: #FF6347;
    --markdown-value: #4B0000;
    --markdown-selector: #FF4500;
    --markdown-indentation: #CCCCCC;
    --markdown-text: var(--markdown-indentation);

    --spacing-none: 0;
    --spacing-extra-small: 5px;
    --spacing-small: 10px;
    --spacing-medium: 16px;
    --spacing-large: 20px;

    --border-radius: 5px;
}
```

You can create your own theme to change the values to what suits your project over the defaults.

### Using ZephyrJS in HTML Project
Import the latest version from jsdelivr into your project as depicted below.
From there, you will be able to make full usage of ZephyrJS.
```html
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Title of project</title>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/ZephyrJS@0.08/zephyrcore/zephyr.js"></script>
    <script type="module" src="https://cdn.jsdelivr.net/gh/RPDevJesco/ZephyrJS@0.08/zephyrtemplates/ZephyrCore.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/RPDevJesco/ZephyrJS@0.08/zephyrcss/variables.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/RPDevJesco/ZephyrJS@0.08/zephyrcss/zephyr.css">
</head>
```

### License
ZephyrJS is MIT licensed.

### Support
For support, please open an issue on our GitHub repository.

Built with ❤️

### ToDO:

#### Form-Related Components
- `<zephyr-form>`: A wrapper component for handling form submissions, validation, and data management.
- `<zephyr-checkbox>`: A customizable checkbox input element with clear styling options.
- `<zephyr-radio>`: Similar to `<zephyr-checkbox>`, but for radio button groups.
- `<zephyr-switch>`: A toggle switch component for binary options.
- `<zephyr-select>`: A styled dropdown selection component.
- `<zephyr-datepicker>`: A calendar component for date input.
- `<zephyr-timepicker>`: A component for selecting time.
- `<zephyr-calendar>`: A full calendar component for scheduling and events.
- `<zephyr-range-slider>`: An input slider for selecting a value within a range.
- `<zephyr-file-upload>`: A component for handling file uploads.
- `<zephyr-multi-form>`: Guides users through multi-step processes, such as checkout processes.

#### Authentication Components
- `<zephyr-login-form>`: A pre-built login form component.
- `<zephyr-signup-form>`: A registration form component.
- `<zephyr-password-strength>`: A password strength indicator.

#### Utility Components
- `<zephyr-scroll-to-top>`: A button to scroll back to the top of the page.
- `<zephyr-infinite-scroll>`: A component to handle infinite scrolling.
- `<zephyr-lazy-load>`: A component for lazy loading images or other content.

#### Navigation & Layout Components
- `Popover/Popover Menu`: Similar to tooltips but more complex, allowing for interaction within the content.
- `<zephyr-navbar>`: A top-level navigation bar component.
- `<zephyr-sidebar>`: A collapsible side navigation menu.
- `<zephyr-breadcrumb>`: A navigational aid that shows the user's path within a website or application.
- `<zephyr-grid>`: A flexible grid system for creating responsive layouts (could integrate with a popular CSS grid library).
- `<zephyr-carousel>`: A slideshow component for displaying images or content.
- `<zephyr-masonry>`: A masonry layout component for dynamic content arrangement.
- `<zephyr-pagination>`: A component to help users navigate through large sets of data.

#### Data Visualization Components
- `<zephyr-chart>`: A generic chart component that can be configured for various chart types (line, bar, pie, etc.). Could potentially integrate with a charting library like Chart.js or D3.js.
- `<zephyr-progress>`: A progress bar or circle component for visualizing progress.
- `<zephyr-timeline>`: A component to display events or data points in chronological order.

#### Interactive Components
- `<zephyr-drawer>`: A sliding panel that emerges from the side of the screen.
- `<zephyr-snackbar>`: A brief notification that appears at the bottom of the screen.
- `<zephyr-rating>`: A component for displaying and collecting user ratings (e.g., star ratings).

#### Additional Ideas
- `<zephyr-avatar>`: A circular image component for displaying user profile pictures.
- `<zephyr-badge>`: A small label or tag to highlight a piece of information.
- `<zephyr-loader/spinner>`: Animated loading indicators to provide feedback during asynchronous operations.
- `<zephyr-audio-player>`: A component for playing audio files.
- `<zephyr-video-player>`: A component for playing video files.
- `<zephyr-sortable-list>`: Allows users to reorder list items via drag and drop.