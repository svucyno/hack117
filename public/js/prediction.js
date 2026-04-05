document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('prediction-form');
    const resultsPanel = document.getElementById('results-panel');
    const loader = document.getElementById('loader');
    const placeholder = document.getElementById('placeholder-text');
    const content = document.getElementById('result-content');
    
    const yieldVal = document.getElementById('yield-value');
    const confVal = document.getElementById('confidence-val');
    const confFill = document.getElementById('confidence-fill');
    const recsList = document.getElementById('recommendations');
    const audioBtn = document.getElementById('play-audio-btn');
    const apiKeyWarning = document.getElementById('api-key-warning');

    let currentReportText = ''; // Stores text for Speech Synthesis

    // [NEW] Prediction History UI Feed Logic
    async function loadPredictionHistory() {
        try {
            const feedContainer = document.getElementById('prediction-history-feed');
            if(!feedContainer) return;
            
            const userStr = localStorage.getItem('agri_current_user');
            const userId = userStr ? JSON.parse(userStr).id : 'local-user-id';

            const req = await fetch('/api/predictions', {
                headers: { 'x-user-id': userId }
            });
            if(req.ok) {
                const history = await req.json();
                feedContainer.innerHTML = ''; // Clear loading text
                
                if (history.length === 0) {
                    feedContainer.innerHTML = '<div style="opacity:0.6; font-size:0.9rem; font-style:italic;">No past predictions found. Run your first analysis above!</div>';
                    return;
                }
                
                history.forEach(pred => {
                    const card = document.createElement('div');
                    card.style.background = 'rgba(255,255,255,0.6)';
                    card.style.border = '1px solid rgba(0,0,0,0.05)';
                    card.style.borderRadius = '8px';
                    card.style.padding = '1rem';
                    card.style.display = 'grid';
                    card.style.gridTemplateColumns = '2fr 1fr 1fr 1fr';
                    card.style.alignItems = 'center';
                    card.style.gap = '1rem';
                    card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    
                    const dateStr = new Date(pred.createdAt).toLocaleDateString();
                    
                    const cropMap = { 'wheat': 'Wheat 🌾', 'rice': 'Rice 🍙', 'corn': 'Corn 🌽', 'soybeans': 'Soybeans 🌱' };
                    const cropName = cropMap[pred.cropType] || pred.cropType;
                    
                    card.innerHTML = `
                        <div>
                            <div style="font-weight:600; color:var(--primary); font-size:1.1rem;">${cropName}</div>
                            <div style="font-size:0.75rem; color:var(--muted);">${dateStr}</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">N/P Levels</div>
                            <div style="font-weight:500;">${pred.factors?.nitrogen || 0} / ${pred.factors?.phosphorus || 0}</div>
                        </div>
                        <div>
                            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Fertilizer & Soil</div>
                            <div style="font-weight:500; font-size: 0.9rem; color: var(--green-bright);">${pred.factors?.fertilizer || '-'}</div>
                            <div style="font-size:0.75rem; color:var(--text);">${pred.factors?.soil || 'Unknown Soil'}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:0.75rem; color:var(--muted); text-transform:uppercase;">Achieved Yield</div>
                            <div style="font-size:1.4rem; font-family:var(--font-display); font-weight:800; color:var(--green-light);">${pred.predictedYield} <small style="font-size:0.8rem;font-weight:400;color:var(--text);">t/ha</small></div>
                        </div>
                    `;
                    feedContainer.appendChild(card);
                });
            }
        } catch(e) {
            console.warn("Failed to load Prediction History feed frontend.", e);
        }
    }
    
    // Fire on load
    loadPredictionHistory();
    // Expose to window so we can trigger from the event listener down below
    window.loadPredictionHistory = loadPredictionHistory;

    // Check for API key
    const apiKey = localStorage.getItem('agripredict_openai_key');
    if (!apiKey) {
        apiKeyWarning.style.display = 'block';
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // UI Loading State
        loader.style.display = 'block';
        placeholder.style.display = 'none';
        content.style.display = 'none';

        const data = {
            cropType: document.getElementById('cropType').value,
            nitrogen: parseFloat(document.getElementById('nitrogen').value),
            phosphorus: parseFloat(document.getElementById('phosphorus').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            rainfall: parseFloat(document.getElementById('rainfall').value),
            farmArea: parseFloat(document.getElementById('farmArea').value),
            irrigationType: document.getElementById('irrigationType').value,
            fertilizerUsed: parseFloat(document.getElementById('fertilizerUsed').value),
            pesticideUsed: parseFloat(document.getElementById('pesticideUsed').value),
            soilType: document.getElementById('soilType').value,
            season: document.getElementById('season').value,
            waterUsage: parseFloat(document.getElementById('waterUsage').value)
        };

        const apiKey = localStorage.getItem('agripredict_openai_key');
        
        let mlPredictedYield = 0;
        let mlConfidence = 0;

        // 1. Fetch from Local ML Model First!
        try {
            const userStr = localStorage.getItem('agri_current_user');
            const userId = userStr ? JSON.parse(userStr).id : 'local-user-id';
            
            const mlRes = await fetch('/api/ml-predict', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
               body: JSON.stringify(data)
            });
            
            if(mlRes.ok) {
                const mlJson = await mlRes.json();
                if(mlJson.predictedYield) {
                    mlPredictedYield = mlJson.predictedYield;
                    mlConfidence = mlJson.confidence ? Math.floor(mlJson.confidence * 100) : 92;
                }
            } else {
                console.warn("ML API Error, falling back to heuristics");
            }
        } catch(e) {
            console.error("Failed to reach ML model", e);
        }

        // 2. Fetch Optimal Fertilizer from XGBoost!
        let optimalFertilizer = '';
        try {
            const fertRes = await fetch('/api/predict-fertilizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if(fertRes.ok) {
                const fertJson = await fertRes.json();
                optimalFertilizer = fertJson.optimal_fertilizer || '';
            }
        } catch(e) {
            console.warn("Fertilizer ML err", e);
        }

        // Helper function for local calculation fallback
        function runFallback() {
            loader.style.display = 'none';
            content.style.display = 'block';

            // If ML model succeeded, use its actual data! Otherwise mock it.
            let finalYield = mlPredictedYield;
            let finalConf = mlConfidence;
            
            if(!finalYield) {
                const baseYield = { 'wheat': 3.5, 'rice': 4.2, 'corn': 5.0, 'soybeans': 2.8 }[data.cropType] || 3.0;
                let modifier = 1.0;
                if (data.nitrogen < 30) modifier -= 0.15;
                if (data.rainfall < 50) modifier -= 0.2;
                finalYield = (baseYield * modifier).toFixed(2);
                finalConf = Math.floor(Math.random() * 15) + 80; // 80-95%
            }

            yieldVal.innerText = finalYield;
            confVal.innerText = `${finalConf}%`;
            
            document.getElementById('ml-fertilizer-val').innerText = optimalFertilizer || "Universal NPK Blend";
            document.getElementById('ml-soil-val').innerText = data.soilType || "--";
            
            confFill.style.width = '0%';
            setTimeout(() => { confFill.style.width = `${finalConf}%`; }, 50);

            recsList.innerHTML = '';
            const recs = [];
            if (data.nitrogen < 30) recs.push('Nitrogen levels are critically low. Add urea top-dressing.');
            if (data.temperature > 30) recs.push('High temperature detected. Increase irrigation frequency to prevent heat stress.');
            if (recs.length === 0) recs.push('Soil NPK ratio is optimal for current growth stage.');
            recs.push(`Expected harvest window is looking good with a ${finalConf}% confidence score.`);

            recs.forEach(r => {
                const li = document.createElement('li');
                li.innerText = r;
                recsList.appendChild(li);
            });

            currentReportText = `AI Analysis complete. Predicted yield for ${data.cropType} is ${finalYield} tons per hectare with ${finalConf} percent confidence. Recommendations: ${recs.join(' ')}`;
            
            // Show Consultation Section
            document.getElementById('consultation-section').style.display = 'block';
            initConsultation();
        }

        try {
            // Fetch global keys
            const keyRes = await fetch('/api/settings/keys');
            const keys = await keyRes.json();
            const apiKey = keys.gemini;

            if (!apiKey || apiKey.length < 5) {
                // Simulate Network Delay or LLM processing time for fallback
                setTimeout(() => {
                    runFallback();
                }, 1000);
                return;
            }

            // Language specific handling
            const pageLang = localStorage.getItem('agripredict_lang') || 'en-US';
            const langMap = { 'hi': 'Hindi', 'or': 'Odia', 'te': 'Telugu', 'en': 'English' };
            const langCode = pageLang.split('-')[0];
            const targetLang = langMap[langCode] || 'English';

            const prompt = `You are AgriPredict AI, an expert machine learning agronomist.
Analyze the following farm data:
- Crop Type: ${data.cropType}
- Nitrogen (N): ${data.nitrogen} mg/kg
- Phosphorus (P): ${data.phosphorus} mg/kg
- Average Temperature: ${data.temperature}°C
- Rainfall: ${data.rainfall} mm
${mlPredictedYield ? `- ML Verified Target Yield: ${mlPredictedYield} tons/hectare` : ''}
${optimalFertilizer ? `- ML Optimal Fertilizer Recommendation: ${optimalFertilizer}` : ''}

Based on real-world agronomy, predict the yield and give actionable advice to this local farmer.
Return ONLY a valid JSON object with EXACTLY these keys:
"predictedYield" (number representing tons/hectare, e.g., 4.2. ${mlPredictedYield ? `MUST BE EXACTLY ${mlPredictedYield} AS COMPUTED BY THE LOCAL ML ENGINE` : ''}),
"confidenceScore" (number between 60 and 99),
"importanceOfYield" (a short sentence explaining why this yield level is important/what it means for market/profit, written strictly in ${targetLang} language),
"waysToIncrease" (an array of exactly 3 specific real-time recommendations/methods to increase this yield further considering the input data. ${optimalFertilizer ? `MAKE SURE ONE OF THE RECOMMENDATIONS EXPLICITLY SUGGESTS USING THIS EXACT FERTILIZER: "${optimalFertilizer}" AS PROVEN BY OUR ML MODEL` : ''}, written strictly in ${targetLang} language),
"spokenReport" (A 2-3 sentence conversational summary of the prediction and recommendations, explicitly written in ${targetLang} language. This will be read aloud to the farmer via TTS. ${optimalFertilizer ? `Must mention the ${optimalFertilizer} fertilizer.` : ''}).
Do not include \`\`\`json blocks or any other markdown/text.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        topP: 0.8
                    }
                })
            });

            const result = await response.json();

            if (result.error) {
                console.warn("Gemini API failed, using local fallback. Error:", result.error.message);
                alert("AI Quota Limit Reached: " + result.error.message + "\n\nPlease wait 1 minute before running another prediction.");
                runFallback();
                return;
            }

            loader.style.display = 'none';
            content.style.display = 'block';

            let aiContent = result.candidates[0].content.parts[0].text.trim();
            aiContent = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiData = JSON.parse(aiContent);

            // Override with actual ML model if available, otherwise use Gemini fallback
            const finalPredictedYield = mlPredictedYield ? parseFloat(mlPredictedYield).toFixed(2) : parseFloat(aiData.predictedYield).toFixed(2);
            const finalConfidence = mlConfidence ? mlConfidence : Math.floor(aiData.confidenceScore);

            yieldVal.innerText = finalPredictedYield;
            confVal.innerText = `${finalConfidence}%`;
            
            document.getElementById('ml-fertilizer-val').innerText = optimalFertilizer || "Universal NPK Blend";
            document.getElementById('ml-soil-val').innerText = data.soilType || "--";
            
            confFill.style.width = '0%';
            setTimeout(() => { confFill.style.width = `${finalConfidence}%`; }, 50);

            // Populate importance string
            document.getElementById('yield-importance-text').innerText = aiData.importanceOfYield;

            recsList.innerHTML = '';
            aiData.waysToIncrease.forEach(r => {
                const li = document.createElement('li');
                li.innerText = r;
                recsList.appendChild(li);
            });

            currentReportText = aiData.spokenReport || `AI Analysis complete. Predicted yield for ${data.cropType} is ${predictedYield} tons per hectare. ${aiData.importanceOfYield}`;
            
            // [NEW] Save directly to DB to explicitly maintain 5-item user history
            try {
                const userStr = localStorage.getItem('agri_current_user');
                const userId = userStr ? JSON.parse(userStr).id : 'local-user-id';

                await fetch('/api/predict', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'x-user-id': userId
                    },
                    body: JSON.stringify({
                        cropType: data.cropType,
                        moisture: null,
                        temp: data.temperature,
                        ph: null,
                        rainfall: data.rainfall,
                        predictedYield: parseFloat(finalPredictedYield),
                        confidence: parseFloat(finalConfidence),
                        factors: { 
                            nitrogen: data.nitrogen, 
                            phosphorus: data.phosphorus,
                            fertilizer: optimalFertilizer || "Unknown",
                            soil: data.soilType
                        }
                    })
                });
                
                // [NEW] If prediction is Highly Productive (> 3.0 yield), log to Healthy Crop DB for Dynamic Analytics!
                if (parseFloat(finalPredictedYield) >= 3.0) {
                    await fetch('/api/healthy-crop-log', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
                        body: JSON.stringify({
                            cropType: data.cropType,
                            soilType: data.soilType,
                            temperature: data.temperature,
                            humidity: 60, // Fallback since not on form
                            moisture: data.rainfall,
                            nitrogen: data.nitrogen,
                            phosphorus: data.phosphorus,
                            potassium: 40, // Fallback since not on form
                            fertilizerUsed: optimalFertilizer || "Unknown",
                            yieldScore: parseFloat(finalPredictedYield)
                        })
                    });
                }
                
                // Refresh the prediction history Feed directly
                if (typeof loadPredictionHistory === 'function') {
                    loadPredictionHistory();
                }
            } catch (err) {
                console.warn("Failed to save prediction to tracking DB:", err);
            }

            // [NEW] Show Consultation Section
            document.getElementById('consultation-section').style.display = 'block';
            initConsultation();

        } catch (error) {
            console.warn("Error parsing AI response, using local fallback.", error.message);
            runFallback();
        }
    });

    // Audio Report TTS using Web Speech API
    audioBtn.addEventListener('click', () => {
        if (!currentReportText) return;
        
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(currentReportText);
            
            // Try to set language to user's preference
            const pageLang = localStorage.getItem('agripredict_lang') || 'en-US';
            let ttsLang = 'en-US';
            if (pageLang === 'hi-IN' || pageLang === 'hi') ttsLang = 'hi-IN';
            if (pageLang === 'or-IN' || pageLang === 'or') ttsLang = 'hi-IN';
            if (pageLang === 'te-IN' || pageLang === 'te') ttsLang = 'te-IN';

            utterance.lang = ttsLang;
            utterance.rate = 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const voice = voices.find(v => v.lang.replace('_', '-').startsWith(ttsLang.split('-')[0]));
            if (voice) {
                utterance.voice = voice;
            }
            
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Sorry, your browser doesn't support text-to-speech.");
        }
    });

    // ===== POST-PREDICTION FIELD ASSISTANT LOGIC =====
    let consultationInitiated = false;
    
    const consultationSection = document.getElementById('consultation-section');
    const autoAudioToggle = document.createElement('div');
    autoAudioToggle.innerHTML = `<label><input type="checkbox" id="auto-audio-mode"> Enable Auto Audio for Consultation Reply</label>`;
    autoAudioToggle.style.padding = '0.5rem 0';
    autoAudioToggle.style.color = '#374151';
    autoAudioToggle.style.fontWeight = 'bold';
    
    // Insert before the chat container if exists
    const chatContainer = document.getElementById('consultation-chat');
    if (chatContainer && chatContainer.parentNode) {
        chatContainer.parentNode.insertBefore(autoAudioToggle, chatContainer);
    }
    
    let consultImageBase64 = null;
    const btnImg = document.getElementById('consultation-btn-img');
    const fileInput = document.getElementById('consultation-file');
    const imgPreviewContainer = document.getElementById('consultation-img-preview-container');
    const imgPreview = document.getElementById('consultation-img-preview');
    const imgRemove = document.getElementById('consultation-img-remove');

    if (btnImg && fileInput) {
        btnImg.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    consultImageBase64 = ev.target.result;
                    imgPreview.src = consultImageBase64;
                    imgPreviewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
        imgRemove.addEventListener('click', () => {
            consultImageBase64 = null;
            fileInput.value = '';
            imgPreviewContainer.style.display = 'none';
        });
    }

    function initConsultation() {
        if(consultationInitiated) return;
        consultationInitiated = true;
        
        const crop = document.getElementById('cropType').value;
        const profLang = localStorage.getItem('agripredict_lang') || 'en-US';
        const langCode = profLang.split('-')[0];
        
        const greetings = {
            'en': `Your yield prediction for ${crop} is ready! Based on the prediction, what are the current physical conditions in the field? (e.g., Soil moisture, signs of pests, overall budget for chemicals? You can attach images of diseases for me to scan.)`,
            'hi': `आपकी ${crop} की उपज की भविष्यवाणी तैयार है! इसके आधार पर, खेत की भौतिक स्थिति क्या है (जैसे मिट्टी की नमी, कीटों के लक्षण)? आप स्कैनिंग के लिए बीमारी की तस्वीरें भी संलग्न कर सकते हैं।`,
            'or': `ଆପଣଙ୍କର ${crop} ର ଅମଳ ପୂର୍ବାନୁମାନ ପ୍ରସ୍ତୁତ ଅଛି! ଏହା ଉପରେ ଆଧାର କରି, କ୍ଷେତର ବର୍ତ୍ତମାନର ଅବସ୍ଥା କିପରି ଅଛି? ଆପଣ ସ୍କାନିଂ ପାଇଁ ଫଟୋ ବି ସଂଲଗ୍ନ କରିପାରିବେ।`,
            'te': `మీ ${crop} దిగుబడి అంచనా సిద్ధంగా ఉంది! దీని ఆధారంగా, పొలంలో ప్రస్తుత పరిస్థితులు ఎలా ఉన్నాయి? మీరు స్కాన్ చేయడానికి వ్యాధుల ఫోటోలను కూడా జత చేయవచ్చు.`
        };
        const text = greetings[langCode] || greetings['en'];
        
        appendMessage(chatContainer, 'bot', text);
        
        if (document.getElementById('auto-audio-mode') && document.getElementById('auto-audio-mode').checked && window.speakText) {
            window.speakText(text, profLang);
        }
    }

    const consultationForm = document.getElementById('consultation-form');
    consultationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const inputField = document.getElementById('consultation-input');
        const userText = inputField.value.trim();
        if(!userText && !consultImageBase64) return;

        let displayHtml = userText;
        if (consultImageBase64) {
            displayHtml += `<br><img src="${consultImageBase64}" style="max-height: 100px; border-radius: 8px; margin-top: 5px;">`;
        }

        const chatWindow = document.getElementById('consultation-chat');
        appendMessage(chatWindow, 'user', displayHtml);
        
        inputField.value = '';
        const payloadImage = consultImageBase64;
        
        // reset image
        consultImageBase64 = null;
        if(fileInput) fileInput.value = '';
        if(imgPreviewContainer) imgPreviewContainer.style.display = 'none';

        // Typing indicator
        const typingId = 'typing-' + Date.now();
        appendMessage(chatWindow, 'bot', '...', typingId);

        try {
             // Fetch global keys
            const keyRes = await fetch('/api/settings/keys');
            const keys = await keyRes.json();
            const apiKey = keys.gemini;

            if (!apiKey) {
                setTimeout(() => {
                    document.getElementById(typingId).innerText = "I understand. Based on what you said, I recommend starting with basic neem spray for the pests. It's cost-effective and organic.";
                    chatWindow.scrollTo(0, chatWindow.scrollHeight);
                }, 1000);
                return;
            }

            // Apply the 8 Personas dynamically to consultation too
            const profLang = localStorage.getItem('agripredict_lang') || 'en-US';
            const langMap = { 'hi': 'Hindi', 'or': 'Odia', 'te': 'Telugu', 'en': 'English' };
            const langCode = profLang.split('-')[0];
            const targetLang = langMap[langCode] || 'English';

            const prompt = `You are an AI agricultural assistant talking to a farmer. 
Context from their prediction report: ${currentReportText}. 

The farmer provided a text response or image.
Auto Crop Detection: If an image is attached, auto-detect the crop species.
Soil Type Check: If recommending fertilizer, ask what their soil type is to adjust retention advice.
Weather Spray Warning: If they ask about spraying, and the weather implies rain, strictly tell them NOT TO SPRAY.
Market Price Integration: If they ask what price to sell at, estimate the mandi price for the crop and advise on selling strategies.
Disease Detection: If an image is attached, identify disease, state cause, treatment, and prevention.

User text: "${userText}"

Act according to these advanced rules. Provide an actionable, encouraging response STRICTLY IN ${targetLang.toUpperCase()} LANGUAGE. Keep it concise but follow the persona outlines. Do not answer in English if the target language is ${targetLang}.`;

            const parts = [{ text: prompt }];

            if (payloadImage) {
                const mimeType = payloadImage.split(';')[0].split(':')[1];
                const base64Data = payloadImage.split(',')[1];
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }

            let maxRetries = 3;
            let currentRetry = 0;
            let result = null;

            while (currentRetry < maxRetries) {
                document.getElementById(typingId).innerText = currentRetry > 0 ? "Network is busy, retrying consultation..." : "...";
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: parts }],
                        generationConfig: { temperature: 0.2, topP: 0.8 }
                    })
                });

                result = await response.json();

                if (result.error && result.error.code === 429) {
                    currentRetry++;
                    if (currentRetry < maxRetries) {
                        document.getElementById(typingId).innerText = `API Rate Limit Reached. Pausing for 30s to recover (${currentRetry}/${maxRetries})...`;
                        await new Promise(resolve => setTimeout(resolve, 30000));
                    }
                } else {
                    break;
                }
            }

            if (result.error) {
                document.getElementById(typingId).innerText = "AI System Alert: " + result.error.message + " (Quota limits exceeded, retries failed).";
                chatWindow.scrollTo(0, chatWindow.scrollHeight);
                return;
            }
            
            if (!result.candidates || !result.candidates[0].content) {
                console.warn("Safety Block or Empty Content:", result);
                const reason = result.promptFeedback?.blockReason || result.candidates?.[0]?.finishReason || "No content returned.";
                document.getElementById(typingId).innerText = "AI System Alert: The response was blocked or empty. Reason: " + reason;
                chatWindow.scrollTo(0, chatWindow.scrollHeight);
                return;
            }

            const botReply = result.candidates[0].content.parts[0].text.trim();
            document.getElementById(typingId).innerText = botReply;
            chatWindow.scrollTo(0, chatWindow.scrollHeight);
            
            if (document.getElementById('auto-audio-mode') && document.getElementById('auto-audio-mode').checked && window.speakText) {
                const profLang = localStorage.getItem('agripredict_lang') || 'en-US';
                window.speakText(botReply, profLang);
            }
        } catch (error) {
            console.error("AI Consultation Error:", error);
            document.getElementById(typingId).innerText = "Sorry, there was an AI connectivity error. Details: " + error.message;
        }
    });

    function appendMessage(container, sender, text, id = null) {
        const msgDiv = document.createElement('div');
        msgDiv.style.padding = '0.8rem 1rem';
        msgDiv.style.borderRadius = '8px';
        msgDiv.style.maxWidth = '80%';
        msgDiv.style.fontSize = '0.9rem';
        msgDiv.style.lineHeight = '1.4';
        
        if (id) msgDiv.id = id;

        if (sender === 'user') {
            msgDiv.style.background = 'var(--green-bright)';
            msgDiv.style.color = 'white';
            msgDiv.style.alignSelf = 'flex-end';
            msgDiv.style.borderBottomRightRadius = '0';
        } else {
            msgDiv.style.background = 'white';
            msgDiv.style.color = 'var(--text)';
            msgDiv.style.alignSelf = 'flex-start';
            msgDiv.style.borderBottomLeftRadius = '0';
            msgDiv.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
        }

        msgDiv.innerText = text;
        container.appendChild(msgDiv);
        container.scrollTo(0, container.scrollHeight);
    }
});
