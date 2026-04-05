const fs = require('fs');
async function test() {
    try {
        const keys = JSON.parse(fs.readFileSync('api-keys.json', 'utf8'));
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keys.gemini}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: 'Hello' }] }],
                generationConfig: {
                    temperature: 0.2,
                    topP: 0.8
                }
            })
        });
        const data = await res.json();
        console.log("RESPONSE:", JSON.stringify(data, null, 2));
    } catch(e) {
        console.error("ERROR:", e);
    }
}
test();
