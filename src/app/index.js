
import { initNewSalePage } from '../pages/new-sale/index.js';

export const initializeApp = () => {
    console.log("Anokhi Restro: FSD Architecture Initialized");
    
    // Global App Setup logic goes here
    
    // If we are on the POS view, initialize New Sale page
    if (document.getElementById('pos').classList.contains('active')) {
        if (window.inventory) {
            initNewSalePage(window.inventory);
        }
    }
};

// Auto-init on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeApp);
