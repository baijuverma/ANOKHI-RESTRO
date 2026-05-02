export const createTableCard = (table, isSelected, onClick) => {
    const div = document.createElement('div');
    
    // Robust check for cart occupancy
    const hasItems = (c) => {
        if (!c) return false;
        if (Array.isArray(c)) return c.length > 0;
        if (typeof c === 'string') {
            try {
                const parsed = JSON.parse(c);
                return Array.isArray(parsed) && parsed.length > 0;
            } catch(e) {
                return c !== '[]' && c !== '';
            }
        }
        return false;
    };
    
    // Use the isOccupied status from the enhanced table object passed from the widget
    const isOccupied = table.isOccupied === true || (table.isOccupied === undefined && hasItems(table.cart));
    
    // Helper to format duration (fallback to current if no startTime)
    const getDuration = (startTime) => {
        if (!startTime) return '00:00';
        const diff = Math.floor((Date.now() - new Date(startTime)) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const startTime = table.lastUpdated || table.timestamp || null;
    
    // FORCE WHITE ON SELECTION (Bypasses any CSS)
    if (isSelected) {
        div.style.setProperty('background-color', '#ffffff', 'important');
        div.style.setProperty('background', '#ffffff', 'important');
        div.style.setProperty('border-color', '#6366f1', 'important');
        div.style.setProperty('box-shadow', '0 0 20px rgba(255,255,255,0.5)', 'important');
    }

    const textColor = isSelected ? '#000000' : '#ffffff';

    div.className = `table-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`;
    div.setAttribute('data-fsd', 'true');

    const statusHtml = isOccupied ? 
        `<span style="color:#ef4444; font-weight:700;">Occupied</span>${startTime ? `<br><span class="table-timer" data-start="${new Date(startTime).getTime()}" style="color: ${textColor} !important; font-weight: 900 !important;">${getDuration(startTime)}</span>` : ''}` : 
        `<span style="color:#22c55e; font-weight:700;">Available</span>`;

    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:8px; right:8px; background:${isOccupied ? '#ef4444' : '#22c55e'}; width:6px; height:6px;"></span>
        <div class="table-name" style="color: ${textColor} !important; font-weight: 800 !important;">${table.name}</div>
        <div class="table-status" style="font-size: 9px; line-height: 1.2;">
            ${statusHtml}
        </div>
    `;

    div.onclick = () => onClick(table.id);

    return div;
};
