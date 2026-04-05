document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('agri_current_user');
    if (!userStr) return window.location.replace('/login.html');
    
    const user = JSON.parse(userStr);
    
    // Inject correct sidebar links based on role
    const sidebar = document.getElementById('dynamic-sidebar');
    if (user.role === 'admin') {
        sidebar.innerHTML = `
            <a href="/admin.html">👑 Overview</a>
            <a href="/profile.html" class="active">👤 Profile Settings</a>
            <div style="flex:1"></div>
            <a href="#" onclick="logout(); return false;" style="color:var(--muted)">🚪 Logout</a>
        `;
    } else if (user.role === 'guider') {
        sidebar.innerHTML = `
            <a href="/guider.html">👨‍🌾 Farmer Issues</a>
            <a href="/guider-test.html">📝 View Certification</a>
            <a href="/profile.html" class="active">👤 Profile Settings</a>
            <div style="flex:1"></div>
            <a href="#" onclick="logout(); return false;" style="color:var(--muted)">🚪 Logout</a>
        `;
    } else {
        sidebar.innerHTML = `
            <a href="/dashboard.html">📊 Dashboard</a>
            <a href="/prediction.html">🌱 AI Crop Prediction</a>
            <a href="/map.html">📍 Live GPS Tracker</a>
            <a href="/soil-testing.html">🧪 Soil Testing</a>
            <a href="/profile.html" class="active">👤 Profile Settings</a>
            <div style="flex:1"></div>
            <a href="#" onclick="logout(); return false;" style="color:var(--muted)">🚪 Logout</a>
        `;
    }

    // Populate Identity
    document.getElementById('prof-name').innerText = user.name;
    document.getElementById('prof-role').innerText = user.role;
    if (user.name) document.getElementById('prof-avatar').innerText = user.name.charAt(0).toUpperCase();
    document.getElementById('prof-email').value = user.email;

    // Load Settings
    const langInput = document.getElementById('prof-lang');
    langInput.value = localStorage.getItem('agripredict_lang') || 'en';

    const themeInput = document.getElementById('prof-theme');
    themeInput.value = localStorage.getItem('agripredict_theme') || 'light';

    // Save Settings
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const oldLang = localStorage.getItem('agripredict_lang');
        localStorage.setItem('agripredict_lang', langInput.value);
        localStorage.setItem('agripredict_theme', themeInput.value);
        
        // Apply instantly with animations
        document.documentElement.setAttribute('data-theme', themeInput.value);
        
        const status = document.getElementById('prof-status');
        status.style.display = 'inline';
        
        if (oldLang !== langInput.value) {
            setTimeout(() => window.location.reload(), 500);
        } else {
            setTimeout(() => status.style.display = 'none', 3000);
        }
    });

    // Fetch Profile Stats
    const fetchStats = async () => {
        try {
            const res = await fetch('/api/auth/profile-stats', {
                headers: { 'x-user-id': user.id }
            });
            if (res.ok) {
                const stats = await res.json();
                
                if (user.role === 'farmer') {
                    document.getElementById('stat-1-label').innerText = 'Problems Posted';
                    document.getElementById('stat-1-val').innerText = stats.problemsCount;
                    document.getElementById('stat-2-label').innerText = 'Predictions Mapped';
                    document.getElementById('stat-2-val').innerText = stats.predictionsCount;
                } else if (user.role === 'guider') {
                    document.getElementById('stat-1-label').innerText = 'Solutions Provided';
                    document.getElementById('stat-1-val').innerText = stats.solutionsCount;
                    document.getElementById('stat-2-label').innerText = 'Certification';
                    document.getElementById('stat-2-val').innerText = user.testPassed ? 'Passed' : 'Pending';
                } else {
                    document.getElementById('stat-1-label').innerText = 'Total Users Mngd';
                    document.getElementById('stat-1-val').innerText = '∞';
                    document.getElementById('stat-2-label').innerText = 'Platform Status';
                    document.getElementById('stat-2-val').innerText = 'Healthy';
                }
            }
        } catch(e) {
            console.error("Could not load stats.", e);
        }
    };
    
    fetchStats();
});
