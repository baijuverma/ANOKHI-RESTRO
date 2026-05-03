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
        const start = (this.currentPage - 1) * this.pageSize;
        return this.fullArray.slice(start, start + this.pageSize);
    }

    getVisibleItems() {
        // Kept for backward compatibility if needed during transition
        return this.fullArray.slice(0, this.currentPage * this.pageSize);
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
        <div class="pagination-container">
            <button class="page-btn" ${current === 1 ? 'disabled' : ''} onclick="window.${onPageChange}(${current - 1})" title="Previous">
                <i class="fa-solid fa-chevron-left"></i>
            </button>
    `;

    // Page Numbers (Smart display)
    const range = 2; // Show 2 pages before and after
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= current - range && i <= current + range)) {
            html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="window.${onPageChange}(${i})">${i}</button>`;
        } else if (i === current - range - 1 || i === current + range + 1) {
            html += `<span class="page-info">...</span>`;
        }
    }

    html += `
            <button class="page-btn" ${current === totalPages ? 'disabled' : ''} onclick="window.${onPageChange}(${current + 1})" title="Next">
                <i class="fa-solid fa-chevron-right"></i>
            </button>
            <span class="page-info">Page ${current} of ${totalPages}</span>
        </div>
    `;

    container.innerHTML = html;
}

window.setupInfiniteScroll = setupInfiniteScroll;
window.LocalPagination = LocalPagination;
window.renderPaginationControls = renderPaginationControls;
