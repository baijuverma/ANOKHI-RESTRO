export const formatCurrency = (amount) => {
    return '\u20B9' + parseFloat(amount).toFixed(2);
};

export const getDDMMYYYY = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const storage = {
    get: (key, defaultVal) => {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : defaultVal;
        } catch (e) {
            console.warn(`Error reading ${key}:`, e);
            return defaultVal;
        }
    },
    set: (key, data) => {
        localStorage.setItem(key, JSON.stringify(data));
    }
};
