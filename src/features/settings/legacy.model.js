export function initSettingsLogic() {
window.adjustTableCount = function(delta) {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    let current = parseInt(input.value) || 0;
    current = Math.max(1, current + delta);
    input.value = current;
}

window.saveSettings = function() {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    const count = parseInt(input.value);
    
    // Update tables array
    if (count > window.tables.length) {
        for (let i = window.tables.length; i < count; i++) {
            window.tables.push({
                id: `T${i + 1}`,
                name: `Table ${i + 1}`,
                cart: [],
                advance: 0
            });
        }
    } else {
        window.tables = window.tables.slice(0, count);
        tables = window.tables; // Update local reference too
    }
    
    saveData();
    alert(`Configuration Saved! ${count} tables are now available.`);
    
    if (typeof renderTableGrid === 'function') renderTableGrid();
    if (typeof refreshUI === 'function') refreshUI();
}



}
