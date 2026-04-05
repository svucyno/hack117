const pmfby = {
    state: {
        statusData: null,
        currentLang: 'en'
    },
    
    async init() {
        try {
            const res = await fetch('/api/insurance/status');
            this.state.statusData = await res.json();
            this.renderStatus();
            this.switchLanguage(this.state.currentLang);
        } catch (e) {
            console.error("Failed to load PMFBY module", e);
        }
    },

    renderStatus() {
        const d = this.state.statusData;
        if (!d) return;
        const panel = document.getElementById('pmfby-status-panel');
        const regEl = document.getElementById('pmfby-reg-status');
        const riskEl = document.getElementById('pmfby-risk-level');
        const alertBanner = document.getElementById('pmfby-alert-banner');

        // Registration String
        regEl.innerText = d.insuranceStatus === 'registered' ? "Registered" : "Not Registered";

        // Risk Level Styling
        if (d.riskLevel === 'high') {
            panel.style.borderLeftColor = '#DC2626'; // Red
            riskEl.innerText = "High Risk";
            riskEl.style.color = '#DC2626';
            alertBanner.style.display = 'flex';
        } else if (d.riskLevel === 'medium') {
            panel.style.borderLeftColor = '#F59E0B'; // Yellow
            riskEl.innerText = "Medium Risk";
            riskEl.style.color = '#F59E0B';
            alertBanner.style.display = 'none';
        } else {
            panel.style.borderLeftColor = '#10B981'; // Green
            riskEl.innerText = "Low Risk";
            riskEl.style.color = '#10B981';
            alertBanner.style.display = 'none';
        }
    },

    switchLanguage(langCode) {
        this.state.currentLang = langCode;
        const d = this.state.statusData;
        if (!d) return;
        
        // Switch Video Source
        const frame = document.getElementById('pmfby-video-frame');
        if(langCode === 'en' && d.videos.english) frame.src = d.videos.english;
        if(langCode === 'hi' && d.videos.hindi) frame.src = d.videos.hindi;
        if(langCode === 'te' && d.videos.telugu) frame.src = d.videos.telugu;
        if(langCode === 'or') frame.src = d.videos.odia || d.videos.hindi; 
        
        // Localized Static Labels Dictionary implementation
        this.updateStaticLabels(langCode);
    },

    async askAI(questionScope) {
        const box = document.getElementById('pmfby-ai-response');
        box.innerHTML = '<div class="spinner" style="width:20px; height:20px; border:2px solid #ccc; border-top-color:#1B4332; border-radius:50%; animation:spin 1s linear infinite; display: inline-block; vertical-align: middle;"></div> <span style="vertical-align: middle;">Analyzing...</span>';
        
        // Convert local drop-down lang-code to chat language parameter
        let chatLang = 'en';
        if (this.state.currentLang === 'hi') chatLang = 'hi';
        if (this.state.currentLang === 'te') chatLang = 'te';
        if (this.state.currentLang === 'or') chatLang = 'or';

        try {
            // Note: Reuse chat API functionality. The prompt logic in routes.ts is already tuned for PMFBY when asking these questions
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-local-dev-user': '1' // auth bypass for dev if needed
                },
                body: JSON.stringify({ 
                    question: questionScope, 
                    language: chatLang
                    // In a more complex integration, we could pass a strict context flag here
                })
            });
            const data = await res.json();
            // Parse text cleanly
            let reply = data.answer || "I'm unable to process that request right now.";
            reply = reply.replace(/```html/g, '').replace(/```/g, '');
            
            // Note: In the design doc I mentioned parsing the [VIDEO] tags. Since we have a dedicated iframe in this module UI, 
            // we can strip the [VIDEO...] tags from the AI response here so they don't double render as broken text.
            reply = reply.replace(/\[VIDEO:(https?:\/\/[^\s\]]+)\]/g, "");

            box.innerHTML = reply;
        } catch (e) {
            console.error("AI Assistant error:", e);
            box.innerText = "Connection failed. Please retrieve information later.";
        }
    },

    updateStaticLabels(lang) {
        // Simple mapping based on selected language
        const map = {
            'en': { risk: 'Current Farm Risk Level', reg: 'Registration Status', ai: '🤖 Insurance Helper Agent' },
            'hi': { risk: 'वर्तमान खेत जोखिम स्तर', reg: 'पंजीकरण स्थिति', ai: '🤖 बीमा सहायक एजेंट' },
            'te': { risk: 'ప్రస్తుత వ్యవసాయ ప్రమాద స్థాయి', reg: 'నమోదు స్థితి', ai: '🤖 బీమా సహాయక ఏజెంట్' },
            'or': { risk: 'ବର୍ତ୍ତମାନର ଚାଷ ବିପଦ ସ୍ତର', reg: 'ପଞ୍ଜୀକରଣ ସ୍ଥିତି', ai: '🤖 ବୀମା ସହାୟକ ଏଜେଣ୍ଟ' }
        };
        const dict = map[lang] || map['en'];
        
        const elRisk = document.getElementById('lbl-risk-lvl');
        const elReg = document.getElementById('lbl-reg-status');
        const elAi = document.getElementById('lbl-ai-helper');
        
        if(elRisk) elRisk.innerText = dict.risk;
        if(elReg) elReg.innerText = dict.reg;
        if(elAi) elAi.innerText = dict.ai;
    }
};

// Initialize on load if dashboard is visible
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pmfby-insurance-module')) {
        pmfby.init();
    }
});
