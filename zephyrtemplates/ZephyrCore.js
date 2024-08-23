import ZephyrJS from "../zephyrcore/zephyr.js";

export const Themes = Object.freeze({
    DEFAULT: Symbol('default'),
    SHELBY: Symbol('shelby'),
    COOL_WINTER: Symbol('cool-winter'),
    DARK: Symbol('dark'),
    ELEGANT: Symbol('elegant'),
    FANTASY: Symbol('fantasy'),
    HEAVEN: Symbol('heaven'),
    HELLFIRE: Symbol('hellfire'),
    HIGH_CONTRAST: Symbol('high-contrast'),
    HIGH_TECH: Symbol('high-tech'),
    LIGHT: Symbol('light'),
    MINIMALIST: Symbol('minimalist'),
    NEON: Symbol('neon'),
    PASTEL: Symbol('pastel'),
    RETRO_FUTURISM: Symbol('retro-futurism'),
    VINTAGE: Symbol('vintage'),
    WARM_AUTUMN: Symbol('warm-autumn')
});

export function setTheme(themeName) {
    if (Object.values(Themes).includes(themeName)) {
        document.documentElement.setAttribute('data-theme', themeName.description);
    } else {
        console.warn(`Theme ${themeName.description} is not defined.`);
    }
}

// Expose setTheme to the global scope
window.Themes = Themes;
window.setTheme = setTheme;

import BasicCard from "../zephyrtemplates/BasicCard.js";
import LayeredCard from "../zephyrtemplates/LayeredCard.js";
import ModalDialog from "../zephyrtemplates/ModalDialog.js";
import Notification from "../zephyrtemplates/Notification.js";
import Button from "../zephyrtemplates/Button.js";
import Input from "../zephyrtemplates/Input.js";
import Dropdown from "../zephyrtemplates/Dropdown.js";
import Upload from "../zephyrtemplates/UserProfile.js";
import MarkdownRenderer from "../zephyrtemplates/MarkdownRenderer.js";
import MarkdownEditor from "../zephyrtemplates/MarkdownEditor.js";
import KanbanBoard from "../zephyrtemplates/KanbanBoard.js";
import Accordion from "../zephyrtemplates/Accordion.js";
import DataTable from "../zephyrtemplates/DataTable.js";
import TreeTable from "../zephyrtemplates/TreeTable.js";
import AccordionTable from "../zephyrtemplates/AccordionTable.js";
import PaginationComponent from "../zephyrtemplates/PaginationComponent.js";
import FilterComponent from "../zephyrtemplates/FilterComponent.js";
import SearchComponent from "../zephyrtemplates/SearchComponent.js";
import InlineEditingComponent from "../zephyrtemplates/InlineEditingComponent.js";
import LayoutComponent from "../zephyrtemplates/LayoutComponent.js";
import CardGroup from "../zephyrtemplates/CardGroup.js";
import Carousel from "../zephyrtemplates/Carousel.js";
import TabsComponent from "../zephyrtemplates/TabsComponent.js";
import TooltipComponent from "../zephyrtemplates/TooltipComponent.js";
import MarkdownShowcase from "../zephyrtemplates/MarkdownShowcase.js";
import TimelineView from "../zephyrtemplates/TimelineView.js";
import TimelineItem from "../zephyrtemplates/TimelineItem.js";
import Modal from "../zephyrtemplates/Modal.js";
import Blog from "../zephyrtemplates/Blog.js";
import DynamicFocusZone from "./DynamicFocusCard.js";
import SlideReveal from "./SlideReveal.js";