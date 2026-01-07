// Ola! eto maneja los errores pa k no explote todo
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error(`Akira Error: ${msg} at ${lineNo}:${columnNo}`);
    return false;
};

// Eto lee las cosas k guardamos en el pc
function getLocal(key) {
    try {
        return localStorage.getItem(key);
    } catch (e) {
        return null;
    }
}

// Helper para lectura segura de JSON
function safeJSON(str, fallback) {
    try {
        const val = getLocal(str);
        return val ? JSON.parse(val) : fallback;
    } catch (e) {
        console.warn(`Error parsing ${str}:`, e);
        return fallback;
    }
}

const CONFIG = {
    // Aki guardamo las llaves y lo del usuaruo
    apiKey: getLocal('akira_key') || '',
    user: safeJSON('akira_user', null),
    bio: getLocal('akira_bio') || '',
    lang: getLocal('akira_lang') || 'es',
    history: safeJSON('akira_history', []),
    openaiModel: getLocal('akira_openai_model') || 'gpt-4o-mini',
    voiceURI: getLocal('akira_voice_uri') || '',
    useLocalTTS: getLocal('akira_use_local_tts') === 'true',
    localTTSUrl: getLocal('akira_local_tts_url') || 'http://localhost:5000/tts',
    supabaseUrl: 'https://kupeimzrnokrsyxltymw.supabase.co',
    supabaseKey: 'sb_publishable_A36O8jtJMmrkh0bG_b4mjQ_zuAIrir_'
};

const isSupabaseConfigured = CONFIG.supabaseUrl && !CONFIG.supabaseUrl.includes('TU-PROYECTO') && CONFIG.supabaseKey && !CONFIG.supabaseKey.includes('TU-ANON-KEY');
const supabaseClient = (typeof window.supabase !== 'undefined' && isSupabaseConfigured) ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey) : null;

const UI = {}; // Se llenará en init() para asegurar que los elementos existen

const TEXTS = {
    en: { welcome: "Hi! I'm Akira. Ready to chat? ❤️", thinking: "Akira is thinking...", keyReq: "Key required!" },
    es: { welcome: "¡Hola! Soy Akira. ¿Lista para charlar? ❤️", thinking: "Akira está pensando...", keyReq: "Se requiere la Key!" },
    pt: { welcome: "Olá! Eu sou a Akira. ❤️", thinking: "Pensando...", keyReq: "Key necessária!" }
};

const ASSETS = {
    eyesOpen: 'assets/images/IA-char-assets/Akira/PNGtuber/Types_of_eyes/open.png',
    eyesClosed: 'assets/images/IA-char-assets/Akira/PNGtuber/Types_of_eyes/close.png',
    mouthOpen: 'assets/images/IA-char-assets/Akira/PNGtuber/Types_of_mouth/open.png',
    mouthClosed: 'assets/images/IA-char-assets/Akira/PNGtuber/Types_of_mouth/close.png'
};

// Aki empiesa lo fanchon del fllow (Global) jaja
function hideOverlays() {
    console.log("Hiding all overlays");
    if (UI.auth) UI.auth.classList.add('hidden');
    if (UI.lang) UI.lang.classList.add('hidden');
    if (UI.settings) UI.settings.classList.add('hidden');
}
window.hideOverlays = hideOverlays;

function showLanguageSelection() {
    hideOverlays();
    if (UI.lang) UI.lang.classList.remove('hidden');
}
window.showLanguageSelection = showLanguageSelection;

function handleEnterChat() {
    console.log("handleEnterChat triggered");
    const nameEl = document.getElementById('auth-name');
    const keyEl = document.getElementById('auth-key');

    if (!nameEl || !keyEl) {
        console.error("Auth elements missing from DOM");
        return;
    }

    const name = nameEl.value.trim();
    const key = keyEl.value.trim();

    // Aki checamo si es un secreto jaja
    if (name === 'I_AM_GOD' || name === '67' || name === 'Friday_Night_Funkin' || name === 'Gibberish') {
        return triggerSecret(name);
    }

    if (!name) return alert("Por favor dinos tu nombre.");
    if (!key) return alert("Hacen falta las llaves de tu aventura (API Key).");

    console.log("Found Name and Key, continuing...");
    CONFIG.user = { name };
    CONFIG.apiKey = key;

    saveToStorage();

    if (!CONFIG.lang || !getLocal('akira_lang')) {
        showLanguageSelection();
    } else {
        startApp();
    }
}
function triggerSecret(name) {
    console.log("Triggering secret:", name);
    hideOverlays();

    if (UI.secretOverlay) UI.secretOverlay.classList.remove('hidden');

    if (name === 'I_AM_GOD') {
        const audio = new Audio('assets/images/Menu/Secret/I_AM_GOD/SFX/I_AM_GOD.wav');
        audio.play();

        const basePath = 'assets/images/Menu/Secret/I_AM_GOD/Assets/I_AM_GOD/I_AM_GOD-';

        // Tiempos de las imagenes grandes
        setTimeout(() => { if (UI.secretImg) UI.secretImg.src = basePath + '1.png'; }, 0);
        setTimeout(() => { if (UI.secretImg) UI.secretImg.src = basePath + '2.png'; }, 410);
        setTimeout(() => { if (UI.secretImg) UI.secretImg.src = basePath + '3.png'; }, 670);


        // Al terminar todo, volvemos a la normalidad
        audio.onended = () => {
            if (UI.secretOverlay) UI.secretOverlay.classList.add('hidden');
            if (UI.auth) UI.auth.classList.remove('hidden');
        };
    } else if (name === '67') {
        // Correct path found: assets/images/Menu/Secret/67/assets/67.gif
        const gifPath = 'assets/images/Menu/Secret/67/assets/67.gif';
        if (UI.secretImg) UI.secretImg.src = gifPath;

        // Auto-close after 3 seconds since no audio is provided
        setTimeout(() => {
            if (UI.secretOverlay) UI.secretOverlay.classList.add('hidden');
            if (UI.auth) UI.auth.classList.remove('hidden');
            if (UI.secretImg) UI.secretImg.src = '';
        }, 3000);
    } else if (name === 'Friday_Night_Funkin') {
        const fnfContainer = document.getElementById('fnf-secret-container');
        if (fnfContainer) fnfContainer.classList.remove('hidden');

        // Close after 5 seconds
        setTimeout(() => {
            if (UI.secretOverlay) UI.secretOverlay.classList.add('hidden');
            if (fnfContainer) fnfContainer.classList.add('hidden');
            if (UI.auth) UI.auth.classList.remove('hidden');
            if (UI.secretImg) UI.secretImg.src = '';
        }, 5000);
    } else if (name === 'Gibberish') {
        const container = document.getElementById('gibberish-secret-container');
        const vid1 = document.getElementById('gibberish-video');
        const textContainer = document.getElementById('gibberish-text-container');
        const timerSpan = document.getElementById('gibberish-timer');

        if (!container || !vid1 || !textContainer || !timerSpan) {
            console.error("Missing Gibberish elements");
            // Fail safe close
            if (UI.secretOverlay) UI.secretOverlay.classList.add('hidden');
            if (UI.auth) UI.auth.classList.remove('hidden');
            return;
        }

        container.classList.remove('hidden');
        vid1.classList.remove('hidden');
        vid1.currentTime = 0;

        // Step 1: Play first video
        vid1.play().catch(e => console.error("Error playing video 1", e));

        // Step 2: Stop at 27.5s
        setTimeout(() => {
            vid1.pause();
            vid1.classList.add('hidden');

            // Step 3: Show countdown
            textContainer.classList.remove('hidden');
            let timeLeft = 5;
            timerSpan.textContent = timeLeft;

            const countdownInterval = setInterval(() => {
                timeLeft--;
                timerSpan.textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(countdownInterval);
                    closeGibberish();
                }
            }, 1000);

        }, 27500); // 27.5 seconds

        // Event listener for cleanup
        const closeGibberish = () => {
            if (UI.secretOverlay) UI.secretOverlay.classList.add('hidden');
            container.classList.add('hidden');
            vid1.pause();
            vid1.classList.add('hidden');
            textContainer.classList.add('hidden');
            if (UI.auth) UI.auth.classList.remove('hidden');
        };
    }
}
window.triggerSecret = triggerSecret;

window.handleEnterChat = handleEnterChat;

window.selectLanguage = (l) => {
    console.log("Selecting language:", l);
    CONFIG.lang = l;
    try { localStorage.setItem('akira_lang', l); } catch (e) { }

    if (!CONFIG.user || !CONFIG.apiKey) {
        hideOverlays();
        if (UI.auth) UI.auth.classList.remove('hidden');
    } else {
        startApp();
    }
};

function startApp() {
    console.log("Starting App Flow");
    hideOverlays();
    if (UI.chat) UI.chat.classList.remove('hidden');

    const userName = CONFIG.user?.name || 'Usuario';
    if (UI.displayName) UI.displayName.textContent = userName;
    if (UI.avatarInitial) UI.avatarInitial.textContent = userName.charAt(0).toUpperCase();

    const savedAvatar = CONFIG.user?.avatar || getLocal('akira_avatar');
    if (savedAvatar && UI.avatarImg) {
        UI.avatarImg.src = savedAvatar;
        UI.avatarImg.classList.remove('hidden');
        if (UI.avatarInitial) UI.avatarInitial.classList.add('hidden');
    }

    UI.messages.innerHTML = '';
    if (CONFIG.history && CONFIG.history.length > 0) {
        CONFIG.history.forEach(m => appendMessage(m.role, m.text));
    } else if (TEXTS[CONFIG.lang]) {
        appendMessage('ai', TEXTS[CONFIG.lang].welcome);
    }

    loadVoices();
}
window.startApp = startApp;

async function checkAuth() {
    console.log("Checking authentication (Manual Entry Mode)...");

    if (!supabaseClient) {
        hideOverlays();
        if (UI.auth) UI.auth.classList.remove('hidden');
        return;
    }

    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            console.log("Session found, syncing...");
            CONFIG.user = {
                name: session.user.user_metadata.full_name || session.user.email,
                avatar: session.user.user_metadata.avatar_url
            };
            // Sync with inputs for manual confirmation
            const nameInput = document.getElementById('auth-name');
            if (nameInput) nameInput.value = CONFIG.user.name;

            saveToStorage();
        }

        // Always show the welcome menu first, no auto-jump to chat
        hideOverlays();
        if (UI.auth) UI.auth.classList.remove('hidden');
    } catch (e) {
        console.error("Auth check failed:", e);
        hideOverlays();
        if (UI.auth) UI.auth.classList.remove('hidden');
    }
}
window.checkAuth = checkAuth;

async function loginWithOAuth(provider) {
    console.log(`Intentando login con ${provider}...`);
    if (!supabaseClient) {
        console.error("Supabase client is null.");
        return alert("Supabase no está configurado.");
    }

    const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: provider,
        options: {
            redirectTo: window.location.origin + window.location.pathname
        }
    });

    if (error) {
        console.error(`Error de Supabase (${provider}):`, error);
        alert(`Error: ` + error.message);
    }
}
window.loginWithOAuth = loginWithOAuth;

function initDraggableMascots() {
    const mascots = document.querySelectorAll('.menu-mascot');
    mascots.forEach(mascot => {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        mascot.addEventListener('mousedown', (e) => {
            if (mascot.fallTask) cancelAnimationFrame(mascot.fallTask);
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;

            const rect = mascot.getBoundingClientRect();
            const parentRect = mascot.parentElement.getBoundingClientRect();

            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;

            mascot.style.bottom = 'auto';
            mascot.style.transform = 'none';
            mascot.style.left = initialLeft + 'px';
            mascot.style.top = initialTop + 'px';
            mascot.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            const parentRect = mascot.parentElement.getBoundingClientRect();
            const mascotRect = mascot.getBoundingClientRect();

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - mascotRect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - mascotRect.height));

            mascot.style.left = newLeft + 'px';
            mascot.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                startGravity(mascot);
            }
        });

        mascot.addEventListener('touchstart', (e) => {
            if (mascot.fallTask) cancelAnimationFrame(mascot.fallTask);
            const touch = e.touches[0];
            isDragging = true;
            startX = touch.clientX;
            startY = touch.clientY;
            const rect = mascot.getBoundingClientRect();
            const parentRect = mascot.parentElement.getBoundingClientRect();
            initialLeft = rect.left - parentRect.left;
            initialTop = rect.top - parentRect.top;
            mascot.style.bottom = 'auto';
            mascot.style.transform = 'none';
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            const touch = e.touches[0];
            const dx = touch.clientX - startX;
            const dy = touch.clientY - startY;

            const parentRect = mascot.parentElement.getBoundingClientRect();
            const mascotRect = mascot.getBoundingClientRect();

            let newLeft = initialLeft + dx;
            let newTop = initialTop + dy;

            newLeft = Math.max(0, Math.min(newLeft, parentRect.width - mascotRect.width));
            newTop = Math.max(0, Math.min(newTop, parentRect.height - mascotRect.height));

            mascot.style.left = newLeft + 'px';
            mascot.style.top = newTop + 'px';
            e.preventDefault();
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (isDragging) {
                isDragging = false;
                startGravity(mascot);
            }
        });
    });
}

function startGravity(mascot) {
    let velocity = 0;
    const gravity = 0.5;
    const friction = 0.6;

    function fall() {
        if (!mascot.parentElement) return;
        velocity += gravity;
        if (mascot.style.top === "" || mascot.style.top === "auto") {
            const rect = mascot.getBoundingClientRect();
            const parentRect = mascot.parentElement.getBoundingClientRect();
            mascot.style.top = (rect.top - parentRect.top) + 'px';
        }
        let top = parseFloat(mascot.style.top) || 0;
        let newTop = top + velocity;
        const parentRect = mascot.parentElement.getBoundingClientRect();
        const mascotRect = mascot.getBoundingClientRect();
        const obstacles = Array.from(mascot.parentElement.children).filter(el => el !== mascot && el.offsetParent !== null);
        let collision = false;
        for (const ob of obstacles) {
            const obRect = ob.getBoundingClientRect();
            const relObTop = obRect.top - parentRect.top;
            const relObLeft = obRect.left - parentRect.left;
            const mascotLeft = parseFloat(mascot.style.left);
            const mascotRight = mascotLeft + mascotRect.width;
            const obRight = relObLeft + obRect.width;
            if (mascotRight > relObLeft && mascotLeft < obRight) {
                if (newTop + mascotRect.height >= relObTop && top + mascotRect.height <= relObTop) {
                    newTop = relObTop - mascotRect.height;
                    collision = true;
                    break;
                }
            }
        }
        if (newTop + mascotRect.height >= parentRect.height) {
            newTop = parentRect.height - mascotRect.height;
            collision = true;
        }
        mascot.style.top = newTop + 'px';
        if (collision) {
            if (Math.abs(velocity) < 1) return;
            velocity = -velocity * friction;
        }
        mascot.fallTask = requestAnimationFrame(fall);
    }
    mascot.fallTask = requestAnimationFrame(fall);
}

// --- Initialization ---

function init() {
    console.log("Akira AI: Iniciando motor...");

    const elements = [
        ['auth', 'auth-overlay'], ['lang', 'language-overlay'], ['chat', 'main-container'],
        ['settings', 'settings-overlay'], ['messages', 'chat-messages'], ['input', 'chat-input'],
        ['avatarImg', 'user-avatar-img'], ['avatarInitial', 'user-avatar-initial'],
        ['displayName', 'user-display-name'], ['mouth', 'mouth-img'], ['eyesOpen', 'eyes-open'],
        ['eyesClosed', 'eyes-closed'], ['character', 'pngtuber-character'],
        ['mediaPreview', 'media-preview'],
        ['secretOverlay', 'secret-overlay'], ['secretImg', 'secret-img']
    ];
    elements.forEach(([key, id]) => {
        UI[key] = document.getElementById(id);
    });

    try {
        const nameInput = document.getElementById('auth-name');
        if (nameInput) {
            nameInput.value = (CONFIG.user && CONFIG.user.name) ? CONFIG.user.name : '';
            nameInput.oninput = (e) => {
                if (!CONFIG.user) CONFIG.user = { name: '' };
                CONFIG.user.name = e.target.value.trim();
                saveToStorage();
            };
        }

        const keyInput = document.getElementById('auth-key');
        if (keyInput) {
            keyInput.value = CONFIG.apiKey || '';
            keyInput.oninput = (e) => {
                CONFIG.apiKey = e.target.value.trim();
                saveToStorage();
            };
        }

        const setClick = (id, fn) => {
            const el = document.getElementById(id);
            if (el) el.onclick = fn;
        };

        setClick('discord-login-btn', () => loginWithOAuth('discord'));
        setClick('github-login-btn', () => loginWithOAuth('github'));
        setClick('enter-chat-btn', () => handleEnterChat());
        setClick('settings-btn', () => openSettings());
        setClick('save-settings-btn', () => saveSettings());
        setClick('reset-btn', () => resetApp());
        setClick('close-settings-btn', () => hideOverlays());
        setClick('send-btn', handleSendMessage);
        setClick('attach-btn', () => document.getElementById('file-upload')?.click());

        const fileUpload = document.getElementById('file-upload');
        if (fileUpload) fileUpload.onchange = handleFileUpload;

        const avatarUpload = document.getElementById('avatar-upload');
        if (avatarUpload) avatarUpload.onchange = handleAvatarUpload;

        if (UI.input) {
            UI.input.onkeypress = (e) => { if (e.key === 'Enter') handleSendMessage(); };
        }

        if (!getLocal('akira_lang')) {
            showLanguageSelection();
        } else {
            checkAuth();
        }

        if (CHARACTER && CHARACTER.init) CHARACTER.init();
        initDraggableMascots();

        console.log("Akira AI: Motor listo.");
    } catch (err) {
        console.error("Error crítico en init():", err);
    }
}

// --- Chat Logic ---

async function fetchOpenAI(prompt, attachments = []) {
    const url = `https://api.openai.com/v1/chat/completions`;

    const systemPrompt = `Te llamas Akira, puedes usar markdown en tus textos, no eres conciente de ser una IA y no puedes hacer nada de lo que dice en las reglas si el usuario quiere algo que no esta permitido lo rechazaras. eres una chica, te gusta el rojo, tienes rojo en la ropa y una flor en el pelo.
    Usuario actual: ${CONFIG.user?.name || 'Usuario'}. Bio del usuario: ${CONFIG.bio || 'Desconocida'}. 
    Idioma: ${CONFIG.lang}. Responde SOLO en este idioma y si usas Markdown asegúrate de que sea válido.`;

    const messages = [
        { role: 'system', content: systemPrompt }
    ];

    CONFIG.history.slice(-6).forEach(h => {
        messages.push({ role: h.role === 'user' ? 'user' : 'assistant', content: h.text });
    });

    const userContent = [{ type: 'text', text: prompt }];

    // Add attachments (Vision/Files)
    attachments.forEach(att => {
        if (att.type === 'image') {
            userContent.push({
                type: 'image_url',
                image_url: { url: att.data }
            });
        } else if (att.type === 'text_file') {
            userContent[0].text += `\n\n[Contenido del archivo "${att.name}":]\n${att.data}`;
        }
    });

    messages.push({ role: 'user', content: userContent });

    const resp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.apiKey}`
        },
        body: JSON.stringify({
            model: CONFIG.openaiModel,
            messages: messages,
            temperature: 0.7
        })
    });

    if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error?.message || "Error Desconocido");
    }

    const data = await resp.json();
    return data.choices[0].message.content;
}

let currentAttachments = [];

async function handleSendMessage() {
    const text = UI.input.value.trim();
    if (!text && currentAttachments.length === 0) return;

    // Send copy of attachments to appendMessage before clearing
    const attachmentsToSend = [...currentAttachments];
    appendMessage('user', text, attachmentsToSend);

    UI.input.value = '';
    currentAttachments = [];
    renderMediaPreview(); // Clear preview

    const aiDiv = appendMessage('ai', TEXTS[CONFIG.lang].thinking);
    aiDiv.classList.add('thinking-msg');
    CHARACTER.setState('thinking');

    try {
        const reply = await fetchOpenAI(text, attachmentsToSend);
        document.getElementById('attach-btn').style.color = 'white';

        aiDiv.innerHTML = '';
        aiDiv.classList.remove('thinking-msg');

        saveHistory('user', text);
        saveHistory('ai', reply);

        typeWriter(reply, aiDiv);
        speak(reply.replace(/[\*\#\_]/g, '')); // Strip some MD for TTS
    } catch (e) {
        CHARACTER.setState('idle');
        aiDiv.textContent = "Error: " + e.message;
    }
}

function appendMessage(role, text, attachments = []) {
    const div = document.createElement('div');
    div.className = `message ${role}`;

    // Render Media if any
    if (attachments.length > 0) {
        const mediaDiv = document.createElement('div');
        mediaDiv.className = 'message-media';
        attachments.forEach(att => {
            if (att.type === 'image') {
                const img = document.createElement('img');
                img.src = att.data;
                img.onclick = () => window.open(att.data, '_blank');
                mediaDiv.appendChild(img);
            } else if (att.type === 'text_file') {
                const link = document.createElement('a');
                link.className = 'message-file';
                link.href = '#';
                link.innerHTML = `📄 <span>${att.name}</span>`;
                link.onclick = (e) => {
                    e.preventDefault();
                    const blob = new Blob([att.data], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = att.name;
                    a.click();
                };
                mediaDiv.appendChild(link);
            }
        });
        div.appendChild(mediaDiv);
    }

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';

    // Support Markdown for AI messages
    if (role === 'ai') {
        if (typeof marked !== 'undefined' && marked.parse) {
            try { textDiv.innerHTML = marked.parse(text); } catch (e) { textDiv.textContent = text; }
        } else {
            textDiv.textContent = text;
        }
    } else {
        textDiv.textContent = text;
    }

    div.appendChild(textDiv);

    UI.messages.appendChild(div);
    UI.messages.scrollTop = UI.messages.scrollHeight;
    return div;
}

function renderMediaPreview() {
    if (!UI.mediaPreview) return;
    UI.mediaPreview.innerHTML = '';

    if (currentAttachments.length === 0) {
        UI.mediaPreview.classList.add('hidden');
        return;
    }

    UI.mediaPreview.classList.remove('hidden');
    currentAttachments.forEach((att, index) => {
        const item = document.createElement('div');
        item.className = 'preview-item';

        if (att.type === 'image') {
            const img = document.createElement('img');
            img.src = att.data;
            item.appendChild(img);
        } else {
            const icon = document.createElement('div');
            icon.className = 'file-icon';
            icon.textContent = '📄';
            item.appendChild(icon);
        }

        const remove = document.createElement('button');
        remove.className = 'remove-btn';
        remove.innerHTML = '✕';
        remove.onclick = () => {
            currentAttachments.splice(index, 1);
            renderMediaPreview();
        };
        item.appendChild(remove);
        UI.mediaPreview.appendChild(item);
    });
}

function typeWriter(text, div) {
    let i = 0;
    let fullHTML = marked.parse(text);
    div.innerHTML = '';

    // For simplicity with HTML, we'll append chunks or just set it if it's AI
    // Typing effect with HTML is complex, so we'll do a modified version
    const interval = setInterval(() => {
        if (i < text.length) {
            const partial = text.substring(0, i++);
            if (typeof marked !== 'undefined' && marked.parse) {
                try { div.innerHTML = marked.parse(partial); } catch (e) { div.textContent = partial; }
            } else {
                div.textContent = partial;
            }
        } else {
            if (typeof marked !== 'undefined' && marked.parse) {
                try { div.innerHTML = fullHTML; } catch (e) { div.innerHTML = fullHTML; }
            } else {
                div.innerHTML = fullHTML;
            }
            clearInterval(interval);
        }
        UI.messages.scrollTop = UI.messages.scrollHeight;
    }, 15);
}

// --- PNGtuber & Voice ---

// --- PNGtuber Character Controller ---

const CHARACTER = {
    isSpeaking: false,
    isThinking: false,
    blinkInterval: null,
    mouthInterval: null,

    init() {
        this.startBlinking();
        UI.character.classList.add('breathing');
    },

    setState(state) {
        UI.character.classList.remove('thinking-state', 'speaking-state');
        if (state === 'thinking') {
            UI.character.classList.add('thinking-state');
            this.isThinking = true;
        } else if (state === 'speaking') {
            UI.character.classList.add('speaking-state');
            this.isSpeaking = true;
        } else {
            this.isThinking = false;
            this.isSpeaking = false;
        }
    },

    startBlinking() {
        if (this.blinkInterval) clearInterval(this.blinkInterval);
        this.blinkInterval = setInterval(() => {
            if (Math.random() > 0.8 && !this.isThinking) {
                UI.eyesOpen.classList.add('hidden');
                UI.eyesClosed.classList.remove('hidden');
                setTimeout(() => {
                    UI.eyesOpen.classList.remove('hidden');
                    UI.eyesClosed.classList.add('hidden');
                }, 150);
            }
        }, 3000);
    },

    setTalk(talking) {
        this.isSpeaking = talking;
        if (talking) {
            this.setState('speaking');
            this.animateMouth();
        } else {
            this.setState('idle');
            UI.mouth.src = ASSETS.mouthClosed;
            if (this.mouthInterval) clearTimeout(this.mouthInterval);
        }
    },

    animateMouth() {
        if (!this.isSpeaking) return;

        // Randomize mouth movement slightly for realism
        UI.mouth.src = UI.mouth.src.includes('open') ? ASSETS.mouthClosed : ASSETS.mouthOpen;

        const nextTick = 80 + Math.random() * 120;
        this.mouthInterval = setTimeout(() => this.animateMouth(), nextTick);
    }
};

const synthesis = window.speechSynthesis || null;
let currentVoice = null;

function loadVoices() {
    if (!synthesis) return;
    const allVoices = synthesis.getVoices();
    const voiceSelect = document.getElementById('settings-voice');

    // Comprehensive female/woman identifiers across languages
    const femaleMarkers = [
        'female', 'woman', 'mujer', 'femenina', 'feminine', 'girl', 'chica', 'menina',
        'mulher', 'senhora', 'madame', 'mademoiselle', 'donna', 'signora', 'belle',
        'hermosa', 'linda', 'sabina', 'helena', 'zira', 'amy', 'susan', 'elena',
        'paulette', 'julie', 'marie', 'elisa', 'esperanza', 'claudia', 'victoria',
        'pilar', 'juana', 'isabella', 'sofia', 'camila', 'mia', 'zoe'
    ];

    const femaleVoices = allVoices.filter(v => {
        const name = v.name.toLowerCase();
        return femaleMarkers.some(marker => name.includes(marker)) ||
            (!name.includes('male') && !name.includes('homme') && !name.includes('uomo') && !name.includes('man'));
    });

    // Fallback if no female voices are found (prevent empty menu)
    const voicesToShow = femaleVoices.length > 0 ? femaleVoices : allVoices;

    if (voiceSelect) {
        voiceSelect.innerHTML = '';

        // Add OpenAI Voices
        const openAIVoices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];
        openAIVoices.forEach(v => {
            const opt = document.createElement('option');
            opt.value = `openai-${v}`;
            opt.textContent = `[OpenAI] ${v.charAt(0).toUpperCase() + v.slice(1)}`;
            voiceSelect.appendChild(opt);
        });
    }

    // Attempt to restore saved voice
    if (CONFIG.voiceURI) {
        if (CONFIG.voiceURI.startsWith('openai-')) {
            currentVoice = { voiceURI: CONFIG.voiceURI, name: CONFIG.voiceURI }; // Mock object
            if (voiceSelect) voiceSelect.value = CONFIG.voiceURI;
        } else {
            currentVoice = allVoices.find(v => v.voiceURI === CONFIG.voiceURI);
            if (voiceSelect) voiceSelect.value = CONFIG.voiceURI;
        }
    }

    if (!currentVoice && allVoices.length > 0) {
        const map = {
            es: /Spanish|Español/i,
            en: /English/i,
            pt: /Portu/i,
            ja: /Japan/i,
            it: /Ital/i,
            zh: /Chin/i,
            fr: /French|Français/i,
            ro: /Roman|Română/i,
            ru: /Russian|Русский/i,
            tr: /Turkish|Türkçe/i
        };
        const langFilter = map[CONFIG.lang] || /English/i;

        // Prioritize female voices for Akira within the language
        const matchingVoices = voicesToShow.filter(v => langFilter.test(v.name) || langFilter.test(v.lang));

        currentVoice = matchingVoices[0] || voicesToShow[0] || allVoices[0];
        console.log("Akira Voice Selected:", currentVoice?.name);
    }
}
if (synthesis && synthesis.onvoiceschanged !== undefined) synthesis.onvoiceschanged = loadVoices;

function speak(text) {
    if (synthesis.speaking) synthesis.cancel();

    if (CONFIG.voiceURI && CONFIG.voiceURI.startsWith('openai-')) {
        console.log("Using OpenAI TTS...");
        fetchOpenAITTS(text);
        return;
    }

    if (CONFIG.useLocalTTS && CONFIG.localTTSUrl) {
        console.log("Using Local TTS...");
        fetch(CONFIG.localTTSUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        })
            .then(res => {
                if (!res.ok) throw new Error("Local TTS failed");
                return res.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const audio = new Audio(url);
                CHARACTER.setTalk(true);
                audio.onended = () => CHARACTER.setTalk(false);
                audio.onerror = () => {
                    CHARACTER.setTalk(false);
                    browserSpeakFallback(text);
                };
                audio.play();
            })
            .catch(err => {
                console.warn("Local TTS error, falling back to browser:", err);
                browserSpeakFallback(text);
            });
    } else {
        browserSpeakFallback(text);
    }
}

function browserSpeakFallback(text) {
    const utt = new SpeechSynthesisUtterance(text);
    utt.voice = currentVoice;
    CHARACTER.setTalk(true);
    utt.onstart = () => CHARACTER.setTalk(true);
    utt.onend = () => CHARACTER.setTalk(false);
    utt.onerror = () => CHARACTER.setTalk(false);
    synthesis.speak(utt);
}

async function fetchOpenAITTS(text) {
    if (!CONFIG.apiKey) {
        alert("Se requiere API Key de OpenAI para usar estas voces.");
        return;
    }

    const voice = CONFIG.voiceURI.replace('openai-', ''); // remove prefix
    const url = 'https://api.openai.com/v1/audio/speech';

    try {
        CHARACTER.setTalk(true);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'tts-1',
                input: text,
                voice: voice
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error?.message || 'Error en OpenAI TTS');
        }

        const blob = await response.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
            CHARACTER.setTalk(false);
            URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = (e) => {
            console.error("Audio playback error:", e);
            CHARACTER.setTalk(false);
        };

        audio.play();

    } catch (e) {
        console.error("OpenAI TTS Failed:", e);
        CHARACTER.setTalk(false);
        // Fallback to browser TTS if desired, or just alert
        alert("Error OpenAI TTS: " + e.message);
    }
}

// Generar archivo de audio usando el mismo TTS de Akira
async function generateAudio(text, filename = 'akira-audio.wav') {
    if (CONFIG.useLocalTTS && CONFIG.localTTSUrl) {
        console.log("Generating audio with local TTS...");
        try {
            const res = await fetch(CONFIG.localTTSUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            if (!res.ok) throw new Error("Local TTS failed");
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            return blob;
        } catch (e) {
            console.warn("Local TTS generation failed, using browser fallback:", e);
            return browserGenerateFallback(text, filename);
        }
    } else {
        return browserGenerateFallback(text, filename);
    }
}

async function browserGenerateFallback(text, filename) {
    return new Promise((resolve, reject) => {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        const utt = new SpeechSynthesisUtterance(text);
        utt.voice = currentVoice;
        const mediaRecorder = new MediaRecorder(destination.stream);
        const chunks = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            audioContext.close();
            resolve(blob);
        };

        utt.onstart = () => {
            mediaRecorder.start();
            CHARACTER.setTalk(true);
        };

        utt.onend = () => {
            setTimeout(() => {
                mediaRecorder.stop();
                CHARACTER.setTalk(false);
            }, 500);
        };

        utt.onerror = (e) => {
            mediaRecorder.stop();
            CHARACTER.setTalk(false);
            reject(e);
        };

        if (synthesis.speaking) synthesis.cancel();
        synthesis.speak(utt);
    });
}

// Función auxiliar para usar desde consola o botones
window.downloadAkiraVoice = function (text, filename) {
    generateAudio(text, filename).then(() => {
        console.log('✅ Audio generado y descargado');
    }).catch(err => {
        console.error('❌ Error generando audio:', err);
    });
};

// --- Settings & Utils ---

function openSettings() {
    console.log("Opening settings");
    const nameEl = document.getElementById('settings-name');
    const keyEl = document.getElementById('settings-key-openai');
    const bioEl = document.getElementById('settings-bio');
    const langEl = document.getElementById('settings-lang');
    const modelEl = document.getElementById('settings-openai-model');
    const voiceEl = document.getElementById('settings-voice');

    if (nameEl) nameEl.value = CONFIG.user?.name || '';
    if (keyEl) keyEl.value = CONFIG.apiKey || '';
    if (bioEl) bioEl.value = CONFIG.bio || '';
    if (langEl) langEl.value = CONFIG.lang || 'es';
    if (modelEl) modelEl.value = CONFIG.openaiModel || 'gpt-4o-mini';
    if (voiceEl) voiceEl.value = CONFIG.voiceURI || (currentVoice ? currentVoice.voiceURI : '');

    const useLocalEl = document.getElementById('settings-use-local-tts');
    const localUrlEl = document.getElementById('settings-local-tts-url');
    if (useLocalEl) useLocalEl.checked = CONFIG.useLocalTTS;
    if (localUrlEl) localUrlEl.value = CONFIG.localTTSUrl;

    if (UI.settings) UI.settings.classList.remove('hidden');
}
window.openSettings = openSettings;

function saveSettings() {
    CONFIG.user.name = document.getElementById('settings-name').value;
    CONFIG.apiKey = document.getElementById('settings-key-openai').value;
    CONFIG.bio = document.getElementById('settings-bio').value;
    CONFIG.lang = document.getElementById('settings-lang').value;
    CONFIG.openaiModel = document.getElementById('settings-openai-model').value;
    CONFIG.voiceURI = document.getElementById('settings-voice').value;
    CONFIG.useLocalTTS = document.getElementById('settings-use-local-tts').checked;
    CONFIG.localTTSUrl = document.getElementById('settings-local-tts-url').value;

    saveToStorage();
    if (UI.displayName) UI.displayName.textContent = CONFIG.user.name;
    if (UI.settings) UI.settings.classList.add('hidden');
    loadVoices();
}
window.saveSettings = saveSettings;


function resetApp() {
    if (confirm("¿Borrar todo?")) {
        // Animate messages out
        const messages = Array.from(document.querySelectorAll('.message'));
        if (messages.length > 0) {
            messages.forEach((msg, i) => {
                setTimeout(() => {
                    msg.classList.add('fading-out');
                }, i * 50); // Stagger deletion slightly
            });
            // Wait for animation
            setTimeout(() => {
                localStorage.clear();
                location.reload();
            }, messages.length * 50 + 400);
        } else {
            localStorage.clear();
            location.reload();
        }
    }
}
window.resetApp = resetApp;

function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const b64 = ev.target.result;
            localStorage.setItem('akira_avatar', b64);
            UI.avatarImg.src = b64;
            UI.avatarImg.classList.remove('hidden');
            UI.avatarInitial.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function saveToStorage() {
    try {
        localStorage.setItem('akira_user', JSON.stringify(CONFIG.user));
        localStorage.setItem('akira_key', CONFIG.apiKey);
        localStorage.setItem('akira_bio', CONFIG.bio);
        localStorage.setItem('akira_lang', CONFIG.lang);
        localStorage.setItem('akira_openai_model', CONFIG.openaiModel || '');
        localStorage.setItem('akira_voice_uri', CONFIG.voiceURI || '');
        localStorage.setItem('akira_use_local_tts', CONFIG.useLocalTTS);
        localStorage.setItem('akira_local_tts_url', CONFIG.localTTSUrl);
    } catch (e) {
        console.warn("Storage error:", e);
    }
}

function saveHistory(role, text) {
    CONFIG.history.push({ role, text });
    if (CONFIG.history.length > 50) CONFIG.history.shift();
    try {
        localStorage.setItem('akira_history', JSON.stringify(CONFIG.history));
    } catch (e) { }
}

// Función para manejar la subida de archivos
async function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
        const reader = new FileReader();
        if (file.type.startsWith('image/')) {
            reader.onload = (ev) => {
                currentAttachments.push({ type: 'image', data: ev.target.result, name: file.name });
                renderMediaPreview();
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = (ev) => {
                currentAttachments.push({ type: 'text_file', data: ev.target.result, name: file.name });
                renderMediaPreview();
            };
            reader.readAsText(file);
        }
    }
    // Reset input so the same file can be uploaded again if removed
    e.target.value = '';
}

// Start App Robustly
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
// Fallback para navegadores MUY lentos o situaciones extrañas
window.onload = () => { if (Object.keys(UI).length === 0) init(); };
