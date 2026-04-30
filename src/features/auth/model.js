import { storage } from '../../shared/lib/utils.js';

export const login = (password, adminPass) => {
    if (password === adminPass) {
        document.getElementById('login-overlay').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-overlay').style.display = 'none';
        }, 500);
        return true;
    }
    return false;
};

export const logout = () => {
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) {
        loginOverlay.style.display = 'flex';
        setTimeout(() => {
            loginOverlay.style.opacity = '1';
        }, 10);
        // Clear sensitive inputs
        const passInput = document.getElementById('admin-password-input');
        if (passInput) passInput.value = '';
    }
};
