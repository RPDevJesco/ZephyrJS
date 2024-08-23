# SlideReveal Component Documentation

The `SlideReveal` component is a custom web component built with ZephyrJS. It provides a sliding reveal functionality that allows users to explore the difference between two layers of content by dragging a handle. The component is fully responsive and supports both horizontal and vertical orientations.

## Features

- **Orientation Support:** The component supports both horizontal and vertical sliding reveals.
- **Smooth Dragging:** Users can drag the handle smoothly to reveal the underlying content.
- **Customizable Appearance:** The drag handle's style and appearance can be customized using CSS.
- **Responsive Design:** The component adapts to different screen sizes and orientations.

## Usage

To use the `SlideReveal` component in your HTML, include the custom element with the appropriate slots for the background and foreground content.

### Example

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SlideReveal Example</title>
    <script type="module" src="path/to/SlideReveal.js"></script>
</head>
<body>
    <slide-reveal orientation="horizontal">
        <img slot="background" src="background-image.jpg" alt="Background">
        <img slot="foreground" src="foreground-image.png" alt="Foreground">
    </slide-reveal>
</body>
</html>
```

## Attributes

    orientation: Specifies the orientation of the reveal. Can be horizontal (default) or vertical.

## Slots

    background: The content in this slot appears as the background layer.
    foreground: The content in this slot appears as the foreground layer, which is revealed as the user drags the handle.

## Methods
setState(newState)

Updates the internal state of the component and refreshes the UI accordingly.

    Parameters:
        newState (Object): The new state to apply.

### updateReveal()

Updates the position of the drag handle and the reveal area based on the current state.
### startDragging(event)

Handles the start of the dragging operation.
### drag(event)

Handles the dragging operation, calculating the new reveal percentage based on the user's interaction.
### updateImageRect()

Calculates and updates the dimensions of the background image for use in calculations.
## Styling

The SlideReveal component can be customized using CSS. Below are some of the key elements that can be styled:
### Drag Handle

The drag handle is styled using the .drag-handle class. The handle is designed to change its appearance on hover for better user experience.

```css
.drag-handle {
    background-color: rgba(255, 255, 255, 0.7);
    cursor: ew-resize;
}

.drag-handle:hover {
    background-color: rgba(255, 255, 255, 0.9);
}

.drag-handle::after {
    content: '';
    width: 40px;
    height: 40px;
    background-color: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
}
```

## Orientation

The component automatically changes the drag handle's cursor style based on the orientation attribute.

```css
:host([orientation="vertical"]) .drag-handle {
    cursor: ns-resize;
}
```

## Events

The component currently does not emit custom events, but you can easily extend it to do so by overriding the drag or startDragging methods.