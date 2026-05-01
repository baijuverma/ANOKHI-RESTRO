
import { loadTemplate } from '../../shared/utils/loader.js';
import { renderProductGrid } from '../../features/product-grid/grid.js';
import { updateBillingUI } from '../../features/billing-panel/billing.js';

export const initNewSalePage = async () => {
    // 1. Load HTML/CSS for Features
    await Promise.all([
        loadTemplate('pos-item-grid-container', 'src/features/product-grid/grid.html', 'src/features/product-grid/grid.css'),
        loadTemplate('billing-panel-container', 'src/features/billing-panel/billing.html', 'src/features/billing-panel/billing.css')
    ]);

    console.log("New Sale Page Modular Structure Loaded.");

    // 2. Initialize Features with Data
    if (window.inventory) {
        renderProductGrid('product-grid-main', window.inventory, (item) => {
            window.cart.unshift(item); // Simple legacy sync
            updateBillingUI(window.cart);
        });
    }
};
