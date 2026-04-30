export function formatCurrency(amount) {
    return 'â‚¹' + parseFloat(amount).toFixed(2);
}

export function getDDMMYYYY(date) {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
}

export function getLocalData(key, defaultVal) {
    try {
        const val = localStorage.getItem(key);
        return val ? JSON.parse(val) : defaultVal;
    } catch (e) {
        console.warn(`Error parsing localStorage key "${key}":`, e);
        return defaultVal;
    }
}

export function saveDataToLocal(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}
