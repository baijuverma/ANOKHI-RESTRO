export const createOrderTypeButton = (type, label, isActive, onClick) => {
    const btn = document.createElement('button');
    btn.className = `order-type-btn ${isActive ? 'active' : ''}`;
    btn.setAttribute('data-type', type);
    btn.textContent = label;
    
    // Style directly to ensure consistency
    Object.assign(btn.style, {
        flex: '1',
        padding: '10px',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.1)',
        background: isActive ? 'var(--accent-color)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-secondary)',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.3s ease'
    });

    btn.onclick = () => onClick(type);
    
    return btn;
};
