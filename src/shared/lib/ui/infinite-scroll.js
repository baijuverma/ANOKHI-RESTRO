/**
 * Shared Utility for Infinite Scroll and Pagination
 */

export function setupInfiniteScroll(sentinelId, callback, options = {}) {
    const sentinel = document.getElementById(sentinelId);
    if (!sentinel) return null;

    const observer = new IntersectionObserver((entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
            callback();
        }
    }, {
        threshold: options.threshold || 0.1,
        rootMargin: options.rootMargin || '100px'
    });

    observer.observe(sentinel);
    return observer;
}

/**
 * Manages local pagination for in-memory arrays
 */
export class LocalPagination {
    constructor(array, pageSize = 20) {
        this.fullArray = array;
        this.pageSize = pageSize;
        this.currentPage = 1;
    }

    getTotalPages() {
        return Math.ceil(this.fullArray.length / this.pageSize);
    }

    getPageItems() {
        // Return cumulative visible items for Load More
        return this.fullArray.slice(0, this.currentPage * this.pageSize);
    }

    getVisibleItems() {
        return this.getPageItems();
    }

    loadMore() {
        if (this.hasMore()) {
            this.currentPage++;
            return true;
        }
        return false;
    }

    hasMore() {
        return (this.currentPage * this.pageSize) < this.fullArray.length;
    }

    goToPage(page) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            return true;
        }
        return false;
    }

    nextPage() {
        return this.goToPage(this.currentPage + 1);
    }

    prevPage() {
        return this.goToPage(this.currentPage - 1);
    }
}

/**
 * Renders Modern Pagination Controls with Infinite Scroll
 */
export function renderPaginationControls(containerId, pagination, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!pagination.hasMore()) {
        container.innerHTML = '';
        return;
    }

    // Render a sentinel for IntersectionObserver instead of a button
    const sentinelId = `sentinel-${containerId}`;
    container.innerHTML = `
        <div id="${sentinelId}" class="infinite-scroll-sentinel" style="display: flex; justify-content: center; align-items: center; padding: 20px; width: 100%;">
            <div class="loading-dots">
                <i class="fa-solid fa-circle fa-fade" style="font-size: 8px; color: var(--accent-color); margin: 0 4px;"></i>
                <i class="fa-solid fa-circle fa-fade" style="font-size: 8px; color: var(--accent-color); margin: 0 4px; animation-delay: 0.1s;"></i>
                <i class="fa-solid fa-circle fa-fade" style="font-size: 8px; color: var(--accent-color); margin: 0 4px; animation-delay: 0.2s;"></i>
            </div>
        </div>
    `;

    // Setup the observer to trigger loadMore automatically
    setupInfiniteScroll(sentinelId, () => {
        if (typeof window[onPageChange] === 'function') {
            // Use a small timeout to avoid rapid fire
            if (window._loadingNextPage) return;
            window._loadingNextPage = true;
            
            window[onPageChange]();
            
            setTimeout(() => {
                window._loadingNextPage = false;
            }, 500);
        }
    }, { threshold: 0.1, rootMargin: '200px' });
}

window.setupInfiniteScroll = setupInfiniteScroll;
window.LocalPagination = LocalPagination;
window.renderPaginationControls = renderPaginationControls;
