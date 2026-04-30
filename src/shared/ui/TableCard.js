export const createTableCard = (table, isSelected, onClick) => {
    const div = document.createElement('div');
    const isOccupied = table.cart && table.cart.length > 0;
    
    // Helper to format duration (fallback to current if no startTime)
    const getDuration = (startTime) => {
        if (!startTime) return '00:00';
        const diff = Math.floor((Date.now() - new Date(startTime)) / 1000);
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    const startTime = table.lastUpdated || table.timestamp || Date.now();
    const selectedStyle = isSelected ? 'background: #ffffff !important; border-color: var(--accent-color) !important; box-shadow: 0 0 15px rgba(255,255,255,0.3) !important;' : '';
    const textColor = isSelected ? '#1a1a1a' : 'white';
    const subTextColor = isSelected ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)';

    div.className = `table-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`;
    div.setAttribute('style', selectedStyle);

    div.innerHTML = `
        <span class="bullet" style="position:absolute; top:8px; right:8px; background:${isOccupied ? '#ef4444' : '#22c55e'}; width:6px; height:6px;"></span>
        <div class="table-name" style="color: ${textColor} !important;">${table.name}</div>
        <div class="table-status" style="font-size: 9px; line-height: 1.2; color: ${subTextColor} !important;">
            ${isOccupied ? 
                `<span style="color:#ef4444; font-weight:700;">Occupied</span><br><span class="table-timer" data-start="${startTime}" style="color: ${isSelected ? '#000000' : '#ffffff'} !important;">${getDuration(startTime)}</span>` : 
                `<span style="color:#22c55e; font-weight:700;">Available</span>`}
        </div>
    `;

    div.onclick = () => onClick(table.id);

    return div;
};
