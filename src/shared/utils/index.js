
export const formatCurrency = (amount) => {
    return "₹" + parseFloat(amount).toFixed(2);
};

export const getDDMMYYYY = (date) => {
    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
};

export const formatDateTime = (isoString) => {
    const d = new Date(isoString);
    const date = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${date} ${time}`;
};

export const truncateName = (name, limit = 20) => {
    if (!name) return "";
    return name.length > limit ? name.substring(0, limit) + "..." : name;
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
