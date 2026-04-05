const fs = require('fs');

async function patchFile() {
    let cb = fs.readFileSync('public/js/chat-bot.js', 'utf8');

    // 1. UPDATE CSS
    const oldCSS = `.chat-header {
        background: var(--green-deep, #1B4332);
        color: white;
        padding: 1rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }`;
    const newCSS = `.chat-header {
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
    }`;
    cb = cb.replace(oldCSS, newCSS);

    // 2. UPDATE HTML WIDGET
    const oldHTML = `            <div class="chat-header">
                <strong style="font-family: var(--font-display, sans-serif)">AgriBot AI</strong>
                <select class="lang-select" id="chat-lang">
                    <option value="en-US">English</option>
                    <option value="hi-IN">Hindi (हिन्दी)</option>
                    <option value="or-IN">Odia (ଓଡ଼ିଆ)</option>
                    <option value="te-IN">Telugu (తెలుగు)</option>
                </select>
            </div>
            <div class="chat-body" id="chat-body">
                <div class="msg msg-bot">Hello! I am your AI farming assistant. Ask me about your crops, weather, or soil. <span class="audio-play" onclick="speakText('Hello! I am your AI farming assistant. Ask me about your crops, weather, or soil.', 'en-US')">🔊 Play</span></div>
            </div>
            <div class="chat-footer">
                <button class="mic-btn" id="mic-btn">🎙️</button>
                <input type="text" class="chat-input" id="chat-input" placeholder="Type a message...">
                <button class="chat-btn" id="send-btn">➤</button>
            </div>
        </div>`;
    const newHTML = `            <div class="chat-header">
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
        </div>`;
    cb = cb.replace(oldHTML, newHTML);

    // 3. UPDATE VARIABLES AND SETUP
    const oldSetup = `    const toggle = document.getElementById('chat-toggle');
    const panel = document.getElementById('chat-panel');
    const input = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const micBtn = document.getElementById('mic-btn');
    const body = document.getElementById('chat-body');
    const langSelect = document.getElementById('chat-lang');

    // UI Toggle`;
    const newSetup = `    const toggle = document.getElementById('chat-toggle');
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
        navigator.geolocation.getCurrentPosition((pos) => {
            userLocation = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        }, err => console.warn("Geolocation warning:", err));
    }

    // UI Toggle`;
    cb = cb.replace(oldSetup, newSetup);

    // 4. FIX HTML Encoding for Audio Button inside appendMsg
    const oldAppend = `        if (sender === 'bot') {
            const safeText = text.replace(/'/g, "\\\\'");
            innerHtml += \` <span class="audio-play" onclick="speakText('\${safeText}', '\${langSelect.value}')">🔊 Play</span>\`;
        }`;
    const newAppend = `        if (sender === 'bot') {
            const safeText = encodeURIComponent(text);
            innerHtml += \` <span class="audio-play" onclick="speakText(decodeURIComponent('\${safeText}'), '\${langSelect.value}')">🔊 Play</span>\`;
        }`;
    cb = cb.replace(oldAppend, newAppend);

    // 5. UPDATE handleSend() LOGIC
    const oldHandleSendStr1 = `    async function handleSend() {
        const text = input.value.trim();
        if (!text) return;

        appendMsg(text, 'user');
        input.value = '';

        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'msg msg-bot';
        loadingDiv.innerText = 'Thinking...';
        body.appendChild(loadingDiv);
        body.scrollTop = body.scrollHeight;

        const apiKey = localStorage.getItem('agripredict_openai_key');`;
    const newHandleSendStr1 = `    async function handleSend() {
        const text = input.value.trim();
        if (!text && !currentImageData) return;

        let displayHtml = text;
        if (currentImageData) {
            displayHtml += \`<br><img src="\${currentImageData}" style="max-height: 100px; border-radius: 8px; margin-top: 5px;">\`;
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
        body.scrollTop = body.scrollHeight;`;
        
    cb = cb.replace(oldHandleSendStr1, newHandleSendStr1);

    const oldLogicRegex = /        \/\/ Helper specifically for our local data fallback route[\s\S]*?            if \(!apiKey \|\| apiKey\.length < 5\) \{[\s\S]*?            else \{[\s\S]*?                let langName = "English";[\s\S]*?                        max_tokens: 150[\s\S]*?                    \}\)[\s\S]*?                \}\);[\s\S]*?                const result = await response\.json\(\);[\s\S]*?                if \(result\.error\) \{[\s\S]*?                    console\.warn\("OpenAI API failed, using local database fallback\. Error:", result\.error\.message\);[\s\S]*?                    reply = await fetchFallback\(\);[\s\S]*?                \} else \{[\s\S]*?                    reply = result\.choices\[0\]\.message\.content\.trim\(\);[\s\S]*?                \}[\s\S]*?            \}/;

    const newLogicStr = `        let code = 'en';
        if (langSelect.value === 'hi-IN') code = 'hi';
        if (langSelect.value === 'or-IN') code = 'or';
        if (langSelect.value === 'te-IN') code = 'te';

        let reply = "";
        try {
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-local-dev-user': '1' },
                body: JSON.stringify({ 
                    question: text || "Please analyze this image.", 
                    language: code,
                    image: payloadImage,
                    location: userLocation
                })
            });
            const data = await res.json();
            reply = data.answer || "I'm sorry, I encountered an error answering that.";
        } catch (e) {
            reply = "Network error communicating with AI. Please try again.";
        }`;

    cb = cb.replace(oldLogicRegex, newLogicStr);
    
    // Add Auto-play trigger to bot speech
    const oldPlayTrigger = `            body.removeChild(loadingDiv);
            appendMsg(reply, 'bot');
            speakText(reply, langSelect.value);`;
    const newPlayTrigger = `            body.removeChild(loadingDiv);
            appendMsg(reply, 'bot');
            if (autoPlayAudio) {
                speakText(reply, langSelect.value);
            }`;
    cb = cb.replace(oldPlayTrigger, newPlayTrigger);


    fs.writeFileSync('public/js/chat-bot.js', cb);


    // PATCHING routes.ts
    let routes = fs.readFileSync('server/routes.ts', 'utf8');

    const oldChatRoutes = `      const { question, language = "en" } = req.body;

      let answer = null;
      let usedGemini = false;

      // Try Gemini API dynamically first
      try {
        const KEYS_FILE = path.join(process.cwd(), 'api-keys.json');
        const data = await fs.readFile(KEYS_FILE, 'utf-8');
        const keys = JSON.parse(data);
        if (keys.gemini && keys.gemini.length > 5 && keys.gemini !== 'exampurpose') {
            const langMap: Record<string, string> = { 'en': 'English', 'hi': 'Hindi', 'or': 'Odia', 'te': 'Telugu' };
            const promptLang = langMap[language] || 'English';
            const prompt = \`You are an expert Agricultural Assistant named AgriBot. Please answer the following question clearly and concisely in \${promptLang}. Provide practical farming advice or current agricultural context if applicable: "\${question}"\`;
            
            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${keys.gemini}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
            });
            
            const resJson = await response.json();
            if (resJson.candidates && resJson.candidates.length > 0) {
              answer = resJson.candidates[0].content?.parts?.[0]?.text || null;
              if (answer) usedGemini = true;
            }
        }
      } catch(e) {
        console.error("Gemini chatbot error", e);
      }`;

    const newChatRoutes = `      const { question, language = "en", image, location } = req.body;

      let answer = null;
      let usedGemini = false;

      // Try Gemini API dynamically first
      try {
        const KEYS_FILE = path.join(process.cwd(), 'api-keys.json');
        const data = await fs.readFile(KEYS_FILE, 'utf-8');
        const keys = JSON.parse(data);
        
        let weatherContext = "";
        if (location && location.lat && location.lon && keys.weather) {
          try {
            const wRes = await fetch(\`https://api.openweathermap.org/data/2.5/weather?lat=\${location.lat}&lon=\${location.lon}&appid=\${keys.weather}&units=metric\`);
            const wData = await wRes.json();
            if (wData.main && wData.weather) {
              weatherContext = \`\\nCurrent User Weather: \${wData.weather[0].description}, \${wData.main.temp}°C, Humidity: \${wData.main.humidity}%. Include this context if relevant to the question.\`;
            }
          } catch(e) { console.error("Weather fetch error", e); }
        }

        if (keys.gemini && keys.gemini.length > 5 && keys.gemini !== 'exampurpose') {
            const langMap: Record<string, string> = { 'en': 'English', 'hi': 'Hindi', 'or': 'Odia', 'te': 'Telugu' };
            const promptLang = langMap[language] || 'English';
            const prompt = \`You are an expert Agricultural Assistant named AgriBot. Please answer the following question clearly and concisely in \${promptLang}. Provide practical farming advice or current agricultural context if applicable.\${weatherContext}\\nQuestion: "\${question}"\`;
            
            const parts: any[] = [{ text: prompt }];

            if (image) {
                const mimeType = image.split(';')[0].split(':')[1];
                const base64Data = image.split(',')[1];
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }

            const response = await fetch(\`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=\${keys.gemini}\`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ contents: [{ parts: parts }] })
            });
            
            const resJson = await response.json();
            if (resJson.candidates && resJson.candidates.length > 0) {
              answer = resJson.candidates[0].content?.parts?.[0]?.text || null;
              if (answer) usedGemini = true;
            }
        }
      } catch(e) {
        console.error("Gemini chatbot error", e);
      }`;
      
    routes = routes.replace(oldChatRoutes, newChatRoutes);
    fs.writeFileSync('server/routes.ts', routes);

    // PATCHING prediction.js
    let pred = fs.readFileSync('public/js/prediction.js', 'utf8');

    const oldPredToggle = `    // ===== POST-PREDICTION FIELD ASSISTANT LOGIC =====
    let consultationInitiated = false;
    
    function initConsultation() {
        if(consultationInitiated) return;
        consultationInitiated = true;
        
        const chatWindow = document.getElementById('consultation-chat');
        appendMessage(chatWindow, 'bot', 'Hello! Your yield prediction is ready. I noticed some areas we could improve. How are your current funds for fertilizer, and have you noticed any pests lately? (P.S. You can reply in English, Hindi, Odia, or Telugu)');
    }`;

    const newPredToggle = `    // ===== POST-PREDICTION FIELD ASSISTANT LOGIC =====
    let consultationInitiated = false;
    
    const consultationSection = document.getElementById('consultation-section');
    const autoAudioToggle = document.createElement('div');
    autoAudioToggle.innerHTML = \`<label><input type="checkbox" id="auto-audio-mode"> Enable Auto Audio for Consultation Reply</label>\`;
    autoAudioToggle.style.padding = '0.5rem 0';
    autoAudioToggle.style.color = '#374151';
    autoAudioToggle.style.fontWeight = 'bold';
    
    // Insert before the chat container if exists
    const chatContainer = document.getElementById('consultation-chat');
    if (chatContainer && chatContainer.parentNode) {
        chatContainer.parentNode.insertBefore(autoAudioToggle, chatContainer);
    }
    
    function initConsultation() {
        if(consultationInitiated) return;
        consultationInitiated = true;
        
        const text = 'Hello! Your yield prediction is ready. I noticed some areas we could improve. How are your current funds for fertilizer, and have you noticed any pests lately?';
        appendMessage(chatContainer, 'bot', text);
        
        if (document.getElementById('auto-audio-mode') && document.getElementById('auto-audio-mode').checked && window.speakText) {
            window.speakText(text, 'en-US');
        }
    }`;
    
    pred = pred.replace(oldPredToggle, newPredToggle);

    const oldBotReply = `            const botReply = result.candidates[0].content.parts[0].text.trim();
            document.getElementById(typingId).innerText = botReply;
            chatWindow.scrollTo(0, chatWindow.scrollHeight);`;
            
    const newBotReply = `            const botReply = result.candidates[0].content.parts[0].text.trim();
            document.getElementById(typingId).innerText = botReply;
            chatWindow.scrollTo(0, chatWindow.scrollHeight);
            
            if (document.getElementById('auto-audio-mode') && document.getElementById('auto-audio-mode').checked && window.speakText) {
                window.speakText(botReply, 'en-US');
            }`;
            
    pred = pred.replace(oldBotReply, newBotReply);
    fs.writeFileSync('public/js/prediction.js', pred);
}

patchFile().then(() => console.log('Patched correctly!')).catch(console.error);
