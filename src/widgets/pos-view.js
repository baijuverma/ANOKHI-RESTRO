
import { renderProductGrid } from '../../features/product-grid/index.js';
import { updateBillingUI, addItemToCart } from '../../features/billing-panel/index.js';

export const initPOSWidget = async (products) => {
    // 1. Initial Logic
    renderProductGrid('product-grid-main', products, (item) => {
        addItemToCart(item);
        updateBillingUI(window.cart);
    });
};
