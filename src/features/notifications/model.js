// Feature: Notifications — Toast notification system
export function initNotificationsLogic() {
    // showToast is already defined in shared/lib/core/legacy.model.js
    // This module can be extended for more notification types

    window.notifySuccess = function(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'success');
        }
    };

    window.notifyError = function(message) {
        if (typeof window.showToast === 'function') {
            window.showToast(message, 'error');
        }
    };
}
