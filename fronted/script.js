const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const micBtn = document.getElementById('micBtn');
const voiceBtn = document.getElementById('voiceBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarChats = document.getElementById('sidebarChats');
const themeBtn = document.getElementById('themeBtn');
const themeIcon = document.getElementById('themeIcon');
const normalBtn = document.getElementById('normalBtn');
const studyBtn = document.getElementById('studyBtn');
const kisanBtn = document.getElementById('kisanBtn');
const exportBtn = document.getElementById('exportBtn');

// Image elements
const imageBtn = document.getElementById('imageBtn');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const removeImage = document.getElementById('removeImage');

// File elements
const fileBtn = document.getElementById('fileBtn');
const fileInput = document.getElementById('fileInput');
const filePreview = document.getElementById('filePreview');
const fileName = document.getElementById('fileName');
const removeFile = document.getElementById('removeFile');

// Plan modal
const planModal = document.getElementById('planModal');
const closePlanModal = document.getElementById('closePlanModal');
const userInfo = document.getElementById('userInfo');

// ===== RENDER BACKEND URL =====
const API_URL = 'https://bharat-ai-trwz.onrender.com/chat';

let isFirstMessage = true;
let currentChatId = null;
let currentMessages = [];
let pendingImage = null;
let pendingFile = null;
let voiceEnabled = false;
let studyMode = false;
let kisanMode = false;

// ===== USER LOGIN CHECK (Guest Mode Allowed) =====
function loadUserInfo() {
    const userData = localStorage.getItem('bharatai_user');

    // Agar user login nahi hai, toh Guest mode me chalao
    if (!userData) {
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.textContent = 'Guest User';
        if (avatarEl) avatarEl.textContent = 'G';

        return;
    }

    try {
        const user = JSON.parse(userData);
        const nameEl = document.getElementById('userName');
        const avatarEl = document.getElementById('userAvatar');

        if (nameEl) nameEl.textContent = user.name || 'User';
        if (avatarEl) {
            avatarEl.textContent = (user.name || 'U').charAt(0).toUpperCase();
        }
    } catch (e) {
        console.error('User data error:', e);
    }
}

// ===== LOGOUT =====
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Logout karna hai?')) {
            localStorage.removeItem('bharatai_user');
            window.location.href = 'login.html';
        }
    });
}

// ===== FREE PLAN LIMIT (5 messages/din) =====
const FREE_LIMIT = 5;

function getTodayKey() {
    const d = new Date();
    return `bharatai_count_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`;
}

function getMsgCount() {
    return parseInt(localStorage.getItem(getTodayKey()) || '0');
}

function incrementMsgCount() {
    const count = getMsgCount() + 1;
    localStorage.setItem(getTodayKey(), count.toString());
    updateLimitUI();
    return count;
}

function isLimitReached() {
    return getMsgCount() >= FREE_LIMIT;
}

function updateLimitUI() {
    const count = getMsgCount();
    const remaining = Math.max(0, FREE_LIMIT - count);
    const planEl = document.getElementById('userPlan');

    if (isLimitReached()) {
        planEl.textContent = `❌ Limit khatam (${count}/${FREE_LIMIT}) — Pro lo`;
        planEl.style.color = '#ff4444';
        userInput.disabled = true;
        userInput.placeholder = 'Aaj ki limit khatam. Pro plan kharido →';
        sendBtn.disabled = true;
    } else {
        planEl.textContent = `Free Plan (${remaining} msg bache)`;
        planEl.style.color = '';
        userInput.disabled = false;
        userInput.placeholder = 'Bharat AI se kuch bhi poocho...';
    }
}

// ===== THEME =====
function loadTheme() {
    const theme = localStorage.getItem('bharatai_theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        `;
    }
}

themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    localStorage.setItem('bharatai_theme', isLight ? 'light' : 'dark');

    if (isLight) {
        themeIcon.innerHTML = `
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        `;
    } else {
        themeIcon.innerHTML = `
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        `;
    }
});

loadTheme();

// ===== MODE SWITCHING =====
function updatePlaceholder() {
    if (isLimitReached()) {
        userInput.placeholder = 'Aaj ki limit khatam. Pro plan kharido →';
        return;
    }
    if (studyMode) {
        userInput.placeholder = '📚 Study Mode: Sawal poocho...';
    } else if (kisanMode) {
        userInput.placeholder = '🌾 Kisan Mode: Kheti ke baare me poocho...';
    } else {
        userInput.placeholder = 'Bharat AI se kuch bhi poocho...';
    }
}

function setNormalMode() {
    studyMode = false;
    kisanMode = false;
    studyBtn.classList.remove('active');
    kisanBtn.classList.remove('active');
    normalBtn.classList.add('active');
    updatePlaceholder();
}

if (normalBtn) normalBtn.addEventListener('click', setNormalMode);

if (studyBtn) {
    studyBtn.addEventListener('click', () => {
        studyMode = !studyMode;
        studyBtn.classList.toggle('active', studyMode);
        if (studyMode) {
            kisanMode = false;
            kisanBtn.classList.remove('active');
            normalBtn.classList.remove('active');
        } else {
            normalBtn.classList.add('active');
        }
        updatePlaceholder();
    });
}

if (kisanBtn) {
    kisanBtn.addEventListener('click', () => {
        kisanMode = !kisanMode;
        kisanBtn.classList.toggle('active', kisanMode);
        if (kisanMode) {
            studyMode = false;
            studyBtn.classList.remove('active');
            normalBtn.classList.remove('active');
        } else {
            normalBtn.classList.add('active');
        }
        updatePlaceholder();
    });
}

// ===== PLAN MODAL =====
userInfo.addEventListener('click', () => {
    planModal.classList.add('active');
});

closePlanModal.addEventListener('click', () => {
    planModal.classList.remove('active');
});

planModal.addEventListener('click', (e) => {
    if (e.target === planModal) {
        planModal.classList.remove('active');
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && planModal.classList.contains('active')) {
        planModal.classList.remove('active');
    }
});

// ===== PRO PLAN BUTTON =====
const proBtn = document.getElementById('proBtn');

if (proBtn) {
    proBtn.addEventListener('click', () => {
        planModal.classList.add('active');

        setTimeout(() => {
            const yearlyCard = document.querySelector('.plan-card.yearly');
            if (yearlyCard) {
                yearlyCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                yearlyCard.style.transform = 'scale(1.05)';
                yearlyCard.style.transition = 'all 0.3s';
                setTimeout(() => {
                    yearlyCard.style.transform = 'scale(1)';
                }, 800);
            }
        }, 300);
    });
}

const upgradeBtn = document.getElementById('upgradeBtn');
const yearlyBtn = document.getElementById('yearlyBtn');

if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
        alert('💎 Pro Plan selected!\n\n₹99/month — unlimited messages');
    });
}

if (yearlyBtn) {
    yearlyBtn.addEventListener('click', () => {
        alert('🎉 Yearly Plan selected!\n\n₹899/saal — 24% bachat');
    });
}

// ===== CHAT HISTORY =====
function getChats() {
    return JSON.parse(localStorage.getItem('bharatai_chats') || '[]');
}

function saveChats(chats) {
    localStorage.setItem('bharatai_chats', JSON.stringify(chats));
}

function saveCurrentChat() {
    if (currentMessages.length === 0) return;
    const chats = getChats();
    const firstUserMsg = currentMessages.find(m => m.sender === 'user');
    const title = firstUserMsg ? firstUserMsg.text.substring(0, 30) : 'New Chat';

    if (currentChatId) {
        const idx = chats.findIndex(c => c.id === currentChatId);
        if (idx !== -1) {
            chats[idx].messages = currentMessages;
            chats[idx].title = title;
        }
    } else {
        currentChatId = Date.now().toString();
        chats.unshift({
            id: currentChatId,
            title: title,
            messages: currentMessages,
            timestamp: Date.now(),
        });
    }
    saveChats(chats);
    renderChatList();
}

function renderChatList() {
    const chats = getChats();
    sidebarChats.innerHTML = '';
    if (chats.length === 0) {
        sidebarChats.innerHTML = '<div style="padding:16px;font-size:12px;color:#6e6e6e;text-align:center;">Abhi koi chat nahi</div>';
        return;
    }

    chats.forEach(chat => {
        const item = document.createElement('div');
        item.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');

        const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        icon.setAttribute('width', '14');
        icon.setAttribute('height', '14');
        icon.setAttribute('viewBox', '0 0 24 24');
        icon.setAttribute('fill', 'none');
        icon.innerHTML = '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';

        const title = document.createElement('span');
        title.className = 'chat-item-title';
        title.textContent = chat.title;

        const delBtn = document.createElement('button');
        delBtn.className = 'chat-delete-btn';
        delBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        delBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        });

        item.appendChild(icon);
        item.appendChild(title);
        item.appendChild(delBtn);
        item.addEventListener('click', () => loadChat(chat.id));
        sidebarChats.appendChild(item);
    });
}

function deleteChat(chatId) {
    if (!confirm('Ye chat delete karni hai?')) return;
    let chats = getChats();
    chats = chats.filter(c => c.id !== chatId);
    saveChats(chats);

    if (currentChatId === chatId) {
        currentChatId = null;
        currentMessages = [];
        isFirstMessage = true;
        showWelcome();
    }
    renderChatList();
}

function loadChat(chatId) {
    const chats = getChats();
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;

    currentChatId = chat.id;
    currentMessages = [...chat.messages];
    isFirstMessage = false;

    chatBox.innerHTML = '';
    currentMessages.forEach(msg => {
        renderMessage(msg.text, msg.sender, false, msg.image, msg.rating);
    });

    renderChatList();
    sidebar.classList.remove('open');
}

// ===== CHAT EXPORT =====
if (exportBtn) {
    exportBtn.addEventListener('click', () => {
        if (currentMessages.length === 0) {
            alert('Bhai, pehle koi chat toh karo!');
            return;
        }

        const choice = confirm(
            'Chat export karni hai?\n\n' +
            '✅ OK = Text file (.txt)\n' +
            '❌ Cancel = Print/PDF'
        );

        if (choice) {
            exportAsText();
        } else {
            exportAsPDF();
        }
    });
}

function getChatTitle() {
    const firstUserMsg = currentMessages.find(m => m.sender === 'user');
    return firstUserMsg ? firstUserMsg.text.substring(0, 30) : 'Bharat_AI_Chat';
}

function exportAsText() {
    let text = `🇮🇳 Bharat AI — Chat Export\n`;
    text += `============================\n`;
    text += `Date: ${new Date().toLocaleString('hi-IN')}\n`;
    text += `Total Messages: ${currentMessages.length}\n`;
    text += `============================\n\n`;

    currentMessages.forEach((msg) => {
        const sender = msg.sender === 'user' ? '👤 You' : '🤖 Bharat AI';
        text += `${sender}:\n${msg.text}\n\n`;
        if (msg.image) {
            text += `[Image: ${msg.image.substring(0, 50)}...]\n\n`;
        }
        text += `---\n\n`;
    });

    text += `\n============================\n`;
    text += `Generated by Bharat AI\n`;
    text += `Founder: Noor Alam — AI Engineer\n`;
    text += `Instagram: @bharat___ai\n`;
    text += `============================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BharatAI_${getChatTitle()}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert('✅ Chat export ho gayi! Downloads folder me dekho.');
}

function exportAsPDF() {
    const printWindow = window.open('', '_blank');

    let html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Bharat AI - Chat Export</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Arial, sans-serif;
                    padding: 40px;
                    color: #1a1a1a;
                    background: white;
                }
                .header {
                    text-align: center;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #ff9933;
                    margin-bottom: 30px;
                }
                .header h1 {
                    font-size: 28px;
                    color: #ff9933;
                    margin-bottom: 6px;
                }
                .header p {
                    color: #666;
                    font-size: 13px;
                }
                .chat-message {
                    margin-bottom: 20px;
                    padding: 14px 18px;
                    border-radius: 12px;
                    page-break-inside: avoid;
                }
                .user-msg {
                    background: #fff3e0;
                    border-left: 4px solid #ff9933;
                }
                .ai-msg {
                    background: #e8f5e9;
                    border-left: 4px solid #138808;
                }
                .sender {
                    font-weight: 700;
                    font-size: 13px;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .user-msg .sender { color: #e65100; }
                .ai-msg .sender { color: #1b5e20; }
                .msg-text {
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    word-wrap: break-word;
                }
                .footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #ff9933;
                    color: #666;
                    font-size: 12px;
                }
                .footer strong { color: #ff9933; }
                @media print {
                    body { padding: 20px; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🇮🇳 Bharat AI</h1>
                <p>Chat Export — ${new Date().toLocaleString('hi-IN')}</p>
                <p>Total Messages: ${currentMessages.length}</p>
            </div>
    `;

    currentMessages.forEach(msg => {
        const isUser = msg.sender === 'user';
        html += `
            <div class="chat-message ${isUser ? 'user-msg' : 'ai-msg'}">
                <div class="sender">${isUser ? '👤 You' : '🤖 Bharat AI'}</div>
                <div class="msg-text">${escapeHtml(msg.text)}</div>
            </div>
        `;
    });

    html += `
            <div class="footer">
                <p><strong>Bharat AI</strong> — India's Own AI Platform</p>
                <p>Founder: Noor Alam — AI Engineer</p>
                <p>Instagram: @bharat___ai</p>
            </div>
            <script>
                window.onload = () => {
                    setTimeout(() => {
                        window.print();
                    }, 500);
                };
            <\/script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== Textarea auto-resize =====
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
    sendBtn.disabled = !userInput.value.trim() && !pendingImage && !pendingFile;
    if (isLimitReached()) sendBtn.disabled = true;
});

menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

newChatBtn.addEventListener('click', () => {
    chatBox.innerHTML = '';
    isFirstMessage = true;
    currentChatId = null;
    currentMessages = [];
    pendingImage = null;
    pendingFile = null;
    imagePreview.style.display = 'none';
    filePreview.style.display = 'none';
    showWelcome();
    renderChatList();
});

document.addEventListener('click', (e) => {
    const card = e.target.closest('.suggestion-card');
    if (card) {
        userInput.value = card.dataset.prompt;
        sendMessage();
    }
});

// ===== Welcome =====
function showWelcome() {
    chatBox.innerHTML = `
        <div class="welcome">
            <div class="welcome-logo">
                <img src="bharatailogo.png" alt="Bharat AI">
            </div>
            <h1>नमस्ते, मैं भारत AI हूँ</h1>
            <p>आपका अपना देसी AI Assistant। मैं आपकी क्या मदद कर सकता हूँ</p>
            <div class="suggestions">
                <div class="suggestion-card" data-prompt="Bharat ki rajdhani kya hai?">
                    <div class="suggestion-icon">🏛️</div>
                    <div class="suggestion-text">
                        <div class="suggestion-title">Bharat ke baare me</div>
                        <div class="suggestion-sub">Rajdhani, itihaas, sanskriti</div>
                    </div>
                </div>
                <div class="suggestion-card" data-prompt="Mujhe padhai me madad karo">
                    <div class="suggestion-icon">📚</div>
                    <div class="suggestion-text">
                        <div class="suggestion-title">Padhai me madad</div>
                        <div class="suggestion-sub">Homework, notes, exam prep</div>
                    </div>
                </div>
                <div class="suggestion-card" data-prompt="Ek shayari sunao">
                    <div class="suggestion-icon">✍️</div>
                    <div class="suggestion-text">
                        <div class="suggestion-title">Shayari likho</div>
                        <div class="suggestion-sub">Hindi, Urdu, Hinglish</div>
                    </div>
                </div>
                <div class="suggestion-card" data-prompt="Business idea do">
                    <div class="suggestion-icon">💡</div>
                    <div class="suggestion-text">
                        <div class="suggestion-title">Business idea</div>
                        <div class="suggestion-sub">Startup, side hustle</div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ===== VOICE OUTPUT =====
function speakText(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '').substring(0, 500);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang === 'hi-IN') || voices.find(v => v.lang.startsWith('hi')) || voices.find(v => v.lang === 'en-IN');
    if (hindiVoice) utterance.voice = hindiVoice;
    window.speechSynthesis.speak(utterance);
}

voiceBtn.addEventListener('click', () => {
    voiceEnabled = !voiceEnabled;
    voiceBtn.classList.toggle('active', voiceEnabled);
    if (!voiceEnabled) window.speechSynthesis.cancel();
});

// ===== Render message =====
function renderMessage(text, sender, animate = true, imageDataUrl = null, rating = null) {
    const row = document.createElement('div');
    row.classList.add('message-row', sender === 'user' ? 'user-row' : 'ai-row');
    if (animate) row.style.animation = 'fadeIn 0.3s ease';

    const avatar = document.createElement('div');
    avatar.classList.add('message-avatar');
    if (sender === 'user') {
        avatar.textContent = 'You';
    } else {
        const img = document.createElement('img');
        img.src = 'bharatailogo.png';
        avatar.appendChild(img);
    }

    const content = document.createElement('div');
    content.classList.add('message-content');

    if (text) {
        const p = document.createElement('div');
        p.textContent = text;
        content.appendChild(p);
    }

    if (imageDataUrl) {
        const img = document.createElement('img');
        img.src = imageDataUrl;
        img.classList.add('message-image');
        content.appendChild(img);
    }

    if (sender === 'ai' && text) {
        const actionsRow = document.createElement('div');
        actionsRow.className = 'rating-row';

        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" stroke-width="2"/></svg>`;
        copyBtn.addEventListener('click', () => copyToClipboard(text, copyBtn));
        actionsRow.appendChild(copyBtn);

        const goodBtn = document.createElement('button');
        goodBtn.classList.add('rating-btn');
        if (rating === 'good') goodBtn.classList.add('active-good');
        goodBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88z" stroke="currentColor" stroke-width="2"/></svg>`;
        goodBtn.addEventListener('click', () => rateMessage(row, 'good', goodBtn, badBtn));
        actionsRow.appendChild(goodBtn);

        const badBtn = document.createElement('button');
        badBtn.classList.add('rating-btn');
        if (rating === 'bad') badBtn.classList.add('active-bad');
        badBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M17 14V2M9 18.12L10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88z" stroke="currentColor" stroke-width="2"/></svg>`;
        badBtn.addEventListener('click', () => rateMessage(row, 'bad', goodBtn, badBtn));
        actionsRow.appendChild(badBtn);

        const shareBtn = document.createElement('button');
        shareBtn.classList.add('rating-btn');
        shareBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="18" cy="5" r="3" stroke="currentColor" stroke-width="2"/><circle cx="6" cy="12" r="3" stroke="currentColor" stroke-width="2"/><circle cx="18" cy="19" r="3" stroke="currentColor" stroke-width="2"/><path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="2"/></svg>`;
        shareBtn.addEventListener('click', () => shareMessage(text));
        actionsRow.appendChild(shareBtn);

        content.appendChild(actionsRow);
    }

    row.appendChild(avatar);
    row.appendChild(content);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== Share =====
async function shareMessage(text) {
    const shareText = `🇮🇳 Bharat AI — India's Own AI Platform\n\n${text}\n\n👉 Bharat AI try karo!`;
    if (navigator.share) {
        try {
            await navigator.share({ title: 'Bharat AI', text: shareText });
        } catch (err) { console.log('Share cancelled'); }
    } else {
        try {
            await navigator.clipboard.writeText(shareText);
            alert('✅ Chat copy ho gayi! Ab kahin bhi paste karo.');
        } catch (err) { alert('Share nahi ho paya'); }
    }
}

// ===== Rating =====
function rateMessage(row, rating, goodBtn, badBtn) {
    const rows = Array.from(chatBox.querySelectorAll('.message-row.ai-row'));
    const idx = rows.indexOf(row);
    if (idx === -1) return;
    const aiMessages = currentMessages.filter(m => m.sender === 'ai');
    const aiMsg = aiMessages[idx];
    if (!aiMsg) return;
    const realIdx = currentMessages.indexOf(aiMsg);
    if (realIdx !== -1) {
        currentMessages[realIdx].rating = rating;
        saveCurrentChat();
    }
    goodBtn.classList.remove('active-good', 'active-bad');
    badBtn.classList.remove('active-good', 'active-bad');
    if (rating === 'good') goodBtn.classList.add('active-good');
    else badBtn.classList.add('active-bad');
}

// ===== Copy =====
async function copyToClipboard(text, btn) {
    try {
        await navigator.clipboard.writeText(text);
        const orig = btn.innerHTML;
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1500);
    } catch (e) { console.error(e); }
}

// ===== Add message =====
function addMessage(text, sender, imageDataUrl = null) {
    if (isFirstMessage) {
        chatBox.innerHTML = '';
        isFirstMessage = false;
    }
    const msg = { text, sender };
    if (imageDataUrl) msg.image = imageDataUrl;
    currentMessages.push(msg);
    renderMessage(text, sender, true, imageDataUrl, null);
    saveCurrentChat();
    if (sender === 'ai' && voiceEnabled && text) speakText(text);
}

// ===== Loading =====
function addLoading() {
    const row = document.createElement('div');
    row.classList.add('message-row', 'ai-row');
    row.id = 'loadingRow';
    const avatar = document.createElement('div');
    avatar.classList.add('message-avatar');
    const img = document.createElement('img');
    img.src = 'bharatailogo.png';
    avatar.appendChild(img);
    const content = document.createElement('div');
    content.classList.add('message-content');
    content.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
    row.appendChild(avatar);
    row.appendChild(content);
    chatBox.appendChild(row);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// ===== IMAGE UPLOAD =====
imageBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('5MB se choti image bhejo'); return; }
    const reader = new FileReader();
    reader.onload = (event) => {
        const base64 = event.target.result.split(',')[1];
        pendingImage = { base64, mimeType: file.type, dataUrl: event.target.result };
        previewImg.src = event.target.result;
        imagePreview.style.display = 'block';
        sendBtn.disabled = false;
    };
    reader.readAsDataURL(file);
});

removeImage.addEventListener('click', () => {
    pendingImage = null;
    imageInput.value = '';
    imagePreview.style.display = 'none';
    sendBtn.disabled = !userInput.value.trim() && !pendingFile;
});

// ===== FILE UPLOAD =====
fileBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert('10MB se choti file bhejo'); return; }

    fileName.textContent = file.name;
    filePreview.style.display = 'block';
    sendBtn.disabled = false;

    try {
        let textContent = '';
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            for (let i = 1; i <= Math.min(pdf.numPages, 20); i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const pageText = content.items.map(item => item.str).join(' ');
                textContent += `\n--- Page ${i} ---\n${pageText}\n`;
            }
        } else {
            textContent = await file.text();
        }
        pendingFile = { name: file.name, content: textContent.substring(0, 30000) };
    } catch (err) {
        console.error('File read error:', err);
        alert('File padhne me problem');
        pendingFile = null;
        filePreview.style.display = 'none';
    }
});

removeFile.addEventListener('click', () => {
    pendingFile = null;
    fileInput.value = '';
    filePreview.style.display = 'none';
    sendBtn.disabled = !userInput.value.trim() && !pendingImage;
});

// ===== Send =====
async function sendMessage() {
    const message = userInput.value.trim();

    if (isLimitReached()) {
        alert('❌ Aaj ki free limit khatam ho gayi!\n\nAb Pro plan kharido — ₹99/month ya ₹899/saal.\n\nUnlimited messages ke liye upgrade karo.');
        planModal.classList.add('active');
        return;
    }

    if (!message && !pendingImage && !pendingFile) return;

    const imageToSend = pendingImage;
    const fileToSend = pendingFile;

    if (imageToSend) addMessage(message || 'Yeh kya hai?', 'user', imageToSend.dataUrl);
    else if (fileToSend) addMessage(message || `Is file ke baare me batao: ${fileToSend.name}`, 'user');
    else addMessage(message, 'user');

    incrementMsgCount();

    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    pendingImage = null;
    pendingFile = null;
    imagePreview.style.display = 'none';
    filePreview.style.display = 'none';
    imageInput.value = '';
    fileInput.value = '';

    addLoading();

    try {
        const body = { message: message || 'Is file ke baare me batao' };

        if (imageToSend) {
            body.image = { base64: imageToSend.base64, mimeType: imageToSend.mimeType };
        }

        let finalMsg = message || '';

        if (studyMode) finalMsg = `[STUDY MODE ON] ${finalMsg || 'Is file ko samjhao'}`;
        if (kisanMode) finalMsg = `[KISAN MODE ON] ${finalMsg || 'Kheti ke baare me batao'}`;

        if (fileToSend) {
            finalMsg = `${finalMsg || 'Is file ke content ke baare me batao'}\n\nFile: ${fileToSend.name}\n\nContent:\n${fileToSend.content}`;
        }

        body.message = finalMsg;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        document.getElementById('loadingRow')?.remove();

        if (data.reply) addMessage(data.reply, 'ai');
        else addMessage('Sorry bhai, kuch problem aa gayi.', 'ai');
    } catch (error) {
        document.getElementById('loadingRow')?.remove();
        addMessage('Server se connection nahi ho raha.', 'ai');
        console.error(error);
    }

    sendBtn.disabled = !userInput.value.trim() || isLimitReached();
    userInput.focus();
}

sendBtn.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// ===== VOICE INPUT =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    let isRecording = false;

    micBtn.addEventListener('click', () => {
        if (isLimitReached()) {
            alert('❌ Aaj ki limit khatam. Pro plan kharido.');
            planModal.classList.add('active');
            return;
        }
        if (isRecording) recognition.stop();
        else recognition.start();
    });

    recognition.onstart = () => {
        isRecording = true;
        micBtn.classList.add('recording');
        userInput.placeholder = '🎤 Sun raha hoon... bolo';
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 200) + 'px';
        sendBtn.disabled = false;
        userInput.focus();
    };

    recognition.onend = () => {
        isRecording = false;
        micBtn.classList.remove('recording');
        updatePlaceholder();
    };

    recognition.onerror = (event) => {
        isRecording = false;
        micBtn.classList.remove('recording');
        updatePlaceholder();
        if (event.error === 'not-allowed') alert('Mic ki permission do bhai!');
    };
} else {
    micBtn.style.display = 'none';
}

// ===== INIT =====
loadUserInfo();
renderChatList();
updateLimitUI();