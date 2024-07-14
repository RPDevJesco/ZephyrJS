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

<basic-card>
<custom-button>
<custom-dropdown>
<custom-input>
<modal-dialog>
<notification-box>

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

Built with ❤️ by the ZephyrJS Team
