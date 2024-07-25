export default function setTheme(themeName) {
    document.documentElement.setAttribute('data-theme', themeName);
}
import Modal from "../zephyrtemplates/Modal.js";
import BasicCard from "../zephyrtemplates/BasicCard.js";
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
import TimelineItem from "../zephyrtemplates/TimelineItem.js";
import TimelineView from "../zephyrtemplates/TimelineView.js";
// Expose setTheme to the global scope
window.setTheme = setTheme;