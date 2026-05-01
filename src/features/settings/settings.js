
export const initSettings = () => {
    console.log("Settings Module Initialized");
    const tableCountInput = document.getElementById('setting-table-count');
    if (tableCountInput && window.tables) {
        tableCountInput.value = window.tables.length;
    }
};

export const handleTableAdjustment = (delta) => {
    const input = document.getElementById('setting-table-count');
    if (!input) return;
    let current = parseInt(input.value) || 0;
    input.value = Math.max(1, current + delta);
};
