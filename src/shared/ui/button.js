
export const createButton = (text, iconClass, onClick) => {
    const btn = document.createElement('button');
    btn.className = 'base-button';
    btn.innerHTML = `
        ${iconClass ? `<i class="${iconClass}"></i>` : ''}
        <span>${text}</span>
    `;
    if (onClick) btn.onclick = onClick;
    return btn;
};
