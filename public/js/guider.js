document.addEventListener('DOMContentLoaded', () => {
    // Welcome Greeting
    const userStr = localStorage.getItem('agri_current_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            const heading = document.getElementById('welcome-heading');
            if (heading && user.name) {
                heading.innerText = `Welcome Guider, ${user.name.split(' ')[0]}!`;
            }
        } catch(e) {}
    }

    const feedContainer = document.getElementById('guider-feed-container');
    const refreshBtn = document.getElementById('refresh-feed-btn');

    async function loadFeed() {
        if(!feedContainer) return;
        
        feedContainer.innerHTML = '<div style="text-align:center; padding: 2rem; opacity:0.6; font-style:italic;">Loading farmer problems...</div>';
        try {
            const userStr = localStorage.getItem('agri_current_user');
            const userId = userStr ? JSON.parse(userStr).id : '';

            // This hits the GET /api/problems which returns ALL problems for the guider
            const res = await fetch('/api/problems', {
                headers: { 'x-user-id': userId }
            });

            if (res.ok) {
                const problems = await res.json();
                renderFeed(problems);
            } else {
                feedContainer.innerHTML = '<div style="color:#DC2626;">Error loading feed.</div>';
            }
        } catch (err) {
            feedContainer.innerHTML = '<div style="color:#DC2626;">Could not connect to server.</div>';
        }
    }

    function renderFeed(problems) {
        feedContainer.innerHTML = '';
        if (problems.length === 0) {
            feedContainer.innerHTML = '<div style="opacity:0.6;">No problems reported yet.</div>';
            return;
        }

        problems.forEach(p => {
            const wrap = document.createElement('div');
            wrap.className = `problem-card ${p.status === 'solved' ? 'solved' : ''}`;
            
            const badgeLabel = p.status === 'solved' ? '✅ Solved' : '⏳ Awaiting Solution';
            const badgeBg = p.status === 'solved' ? 'var(--green-mid)' : 'var(--accent)';
            const badgeColor = p.status === 'solved' ? 'white' : '#453000';

            let audioHtml = '';
            if (p.audioUrl) {
                audioHtml = `
                    <div style="margin-top: 1rem;">
                        <strong>Farmer Audio:</strong><br>
                        <audio src="${p.audioUrl}" controls style="width: 100%; height: 35px;"></audio>
                    </div>
                `;
            }

            // Solution input UI (only if open, for MVP)
            let solutionFormHtml = '';
            if (p.status === 'open') {
                solutionFormHtml = `
                    <div class="solution-section">
                        <h4 style="margin-bottom: 0.5rem; color: var(--primary);">Provide a Solution</h4>
                        <form class="solution-form" data-problem-id="${p.id}">
                            <textarea class="form-control" rows="3" placeholder="Write your recommended solution here..." required></textarea>
                            <button type="submit" class="btn btn-primary">Submit Solution</button>
                            <div class="sol-status" style="font-size:0.8rem; display:none; margin-top:0.5rem;"></div>
                        </form>
                    </div>
                `;
            } else {
                // If solved, let's fetch its solution (Optional MVP polish)
                solutionFormHtml = `
                    <div class="solution-section">
                        <button class="btn btn-outline" style="font-size:0.8rem;" onclick="loadSolutions('${p.id}', this)">Show Provided Solutions</button>
                        <div class="solutions-display"></div>
                    </div>
                `;
            }

            wrap.innerHTML = `
                <div class="problem-header">
                    <h3 class="problem-title">${p.title}</h3>
                    <span style="background:${badgeBg}; color:${badgeColor}; padding:4px 12px; border-radius:99px; font-size:0.8rem; font-weight:600;">${badgeLabel}</span>
                </div>
                <div style="font-size: 0.95rem; color: #475569;">
                    <strong>Description:</strong> ${p.description}
                </div>
                ${audioHtml}
                ${solutionFormHtml}
            `;
            feedContainer.appendChild(wrap);
        });

        // Attach event listeners to solution forms
        document.querySelectorAll('.solution-form').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const problemId = form.getAttribute('data-problem-id');
                const textInput = form.querySelector('textarea');
                const submitBtn = form.querySelector('button');
                const statusDiv = form.querySelector('.sol-status');

                submitBtn.disabled = true;
                submitBtn.innerText = 'Submitting...';

                try {
                    const userStr = localStorage.getItem('agri_current_user');
                    const guiderId = userStr ? JSON.parse(userStr).id : '';

                    const res = await fetch(`/api/problems/${problemId}/solutions`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-user-id': guiderId
                        },
                        body: JSON.stringify({
                            solutionText: textInput.value,
                            audioUrl: null // Out of scope MVP
                        })
                    });

                    if (res.ok) {
                        statusDiv.innerText = '✅ Solution submitted successfully!';
                        statusDiv.style.color = 'green';
                        statusDiv.style.display = 'block';
                        setTimeout(() => loadFeed(), 1500); // Reload feed
                    } else {
                        throw new Error('Failed');
                    }
                } catch(e) {
                    statusDiv.innerText = '❌ Failed to submit.';
                    statusDiv.style.color = 'red';
                    statusDiv.style.display = 'block';
                    submitBtn.disabled = false;
                    submitBtn.innerText = 'Submit Solution';
                }
            });
        });
    }

    if(refreshBtn) refreshBtn.addEventListener('click', loadFeed);

    loadFeed();
});

// Helper to expand and load solutions for already solved problems
window.loadSolutions = async function(problemId, btnElement) {
    const displayDiv = btnElement.nextElementSibling;
    btnElement.innerText = "Loading...";
    
    try {
        const userStr = localStorage.getItem('agri_current_user');
        const userId = userStr ? JSON.parse(userStr).id : '';
        const res = await fetch(`/api/problems/${problemId}/solutions`, {
            headers: { 'x-user-id': userId }
        });
        
        if (res.ok) {
            const solutions = await res.json();
            btnElement.style.display = 'none'; // Hide button after load
            
            if (solutions.length === 0) {
                displayDiv.innerHTML = '<p style="font-size:0.8rem; color:gray;">No solutions found.</p>';
            } else {
                let html = '<h5 style="margin-top:0.5rem; margin-bottom:0.5rem;">Guider Answers:</h5>';
                solutions.forEach(sol => {
                    html += `<div style="background: rgba(255,255,255,0.6); padding: 0.8rem; margin-bottom: 0.5rem; border-radius: 4px; border-left: 3px solid var(--primary); font-size: 0.9rem;">${sol.solutionText}</div>`;
                });
                displayDiv.innerHTML = html;
            }
        }
    } catch(e) {
        btnElement.innerText = "Error Loading. Try Again.";
    }
};
