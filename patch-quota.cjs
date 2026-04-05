const fs = require('fs');

async function fixQuotaErrors() {
    // 1. CHAT-BOT BACKEND ROUTES
    let routes = fs.readFileSync('server/routes.ts', 'utf8');

    const oldGeminiCheck = `            const resJson = await response.json();
            if (resJson.candidates && resJson.candidates.length > 0) {
              answer = resJson.candidates[0].content?.parts?.[0]?.text || null;
              if (answer) usedGemini = true;
            }`;

    const newGeminiCheck = `            const resJson = await response.json();
            if (resJson.error) {
               console.warn("Gemini Quota/Error:", resJson.error.message);
               answer = "Gemini API Alert: " + resJson.error.message + " (You have likely hit the free tier rate limit. Please wait 1 minute and try again.)";
               usedGemini = true; // Skip local DB
            } else if (resJson.candidates && resJson.candidates.length > 0) {
              answer = resJson.candidates[0].content?.parts?.[0]?.text || null;
              if (answer) usedGemini = true;
            }`;

    routes = routes.replace(oldGeminiCheck, newGeminiCheck);
    fs.writeFileSync('server/routes.ts', routes);

    // 2. PREDICTION MAIN PARSE
    let pred = fs.readFileSync('public/js/prediction.js', 'utf8');

    const oldPredParse = `            const result = await response.json();

            if (result.error) {
                console.warn("Gemini API failed, using local fallback. Error:", result.error.message);
                runFallback();
                return;
            }`;

    const newPredParse = `            const result = await response.json();

            if (result.error) {
                console.warn("Gemini API failed, using local fallback. Error:", result.error.message);
                alert("AI Quota Limit Reached: " + result.error.message + "\\n\\nPlease wait 1 minute before running another prediction.");
                runFallback();
                return;
            }`;
    pred = pred.replace(oldPredParse, newPredParse);

    // 3. PREDICTION CONSULTATION PARSE
    const oldConsultParse = `            const result = await response.json();
            const botReply = result.candidates[0].content.parts[0].text.trim();
            document.getElementById(typingId).innerText = botReply;`;

    const newConsultParse = `            const result = await response.json();
            if (result.error) {
                document.getElementById(typingId).innerText = "AI System Alert: " + result.error.message + " (Please wait 1 minute and try again)";
                chatWindow.scrollTo(0, chatWindow.scrollHeight);
                return;
            }
            const botReply = result.candidates[0].content.parts[0].text.trim();
            document.getElementById(typingId).innerText = botReply;`;
    
    pred = pred.replace(oldConsultParse, newConsultParse);
    fs.writeFileSync('public/js/prediction.js', pred);
}

fixQuotaErrors().then(() => console.log('Fixed API Error Handling')).catch(console.error);
