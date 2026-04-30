import * as State from './core/state.js';
import * as Utils from './core/utils.js';
import * as Actions from './core/actions.js';
import { renderPOSMenu } from './components/organisms/POSMenu.js';
import { renderDineInGrid } from './components/organisms/DineInGrid.js';

// Globalizing functions for HTML compatibility
window.addToCart = Actions.addToCart;
window.updateCartQty = Actions.updateCartQty;
window.newBill = Actions.newBill;

window.renderPOSItems = (search = '') => {
    const grid = document.getElementById('pos-item-grid');
    renderPOSMenu(grid, search, window.addToCart, window.updateCartQty);
};

window.renderTableGrid = () => {
    const grid = document.getElementById('pos-tables-container');
    renderDineInGrid(grid, (id) => {
        // Table selection logic here
        State.setState.setTable(id);
        window.renderTableGrid();
        window.renderPOSItems();
    });
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Anokhi Restro: Atomic Design System Initialized');
    window.renderPOSItems();
    window.renderTableGrid();
    
    // Setup Search
    const searchInput = document.getElementById('pos-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => window.renderPOSItems(e.target.value));
    }
});
