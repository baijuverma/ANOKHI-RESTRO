// Widget: Sidebar — Navigation rendering
export function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.getAttribute('data-target');
            if (typeof window.showView === 'function') window.showView(target);
        });
    });
}
