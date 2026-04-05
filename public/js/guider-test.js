document.addEventListener('DOMContentLoaded', () => {
    const apiKeyWarning = document.getElementById('api-key-warning');
    const loader = document.getElementById('loader');
    const examForm = document.getElementById('exam-form');
    const questionsContainer = document.getElementById('questions-container');
    const submitBtn = document.getElementById('submit-exam-btn');
    const resultsPanel = document.getElementById('results-panel');
    
    const resultTitle = document.getElementById('result-title');
    const resultScore = document.getElementById('result-score');
    const resultDesc = document.getElementById('result-desc');
    const continueBtn = document.getElementById('continue-btn');
    const retryBtn = document.getElementById('retry-btn');

    let currentQuestions = [];
    const PASSING_SCORE = 80;

    // Fallback questions incase no API key
    const fallbackQuestions = [
        {
            id: 1,
            question: "Which of the following is considered the ideal NPK ratio for general crop growth?",
            options: ["10:10:10", "4:2:1", "1:2:4", "20:5:5"],
            answerIndex: 1
        },
        {
            id: 2,
            question: "What is the primary sign of Nitrogen deficiency in plants?",
            options: ["Purple leaves", "Yellowing of older leaves (Chlorosis)", "Curled leaf edges", "White powdery mildew on stems"],
            answerIndex: 1
        },
        {
            id: 3,
            question: "Which irrigation method is generally the most water-efficient?",
            options: ["Flood irrigation", "Sprinkler irrigation", "Drip irrigation", "Furrow irrigation"],
            answerIndex: 2
        },
        {
            id: 4,
            question: "What does soil pH primarily affect?",
            options: ["The color of the soil", "The availability of nutrients to plant roots", "The temperature of the soil", "The number of earthworms"],
            answerIndex: 1
        },
        {
            id: 5,
            question: "Which of these is a common organic method for pest control?",
            options: ["Applying Glyphosate", "Using Neem Oil extract", "Tilling the soil deeply", "Applying synthetic Urea"],
            answerIndex: 1
        }
    ];

    async function initTest() {
        let apiKey = '';
        try {
            // Fetch globally configured keys
            const keyRes = await fetch('/api/settings/keys');
            const keys = await keyRes.json();
            apiKey = keys.gemini;
        } catch (e) {
            console.error("Could not fetch global settings block", e);
        }

        if (!apiKey || apiKey.length < 5) {
            apiKeyWarning.style.display = 'block';
            console.log("No valid API Key found. Using fallback questions.");
            renderQuestions(fallbackQuestions);
            return;
        }

        try {
            loader.style.display = 'block';
            
            const prompt = `You are an Agricultural Science Examiner. Generate 5 multiple choice questions (MCQs) for an exam certifying an Agricultural "Guider". The test should evaluate knowledge in:
1. Crop Management
2. Soil Health & Fertilizers
3. Irrigation Techniques
4. Pest & Disease Control

Provide the response as a pure JSON array containing 5 objects. Each object must have:
"question": text,
"options": array of 4 string options,
"answerIndex": integer (0-3) representing the index of the correct option in the options array.
No markdown around the JSON. Keep it concise.`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            const result = await response.json();
            
            if (result.error) {
                console.warn("Gemini API error, fallback to static test:", result.error.message);
                renderQuestions(fallbackQuestions);
                return;
            }

            if (!result.candidates || result.candidates.length === 0) {
                console.warn("Gemini returned zero candidates (possible safety block)");
                renderQuestions(fallbackQuestions);
                return;
            }

            let aiContent = result.candidates[0].content?.parts?.[0]?.text;
            if (!aiContent) throw new Error("Could not parse AI content");
            
            aiContent = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const aiQuestions = JSON.parse(aiContent);
            
            // Map AI questions to our format with IDs
            const mappedQuestions = aiQuestions.map((q, i) => ({
                id: i + 1,
                question: q.question,
                options: q.options,
                answerIndex: q.answerIndex
            }));

            renderQuestions(mappedQuestions);

        } catch (error) {
            console.error("Failed to generate AI questions:", error);
            renderQuestions(fallbackQuestions);
        }
    }

    function renderQuestions(questions) {
        loader.style.display = 'none';
        examForm.style.display = 'block';
        currentQuestions = questions;
        questionsContainer.innerHTML = '';

        questions.forEach((q, index) => {
            const wrap = document.createElement('div');
            wrap.className = 'question-card fade-in';
            wrap.style.animationDelay = `${index * 0.1}s`;

            let optionsHtml = '';
            q.options.forEach((opt, optIdx) => {
                optionsHtml += `
                    <label class="option-label">
                        <input type="radio" name="q${q.id}" value="${optIdx}" required>
                        <span>${opt}</span>
                    </label>
                `;
            });

            wrap.innerHTML = `
                <div class="question-title">Question ${index + 1}: ${q.question}</div>
                <div class="options-grid">
                    ${optionsHtml}
                </div>
            `;
            questionsContainer.appendChild(wrap);
        });
    }

    examForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        submitBtn.disabled = true;
        submitBtn.innerText = 'Scoring Exam...';

        let score = 0;
        currentQuestions.forEach(q => {
            const selectedOpt = document.querySelector(`input[name="q${q.id}"]:checked`);
            if (selectedOpt && parseInt(selectedOpt.value) === q.answerIndex) {
                score++;
            }
        });

        const percentage = Math.round((score / currentQuestions.length) * 100);
        
        examForm.style.display = 'none';
        resultsPanel.style.display = 'block';

        const userStr = localStorage.getItem('agri_current_user');
        const userId = userStr ? JSON.parse(userStr).id : null;

        if (percentage >= PASSING_SCORE) {
            resultTitle.innerText = '🎉 Congratulations!';
            resultTitle.style.color = 'var(--primary)';
            resultScore.innerText = `You scored ${percentage}% (Passed)`;
            resultScore.style.color = 'var(--primary)';
            resultDesc.innerText = 'You have successfully passed the Agricultural Science Certification Test. You have demonstrated the necessary knowledge to help guide farmers and solve their issues.';
            
            continueBtn.style.display = 'block';
            
            // Mark the user as passed in backend
            try {
                if(userId) {
                    await fetch('/api/auth/pass-test', {
                        method: 'POST',
                        headers: { 'x-user-id': userId }
                    });
                }
            } catch(e) {
                console.error("Failed to save test result", e);
            }
            
        } else {
            resultTitle.innerText = '❌ Certification Failed';
            resultTitle.style.color = '#EF4444';
            resultScore.innerText = `You scored ${percentage}% (Need ${PASSING_SCORE}% to pass)`;
            resultScore.style.color = '#EF4444';
            resultDesc.innerText = 'Unfortunately, you did not meet the required score to become a Guider. Please review agricultural best practices regarding Crop Management, Soil Health, and Pest Control, then try again.';
            
            retryBtn.style.display = 'block';
        }
    });

    continueBtn.addEventListener('click', () => {
        window.location.href = '/guider.html';
    });

    // Start the generation process
    initTest();
});
