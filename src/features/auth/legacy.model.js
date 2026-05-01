export function initAuthLogic() {
window.checkLogin = function() {
    const pwdInput = document.getElementById('login-password');
    const pwd = pwdInput ? pwdInput.value : '';
    const storedPwd = localStorage.getItem('anokhi_admin_pwd');
    
    // Allow stored password OR default 8540
    if (pwd === storedPwd || pwd === '8540' || (!storedPwd && pwd === '8540')) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.add('hide');
            setTimeout(() => {
                loginScreen.style.display = 'none';
                loginScreen.classList.remove('hide');
            }, 500);
        }
        
        showView('dashboard');
        console.log('Login successful');
    } else {
        pwdInput.parentElement.classList.add('shake');
        setTimeout(() => pwdInput.parentElement.classList.remove('shake'), 500);
        
        console.warn('Incorrect password entered.');
        if (pwdInput) {
            pwdInput.value = '';
            pwdInput.focus();
        }
    }
}

window.verifySettingsDoB = function() {
    console.log("verifySettingsDoB function called!");
    const dobInput = document.getElementById('settings-admin-dob').value;
    const adminDoB = localStorage.getItem('anokhi_admin_dob') || '1989-12-15';
    
    console.log("Input Value:", dobInput);
    console.log("Expected Value:", adminDoB);

    if (!dobInput) {
        alert('Please select the Date of Birth first.');
        return;
    }

    if (dobInput === adminDoB) {
        console.log("Verification Success!");
        document.getElementById('settings-password-section').classList.remove('force-hidden');
        document.getElementById('settings-dob-section').classList.add('force-hidden');
        alert('Verified! Please enter new password.');
    } else {
        console.log("Verification Failed!");
        alert('Incorrect DOB! System expected ' + adminDoB + ' but got ' + dobInput);
    }
}

window.updateAdminPassword = function() {
    const newPwd = document.getElementById('new-admin-password').value;
    const confirmPwd = document.getElementById('confirm-admin-password').value;

    if (!newPwd) {
        alert('Please enter a new password.');
        return;
    }

    if (newPwd !== confirmPwd) {
        alert('Passwords do not match!');
        return;
    }

    localStorage.setItem('anokhi_admin_pwd', newPwd);
    alert('Password updated successfully! This will be required next time you log in.');
    
    // Reset and hide sections
    document.getElementById('new-admin-password').value = '';
    document.getElementById('confirm-admin-password').value = '';
    document.getElementById('settings-admin-dob').value = '';
    document.getElementById('settings-password-section').classList.add('force-hidden');
    document.getElementById('settings-dob-section').classList.remove('force-hidden');
}

window.logout = function() {
    if (confirm('Are you sure you want to logout and lock the system?')) {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
            const pwdInput = document.getElementById('login-password');
            if (pwdInput) {
                pwdInput.value = '';
                setTimeout(() => pwdInput.focus(), 100);
            }
        }
    }
}


window.openResetModal = function() {
    // Reset modal to Step 1
    document.getElementById('password-reset-fields').classList.add('force-hidden');
    document.getElementById('reset-action-btn').innerText = 'Verify Date of Birth';
    document.getElementById('reset-dob').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-new-password').value = '';
    openModal('reset-password-modal');
}

window.handlePasswordReset = function() {
    const dob = document.getElementById('reset-dob').value;
    const passwordFields = document.getElementById('password-reset-fields');
    const actionBtn = document.getElementById('reset-action-btn');
    const adminDoB = localStorage.getItem('anokhi_admin_dob') || '1989-12-15';

    if (!dob) {
        alert('Please enter Admin Date of Birth.');
        return;
    }

    if (dob !== adminDoB) {
        alert('Security Check Failed: Incorrect Admin Date of Birth.');
        return;
    }

    // If step 1 is done, show step 2
    if (passwordFields.classList.contains('force-hidden')) {
        passwordFields.classList.remove('force-hidden');
        actionBtn.innerText = 'Update Password';
        return;
    }

    // Step 2: Handle actual reset
    const newPwd = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-new-password').value;

    if (!newPwd || !confirmPwd) {
        alert('Please enter and confirm your new password.');
        return;
    }

    localStorage.setItem('anokhi_admin_pwd', newPwd);
    alert('Password updated successfully! You can now login with your new password.');
    closeModal('reset-password-modal');
    document.getElementById('login-password').focus();
}








}
