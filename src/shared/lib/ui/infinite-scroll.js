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

    getVisibleItems() {
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
}

window.setupInfiniteScroll = setupInfiniteScroll;
window.LocalPagination = LocalPagination;
