/**
 * Library: Filter Logic (Atomic/FSD)
 * Robust normalization for restaurant item types (Veg/Non-Veg).
 */

/**
 * Normalizes a string by lowercasing and removing hyphens/spaces.
 * @param {string} str 
 * @returns {string}
 */
export const normalizeType = (str) => {
    return (str || '').toLowerCase().replace(/[- ]/g, '');
};

/**
 * Checks if an item matches the given filter type.
 * @param {Object} item 
 * @param {string} filterType 
 * @returns {boolean}
 */
export const matchesFilterType = (item, filterType) => {
    const filter = normalizeType(filterType);
    if (filter === 'all') return true;

    const itemType = normalizeType(item.itemType || 'Veg');
    
    // Strict match to prevent 'nonveg' from matching 'veg'
    return itemType === filter;
};

/**
 * Filters an array of items based on search and type.
 * @param {Array} items 
 * @param {string} search 
 * @param {string} filterType 
 * @returns {Array}
 */
export const filterItems = (items, search = '', filterType = 'all') => {
    const searchLow = search.toLowerCase();
    
    return items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchLow);
        const matchesType = matchesFilterType(item, filterType);
        
        return matchesSearch && matchesType;
    });
};
