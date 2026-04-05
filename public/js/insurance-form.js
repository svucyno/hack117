document.addEventListener('DOMContentLoaded', () => {
    fetchStatus();
    checkReturningUser();

    const form = document.getElementById('pmfby-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const payload = {
                name: document.getElementById('pm_name').value,
                mobile: document.getElementById('pm_mobile').value,
                state: document.getElementById('pm_state').value,
                district: document.getElementById('pm_district').value,
                cropType: document.getElementById('pm_crop').value,
                season: document.getElementById('pm_season').value,
                bankDetails: document.getElementById('pm_bank').value || ''
            };

            const btn = form.querySelector('button');
            const origText = btn.innerText;
            btn.innerText = "Analyzing Eligibility...";
            btn.disabled = true;

            try {
                // Post to our backend
                const res = await fetch('/api/insurance/apply', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await res.json();
                
                if (data.eligible) {
                    // Show ✅ You are eligible
                    form.style.display = 'none';
                    document.getElementById('form-success-msg').style.display = 'flex';
                    
                    // Smart UX: Show popup before redirect
                    setTimeout(() => {
                        document.getElementById('ux-redirect-modal').style.display = 'flex';
                    }, 1500);
                } else {
                    if (data.message) {
                        alert("Application Failed: " + data.message);
                    } else {
                        alert("Submission failed. Provide valid details.");
                    }
                    btn.disabled = false;
                    btn.innerText = origText;
                }
                
                fetchStatus(); // Refresh status panel
            } catch (err) {
                console.error("Apply error:", err);
                btn.disabled = false;
                btn.innerText = origText;
            }
        });
    }
    
    // Add visibility listener to trigger tracking question when user comes back
    document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === 'visible') {
            checkReturningUser();
        }
    });
});

async function fetchStatus() {
    try {
        const res = await fetch('/api/insurance/status');
        const data = await res.json();
        
        const badge = document.getElementById('app-status-badge');
        if (badge) {
            if (data.insuranceStatus === 'completed') {
                badge.innerText = '✅ Registered';
                badge.style.color = '#10B981';
            } else if (data.insuranceStatus === 'pending') {
                badge.innerText = '⏳ Pending (Action Required)';
                badge.style.color = '#F59E0B';
            } else {
                badge.innerText = '❌ Not Registered';
                badge.style.color = '#6B7280';
            }
        }
    } catch (e) {
        console.error("Status fetch error", e);
    }
}

function executeRedirect() {
    document.getElementById('ux-redirect-modal').style.display = 'none';
    
    // Flag to check when user returns
    sessionStorage.setItem('pmfby_redirected', 'true');
    
    // Redirect officially
    window.open('https://pmfby.gov.in', '_blank');
}

function checkReturningUser() {
    const wasRedirected = sessionStorage.getItem('pmfby_redirected');
    if (wasRedirected === 'true') {
        const trackerModal = document.getElementById('ux-tracker-modal');
        if (trackerModal) {
            trackerModal.style.display = 'flex';
        }
    }
}

async function confirmRegistration(status) {
    // UI Update immediately
    document.getElementById('ux-tracker-modal').style.display = 'none';
    sessionStorage.removeItem('pmfby_redirected');
    
    try {
        await fetch('/api/insurance/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }) // 'completed' or 'pending'
        });
        fetchStatus();
    } catch(e) {
        console.error(e);
    }
}

async function askAIPmfby(q) {
    const box = document.getElementById('ai-response-box');
    box.innerHTML = '<div class="spinner" style="width:20px; height:20px; border:2px solid #ccc; border-top-color:#1B4332; border-radius:50%; animation:spin 1s linear infinite; display: inline-block; vertical-align: middle;"></div> <span style="vertical-align: middle;">Analyzing...</span>';
    
    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: q, language: "en" })
        });
        const data = await res.json();
        
        let reply = data.answer || "I'm unable to process that request right now.";
        reply = reply.replace(/```html/g, '').replace(/```/g, '');
        // We strip rendering videos here because we already show the video on the right natively
        reply = reply.replace(/\[VIDEO:(https?:\/\/[^\s\]]+)\]/g, "");
        
        box.innerHTML = reply.replace(/\n/g, '<br>');
    } catch(e) {
        box.innerText = "Connection failed.";
    }
}
