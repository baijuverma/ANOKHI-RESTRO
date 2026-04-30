/**
 * Atom: LayoutToggle
 * A modular UI component for the table curtain toggle.
 */

export const renderLayoutToggle = (containerId, isVisible, onClick) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!isVisible) {
        container.style.setProperty('display', 'none', 'important');
        return;
    }

    container.style.setProperty('display', 'block', 'important');
    container.onclick = onClick;
};
