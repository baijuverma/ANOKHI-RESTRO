
export const loadTemplate = async (containerId, htmlPath, cssPath) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Load CSS
    if (cssPath) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = cssPath;
        document.head.appendChild(link);
    }

    // Load HTML
    try {
        const response = await fetch(htmlPath);
        const html = await response.text();
        container.innerHTML = html;
    } catch (e) {
        console.error(`Failed to load template from ${htmlPath}:`, e);
    }
};
