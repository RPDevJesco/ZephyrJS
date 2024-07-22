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
```
<basic-card>
<custom-button>
<custom-dropdown>
<custom-input>
<modal-dialog>
<notification-box>
<user-profile>
<markdown-editor>
<markdown-renderer>
<kanban-board>
<accordion-component>
<accordion-table>
<data-table>
<tree-table>
<layout-component>
<timeline-component>
```

### Customization
Customize components using CSS variables:

```css
:root {
    /* Main palette colors */
    --primary-color: #5D4E60;    /* Muted dark purple */
    --secondary-color: #826C7F;  /* Muted medium purple */
    --accent-color: #A88FAC;     /* Soft purple */
    --background-color: #F4F7F9; /* Very light blue-gray */
    --neutral-color: #D4B2D8;    /* Light grayish purple */
    --secondary-color-light: #e0e1ff; /* Light shade of secondary color */

    /* Semantic colors */
    --info-color: #17a2b8;       /* Standard blue for info */
    --info-background: #d1ecf1;  /* Light blue for info background */
    --success-color: #2ECC71;    /* Soft green */
    --success-background: #d4edda; /* Light green for success background */
    --danger-color: #E74C3C;     /* Soft red */
    --danger-background: #f8d7da; /* Light red for danger background */
    --warning-color: #F39C12;    /* Amber */
    --warning-background: #fff3cd; /* Light amber for warning background */

    /* Text colors */
    --light-text: var(--white);      /* White for text on dark backgrounds */
    --dark-text: #2C3E50;       /* Dark blue-gray for main text */

    /* Component-specific colors */
    --button-hover-bg: #2980B9;  /* Darker blue for button hover */
    --input-focus-border: #826C7F; /* Adjusted to match the secondary color */
    --button-click-bg: #1190B9;

    /* Typography */
    --font-family-sans-serif: "Montserrat", "Helvetica Neue", Arial, sans-serif;
    --font-family-serif: "Merriweather", Georgia, serif;
    --font-family-monospace: "Fira Code", "Courier New", monospace;

    /* Body styles */
    --body-bg: var(--background-color);
    --body-color: #2C3E50;       /* Dark blue-gray for main text */

    /* Link styles */
    --link-color: var(--accent-color);
    --link-decoration: none;
    --link-hover-color: #d54644; /* Darker shade of coral for hover */

    /* Additional theme-specific variables */
    --header-bg: var(--primary-color);
    --header-color: var(--neutral-color);
    --footer-bg: var(--secondary-color);
    --footer-color: var(--primary-color);
    --button-primary-bg: var(--accent-color);
    --button-primary-color: white;
    --card-bg: white;
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

    /* Input specific variables */
    --input-margin: 10px 0;
    --input-padding: 10px;
    --input-border: 1px solid var(--neutral-color);
    --input-border-radius: 4px;
    --input-font-size: 1rem;
    --input-focus-border-color: var(--secondary-color);

    /* Dropdown specific variables */
    --dropdown-padding: 10px;
    --dropdown-border: 1px solid var(--neutral-color);
    --dropdown-border-radius: 4px;
    --dropdown-font-size: 1rem;
    --dropdown-background: var(--background-color);
    --dropdown-arrow: url('data:image/svg+xml;utf8,<svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg"><polygon points="0,0 140,0 70,70" style="fill:%232A4858;"/></svg>');
    --dropdown-focus-border-color: var(--secondary-color);

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
    --notification-background: var(--light-text);
    --notification-border-color: var(--primary-color);
    --notification-font-size: 1em;
    --notification-success-background: var(--success-background);
    --notification-error-background: var(--danger-background);
    --notification-warning-background: var(--warning-background);
    --notification-success-text: var(--success-color);
    --notification-error-text: var(--danger-color);
    --notification-warning-text: var(--warning-color);

    /* Markdown Editor and Renderer Colors */
    --markdown-bg: #272822;
    --markdown-color: #F8F8F2;
    --markdown-keyword: #F92672;
    --markdown-string: #E6DB74;
    --markdown-number: #AE81FF;
    --markdown-function: #A6E22E;
    --markdown-comment: #75715E;
    --markdown-method: #66D9EF;
    --markdown-tag: #0000FF;
    --markdown-attribute: #FF0000;
    --markdown-at-rule: #AF00DB;
    --markdown-punctuation: #000000;
    --markdown-property: #FF0000;
    --markdown-value: #0000FF;
    --markdown-selector: #800000;
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

You can create your own variables.css to change the values to what suits your project over the defaults.

### License
ZephyrJS is MIT licensed.

### Support
For support, please open an issue on our GitHub repository.

Built with ❤️

### ToDO:
- Tabs: A component for creating tabbed navigation interfaces, useful for organizing content into separate sections within a single page.
- Tooltip: A component for displaying additional information when users hover over or focus on an element.
- Carousel: A component for creating image or content sliders, commonly used for showcasing multiple items in a slideshow format.
- Progress Bar: A component to visually indicate the progress of a task or process.
- Spinner/Loader: A component to indicate loading states or background processing.
- Alert: A component for displaying contextual feedback messages, such as warnings, errors, or success messages.
- Breadcrumbs: A component to display the navigation path and help users understand their location within a web application.
- Search Component: A component for searching through data that exists in a Data Table or Tree Table to navigate to the specified item.
- Form: A component for creating and managing user input forms, including validation and submission handling.
- Datepicker: A component for selecting dates from a calendar interface.
- Timepicker: A component for selecting times, often used alongside a datepicker.
- Slider/Range Input: A component for selecting a value or range of values from a predefined range.
- Tree View: A component for displaying hierarchical data in a tree structure, allowing for expanding and collapsing of nodes.
- File Upload: A component for handling file uploads, including drag-and-drop support and progress indicators.
- Menu: A component for creating dropdown or context menus for additional actions or navigation options.
- Modal Form: A modal dialog specifically designed to handle form inputs and submissions within a modal context.
- Stepper: A component to guide users through a multi-step process, often used for forms or workflows.
- Snackbar/Toast: A component for displaying brief messages at the bottom or top of the screen, typically for non-intrusive notifications.
- Rich Text Editor: A component that provides WYSIWYG (What You See Is What You Get) editing capabilities, allowing users to format text with various styles, links, and media.
- Chart/Graph: A component for rendering different types of charts and graphs (e.g., bar, line, pie) using a library like Chart.js or D3.js.
- Split Pane: A component for creating resizable split views, allowing users to adjust the size of adjacent content areas.
- Infinite Scroll: A component for loading content dynamically as the user scrolls, often used in social media feeds or long lists.
- Color Picker: A component for selecting colors, often used in design and customization tools.
- Stepper Wizard: A more advanced stepper component that guides users through multi-step processes, with validation and navigation controls.
- Image Gallery: A component for displaying image collections with features like lightbox viewing, thumbnails, and captions.
- Video Player: A component for embedding and controlling video playback, including custom controls and responsive design.
- Audio Player: A component for embedding and controlling audio playback, similar to the video player.
- Virtual List: A component for rendering large lists efficiently by only rendering the visible items and recycling DOM elements.
- Notification Center: A component for managing and displaying a list of notifications, with features like dismissing and marking as read.
- Map Viewer: A component for displaying interactive maps, possibly integrating with libraries like Leaflet or Google Maps API.
- Rating/Review: A component for capturing and displaying user ratings and reviews, often used in e-commerce and feedback systems.
- Timeline: A component for displaying chronological events or activities in a visually appealing timeline format.