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
 * Renders Modern Pagination Controls
 */
export function renderPaginationControls(containerId, pagination, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPages = pagination.getTotalPages();
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const current = pagination.currentPage;
    
    let html = `
        <div class="pagination-container" style="display: flex; justify-content: center; margin-top: 15px;">
            <button class="btn-primary" onclick="window.${onPageChange}()" style="border-radius: 20px; padding: 10px 30px; font-weight: 700;">
                <i class="fa-solid fa-arrow-down"></i> Load More
            </button>
        </div>
    `;

    container.innerHTML = html;
}

window.setupInfiniteScroll = setupInfiniteScroll;
window.LocalPagination = LocalPagination;
window.renderPaginationControls = renderPaginationControls;
