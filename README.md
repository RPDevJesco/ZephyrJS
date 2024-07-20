# ZephyrJS

ZephyrJS is a lightweight, customizable web component framework for building modern web applications. It provides a set of reusable, encapsulated UI components and a core library for creating your own custom elements.

## Features

- **Custom Elements**: Built on Web Components standards
- **Shadow DOM**: Encapsulation for styles and markup
- **Reactive State Management**: Simple and efficient state handling
- **Template System**: Easy-to-use HTML templating
- **Two-way Data Binding**: Seamless updates between state and UI
- **Lifecycle Hooks**: Familiar component lifecycle management
- **Event Handling**: Simplified custom event system
- **Theming**: CSS variables for easy customization
- **Utility Classes**: Common CSS utilities included

## Quick Start

### Import ZephyrJS:

```js
import { ZephyrJS, defineCustomElement } from 'zephyrjs';
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
```

### Customization
Customize components using CSS variables:

```css
:root {
  --primary-color: #5D4E60;
  --secondary-color: #826C7F;
  --accent-color: #A88FAC;
}
```

### License
ZephyrJS is MIT licensed.

### Support
For support, please open an issue on our GitHub repository.

Built with ❤️

### ToDO:
- **Bootstrap style features to ZephyrCSS.
- **Accordion: A component for collapsible content panels, allowing users to expand and collapse sections of content.
- **Tabs: A component for creating tabbed navigation interfaces, useful for organizing content into separate sections within a single page.
- **Tooltip: A component for displaying additional information when users hover over or focus on an element.
- **Carousel: A component for creating image or content sliders, commonly used for showcasing multiple items in a slideshow format.
- **Progress Bar: A component to visually indicate the progress of a task or process.
- **Spinner/Loader: A component to indicate loading states or background processing.
- **Alert: A component for displaying contextual feedback messages, such as warnings, errors, or success messages.
- **Breadcrumbs: A component to display the navigation path and help users understand their location within a web application.
- **Card Group: A component for displaying multiple cards in a grid or list layout.
- **Search Component: A component for searching through data that exists in a Data Table or Tree Table to navigate to the specified item.
- **Form: A component for creating and managing user input forms, including validation and submission handling.
- **Pagination: A component for navigating through large sets of data or content, often used in conjunction with tables or lists.
- **Datepicker: A component for selecting dates from a calendar interface.
- **Timepicker: A component for selecting times, often used alongside a datepicker.
- **Slider/Range Input: A component for selecting a value or range of values from a predefined range.
- **Tree View: A component for displaying hierarchical data in a tree structure, allowing for expanding and collapsing of nodes.
- **File Upload: A component for handling file uploads, including drag-and-drop support and progress indicators.
- **Menu: A component for creating dropdown or context menus for additional actions or navigation options.
- **Modal Form: A modal dialog specifically designed to handle form inputs and submissions within a modal context.
- **Stepper: A component to guide users through a multi-step process, often used for forms or workflows.
- **Snackbar/Toast: A component for displaying brief messages at the bottom or top of the screen, typically for non-intrusive notifications.
- **Rich Text Editor: A component that provides WYSIWYG (What You See Is What You Get) editing capabilities, allowing users to format text with various styles, links, and media.
- **Data Table: An advanced table component with features like sorting, filtering, pagination, and inline editing.
- **Chart/Graph: A component for rendering different types of charts and graphs (e.g., bar, line, pie) using a library like Chart.js or D3.js.
- **Kanban Board: A component for creating task boards similar to Trello, with draggable cards and columns.
- **Tree Table: A combination of a tree view and a table, allowing hierarchical data to be displayed in a tabular format.
- **Split Pane: A component for creating resizable split views, allowing users to adjust the size of adjacent content areas.
- **Infinite Scroll: A component for loading content dynamically as the user scrolls, often used in social media feeds or long lists.
- **Color Picker: A component for selecting colors, often used in design and customization tools.
- **Stepper Wizard: A more advanced stepper component that guides users through multi-step processes, with validation and navigation controls.
- **Image Gallery: A component for displaying image collections with features like lightbox viewing, thumbnails, and captions.
- **Video Player: A component for embedding and controlling video playback, including custom controls and responsive design.
- **Audio Player: A component for embedding and controlling audio playback, similar to the video player.
- **Virtual List: A component for rendering large lists efficiently by only rendering the visible items and recycling DOM elements.
- **Notification Center: A component for managing and displaying a list of notifications, with features like dismissing and marking as read.
- **Map Viewer: A component for displaying interactive maps, possibly integrating with libraries like Leaflet or Google Maps API.
- **Rating/Review: A component for capturing and displaying user ratings and reviews, often used in e-commerce and feedback systems.
- **Accordion Table: A combination of accordion and table components, allowing expandable rows within a table.
- **Timeline: A component for displaying chronological events or activities in a visually appealing timeline format.