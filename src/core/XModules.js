const basePath = location.hostname.endsWith('github.io')
    ? '/micro-framework/src/'
    : '../';

import(`${basePath}core/XBase.js`).then(module => window.XBase = module.default);
import(`${basePath}core/XBudgets.js`).then(module => window.XBudgets = module.default);
import(`${basePath}elements/XAccordion.js`).then(module => window.XAccordion = module.default);
import(`${basePath}elements/XBreadcrumb.js`).then(module => window.XBreadcrumb = module.default);
import(`${basePath}elements/XButton.js`).then(module => window.XButton = module.default);
import(`${basePath}elements/XCard.js`).then(module => window.XCard = module.default);
import(`${basePath}elements/XCheckbox.js`).then(module => window.XCheckbox = module.default);
import(`${basePath}elements/XContentGrid.js`).then(module => window.XContentGrid = module.default);
import(`${basePath}elements/XDataTable.js`).then(module => window.XDataTable = module.default);
import(`${basePath}elements/XDialog.js`).then(module => window.XDialog = module.default);
import(`${basePath}elements/XFieldset.js`).then(module => window.XFieldset = module.default);
import(`${basePath}elements/XForm.js`).then(module => window.XForm = module.default);
import(`${basePath}elements/XInput.js`).then(module => window.XInput = module.default);
import(`${basePath}elements/XMasonry.js`).then(module => window.XMasonry = module.default);
import(`${basePath}elements/XModalGallery.js`).then(module => window.XModalGallery = module.default);
import(`${basePath}elements/XRadioGroup.js`).then(module => window.XRadioGroup = module.default);
import(`${basePath}elements/XScroll.js`).then(module => window.XScroll = module.default);
import(`${basePath}elements/XSelect.js`).then(module => window.XSelect = module.default);
import(`${basePath}elements/XSidebar.js`).then(module => window.XSidebar = module.default);
import(`${basePath}elements/XSplitter.js`).then(module => window.XSplitter = module.default);
import(`${basePath}elements/XTabs.js`).then(module => window.XTabs = module.default);
import(`${basePath}elements/XTextArea.js`).then(module => window.XTextArea = module.default);
import(`${basePath}elements/XVirtualList.js`).then(module => window.XVirtualList = module.default);