// Inject chatbot styles
const botStyles = document.createElement('style');
botStyles.innerHTML = `
    .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        font-family: var(--font-sans, "Space Grotesk", sans-serif);
    }
    .chat-toggle {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: var(--green-bright, #52B788);
        color: white;
        border: none;
        box-shadow: 0 4px 15px rgba(82,183,136,0.4);
        cursor: pointer;
        font-size: 1.5rem;
        transition: transform 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .chat-toggle:hover {
        transform: scale(1.05);
    }
    .chat-panel {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 350px;
        height: 500px;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(82, 183, 136, 0.3);
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transform: translateY(20px);
        transition: all 0.3s ease;
    }
    .chat-panel.open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
    }
    .chat-header {
        background: var(--green-deep, #1B4332);
        color: white;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .chat-header-actions {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    .audio-toggle {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.7;
        font-size: 1.2rem;
    }
    .audio-toggle.active {
        opacity: 1;
        color: #FFD700;
    }
    .image-preview-container {
        display: none;
        padding: 0.5rem;
        background: #f3f4f6;
        border-top: 1px solid #e5e7eb;
        position: relative;
    }
    .image-preview {
        max-height: 50px;
        border-radius: 4px;
    }
    .remove-image {
        position: absolute;
        top: 0;
        right: 10px;
        background: #DC2626;
        color: white;
        border: none;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        font-size: 12px;
        cursor: pointer;
    }
    .img-btn {
        background: #4B5563;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .lang-select {
        background: rgba(255,255,255,0.2);
        color: white;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 4px;
        padding: 0.2rem;
        font-size: 0.8rem;
    }
    .chat-body {
        flex: 1;
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }
    .msg { max-width: 80%; padding: 0.8rem; border-radius: 12px; font-size: 0.9rem; line-height: 1.4; position: relative; }
    .msg-user { background: var(--green-light, #95D5B2); color: var(--green-deep); align-self: flex-end; border-bottom-right-radius: 2px; }
    .msg-bot { background: #f3f4f6; color: #1f2937; align-self: flex-start; border-bottom-left-radius: 2px; }
    .msg-bot .audio-play {
        position: absolute;
        bottom: -20px;
        right: 0;
        font-size: 0.75rem;
        cursor: pointer;
        opacity: 0.6;
    }
    .msg-bot .audio-play:hover { opacity: 1; }
    .chat-footer {
        padding: 1rem;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 0.5rem;
        background: white;
    }
    .chat-input {
        flex: 1;
        padding: 0.8rem;
        border: 1px solid #d1d5db;
        border-radius: 99px;
        outline: none;
    }
    .chat-btn, .mic-btn {
        background: var(--green-deep);
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .mic-btn.recording { background: #DC2626; animation: pulse 1s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.6; } 100% { opacity: 1; } }
`;
document.head.appendChild(botStyles);

document.addEventListener('DOMContentLoaded', () => {
    const widget = document.createElement('div');
    widget.className = 'chat-widget';
    widget.innerHTML = `
        <div class="chat-panel" id="chat-panel">
            <div class="chat-header">
                <strong style="font-family: var(--font-display, sans-serif)">AgriBot AI</strong>
                <div class="chat-header-actions">
                    <button class="audio-toggle" id="audio-toggle" title="Auto-play Audio">🔇</button>
                    <select class="lang-select" id="chat-lang">
                        <option value="en-US">English</option>
                        <option value="hi-IN">Hindi (हिन्दी)</option>
                        <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                        <option value="te-IN">Telugu (తెలుగు)</option>
                    </select>
                </div>
            </div>
            <div id="weather-banner" style="display: none; background: #E6F4EA; color: #1B4332; padding: 0.5rem 1rem; font-size: 0.8rem; font-weight: bold; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(82, 183, 136, 0.3);">
                <div>📍 <span id="loc-name">Loading...</span></div>
                <div><span id="loc-temp">--</span>, <span id="loc-desc">--</span></div>
            </div>
            <div class="chat-body" id="chat-body">
                <div class="msg msg-bot">Hello! I am your AI farming assistant. Ask me about your crops, weather, or soil. <span class="audio-play" onclick="speakText('Hello! I am your AI farming assistant. Ask me about your crops, weather, or soil.', 'en-US')">🔊 Play</span></div>
            </div>
            <div class="image-preview-container" id="img-preview-container">
                <img src="" class="image-preview" id="img-preview">
                <button class="remove-image" id="remove-img-btn">×</button>
            </div>
            <div class="chat-footer">
                <input type="file" id="chat-image-input" accept="image/*" style="display: none;">
                <button class="img-btn" id="img-btn" title="Upload Image">📷</button>
                <button class="mic-btn" id="mic-btn" title="Speak">🎙️</button>
                <input type="text" class="chat-input" id="chat-input" placeholder="Type a message...">
                <button class="chat-btn" id="send-btn" title="Send">➤</button>
            </div>
        </div>
        <button class="chat-toggle" id="chat-toggle">💬</button>
    `;
    document.body.appendChild(widget);

    const toggle = document.getElementById('chat-toggle');
    const panel = document.getElementById('chat-panel');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const body = document.getElementById('chat-body');
    const langSelect = document.getElementById('chat-lang');
    
    const audioToggle = document.getElementById('audio-toggle');
    const imgBtn = document.getElementById('img-btn');
    const imgInput = document.getElementById('chat-image-input');
    const imgPreviewContainer = document.getElementById('img-preview-container');
    const imgPreview = document.getElementById('img-preview');
    const removeImgBtn = document.getElementById('remove-img-btn');

    // Sync chat language with profile if set
    const profLang = localStorage.getItem('agripredict_lang');
    if (profLang) {
        if (profLang === 'hi') langSelect.value = 'hi-IN';
        else if (profLang === 'or') langSelect.value = 'or-IN';
        else if (profLang === 'te') langSelect.value = 'te-IN';
        else langSelect.value = 'en-US';
    }

    let autoPlayAudio = false;
    audioToggle.addEventListener('click', () => {
        autoPlayAudio = !autoPlayAudio;
        audioToggle.classList.toggle('active', autoPlayAudio);
        audioToggle.innerText = autoPlayAudio ? '🔊' : '🔇';
    });

    let currentImageData = null;
    imgBtn.addEventListener('click', () => imgInput.click());
    imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                currentImageData = ev.target.result;
                imgPreview.src = currentImageData;
                imgPreviewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    removeImgBtn.addEventListener('click', () => {
        currentImageData = null;
        imgInput.value = '';
        imgPreviewContainer.style.display = 'none';
    });

    // Geolocation setup
    let userLocation = null;
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
            
            try {
                const keyRes = await fetch('/api/settings/keys');
                const keys = await keyRes.json();
                if (keys.weather) {
                    const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${userLocation.lat}&lon=${userLocation.lon}&appid=${keys.weather}&units=metric`);
                    const wData = await wRes.json();
                    if (wData.main && wData.weather) {
                        const banner = document.getElementById('weather-banner');
                        document.getElementById('loc-name').innerText = wData.name || "Unknown";
                        document.getElementById('loc-temp').innerText = `🌡️ ${Math.round(wData.main.temp)}°C`;
                        document.getElementById('loc-desc').innerText = `🌤️ ${wData.weather[0].main}`;
                        banner.style.display = 'flex';
                    }
                }
            } catch (e) { console.warn("Failed to fetch weather for UI", e); }
            
        }, err => console.warn("Geolocation warning:", err));
    }

    // UI Toggle
    toggle.addEventListener('click', () => {
        panel.classList.toggle('open');
        if(panel.classList.contains('open')) input.focus();
    });

    // Make speak window-accessible
    window.speakText = function(text, lang) {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            // Map the selected language to a valid TTS voice
            let ttsLang = 'en-US';
            if(lang === 'hi-IN' || lang === 'hi') ttsLang = 'hi-IN';
            if(lang === 'or-IN' || lang === 'or') ttsLang = 'hi-IN'; // Odia uses Hindi fallback mostly if unsupported natively
            if(lang === 'te-IN' || lang === 'te') ttsLang = 'te-IN';
            
            const u = new SpeechSynthesisUtterance(text);
            u.lang = ttsLang;
            
            // Try to find a specific voice to force the language correctly
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.replace('_', '-').startsWith(ttsLang.split('-')[0]));
            if (voice) {
                u.voice = voice;
            }
            
            window.speechSynthesis.speak(u);
        }
    };

    function appendMsg(text, sender) {
        const div = document.createElement('div');
        div.className = `msg msg-${sender}`;
        
        // Remove code block backticks if present from API
        let displayHtml = text.replace(/```html/g, '').replace(/```/g, '');
        
        // Parse Video Embeds
        displayHtml = displayHtml.replace(/\[VIDEO:(https?:\/\/[^\s\]]+)\]/g, (match, url) => {
            return `<div style="margin-top: 10px; border-radius: 8px; overflow: hidden; position: relative; padding-bottom: 56.25%; height: 0;">
                <iframe src="${url}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
            </div>`;
        });

        // Parse Interactive Buttons
        displayHtml = displayHtml.replace(/\[Yes_BTN\]/g, `<button class="chat-choice-btn" onclick="document.getElementById('chat-input').value='Yes, I have completed the registration.'; document.getElementById('send-btn').click();" style="background-color: var(--green-deep, #1B4332); color: white; border: none; padding: 5px 15px; border-radius: 4px; margin: 4px 2px; cursor: pointer; font-size: 0.85rem;">Yes</button>`);
        displayHtml = displayHtml.replace(/\[No_BTN\]/g, `<button class="chat-choice-btn" onclick="document.getElementById('chat-input').value='No, I need more help.'; document.getElementById('send-btn').click();" style="background-color: #DC2626; color: white; border: none; padding: 5px 15px; border-radius: 4px; margin: 4px 2px; cursor: pointer; font-size: 0.85rem;">No</button>`);

        if (sender === 'bot') {
            // Strip placeholders before sending to TTS
            let plainTextForAudio = text.replace(/\[VIDEO:[^\]]+\]/g, '').replace(/\[Yes_BTN\]|\[No_BTN\]/g, '').trim();
            const safeText = encodeURIComponent(plainTextForAudio.replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
            displayHtml += ` <span class="audio-play" onclick="speakText(decodeURIComponent('${safeText}'), '${langSelect.value}')">🔊 Play</span>`;
        }
        
        div.innerHTML = displayHtml;
        body.appendChild(div);
        body.scrollTop = body.scrollHeight;
    }

    async function handleSend(isVoiceContext = false) {
        // Support event objects from standard click events
        if (typeof isVoiceContext !== 'boolean') {
            isVoiceContext = false;
        }
        
        const text = input.value.trim();
        if (!text && !currentImageData) return;

        let displayHtml = text;
        if (currentImageData) {
            displayHtml += `<br><img src="${currentImageData}" style="max-height: 100px; border-radius: 8px; margin-top: 5px;">`;
        }

        if(text || currentImageData) {
            appendMsg(displayHtml, 'user');
        }
        
        input.value = '';
        const payloadImage = currentImageData;
        
        // Reset image
        currentImageData = null;
        imgInput.value = '';
        imgPreviewContainer.style.display = 'none';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'msg msg-bot';
        loadingDiv.innerText = 'Thinking...';
        body.appendChild(loadingDiv);
        body.scrollTop = body.scrollHeight;
        
        // Let the user know if a retry is happening in the background
        const loadingInterval = setInterval(() => {
            if(loadingDiv.innerText === 'Thinking...') {
                loadingDiv.innerText = 'Analyzing data... (This may take up to 30s if network is busy)';
                body.scrollTop = body.scrollHeight;
            }
        }, 10000);
        
        try {
            let code = 'en';
            if (langSelect.value === 'hi-IN') code = 'hi';
            if (langSelect.value === 'or-IN') code = 'or';
            if (langSelect.value === 'te-IN') code = 'te';

            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-local-dev-user': '1' },
                body: JSON.stringify({ 
                    question: text, 
                    language: code,
                    location: userLocation,
                    image: payloadImage
                })
            });

            if(!res.ok) {
                throw new Error("Backend API responded with error.");
            }

            const data = await res.json();
            const reply = data.answer || "I'm sorry, I don't have information about that right now.";

            body.removeChild(loadingDiv);
            appendMsg(reply, 'bot');
            
            // Auto play if the global audio toggle is ON
            if (autoPlayAudio) {
                speakText(reply, langSelect.value);
            }

            clearInterval(loadingInterval);
        } catch (error) {
            clearInterval(loadingInterval);
            body.removeChild(loadingDiv);
            console.error("AI Communication Error:", error);
            appendMsg("Server connection timed out or failed. Please refresh.", 'bot');
        }
    }

    sendBtn.addEventListener('click', handleSend);
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

    // Web Speech API for Dictation
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        
        recognition.continuous = false;
        recognition.interimResults = false;

        micBtn.addEventListener('click', () => {
            if (micBtn.classList.contains('recording')) {
                recognition.stop();
                return;
            }
            recognition.lang = langSelect.value;
            recognition.start();
            micBtn.classList.add('recording');
            input.placeholder = "Listening...";
        });

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            micBtn.classList.remove('recording');
            input.placeholder = "Type a message...";
            handleSend(true);
        };

        recognition.onerror = (e) => {
            console.error(e);
            micBtn.classList.remove('recording');
            input.placeholder = "Type a message...";
        };

        recognition.onend = () => {
            micBtn.classList.remove('recording');
            input.placeholder = "Type a message...";
        };
    } else {
        micBtn.style.display = 'none';
    }
});
