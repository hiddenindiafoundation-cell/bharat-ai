const API_URL = 'http://localhost:3000';

const sendOtpBtn = document.getElementById('sendOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const backBtn = document.getElementById('backBtn');
const nameInput = document.getElementById('nameInput');
const emailInput = document.getElementById('emailInput');
const otpInput = document.getElementById('otpInput');
const emailSection = document.getElementById('emailSection');
const otpSection = document.getElementById('otpSection');
const msgBox = document.getElementById('msgBox');
const sentToEmail = document.getElementById('sentToEmail');

function showMsg(text, type) {
    msgBox.textContent = text;
    msgBox.className = 'msg-box ' + type;
    setTimeout(() => {
        msgBox.className = 'msg-box';
    }, 5000);
}

// ===== Send OTP =====
sendOtpBtn.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();

    if (!name || name.length < 2) {
        showMsg('Please enter your name', 'error');
        return;
    }

    if (!email || !email.includes('@')) {
        showMsg('Please enter a valid email address', 'error');
        return;
    }

    localStorage.setItem('bharatai_pending_name', name);
    localStorage.setItem('bharatai_pending_email', email);

    sendOtpBtn.disabled = true;
    sendOtpBtn.textContent = 'Sending...';

    try {
        const response = await fetch(`${API_URL}/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email })
        });

        const data = await response.json();

        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';

        if (data.success) {
            showMsg('✅ OTP sent! Check your email.', 'success');
            sentToEmail.textContent = email;
            emailSection.style.display = 'none';
            otpSection.classList.add('active');
        } else {
            showMsg('Error: ' + (data.error || 'Could not send OTP'), 'error');
        }
    } catch (error) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.textContent = 'Send OTP';
        showMsg('Server se connection nahi ho raha. Server chalu hai?', 'error');
        console.error(error);
    }
});

// ===== Verify OTP =====
verifyOtpBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const otp = otpInput.value.trim();

    if (!otp || otp.length !== 6) {
        showMsg('Please enter the 6-digit OTP', 'error');
        return;
    }

    verifyOtpBtn.disabled = true;
    verifyOtpBtn.textContent = 'Verifying...';

    try {
        const response = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: otp })
        });

        const data = await response.json();

        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify & Sign In';

        if (data.success) {
            showMsg('✅ Login successful!', 'success');

            const name = localStorage.getItem('bharatai_pending_name') || 'User';
            const savedEmail = localStorage.getItem('bharatai_pending_email') || email;
            localStorage.setItem('bharatai_user', JSON.stringify({ name: name, email: savedEmail }));

            localStorage.removeItem('bharatai_pending_name');
            localStorage.removeItem('bharatai_pending_email');

            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showMsg(data.error || 'Invalid OTP', 'error');
        }
    } catch (error) {
        verifyOtpBtn.disabled = false;
        verifyOtpBtn.textContent = 'Verify & Sign In';
        showMsg('Server se connection nahi ho raha.', 'error');
        console.error(error);
    }
});

// ===== Back Button =====
backBtn.addEventListener('click', () => {
    emailSection.style.display = 'block';
    otpSection.classList.remove('active');
    otpInput.value = '';
});

// ===== Agar already logged in hai toh seedha chat page =====
const existingUser = localStorage.getItem('bharatai_user');
if (existingUser) {
    window.location.href = 'index.html';
}