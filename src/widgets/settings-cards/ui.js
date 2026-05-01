import { adjustTableCount, saveTableSettings, importDefaultMenu } from '../../features/settings/model.js';
import { tables } from '../../entities/table/model.js';

export const renderTableConfig = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const count = (window.tables && window.tables.length) || 12;

    container.innerHTML = `
        <h2 class="settings-title"><i class="fa-solid fa-chair"></i> Table Configuration</h2>
        <div class="form-group">
            <label>Total Number of Tables</label>
            <div style="display: flex; gap: 15px; align-items: center; margin-bottom: 15px;">
                <button class="qty-btn" style="width: 40px; height: 40px; font-size: 18px;" onclick="window.adjustTableCount(-1)"><i class="fa-solid fa-minus"></i></button>
                <input type="number" id="setting-table-count" readonly style="width: 100px; text-align: center; font-size: 24px; font-weight: 700; background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border);" value="${count}">
                <button class="qty-btn" style="width: 40px; height: 40px; font-size: 18px;" onclick="window.adjustTableCount(1)"><i class="fa-solid fa-plus"></i></button>
            </div>
            <p class="settings-help">Updating tables will refresh the Dine-In grid immediately.</p>
        </div>
        <button class="btn-primary" onclick="window.saveSettings()">Save Configuration</button>
    `;
};

export const renderDataManagement = (containerId) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
        <h2 class="settings-title warning"><i class="fa-solid fa-database"></i> Data Management</h2>
        <div class="form-group" style="margin-bottom: 15px;">
            <button class="btn-primary" onclick="window.importItems()" style="background: var(--accent-color); padding: 12px 20px; width: 100%;">
                <i class="fa-solid fa-file-import"></i> Import Default Menu
            </button>
        </div>
        <p class="settings-help mt-2">Importing default menu will add Bihar Special items to your inventory.</p>
    `;
};

export const initSettingsWidgets = () => {
    try {
        console.log('Initializing Settings Widgets...');
        // Global exports for legacy onclick support
        window.adjustTableCount = adjustTableCount;
        window.saveSettings = saveTableSettings;
        window.importItems = importDefaultMenu;
        
        // Render widgets if containers exist
        renderTableConfig('table-config-widget');
        renderDataManagement('data-management-widget');
    } catch (error) {
        console.error('Error initializing settings widgets:', error);
    }
};
